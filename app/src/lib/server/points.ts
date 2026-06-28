import { eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { pointsTransactions, shopItems, shopOrders } from '$lib/server/db/schema';
import { newId } from '$lib/server/ids';
import type { Address } from '$lib/types';

export const POINTS_PER_HOUR = 1;

export async function getBalance(userId: string): Promise<number> {
	const [{ balance }] = await db
		.select({ balance: sql<number>`coalesce(sum(${pointsTransactions.amount}), 0)::int` })
		.from(pointsTransactions)
		.where(eq(pointsTransactions.userId, userId));
	return balance;
}

/** Idempotent: keyed on (kind='attendance', ref_id=attendanceId), so editing
 *  hours re-upserts the same ledger row and the balance self-corrects. */
export async function awardAttendance(
	userId: string,
	attendanceId: string,
	hours: number,
	enteredBy: string
): Promise<void> {
	const amount = Math.round(hours * POINTS_PER_HOUR);
	await db
		.insert(pointsTransactions)
		.values({
			id: newId(),
			userId,
			amount,
			kind: 'attendance',
			refId: attendanceId,
			createdBy: enteredBy
		})
		.onConflictDoUpdate({
			target: [pointsTransactions.kind, pointsTransactions.refId],
			// The unique index is partial, so the conflict target must repeat its
			// predicate or Postgres won't match the index.
			targetWhere: sql`${pointsTransactions.refId} IS NOT NULL`,
			set: { amount }
		});
}

/** Award a camp day's ship reward when its project is approved. Idempotent via
 *  the (kind='ship_bonus', ref_id=projectId) unique index; no-op for 0 points. */
export async function awardShipReward(
	userId: string,
	projectId: string,
	points: number
): Promise<void> {
	if (points <= 0) return;
	await db
		.insert(pointsTransactions)
		.values({
			id: newId(),
			userId,
			amount: points,
			kind: 'ship_bonus',
			refId: projectId,
			createdBy: null
		})
		.onConflictDoNothing();
}

export type PurchaseResult =
	| { ok: true; orderId: string }
	| { ok: false; reason: 'insufficient_points' | 'out_of_stock' | 'unavailable' };

// Thrown inside the purchase transaction to abort it; anything thrown inside
// db.transaction() rolls the whole transaction back.
class InsufficientPointsError extends Error {}

/** Atomic purchase: debit ledger, decrement stock, create the order — or roll
 *  the whole thing back. */
export async function purchase(
	userId: string,
	itemId: string,
	address: Address | null
): Promise<PurchaseResult> {
	try {
		return await db.transaction(async (tx) => {
			const [item] = await tx.select().from(shopItems).where(eq(shopItems.id, itemId)).limit(1);
			if (!item || !item.active) return { ok: false as const, reason: 'unavailable' as const };

			if (item.stock !== null) {
				const updated = await tx
					.update(shopItems)
					.set({ stock: sql`${shopItems.stock} - 1` })
					.where(sql`${shopItems.id} = ${itemId} AND ${shopItems.stock} > 0`)
					.returning({ id: shopItems.id });
				if (updated.length === 0) return { ok: false as const, reason: 'out_of_stock' as const };
			}

			const orderId = newId();
			await tx.insert(pointsTransactions).values({
				id: newId(),
				userId,
				amount: -item.pricePoints,
				kind: 'purchase',
				refId: orderId
			});

			// Re-check balance after the debit; a negative sum means overdraft.
			const [{ balance }] = await tx
				.select({ balance: sql<number>`coalesce(sum(${pointsTransactions.amount}), 0)::int` })
				.from(pointsTransactions)
				.where(eq(pointsTransactions.userId, userId));
			if (balance < 0) throw new InsufficientPointsError();

			await tx.insert(shopOrders).values({
				id: orderId,
				userId,
				itemId,
				pricePoints: item.pricePoints,
				address
			});

			return { ok: true as const, orderId };
		});
	} catch (e) {
		if (e instanceof InsufficientPointsError) {
			return { ok: false, reason: 'insufficient_points' };
		}
		throw e;
	}
}

/** Refund a rejected/canceled order and restock the item. Idempotent via the
 *  (kind='refund', ref_id=orderId) unique index. */
export async function refundOrder(orderId: string): Promise<void> {
	await db.transaction(async (tx) => {
		const [order] = await tx.select().from(shopOrders).where(eq(shopOrders.id, orderId)).limit(1);
		if (!order) return;
		const inserted = await tx
			.insert(pointsTransactions)
			.values({
				id: newId(),
				userId: order.userId,
				amount: order.pricePoints,
				kind: 'refund',
				refId: orderId
			})
			.onConflictDoNothing()
			.returning({ id: pointsTransactions.id });
		// Restock only real shop items; prize orders have no item to restock.
		if (inserted.length > 0 && order.itemId) {
			await tx
				.update(shopItems)
				.set({ stock: sql`${shopItems.stock} + 1` })
				.where(sql`${shopItems.id} = ${order.itemId} AND ${shopItems.stock} IS NOT NULL`);
		}
	});
}
