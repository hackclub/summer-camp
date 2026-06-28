import { asc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { shopCategories, shopItems } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/auth/guards';
import { getBalance } from '$lib/server/points';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	const [items, categories, balance] = await Promise.all([
		db.select().from(shopItems).where(eq(shopItems.active, true)).orderBy(asc(shopItems.sort)),
		db.select().from(shopCategories).orderBy(asc(shopCategories.sort), asc(shopCategories.name)),
		getBalance(user.id)
	]);

	// Group active items by category (in category sort order), uncategorized last.
	const groups = categories
		.map((c) => ({ name: c.name, items: items.filter((i) => i.categoryId === c.id) }))
		.filter((g) => g.items.length > 0);
	const uncategorized = items.filter(
		(i) => !i.categoryId || !categories.some((c) => c.id === i.categoryId)
	);
	if (uncategorized.length) groups.push({ name: categories.length ? 'More' : '', items: uncategorized });

	return { groups, balance };
};
