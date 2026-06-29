import { fail, redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/auth/guards';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	return { name: user.name ?? '', identityVerified: user.identityVerified };
};

export const actions: Actions = {
	saveName: async (event) => {
		const user = requireUser(event);
		const form = await event.request.formData();
		const name = form.get('name')?.toString().trim() ?? '';
		if (name.length < 1 || name.length > 80) {
			return fail(400, { error: 'Please enter your name (up to 80 characters).', name });
		}
		await db.update(users).set({ name }).where(eq(users.id, user.id));
		// Name saved — on to the identity step.
		redirect(303, `${base}/onboarding/verify`);
	}
};
