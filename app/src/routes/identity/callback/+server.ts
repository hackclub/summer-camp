import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/auth/guards';
import { handleCallback } from '$lib/server/auth/oidc';

export const GET: RequestHandler = async (event) => {
	const user = requireUser(event);
	let result;
	try {
		result = await handleCallback(event.cookies, event.url, user.id);
	} catch (e) {
		console.error('[idv] callback failed:', e);
		redirect(303, `${base}/verify-identity?status=error`);
	}
	if (!result.verified) {
		// During onboarding, keep the user inside the flow so the verify step can
		// show its own message (otherwise the guard would bounce them back to the
		// welcome screen). Everywhere else, the dedicated verify-identity page
		// handles it. The decision (pending / blocked_over_18 / blocked_rejected)
		// is carried through so each page can explain the actual reason.
		if (result.returnTo.startsWith(`${base}/onboarding`)) {
			redirect(303, `${result.returnTo}?idv=${result.decision}`);
		}
		redirect(
			303,
			`${base}/verify-identity?status=${result.decision}&returnTo=${encodeURIComponent(result.returnTo)}`
		);
	}
	redirect(303, `${result.returnTo}${result.returnTo.includes('?') ? '&' : '?'}idv=done`);
};
