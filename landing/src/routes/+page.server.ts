import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import Airtable from 'airtable';
import { env } from '$env/dynamic/private';

// Permissive email shape check — just enough to reject obvious garbage.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Simple in-memory per-IP rate limiter. Scoped to a single pod and reset on
// restart, which is fine as a cheap abuse brake for an RSVP form.
const MAX_SUBMISSIONS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
	const now = Date.now();
	const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
	recent.push(now);
	hits.set(ip, recent);
	return recent.length > MAX_SUBMISSIONS;
}

export const actions: Actions = {
	default: async ({ request, getClientAddress }) => {
		const form = await request.formData();
		const email = form.get('email')?.toString().trim();
		// Honeypot: a hidden field real users never see. Bots that fill every
		// input trip it. Pretend success so they don't learn they were caught.
		const honeypot = form.get('company')?.toString();

		if (honeypot) {
			return { success: true };
		}

		if (!email) {
			return fail(400, {
				missing: true
			});
		}

		if (email.length > 254 || !EMAIL_RE.test(email)) {
			return fail(400, {
				invalid: true
			});
		}

		let ip = 'unknown';
		try {
			ip = getClientAddress();
		} catch {
			// getClientAddress throws if no trusted address header is configured;
			// fall back to a shared bucket rather than failing the request.
		}
		if (isRateLimited(ip)) {
			return fail(429, {
				rateLimited: true
			});
		}

		if (!env.API_KEY || !env.BASE_ID) {
			console.error('Missing API_KEY or BASE_ID environment variable');
			return fail(500, {
				error: true
			});
		}

		const base = new Airtable({ apiKey: env.API_KEY }).base(env.BASE_ID);

		try {
			await new Promise((resolve, reject) => {
				base('RSVP').create(
					[
						{
							fields: {
								Email: email
							}
						}
					],
					function (err, records) {
						if (err) {
							reject(err);
						} else {
							resolve(records);
						}
					}
				);
			});
		} catch (err) {
			console.error(err);
			return fail(500, {
				error: true
			});
		}

		return { success: true };
	}
};
