import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { announcements, campDays, projects } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/auth/guards';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);

	const [days, latestAnnouncements, myProjects] = await Promise.all([
		db
			.select({
				id: campDays.id,
				date: campDays.date,
				title: campDays.title,
				joinUrl: campDays.joinUrl,
				recordingUrl: campDays.recordingUrl
			})
			.from(campDays)
			.where(eq(campDays.published, true)),
		db
			.select()
			.from(announcements)
			.where(eq(announcements.published, true))
			.orderBy(desc(announcements.createdAt))
			.limit(3),
		db
			.select()
			.from(projects)
			.where(eq(projects.userId, user.id))
			.orderBy(desc(projects.updatedAt))
			.limit(4)
	]);

	return { days, announcements: latestAnnouncements, myProjects };
};
