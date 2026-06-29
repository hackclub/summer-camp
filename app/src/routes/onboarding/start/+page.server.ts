import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/auth/guards';
import { safeReturnTo } from '$lib/server/auth/oidc';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	// Can't reach the finish line without a name from the setup step.
	if (!user.name) redirect(303, `${base}/onboarding/setup`);
	return {};
};

export const actions: Actions = {
	finish: async (event) => {
		const user = requireUser(event);
		const form = await event.request.formData();
		const raw = form.get('destination')?.toString() ?? '';
		// safeReturnTo validates same-origin + normalizes the /dash base prefix.
		const destination = safeReturnTo(raw);
		await db.update(users).set({ onboardedAt: new Date() }).where(eq(users.id, user.id));
		redirect(303, destination);
	}
};
