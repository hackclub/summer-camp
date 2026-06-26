import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { projects } from '$lib/server/db/schema';
import { awardShipBonus } from '$lib/server/points';
import { verifyWebhook, type AriWebhook } from '$lib/server/ari';
import { markApproved, markRejected } from '$lib/server/airtable-ships';

// Inbound decision webhook from Ari. Every delivery is signed; we verify before
// trusting it, then drive the project's status + the Airtable checkboxes. All
// effects are idempotent so Ari's retries are safe.
export const POST: RequestHandler = async (event) => {
	const rawBody = await event.request.text();
	const ok = verifyWebhook({
		rawBody,
		signature: event.request.headers.get('x-ari-signature'),
		timestamp: event.request.headers.get('x-ari-timestamp'),
		deliveryId: event.request.headers.get('x-ari-delivery-id'),
		now: Date.now()
	});
	if (!ok) return new Response('bad signature', { status: 401 });

	let payload: AriWebhook;
	try {
		payload = JSON.parse(rawBody);
	} catch {
		return new Response('bad json', { status: 400 });
	}

	const [project] = await db
		.select()
		.from(projects)
		.where(eq(projects.id, payload.external_id))
		.limit(1);
	if (!project) {
		// Nothing to do — ack so Ari stops retrying a project we don't have.
		console.warn(`[ari] webhook for unknown external_id ${payload.external_id}`);
		return new Response('ok', { status: 200 });
	}

	const recordId = project.airtableRecordId;

	switch (payload.event) {
		case 'review.approved': {
			await db
				.update(projects)
				.set({ status: 'approved', ariStatus: 'approved', ariId: payload.id, updatedAt: new Date() })
				.where(eq(projects.id, project.id));
			await awardShipBonus(project.userId, project.id, null);
			if (recordId) await markApproved(recordId); // throws -> 500 -> Ari retries
			break;
		}
		case 'review.rejected': {
			await db
				.update(projects)
				.set({ status: 'rejected', ariStatus: 'rejected', ariId: payload.id, updatedAt: new Date() })
				.where(eq(projects.id, project.id));
			if (recordId) await markRejected(recordId);
			break;
		}
		case 'review.changes': {
			// Send it back to building so the camper can fix it and re-ship.
			await db
				.update(projects)
				.set({ status: 'building', ariStatus: 'changes', ariId: payload.id, updatedAt: new Date() })
				.where(eq(projects.id, project.id));
			break;
		}
		case 'review.reverted':
		case 'review.requeued': {
			// Decision rolled back; put it back in the queue. We leave the Airtable
			// checkboxes as-is (a reviewer can untick if needed).
			await db
				.update(projects)
				.set({ status: 'submitted', ariStatus: 'queued', updatedAt: new Date() })
				.where(eq(projects.id, project.id));
			break;
		}
		case 'review.fraud': {
			// Informational only (relay mode); nothing to change on the ship.
			console.log(`[ari] fraud relay for ${project.id}`);
			break;
		}
		default:
			console.warn(`[ari] unhandled event ${payload.event} for ${project.id}`);
	}

	return new Response('ok', { status: 200 });
};
