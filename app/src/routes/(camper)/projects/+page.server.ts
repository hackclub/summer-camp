import { and, desc, eq, inArray } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { projects } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/auth/guards';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	// Only shipped projects appear here — drafts live on the Submit page until
	// they're sent for review.
	const myProjects = await db
		.select()
		.from(projects)
		.where(
			and(
				eq(projects.userId, user.id),
				inArray(projects.status, ['submitted', 'approved', 'rejected'])
			)
		)
		.orderBy(desc(projects.updatedAt));
	return { myProjects };
};
