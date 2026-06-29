import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, `${base}/login?next=${base}/onboarding`);
	// First-run only: anyone who's already finished it goes to the dashboard.
	if (locals.user.onboarded) redirect(303, `${base}/`);
	return { user: locals.user };
};
