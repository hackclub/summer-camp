import { error, fail } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import {
	attendance,
	authSessions,
	campDays,
	extensions,
	pointsTransactions,
	projects,
	users
} from '$lib/server/db/schema';
import { newId } from '$lib/server/ids';
import { requireAdmin } from '$lib/server/auth/guards';
import { getBalance } from '$lib/server/points';
import { etWallTime } from '$lib/camp-time';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const id = event.params.id;
	const [camper] = await db.select().from(users).where(eq(users.id, id)).limit(1);
	if (!camper) error(404, 'Camper not found');

	const [hours, ledger, camperProjects, balance] = await Promise.all([
		db
			.select({ date: campDays.date, title: campDays.title, hours: attendance.hours })
			.from(attendance)
			.innerJoin(campDays, eq(attendance.campDayId, campDays.id))
			.where(eq(attendance.userId, id))
			.orderBy(desc(campDays.date)),
		db
			.select()
			.from(pointsTransactions)
			.where(eq(pointsTransactions.userId, id))
			.orderBy(desc(pointsTransactions.createdAt))
			.limit(50),
		db.select().from(projects).where(eq(projects.userId, id)).orderBy(desc(projects.updatedAt)),
		getBalance(id)
	]);

	// Camp days (for the grant-extension dropdown) + this camper's extensions.
	const [allDays, camperExtensions] = await Promise.all([
		db
			.select({ id: campDays.id, date: campDays.date, title: campDays.title })
			.from(campDays)
			.where(eq(campDays.published, true))
			.orderBy(desc(campDays.date)),
		db
			.select({
				id: extensions.id,
				date: campDays.date,
				title: campDays.title,
				until: extensions.until
			})
			.from(extensions)
			.innerJoin(campDays, eq(extensions.campDayId, campDays.id))
			.where(eq(extensions.userId, id))
			.orderBy(desc(extensions.until))
	]);

	return { camper, hours, ledger, camperProjects, balance, allDays, camperExtensions };
};

const adjustSchema = z.object({
	amount: z.coerce.number().int().min(-100_000).max(100_000),
	note: z.string().trim().min(1, 'A reason is required').max(500)
});

export const actions: Actions = {
	adjustPoints: async (event) => {
		const admin = requireAdmin(event);
		const form = await event.request.formData();
		const parsed = adjustSchema.safeParse(Object.fromEntries(form));
		if (!parsed.success) return fail(400, { adjustInvalid: true });
		await db.insert(pointsTransactions).values({
			id: newId(),
			userId: event.params.id,
			amount: parsed.data.amount,
			kind: 'adjustment',
			note: parsed.data.note,
			createdBy: admin.id
		});
		return { saved: true };
	},

	setRole: async (event) => {
		const admin = requireAdmin(event);
		if (admin.id === event.params.id) return fail(400, { selfRole: true });
		const form = await event.request.formData();
		const role = form.get('role')?.toString();
		if (role !== 'camper' && role !== 'admin') return fail(400, {});
		await db.update(users).set({ role }).where(eq(users.id, event.params.id));
		return { saved: true };
	},

	setBanned: async (event) => {
		const admin = requireAdmin(event);
		if (admin.id === event.params.id) return fail(400, { selfBan: true });
		const form = await event.request.formData();
		const banned = form.get('banned')?.toString() === 'true';
		await db.update(users).set({ banned }).where(eq(users.id, event.params.id));
		// Kick them out of any live sessions immediately.
		if (banned) await db.delete(authSessions).where(eq(authSessions.userId, event.params.id));
		return { saved: true };
	},

	// Grant/extend this camper's submission window for one lesson, through the end
	// (11:59 PM ET) of the chosen date. Upsert so re-granting just moves the date.
	grantExtension: async (event) => {
		const admin = requireAdmin(event);
		const form = await event.request.formData();
		const campDayId = form.get('campDayId')?.toString();
		const until = form.get('until')?.toString();
		if (!campDayId || !until || !/^\d{4}-\d{2}-\d{2}$/.test(until))
			return fail(400, { extInvalid: true });
		const untilTs = etWallTime(until, 23, 59); // through 11:59 PM ET on that date
		await db
			.insert(extensions)
			.values({
				id: newId(),
				userId: event.params.id,
				campDayId,
				until: untilTs,
				createdBy: admin.id
			})
			.onConflictDoUpdate({
				target: [extensions.userId, extensions.campDayId],
				set: { until: untilTs, createdBy: admin.id }
			});
		return { saved: true };
	},

	revokeExtension: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const extId = form.get('id')?.toString();
		if (!extId) return fail(400, {});
		await db
			.delete(extensions)
			.where(and(eq(extensions.id, extId), eq(extensions.userId, event.params.id)));
		return { saved: true };
	}
};
