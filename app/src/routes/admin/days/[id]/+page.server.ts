import { error, fail, redirect } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { campDayMaterials, campDays } from '$lib/server/db/schema';
import { newId } from '$lib/server/ids';
import { requireAdmin } from '$lib/server/auth/guards';

const updateSchema = z.object({
	title: z.string().trim().min(1).max(200),
	description: z.string().trim().max(5000).optional().default(''),
	joinUrl: z.string().trim().max(2000).optional().default(''),
	recordingUrl: z.string().trim().max(2000).optional().default(''),
	// Hours credited (logged to Ari), and the approval reward: points + optional prize.
	hours: z.coerce.number().min(0).max(24).optional().default(3),
	rewardPoints: z.coerce.number().int().min(0).max(100000).optional().default(0),
	prizeLabel: z.string().trim().max(200).optional().default('')
});

const materialSchema = z.object({
	title: z.string().trim().min(1).max(200),
	url: z.string().trim().url().max(2000),
	kind: z.enum(['slides', 'starter', 'link'])
});

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const [day] = await db.select().from(campDays).where(eq(campDays.id, event.params.id)).limit(1);
	if (!day) error(404, 'Camp day not found');
	const materials = await db
		.select()
		.from(campDayMaterials)
		.where(eq(campDayMaterials.campDayId, day.id))
		.orderBy(asc(campDayMaterials.sort));
	return { day, materials };
};

export const actions: Actions = {
	update: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const parsed = updateSchema.safeParse(Object.fromEntries(form));
		if (!parsed.success) return fail(400, { invalid: true });
		await db
			.update(campDays)
			.set({
				title: parsed.data.title,
				description: parsed.data.description || null,
				joinUrl: parsed.data.joinUrl || null,
				recordingUrl: parsed.data.recordingUrl || null,
				hours: parsed.data.hours.toString(),
				rewardPoints: parsed.data.rewardPoints,
				prizeLabel: parsed.data.prizeLabel || null
			})
			.where(eq(campDays.id, event.params.id));
		return { saved: true };
	},

	addMaterial: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const parsed = materialSchema.safeParse(Object.fromEntries(form));
		if (!parsed.success) return fail(400, { materialInvalid: true });
		await db.insert(campDayMaterials).values({
			id: newId(),
			campDayId: event.params.id,
			...parsed.data
		});
		return { saved: true };
	},

	removeMaterial: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const id = form.get('id')?.toString();
		if (id) await db.delete(campDayMaterials).where(eq(campDayMaterials.id, id));
		return { saved: true };
	},

	remove: async (event) => {
		requireAdmin(event);
		await db.delete(campDays).where(eq(campDays.id, event.params.id));
		redirect(303, '/admin/days');
	}
};
