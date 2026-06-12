import { asc, ilike, or, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { attendance, pointsTransactions, users } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/auth/guards';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const q = event.url.searchParams.get('q')?.trim() ?? '';

	const campers = await db
		.select({
			id: users.id,
			email: users.email,
			name: users.name,
			role: users.role,
			banned: users.banned,
			identityVerified: users.identityVerified,
			totalHours: sql<string>`coalesce((select sum(${attendance.hours}) from ${attendance} where ${attendance.userId} = ${users.id}), 0)`,
			points: sql<number>`coalesce((select sum(${pointsTransactions.amount})::int from ${pointsTransactions} where ${pointsTransactions.userId} = ${users.id}), 0)`
		})
		.from(users)
		.where(q ? or(ilike(users.email, `%${q}%`), ilike(users.name, `%${q}%`)) : undefined)
		.orderBy(asc(users.name), asc(users.email))
		.limit(200);

	return { campers, q };
};
