import { eq, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { attendance, campDays, projects, shopOrders, users } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/auth/guards';
import { etDateString } from '$lib/camp-time';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);

	const [[campers], [pendingReviews], [pendingOrders], todayEntered] = await Promise.all([
		db
			.select({ n: sql<number>`count(*)::int` })
			.from(users)
			.where(eq(users.banned, false)),
		db
			.select({ n: sql<number>`count(*)::int` })
			.from(projects)
			.where(eq(projects.status, 'submitted')),
		db
			.select({ n: sql<number>`count(*)::int` })
			.from(shopOrders)
			.where(eq(shopOrders.status, 'pending')),
		(async () => {
			const [day] = await db
				.select()
				.from(campDays)
				.where(eq(campDays.date, etDateString(new Date())))
				.limit(1);
			if (!day) return null;
			const [{ n }] = await db
				.select({ n: sql<number>`count(*)::int` })
				.from(attendance)
				.where(eq(attendance.campDayId, day.id));
			return { day, entered: n };
		})()
	]);

	return {
		campers: campers.n,
		pendingReviews: pendingReviews.n,
		pendingOrders: pendingOrders.n,
		today: todayEntered
	};
};
