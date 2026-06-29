import { error, fail, redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import { and, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { projectReviews, projects } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/auth/guards';
import { flattenErrors, projectSchema } from '$lib/server/validation';

async function ownProject(userId: string, projectId: string) {
	const [project] = await db
		.select()
		.from(projects)
		.where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
		.limit(1);
	if (!project) error(404, 'Project not found');
	return project;
}

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	const project = await ownProject(user.id, event.params.id);
	// Show the camper the latest reviewer feedback if they were asked for changes.
	const reviews = await db
		.select()
		.from(projectReviews)
		.where(eq(projectReviews.projectId, project.id))
		.orderBy(projectReviews.createdAt);
	return { project, latestReview: reviews.at(-1) ?? null };
};

export const actions: Actions = {
	update: async (event) => {
		const user = requireUser(event);
		const project = await ownProject(user.id, event.params.id);
		if (project.status === 'submitted' || project.status === 'approved') {
			return fail(400, { locked: true });
		}
		const form = await event.request.formData();
		const parsed = projectSchema.safeParse(Object.fromEntries(form));
		if (!parsed.success) return fail(400, { errors: flattenErrors(parsed.error) });
		await db
			.update(projects)
			.set({
				title: parsed.data.title,
				description: parsed.data.description || null,
				githubUrl: parsed.data.githubUrl || null,
				playableUrl: parsed.data.playableUrl || null,
				screenshotUrl: parsed.data.screenshotUrl || null,
				updatedAt: new Date()
			})
			.where(eq(projects.id, project.id));
		return { saved: true };
	},
	delete: async (event) => {
		const user = requireUser(event);
		const project = await ownProject(user.id, event.params.id);
		if (project.status === 'submitted' || project.status === 'approved') {
			return fail(400, { locked: true });
		}
		await db.delete(projects).where(eq(projects.id, project.id));
		redirect(303, `${base}/projects`);
	}
};
