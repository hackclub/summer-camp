import { desc, eq, inArray } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { shopItems, shopOrders, users } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/auth/guards';

type OrderStatus = 'ordered' | 'packed' | 'shipped' | 'refunded' | 'canceled';

function cell(v: unknown): string {
	let s = v == null ? '' : String(v);
	// Neutralize spreadsheet formula triggers (camper-controlled address fields
	// land in this CSV; =HYPERLINK/DDE etc. would execute when an admin opens it).
	if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
	return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// CSV of orders to fulfill (default: ordered + packed), for label printing.
export const GET: RequestHandler = async (event) => {
	requireAdmin(event);
	const status = event.url.searchParams.get('status');
	const rows = await db
		.select({ order: shopOrders, itemName: shopItems.name, name: users.name, email: users.email })
		.from(shopOrders)
		.leftJoin(shopItems, eq(shopOrders.itemId, shopItems.id))
		.innerJoin(users, eq(shopOrders.userId, users.id))
		.where(
			status && status !== 'all'
				? eq(shopOrders.status, status as OrderStatus)
				: inArray(shopOrders.status, ['ordered', 'packed'])
		)
		.orderBy(desc(shopOrders.createdAt));

	const header = [
		'Order ID', 'Status', 'Item/Prize', 'Camper', 'Email',
		'Line 1', 'Line 2', 'City', 'State', 'ZIP', 'Country', 'Tracking', 'Notes'
	];
	const lines = [header.map(cell).join(',')];
	for (const r of rows) {
		const a = r.order.address;
		lines.push(
			[
				r.order.id, r.order.status, r.itemName ?? r.order.prizeLabel ?? '', r.name ?? '', r.email,
				a?.line1, a?.line2, a?.city, a?.state, a?.zip, a?.country, r.order.trackingUrl, r.order.notes
			].map(cell).join(',')
		);
	}

	return new Response(lines.join('\n'), {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': 'attachment; filename="orders.csv"'
		}
	});
};
