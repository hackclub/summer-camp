import { error, fail } from '@sveltejs/kit';
import { asc, eq, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { attendance, campDays, users } from '$lib/server/db/schema';
import { newId } from '$lib/server/ids';
import { requireAdmin } from '$lib/server/auth/guards';
import { awardAttendance } from '$lib/server/points';

const MAX_HOURS = 3.5;

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);

	const [day] = await db
		.select()
		.from(campDays)
		.where(eq(campDays.id, event.params.campDayId))
		.limit(1);
	if (!day) error(404, 'Camp day not found');

	const campers = await db
		.select({ id: users.id, name: users.name, email: users.email })
		.from(users)
		.where(eq(users.banned, false))
		.orderBy(asc(users.name), asc(users.email));

	const entries = await db.select().from(attendance).where(eq(attendance.campDayId, day.id));
	const hoursByUser = new Map(entries.map((e) => [e.userId, e.hours]));

	return {
		day,
		campers: campers.map((c) => ({
			...c,
			hours: hoursByUser.get(c.id) ?? null
		}))
	};
};

async function saveHours(
	adminId: string,
	campDayId: string,
	rows: { userId: string; hours: number }[]
) {
	for (const { userId, hours } of rows) {
		const id = newId();
		const [row] = await db
			.insert(attendance)
			.values({
				id,
				userId,
				campDayId,
				hours: hours.toFixed(2),
				enteredBy: adminId,
				updatedAt: new Date()
			})
			.onConflictDoUpdate({
				target: [attendance.userId, attendance.campDayId],
				set: { hours: hours.toFixed(2), enteredBy: adminId, updatedAt: new Date() }
			})
			.returning({ id: attendance.id });
		await awardAttendance(userId, row.id, hours, adminId);
	}
}

export const actions: Actions = {
	// Bulk save: form posts hours_<userId> fields; blank = skip (absent).
	save: async (event) => {
		const admin = requireAdmin(event);
		const campDayId = event.params.campDayId;
		const form = await event.request.formData();

		const rows: { userId: string; hours: number }[] = [];
		const removals: string[] = [];
		for (const [key, value] of form.entries()) {
			if (!key.startsWith('hours_')) continue;
			const userId = key.slice('hours_'.length);
			const text = value.toString().trim();
			if (text === '') {
				removals.push(userId);
				continue;
			}
			const hours = Number(text);
			if (!Number.isFinite(hours) || hours < 0 || hours > MAX_HOURS) {
				return fail(400, { invalid: userId });
			}
			if (hours === 0) removals.push(userId);
			else rows.push({ userId, hours });
		}

		await saveHours(admin.id, campDayId, rows);

		// Clearing a value removes the attendance row and zeroes its ledger entry.
		for (const userId of removals) {
			const [existing] = await db
				.select()
				.from(attendance)
				.where(sql`${attendance.userId} = ${userId} AND ${attendance.campDayId} = ${campDayId}`)
				.limit(1);
			if (existing) {
				await awardAttendance(userId, existing.id, 0, admin.id);
				await db.delete(attendance).where(eq(attendance.id, existing.id));
			}
		}

		return { saved: true, count: rows.length };
	},

	// Convenience: set every camper without an entry to the full 3 hours, then
	// the admin zeroes out absentees — much faster for a fixed-length session.
	markAll: async (event) => {
		const admin = requireAdmin(event);
		const campDayId = event.params.campDayId;

		const campers = await db.select({ id: users.id }).from(users).where(eq(users.banned, false));
		await saveHours(
			admin.id,
			campDayId,
			campers.map((c) => ({ userId: c.id, hours: 3 }))
		);
		return { saved: true, count: campers.length };
	}
};
