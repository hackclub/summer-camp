import { fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { shopItems } from '$lib/server/db/schema';
import { newId } from '$lib/server/ids';
import { requireAdmin } from '$lib/server/auth/guards';

const itemSchema = z.object({
	name: z.string().trim().min(1).max(200),
	description: z.string().trim().max(2000).optional().default(''),
	imageUrl: z.string().trim().max(2000).optional().default(''),
	pricePoints: z.coerce.number().int().min(1).max(1_000_000),
	stock: z
		.string()
		.trim()
		.optional()
		.default('')
		.transform((s) => (s === '' ? null : Number(s)))
		.refine((n) => n === null || (Number.isInteger(n) && n >= 0), 'Stock must be a whole number'),
	requiresAddress: z.coerce.boolean().default(false),
	sort: z.coerce.number().int().default(0)
});

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const items = await db.select().from(shopItems).orderBy(asc(shopItems.sort), asc(shopItems.name));
	return { items };
};

export const actions: Actions = {
	create: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const parsed = itemSchema.safeParse(Object.fromEntries(form));
		if (!parsed.success) return fail(400, { invalid: true });
		await db.insert(shopItems).values({
			id: newId(),
			name: parsed.data.name,
			description: parsed.data.description || null,
			imageUrl: parsed.data.imageUrl || null,
			pricePoints: parsed.data.pricePoints,
			stock: parsed.data.stock,
			requiresAddress: parsed.data.requiresAddress,
			sort: parsed.data.sort
		});
		return { saved: true };
	},

	update: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const id = form.get('id')?.toString();
		if (!id) return fail(400, { invalid: true });
		const parsed = itemSchema.safeParse(Object.fromEntries(form));
		if (!parsed.success) return fail(400, { invalid: true });
		await db
			.update(shopItems)
			.set({
				name: parsed.data.name,
				description: parsed.data.description || null,
				imageUrl: parsed.data.imageUrl || null,
				pricePoints: parsed.data.pricePoints,
				stock: parsed.data.stock,
				requiresAddress: parsed.data.requiresAddress,
				sort: parsed.data.sort
			})
			.where(eq(shopItems.id, id));
		return { saved: true };
	},

	toggleActive: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const id = form.get('id')?.toString();
		const active = form.get('active')?.toString() === 'true';
		if (!id) return fail(400, { invalid: true });
		await db.update(shopItems).set({ active }).where(eq(shopItems.id, id));
		return { saved: true };
	}
};
