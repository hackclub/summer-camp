import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { projects, users } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/auth/guards';
import { SHIP_BONUS } from '$lib/server/points';

// Ari is the sole reviewer now — this page is read-only. Approve/reject happen
// in Ari and come back via the /api/ari/webhook handler, which drives status and
// the Airtable checkboxes. No mutating actions live here anymore.
export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const [row] = await db
		.select({ project: projects, camper: users })
		.from(projects)
		.innerJoin(users, eq(projects.userId, users.id))
		.where(eq(projects.id, event.params.projectId))
		.limit(1);
	if (!row) error(404, 'Project not found');
	return { project: row.project, camper: row.camper, shipBonus: SHIP_BONUS };
};
