import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/auth/guards';
import { buildAuthorizeRedirect, safeReturnTo } from '$lib/server/auth/oidc';

export const GET: RequestHandler = async (event) => {
	requireUser(event);
	const returnTo = safeReturnTo(event.url.searchParams.get('returnTo'));
	const authorizeUrl = await buildAuthorizeRedirect(event.cookies, returnTo);
	redirect(303, authorizeUrl);
};
