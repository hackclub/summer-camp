import { and, desc, eq, inArray } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { announcements, campDays, projects } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/auth/guards';
import { openLessons } from '$lib/server/lessons';
import type { CampDayLite } from '$lib/camp-time';

function loadDays(): Promise<CampDayLite[]> {
	return db
		.select({
			id: campDays.id,
			date: campDays.date,
			title: campDays.title,
			joinUrl: campDays.joinUrl,
			recordingUrl: campDays.recordingUrl
		})
		.from(campDays)
		.where(eq(campDays.published, true));
}

const shippedStatuses = ['submitted', 'approved', 'rejected'] as const;

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);

	const [days, latestAnnouncements, myProjects] = await Promise.all([
		loadDays(),
		db
			.select()
			.from(announcements)
			.where(eq(announcements.published, true))
			.orderBy(desc(announcements.createdAt))
			.limit(3),
		db
			.select()
			.from(projects)
			.where(and(eq(projects.userId, user.id), inArray(projects.status, [...shippedStatuses])))
			.orderBy(desc(projects.updatedAt))
			.limit(4)
	]);

	// Open lessons (today, once launched, + yesterday) and how many the camper
	// still needs to ship — drives the "Submit a project" prompt.
	const open = openLessons(new Date(), days);
	let toSubmit = 0;
	for (const day of open) {
		const [p] = await db
			.select({ status: projects.status })
			.from(projects)
			.where(and(eq(projects.userId, user.id), eq(projects.campDayId, day.id)))
			.limit(1);
		if (!p || !shippedStatuses.includes(p.status as (typeof shippedStatuses)[number])) toSubmit++;
	}

	return {
		days,
		announcements: latestAnnouncements,
		myProjects,
		openCount: open.length,
		toSubmit
	};
};
