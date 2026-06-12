import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { projects } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/auth/guards';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	const myProjects = await db
		.select()
		.from(projects)
		.where(eq(projects.userId, user.id))
		.orderBy(desc(projects.updatedAt));
	return { myProjects };
};
