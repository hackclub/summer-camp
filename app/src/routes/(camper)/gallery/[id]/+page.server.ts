import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { projects, users } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ params }) => {
	const [row] = await db
		.select({
			id: projects.id,
			title: projects.title,
			description: projects.description,
			screenshotUrl: projects.screenshotUrl,
			githubUrl: projects.githubUrl,
			playableUrl: projects.playableUrl,
			authorName: users.name
		})
		.from(projects)
		.innerJoin(users, eq(projects.userId, users.id))
		.where(and(eq(projects.id, params.id), eq(projects.status, 'approved')))
		.limit(1);
	if (!row) error(404, 'Project not found');
	return { project: row };
};
