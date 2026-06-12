import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { projectReviews, projects, users } from '$lib/server/db/schema';
import { newId } from '$lib/server/ids';
import { requireAdmin } from '$lib/server/auth/guards';
import { awardShipBonus, SHIP_BONUS } from '$lib/server/points';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const [row] = await db
		.select({ project: projects, camper: users })
		.from(projects)
		.innerJoin(users, eq(projects.userId, users.id))
		.where(eq(projects.id, event.params.projectId))
		.limit(1);
	if (!row) error(404, 'Project not found');
	return { project: row.project, camper: row.camper, shipBonus: SHIP_BONUS };
};

export const actions: Actions = {
	approve: async (event) => {
		const admin = requireAdmin(event);
		const projectId = event.params.projectId;
		const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
		if (!project || project.status !== 'submitted') return fail(400, { notPending: true });

		const form = await event.request.formData();
		await db.insert(projectReviews).values({
			id: newId(),
			projectId,
			reviewerId: admin.id,
			action: 'approve',
			feedback: form.get('feedback')?.toString().trim() || null
		});
		await db
			.update(projects)
			.set({ status: 'approved', updatedAt: new Date() })
			.where(eq(projects.id, projectId));
		await awardShipBonus(project.userId, projectId, admin.id);
		redirect(303, '/admin/reviews');
	},

	reject: async (event) => {
		const admin = requireAdmin(event);
		const projectId = event.params.projectId;
		const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
		if (!project || project.status !== 'submitted') return fail(400, { notPending: true });

		const form = await event.request.formData();
		const feedback = form.get('feedback')?.toString().trim();
		if (!feedback) return fail(400, { feedbackRequired: true });

		await db.insert(projectReviews).values({
			id: newId(),
			projectId,
			reviewerId: admin.id,
			action: 'reject',
			feedback
		});
		await db
			.update(projects)
			.set({ status: 'rejected', updatedAt: new Date() })
			.where(eq(projects.id, projectId));
		redirect(303, '/admin/reviews');
	}
};
