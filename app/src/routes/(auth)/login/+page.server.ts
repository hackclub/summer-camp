import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { createMagicLink } from '$lib/server/auth/magic-link';
import { sendMagicLink } from '$lib/server/email';
import { isRateLimited } from '$lib/server/ratelimit';
import { safeReturnTo } from '$lib/server/auth/oidc';
import { markSignedUp } from '$lib/server/funnel';
import { base } from '$app/paths';
import { env } from '$env/dynamic/private';

const emailSchema = z.string().trim().toLowerCase().max(254).email();

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) redirect(303, safeReturnTo(url.searchParams.get('next')));
	return {};
};

export const actions: Actions = {
	default: async ({ request, getClientAddress, url }) => {
		const form = await request.formData();

		// Honeypot: hidden field real users never see; pretend success for bots.
		if (form.get('company')?.toString()) redirect(303, `${base}/login/sent`);

		const parsed = emailSchema.safeParse(form.get('email')?.toString());
		if (!parsed.success) return fail(400, { invalid: true });
		const email = parsed.data;
		// The landing "Sign up" form posts here with source=signup — record the
		// RSVP + funnel signup for those (not plain returning-user logins).
		const isSignup = form.get('source')?.toString() === 'signup';

		let ip = 'unknown';
		try {
			ip = getClientAddress();
		} catch {
			// No trusted address header configured; fall back to a shared bucket.
		}
		// Key on the email, not the client IP: behind the ingress every request's
		// socket peer is the proxy, so an IP key collapses to one shared bucket
		// (login DoS for everyone). The DB-backed per-email cap in createMagicLink
		// is the durable guard; this is the cheap in-memory brake.
		if (isRateLimited(`login:${email}`, 5, 10 * 60 * 1000)) return fail(429, { rateLimited: true });

		if (isSignup) {
			try {
				await markSignedUp(email);
			} catch (e) {
				console.error('[funnel] signup tracking failed:', e);
			}
		}

		const rawToken = await createMagicLink(email, ip);
		if (rawToken) {
			const next = safeReturnTo(url.searchParams.get('next'));
			const origin = env.ORIGIN ?? url.origin;
			const link = `${origin}${base}/login/verify?token=${rawToken}&next=${encodeURIComponent(next)}`;
			try {
				await sendMagicLink(email, link);
			} catch (e) {
				console.error('[email] send failed:', e);
				return fail(500, { sendError: true });
			}
		}
		// Always act like it worked (even when rate-limited per-email) so the
		// form can't be used to enumerate accounts or probe limits.
		redirect(303, `${base}/login/sent`);
	}
};
