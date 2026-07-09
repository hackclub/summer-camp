import { and, desc, eq, inArray, getTableColumns } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { campDays, projects } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/auth/guards';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	// Only shipped projects appear here — drafts live on the Submit page until
	// they're sent for review. Join the camp day for its real reward amount.
	const myProjects = await db
		.select({ ...getTableColumns(projects), rewardPoints: campDays.rewardPoints })
		.from(projects)
		.leftJoin(campDays, eq(projects.campDayId, campDays.id))
		.where(
			and(
				eq(projects.userId, user.id),
				inArray(projects.status, ['submitted', 'approved', 'rejected'])
			)
		)
		.orderBy(desc(projects.updatedAt));
	return { myProjects };
};
