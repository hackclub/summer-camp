import { fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { campDays } from '$lib/server/db/schema';
import { newId } from '$lib/server/ids';
import { requireAdmin } from '$lib/server/auth/guards';

const daySchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
	title: z.string().trim().min(1).max(200)
});

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const days = await db.select().from(campDays).orderBy(asc(campDays.date));
	return { days };
};

export const actions: Actions = {
	create: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const parsed = daySchema.safeParse(Object.fromEntries(form));
		if (!parsed.success) return fail(400, { invalid: true });
		await db
			.insert(campDays)
			.values({ id: newId(), date: parsed.data.date, title: parsed.data.title })
			.onConflictDoNothing();
		return { created: true };
	},

	// One-click seed: every weekday from June 23 to July 17 (the camp window).
	seed: async (event) => {
		requireAdmin(event);
		const start = new Date(Date.UTC(2026, 5, 23));
		const end = new Date(Date.UTC(2026, 6, 17));
		let n = 0;
		for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
			const dow = d.getUTCDay();
			if (dow === 0 || dow === 6) continue;
			n++;
			await db
				.insert(campDays)
				.values({
					id: newId(),
					date: d.toISOString().slice(0, 10),
					title: `Camp day ${n}`
				})
				.onConflictDoNothing();
		}
		return { seeded: n };
	},

	togglePublish: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const id = form.get('id')?.toString();
		const published = form.get('published')?.toString() === 'true';
		if (!id) return fail(400, { invalid: true });
		await db.update(campDays).set({ published }).where(eq(campDays.id, id));
		return { updated: true };
	}
};
