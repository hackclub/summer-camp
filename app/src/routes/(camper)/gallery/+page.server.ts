import { desc, eq, ilike, and, type SQL } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { projects, users } from '$lib/server/db/schema';

const PAGE_SIZE = 24;

// Public — shareable with parents and friends; no login required.
export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	const page = Math.max(1, Number(url.searchParams.get('page')) || 1);

	const conditions: SQL[] = [eq(projects.status, 'approved')];
	if (q) conditions.push(ilike(projects.title, `%${q}%`));

	const rows = await db
		.select({
			id: projects.id,
			title: projects.title,
			description: projects.description,
			screenshotUrl: projects.screenshotUrl,
			authorName: users.name
		})
		.from(projects)
		.innerJoin(users, eq(projects.userId, users.id))
		.where(and(...conditions))
		.orderBy(desc(projects.shippedAt))
		.limit(PAGE_SIZE + 1)
		.offset((page - 1) * PAGE_SIZE);

	return {
		gallery: rows.slice(0, PAGE_SIZE),
		hasMore: rows.length > PAGE_SIZE,
		page,
		q
	};
};
