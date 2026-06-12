import { asc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { shopItems } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/auth/guards';
import { getBalance } from '$lib/server/points';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	const [items, balance] = await Promise.all([
		db.select().from(shopItems).where(eq(shopItems.active, true)).orderBy(asc(shopItems.sort)),
		getBalance(user.id)
	]);
	return { items, balance };
};
