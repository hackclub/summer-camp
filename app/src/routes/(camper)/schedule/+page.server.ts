import { asc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { attendance, campDays } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/auth/guards';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);

	const [days, myAttendance] = await Promise.all([
		db.select().from(campDays).where(eq(campDays.published, true)).orderBy(asc(campDays.date)),
		db.select().from(attendance).where(eq(attendance.userId, user.id))
	]);

	const attendedDayIds = new Set(myAttendance.map((a) => a.campDayId));
	return { days, attendedDayIds: [...attendedDayIds] };
};
