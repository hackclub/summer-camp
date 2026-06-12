import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { projects } from '$lib/server/db/schema';
import { newId } from '$lib/server/ids';
import { requireUser } from '$lib/server/auth/guards';
import { flattenErrors, projectSchema } from '$lib/server/validation';

export const actions: Actions = {
	default: async (event) => {
		const user = requireUser(event);
		const form = await event.request.formData();
		const parsed = projectSchema.safeParse(Object.fromEntries(form));
		if (!parsed.success) {
			return fail(400, { errors: flattenErrors(parsed.error) });
		}
		const id = newId();
		await db.insert(projects).values({
			id,
			userId: user.id,
			title: parsed.data.title,
			description: parsed.data.description || null,
			githubUrl: parsed.data.githubUrl || null,
			playableUrl: parsed.data.playableUrl || null,
			screenshotUrl: parsed.data.screenshotUrl || null
		});
		redirect(303, `/projects/${id}/edit?saved=1`);
	}
};
