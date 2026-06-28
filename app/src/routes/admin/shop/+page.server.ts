import { fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { shopCategories, shopItems } from '$lib/server/db/schema';
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
	sort: z.coerce.number().int().default(0),
	categoryId: z
		.string()
		.trim()
		.optional()
		.default('')
		.transform((s) => s || null)
});

function slugify(name: string): string {
	return (
		name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '')
			.slice(0, 48) || 'category'
	);
}

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const [items, categories] = await Promise.all([
		db.select().from(shopItems).orderBy(asc(shopItems.sort), asc(shopItems.name)),
		db.select().from(shopCategories).orderBy(asc(shopCategories.sort), asc(shopCategories.name))
	]);
	return { items, categories };
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
			sort: parsed.data.sort,
			categoryId: parsed.data.categoryId
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
				sort: parsed.data.sort,
				categoryId: parsed.data.categoryId
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
	},

	createCategory: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const name = form.get('name')?.toString().trim();
		if (!name) return fail(400, { categoryInvalid: true });
		await db
			.insert(shopCategories)
			.values({
				id: newId(),
				name,
				slug: slugify(name),
				description: form.get('description')?.toString().trim() || null,
				sort: Number(form.get('sort')?.toString() || 0) || 0
			})
			.onConflictDoNothing();
		return { saved: true };
	},

	deleteCategory: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const id = form.get('id')?.toString();
		if (id) await db.delete(shopCategories).where(eq(shopCategories.id, id));
		return { saved: true };
	}
};
