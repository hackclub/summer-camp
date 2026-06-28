import { fail } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { shopItems, shopOrders, users } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/auth/guards';
import { refundOrder } from '$lib/server/points';
import { notifyOrderStatus, type Recipient } from '$lib/server/notify';

type OrderStatus = 'ordered' | 'packed' | 'shipped' | 'delivered' | 'refunded' | 'canceled';
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
	ordered: 'packed',
	packed: 'shipped',
	shipped: 'delivered'
};

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const status = event.url.searchParams.get('status') ?? 'ordered';
	const rows = await db
		.select({
			order: shopOrders,
			itemName: shopItems.name,
			camperName: users.name,
			camperEmail: users.email
		})
		.from(shopOrders)
		.leftJoin(shopItems, eq(shopOrders.itemId, shopItems.id))
		.innerJoin(users, eq(shopOrders.userId, users.id))
		.where(status === 'all' ? undefined : eq(shopOrders.status, status as OrderStatus))
		.orderBy(desc(shopOrders.createdAt));
	return { rows, status };
};

/** Load an order + its camper (for notifications); null if missing. */
async function orderWithCamper(id: string) {
	const [row] = await db
		.select({
			order: shopOrders,
			itemName: shopItems.name,
			email: users.email,
			slackId: users.slackId,
			name: users.name
		})
		.from(shopOrders)
		.leftJoin(shopItems, eq(shopOrders.itemId, shopItems.id))
		.innerJoin(users, eq(shopOrders.userId, users.id))
		.where(eq(shopOrders.id, id))
		.limit(1);
	return row ?? null;
}

const label = (row: { itemName: string | null; order: { prizeLabel: string | null } }) =>
	row.itemName ?? row.order.prizeLabel ?? 'your order';

export const actions: Actions = {
	// Advance ordered → packed → shipped → delivered.
	advance: async (event) => {
		const admin = requireAdmin(event);
		const form = await event.request.formData();
		const id = form.get('id')?.toString();
		if (!id) return fail(400, {});
		const row = await orderWithCamper(id);
		if (!row) return fail(400, {});
		const next = NEXT[row.order.status as OrderStatus];
		if (!next) return fail(400, { notAdvanceable: true });

		await db
			.update(shopOrders)
			.set({
				status: next,
				updatedAt: new Date(),
				...(next === 'delivered' ? { fulfilledBy: admin.id, fulfilledAt: new Date() } : {})
			})
			.where(eq(shopOrders.id, id));

		const to: Recipient = { email: row.email, slackId: row.slackId, name: row.name };
		await notifyOrderStatus(
			to,
			label(row),
			next as 'packed' | 'shipped' | 'delivered',
			row.order.trackingUrl
		);
		return { done: true };
	},

	// Set tracking URL / internal notes without changing status.
	setDetails: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const id = form.get('id')?.toString();
		if (!id) return fail(400, {});
		await db
			.update(shopOrders)
			.set({
				trackingUrl: form.get('trackingUrl')?.toString().trim() || null,
				notes: form.get('notes')?.toString().trim() || null,
				updatedAt: new Date()
			})
			.where(eq(shopOrders.id, id));
		return { done: true };
	},

	// Refund: points back + restock, status refunded (for shop purchases).
	refund: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const id = form.get('id')?.toString();
		if (!id) return fail(400, {});
		const row = await orderWithCamper(id);
		if (!row) return fail(400, {});
		await refundOrder(id);
		await db
			.update(shopOrders)
			.set({ status: 'refunded', updatedAt: new Date() })
			.where(eq(shopOrders.id, id));
		const to: Recipient = { email: row.email, slackId: row.slackId, name: row.name };
		await notifyOrderStatus(to, label(row), 'refunded');
		return { done: true };
	},

	// Cancel/void: return any points (idempotent; no-op for free prizes), status canceled.
	cancel: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const id = form.get('id')?.toString();
		if (!id) return fail(400, {});
		await refundOrder(id);
		await db
			.update(shopOrders)
			.set({ status: 'canceled', updatedAt: new Date() })
			.where(eq(shopOrders.id, id));
		return { done: true };
	}
};
