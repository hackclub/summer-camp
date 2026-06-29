import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { consumeMagicLink } from '$lib/server/auth/magic-link';
import { createSession } from '$lib/server/auth/session';
import { safeReturnTo } from '$lib/server/auth/oidc';
import { markLoggedIn } from '$lib/server/funnel';

// Rendered as a page (not +server.ts) so the failure state has UI; on success
// the load consumes the token, sets the session cookie, and redirects away.
export const load: PageServerLoad = async ({ url, cookies }) => {
	const token = url.searchParams.get('token');
	if (token) {
		const userId = await consumeMagicLink(token);
		if (userId) {
			await createSession(cookies, userId);
			try {
				const [u] = await db
					.select({ email: users.email })
					.from(users)
					.where(eq(users.id, userId))
					.limit(1);
				if (u?.email) await markLoggedIn(u.email);
			} catch (e) {
				console.error('[funnel] login tracking failed:', e);
			}
			redirect(303, safeReturnTo(url.searchParams.get('next')));
		}
	}
	return { failed: true };
};
