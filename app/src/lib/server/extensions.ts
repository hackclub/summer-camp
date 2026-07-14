import { and, eq, gt } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { extensions } from '$lib/server/db/schema';

/** Camp-day ids this user has an active (until > now) admin-granted submission
 *  extension for — those lessons stay open to submit past the normal window. */
export async function activeExtensionDayIds(userId: string, now: Date): Promise<Set<string>> {
	const rows = await db
		.select({ campDayId: extensions.campDayId })
		.from(extensions)
		.where(and(eq(extensions.userId, userId), gt(extensions.until, now)));
	return new Set(rows.map((r) => r.campDayId));
}
