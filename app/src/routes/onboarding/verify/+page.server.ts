import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requireUser } from '$lib/server/auth/guards';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	// Step 2 — must have done step 1 (name) first.
	if (!user.name) redirect(303, '/onboarding/setup');
	return {
		identityVerified: user.identityVerified,
		// 'done' after a successful IDV round-trip; 'pending' if Identity sent us
		// back without a verified status (not verified yet — or not eligible).
		idv: event.url.searchParams.get('idv')
	};
};
