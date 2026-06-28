import { sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { attendance, pointsTransactions, projects, shopOrders, users } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/auth/guards';

const int = sql<number>`count(*)::int`;

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);

	const [
		[campers],
		[onboarded],
		[verified],
		[shippers],
		[approvedMakers],
		[hours],
		[earned],
		[spent],
		ordersByStatus
	] = await Promise.all([
		db.select({ n: int }).from(users).where(sql`${users.banned} = false`),
		db.select({ n: int }).from(users).where(sql`${users.onboardedAt} is not null`),
		db.select({ n: int }).from(users).where(sql`${users.identityVerified} = true`),
		db.select({ n: sql<number>`count(distinct ${projects.userId})::int` })
			.from(projects)
			.where(sql`${projects.status} in ('submitted','approved','rejected')`),
		db.select({ n: sql<number>`count(distinct ${projects.userId})::int` })
			.from(projects)
			.where(sql`${projects.status} = 'approved'`),
		db.select({ total: sql<number>`coalesce(sum(${attendance.hours}),0)::float` }).from(attendance),
		db.select({ total: sql<number>`coalesce(sum(${pointsTransactions.amount}) filter (where ${pointsTransactions.amount} > 0),0)::int` }).from(pointsTransactions),
		db.select({ total: sql<number>`coalesce(-sum(${pointsTransactions.amount}) filter (where ${pointsTransactions.amount} < 0),0)::int` }).from(pointsTransactions),
		db.select({ status: shopOrders.status, n: int }).from(shopOrders).groupBy(shopOrders.status)
	]);

	return {
		funnel: [
			{ label: 'Campers', value: campers.n },
			{ label: 'Onboarded', value: onboarded.n },
			{ label: 'Identity verified', value: verified.n },
			{ label: 'Shipped a project', value: shippers.n },
			{ label: 'Had one approved', value: approvedMakers.n }
		],
		attendanceHours: hours.total,
		pointsEarned: earned.total,
		pointsSpent: spent.total,
		ordersByStatus: ordersByStatus as { status: string; n: number }[]
	};
};
