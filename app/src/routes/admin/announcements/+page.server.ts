import { fail } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { announcements } from '$lib/server/db/schema';
import { newId } from '$lib/server/ids';
import { requireAdmin } from '$lib/server/auth/guards';

const schema = z.object({
	title: z.string().trim().min(1).max(200),
	body: z.string().trim().min(1).max(5000)
});

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const items = await db.select().from(announcements).orderBy(desc(announcements.createdAt));
	return { items };
};

export const actions: Actions = {
	create: async (event) => {
		const admin = requireAdmin(event);
		const form = await event.request.formData();
		const parsed = schema.safeParse(Object.fromEntries(form));
		if (!parsed.success) return fail(400, { invalid: true });
		await db.insert(announcements).values({
			id: newId(),
			title: parsed.data.title,
			body: parsed.data.body,
			createdBy: admin.id
		});
		return { saved: true };
	},

	togglePublish: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const id = form.get('id')?.toString();
		const published = form.get('published')?.toString() === 'true';
		if (!id) return fail(400, { invalid: true });
		await db.update(announcements).set({ published }).where(eq(announcements.id, id));
		return { saved: true };
	},

	remove: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const id = form.get('id')?.toString();
		if (id) await db.delete(announcements).where(eq(announcements.id, id));
		return { saved: true };
	}
};
