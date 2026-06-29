import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { campDays, projects, type Project, type User } from '$lib/server/db/schema';
import { ariConfigured, buildShipPayload, ingestShip } from '$lib/server/ari';
import { createSubmissionRecord } from '$lib/server/airtable-ships';
import { notifyShipReceived } from '$lib/server/notify';
import { markFirstShip } from '$lib/server/funnel';

const DEFAULT_DAY_HOURS = 3;

/** Hours credited for a project's camp day (logged to Ari), defaulting when the
 *  project isn't tied to a day or the day has no value. */
async function campDayHoursFor(project: Project): Promise<number> {
	if (!project.campDayId) return DEFAULT_DAY_HOURS;
	const [day] = await db
		.select({ hours: campDays.hours })
		.from(campDays)
		.where(eq(campDays.id, project.campDayId))
		.limit(1);
	return day?.hours != null ? Number(day.hours) : DEFAULT_DAY_HOURS;
}

export type ShipOutcome = { ok: true } | { ok: false };

/**
 * Ship a project to Ari: create its Airtable record (once), send the signed
 * ingest, and only mark it submitted on a 2xx. Any failure records the reason on
 * the project and returns ok:false so the caller can keep it in 'building' and
 * tell the camper to retry / contact Jenin. Shared by the per-lesson submit flow
 * and the legacy per-project ship page so they behave identically.
 */
export async function shipProject(
	project: Project,
	maker: User,
	origin: string
): Promise<ShipOutcome> {
	if (!ariConfigured()) {
		console.error('[ari] ingest skipped: ARI_PROGRAM_ID / ARI_SECRET not configured');
		return { ok: false };
	}

	// 1) Airtable record first (reuse one from a previous failed attempt).
	let recordId = project.airtableRecordId;
	if (!recordId) {
		try {
			recordId = await createSubmissionRecord(project, maker);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			console.error('[ari] airtable record create failed:', msg);
			await db
				.update(projects)
				.set({ ariStatus: 'error', ariError: `airtable: ${msg}`, updatedAt: new Date() })
				.where(eq(projects.id, project.id));
			return { ok: false };
		}
		await db
			.update(projects)
			.set({ airtableRecordId: recordId, updatedAt: new Date() })
			.where(eq(projects.id, project.id));
	}

	// 2) Ingest to Ari; any non-2xx blocks the ship. Time is the camp day's hours,
	//    logged as a journal entry (no Hackatime).
	const hours = await campDayHoursFor(project);
	const result = await ingestShip(
		buildShipPayload({ ...project, airtableRecordId: recordId }, maker, origin, hours)
	);
	if (!result.ok) {
		const msg = `ingest ${result.status}: ${result.body.slice(0, 500)}`;
		console.error('[ari] ingest failed:', msg);
		await db
			.update(projects)
			.set({ ariStatus: 'error', ariError: msg, updatedAt: new Date() })
			.where(eq(projects.id, project.id));
		return { ok: false };
	}

	// 3) Queued for review.
	await db
		.update(projects)
		.set({
			status: 'submitted',
			shippedAt: new Date(),
			loggedHours: hours.toString(),
			ariStatus: 'queued',
			ariError: null,
			updatedAt: new Date()
		})
		.where(eq(projects.id, project.id));

	await notifyShipReceived(
		{ email: maker.email, slackId: maker.slackId, name: maker.name },
		project.title
	);
	try {
		await markFirstShip(maker.email);
	} catch (e) {
		console.error('[funnel] ship tracking failed:', e);
	}
	return { ok: true };
}
