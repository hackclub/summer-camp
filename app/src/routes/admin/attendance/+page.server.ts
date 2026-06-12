import { redirect } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { attendance, campDays } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/auth/guards';
import { etDateString } from '$lib/camp-time';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);

	// Jump straight to today's grid when there's a session today.
	const today = etDateString(new Date());
	const [todayDay] = await db.select().from(campDays).where(eq(campDays.date, today)).limit(1);
	if (todayDay) redirect(303, `/admin/attendance/${todayDay.id}`);

	const days = await db.select().from(campDays).orderBy(asc(campDays.date));
	const counts = await db.select({ campDayId: attendance.campDayId }).from(attendance);
	const countByDay = new Map<string, number>();
	for (const row of counts) {
		countByDay.set(row.campDayId, (countByDay.get(row.campDayId) ?? 0) + 1);
	}

	return {
		days: days.map((d) => ({ ...d, entries: countByDay.get(d.id) ?? 0 }))
	};
};
