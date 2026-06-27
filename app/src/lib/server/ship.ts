import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { projects, type Project, type User } from '$lib/server/db/schema';
import { ariConfigured, buildShipPayload, ingestShip } from '$lib/server/ari';
import { createSubmissionRecord } from '$lib/server/airtable-ships';

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

	// 2) Ingest to Ari; any non-2xx blocks the ship.
	const result = await ingestShip(buildShipPayload({ ...project, airtableRecordId: recordId }, maker, origin));
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
			ariStatus: 'queued',
			ariError: null,
			updatedAt: new Date()
		})
		.where(eq(projects.id, project.id));
	return { ok: true };
}
