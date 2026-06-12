import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { consumeMagicLink } from '$lib/server/auth/magic-link';
import { createSession } from '$lib/server/auth/session';
import { safeReturnTo } from '$lib/server/auth/oidc';

// Rendered as a page (not +server.ts) so the failure state has UI; on success
// the load consumes the token, sets the session cookie, and redirects away.
export const load: PageServerLoad = async ({ url, cookies }) => {
	const token = url.searchParams.get('token');
	if (token) {
		const userId = await consumeMagicLink(token);
		if (userId) {
			await createSession(cookies, userId);
			redirect(303, safeReturnTo(url.searchParams.get('next')));
		}
	}
	return { failed: true };
};
