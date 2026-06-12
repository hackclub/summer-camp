import Airtable from 'airtable';
import { eq, isNull, or, sql, and } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { attendance, projects, users } from '$lib/server/db/schema';
import { env } from '$env/dynamic/private';

// Unified YSWS sync. Batched dirty-flag sync (not on-write push): attendance
// saves are bulk (30+ rows) and Airtable caps at 5 req/s, so a periodic sweep
// with per-row synced_at markers is simpler and self-healing.

export interface SyncResult {
	rosterSynced: number;
	projectsSynced: number;
	errors: string[];
	ranAt: string;
}

export let lastSync: SyncResult | null = null;

let running = false;

function base() {
	if (!env.AIRTABLE_API_KEY || !env.YSWS_BASE_ID) return null;
	return new Airtable({ apiKey: env.AIRTABLE_API_KEY }).base(env.YSWS_BASE_ID);
}

export async function runSync(): Promise<SyncResult> {
	const result: SyncResult = {
		rosterSynced: 0,
		projectsSynced: 0,
		errors: [],
		ranAt: new Date().toISOString()
	};
	if (running) {
		result.errors.push('Sync already running');
		return result;
	}
	running = true;
	try {
		const at = base();
		if (!at) {
			result.errors.push('AIRTABLE_API_KEY / YSWS_BASE_ID not configured');
			return result;
		}

		await syncRoster(at, result);
		await syncProjects(at, result);
		lastSync = result;
		return result;
	} finally {
		running = false;
	}
}

// One roster record per camper (Email, Name, Total Hours), updated whenever
// any of their attendance rows is dirty.
async function syncRoster(at: Airtable.Base, result: SyncResult) {
	const rosterTable = env.YSWS_ROSTER_TABLE ?? 'Campers';

	const dirtyUsers = await db
		.selectDistinct({ userId: attendance.userId })
		.from(attendance)
		.where(or(isNull(attendance.syncedAt), sql`${attendance.updatedAt} > ${attendance.syncedAt}`));

	for (const { userId } of dirtyUsers) {
		try {
			const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
			if (!user) continue;
			const [{ totalHours }] = await db
				.select({ totalHours: sql<string>`coalesce(sum(${attendance.hours}), 0)` })
				.from(attendance)
				.where(eq(attendance.userId, userId));

			const fields = {
				Email: user.email,
				Name: user.name ?? '',
				'Total Hours': Number(totalHours)
			};

			// The roster record id is stored on each attendance row; reuse any.
			const [withRecord] = await db
				.select({ recordId: attendance.airtableRecordId })
				.from(attendance)
				.where(and(eq(attendance.userId, userId), sql`${attendance.airtableRecordId} IS NOT NULL`))
				.limit(1);

			let recordId = withRecord?.recordId ?? null;
			if (recordId) {
				await at(rosterTable).update(recordId, fields);
			} else {
				const created = await at(rosterTable).create([{ fields }]);
				recordId = created[0].id;
			}

			await db
				.update(attendance)
				.set({ syncedAt: new Date(), airtableRecordId: recordId })
				.where(eq(attendance.userId, userId));
			result.rosterSynced++;
		} catch (e) {
			result.errors.push(`roster ${userId}: ${e instanceof Error ? e.message : String(e)}`);
		}
	}
}

// Approved projects → YSWS submission table, Hours = camper's summed attendance.
async function syncProjects(at: Airtable.Base, result: SyncResult) {
	const projectsTable = env.YSWS_TABLE ?? 'Approved Projects';

	const dirty = await db
		.select()
		.from(projects)
		.where(
			and(
				eq(projects.status, 'approved'),
				or(isNull(projects.syncedAt), sql`${projects.updatedAt} > ${projects.syncedAt}`)
			)
		);

	for (const project of dirty) {
		try {
			const [user] = await db.select().from(users).where(eq(users.id, project.userId)).limit(1);
			if (!user) continue;
			const [{ totalHours }] = await db
				.select({ totalHours: sql<string>`coalesce(sum(${attendance.hours}), 0)` })
				.from(attendance)
				.where(eq(attendance.userId, project.userId));

			const [firstName, ...rest] = (user.name ?? '').split(' ');
			const fields: Airtable.FieldSet = {
				'Code URL': project.githubUrl ?? '',
				'Playable URL': project.playableUrl ?? '',
				Description: project.description ?? '',
				Email: user.email,
				'First Name': firstName ?? '',
				'Last Name': rest.join(' '),
				Hours: Number(totalHours)
			};
			if (project.screenshotUrl) {
				// Airtable accepts {url} for new attachments; its TS type wants the
				// full server-populated Attachment shape, hence the cast.
				fields.Screenshot = [{ url: project.screenshotUrl }] as unknown as Airtable.Attachment[];
			}

			let recordId = project.airtableRecordId;
			if (recordId) {
				await at(projectsTable).update(recordId, fields);
			} else {
				const created = await at(projectsTable).create([{ fields }]);
				recordId = created[0].id;
			}

			await db
				.update(projects)
				.set({ syncedAt: new Date(), airtableRecordId: recordId })
				.where(eq(projects.id, project.id));
			result.projectsSynced++;
		} catch (e) {
			result.errors.push(`project ${project.id}: ${e instanceof Error ? e.message : String(e)}`);
		}
	}
}
