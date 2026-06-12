import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { shopItems, shopOrders } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/auth/guards';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	const orders = await db
		.select({
			id: shopOrders.id,
			status: shopOrders.status,
			pricePoints: shopOrders.pricePoints,
			createdAt: shopOrders.createdAt,
			itemName: shopItems.name,
			itemImage: shopItems.imageUrl
		})
		.from(shopOrders)
		.innerJoin(shopItems, eq(shopOrders.itemId, shopItems.id))
		.where(eq(shopOrders.userId, user.id))
		.orderBy(desc(shopOrders.createdAt));
	return { orders };
};
