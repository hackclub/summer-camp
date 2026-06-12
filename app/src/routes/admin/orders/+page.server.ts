import { fail } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { shopItems, shopOrders, users } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/auth/guards';
import { refundOrder } from '$lib/server/points';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const status = event.url.searchParams.get('status') ?? 'pending';
	const rows = await db
		.select({
			order: shopOrders,
			itemName: shopItems.name,
			camperName: users.name,
			camperEmail: users.email
		})
		.from(shopOrders)
		.innerJoin(shopItems, eq(shopOrders.itemId, shopItems.id))
		.innerJoin(users, eq(shopOrders.userId, users.id))
		.where(
			status === 'all'
				? undefined
				: eq(shopOrders.status, status as 'pending' | 'fulfilled' | 'rejected' | 'canceled')
		)
		.orderBy(desc(shopOrders.createdAt));
	return { rows, status };
};

export const actions: Actions = {
	fulfill: async (event) => {
		const admin = requireAdmin(event);
		const form = await event.request.formData();
		const id = form.get('id')?.toString();
		if (!id) return fail(400, {});
		await db
			.update(shopOrders)
			.set({ status: 'fulfilled', fulfilledBy: admin.id, fulfilledAt: new Date() })
			.where(eq(shopOrders.id, id));
		return { done: true };
	},

	reject: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const id = form.get('id')?.toString();
		if (!id) return fail(400, {});
		const [order] = await db.select().from(shopOrders).where(eq(shopOrders.id, id)).limit(1);
		if (!order || order.status !== 'pending') return fail(400, {});
		await db.update(shopOrders).set({ status: 'rejected' }).where(eq(shopOrders.id, id));
		await refundOrder(id); // points back + restock
		return { done: true };
	}
};
