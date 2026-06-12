import type { PageServerLoad } from './$types';
import { requireUser } from '$lib/server/auth/guards';
import { safeReturnTo } from '$lib/server/auth/oidc';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	return {
		verified: user.identityVerified,
		status: event.url.searchParams.get('status'),
		returnTo: safeReturnTo(event.url.searchParams.get('returnTo'))
	};
};
