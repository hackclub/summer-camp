import { and, desc, eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { announcements, campDays, projects } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/auth/guards';
import { getCampState, type CampDayLite } from '$lib/camp-time';
import { newId } from '$lib/server/ids';

/** Published camp days as the lite shape the camp-time clock works with. */
function loadDays() {
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

/** Today's camp day once its session has launched (live or wrapped), else null.
 *  This is the window in which a camper may create that day's project. */
function launchedDay(days: CampDayLite[]): CampDayLite | null {
	const state = getCampState(new Date(), days);
	if (state.kind === 'live' || state.kind === 'post-session') return state.day;
	return null;
}

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
			.where(eq(projects.userId, user.id))
			.orderBy(desc(projects.updatedAt))
			.limit(4)
	]);

	const day = launchedDay(days);
	const todayProject = day
		? ((
				await db
					.select()
					.from(projects)
					.where(and(eq(projects.userId, user.id), eq(projects.campDayId, day.id)))
					.limit(1)
			)[0] ?? null)
		: null;

	return {
		days,
		announcements: latestAnnouncements,
		myProjects,
		today: day ? { id: day.id, title: day.title } : null,
		todayProject
	};
};

export const actions: Actions = {
	// One button on the dashboard: create (or reopen) today's project, then drop
	// the camper into the existing edit → ship flow. The launched-day check and
	// the one-per-day lookup are re-done server-side so the client can't forge them.
	startToday: async (event) => {
		const user = requireUser(event);
		const day = launchedDay(await loadDays());
		if (!day) return fail(400, { notLaunched: true });

		const [existing] = await db
			.select({ id: projects.id })
			.from(projects)
			.where(and(eq(projects.userId, user.id), eq(projects.campDayId, day.id)))
			.limit(1);
		if (existing) redirect(303, `/projects/${existing.id}/edit`);

		const id = newId();
		await db.insert(projects).values({
			id,
			userId: user.id,
			campDayId: day.id,
			title: day.title
		});
		redirect(303, `/projects/${id}/edit?saved=1`);
	}
};
