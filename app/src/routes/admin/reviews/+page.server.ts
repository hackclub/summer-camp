import { asc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { projects, users } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/auth/guards';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const queue = await db
		.select({
			id: projects.id,
			title: projects.title,
			shippedAt: projects.shippedAt,
			camperName: users.name,
			camperEmail: users.email,
			identityVerified: users.identityVerified
		})
		.from(projects)
		.innerJoin(users, eq(projects.userId, users.id))
		.where(eq(projects.status, 'submitted'))
		.orderBy(asc(projects.shippedAt));
	return { queue };
};
