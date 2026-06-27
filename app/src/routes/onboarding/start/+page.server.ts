import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/auth/guards';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	// Can't reach the finish line without a name from the setup step.
	if (!user.name) redirect(303, '/onboarding/setup');
	return {};
};

export const actions: Actions = {
	finish: async (event) => {
		const user = requireUser(event);
		const form = await event.request.formData();
		const raw = form.get('destination')?.toString() ?? '';
		// Only same-origin relative paths, so this can't become an open redirect.
		const destination = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/';
		await db.update(users).set({ onboardedAt: new Date() }).where(eq(users.id, user.id));
		redirect(303, destination);
	}
};
