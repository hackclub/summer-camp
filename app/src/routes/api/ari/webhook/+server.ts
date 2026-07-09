import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { campDays, projects, shopOrders, users, webhookDeliveries } from '$lib/server/db/schema';
import { newId } from '$lib/server/ids';
import { awardShipReward } from '$lib/server/points';
import { verifyWebhook, type AriWebhook } from '$lib/server/ari';
import { markApproved } from '$lib/server/airtable-ships';
import { notifyReviewApproved, notifyReviewChanges, type Recipient } from '$lib/server/notify';

// New project status per decision event (fraud is informational, no change).
// Camp only has two review outcomes: approved, or changes requested. Ari's
// `review.rejected` is treated as "changes requested" — the project goes back to
// building and the camper is asked to revise, never a dead-end rejection.
const NEW_STATUS: Record<string, 'approved' | 'building' | 'submitted'> = {
	'review.approved': 'approved',
	'review.rejected': 'building',
	'review.changes': 'building',
	'review.reverted': 'submitted',
	'review.requeued': 'submitted'
};

// Inbound decision webhook from Ari. Every delivery is signed; we verify before
// trusting it, then drive the project's status, the camp-day reward, the Airtable
// checkboxes, and the camper notification. A status-change guard makes Ari's
// retries (which re-deliver the same event) no-ops.
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

	// Replay guard: record the delivery id; a re-sent (already-seen) delivery is
	// acked without re-running side effects, even within the 5-minute signature
	// window. (Belt-and-suspenders with the idempotent awards + status guard.)
	const deliveryId = event.request.headers.get('x-ari-delivery-id');
	if (deliveryId) {
		const inserted = await db
			.insert(webhookDeliveries)
			.values({ deliveryId })
			.onConflictDoNothing()
			.returning({ id: webhookDeliveries.deliveryId });
		if (inserted.length === 0) return new Response('ok', { status: 200 });
	}

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

	if (payload.event === 'review.fraud') {
		console.log(`[ari] fraud relay for ${project.id}`);
		return new Response('ok', { status: 200 });
	}

	const newStatus = NEW_STATUS[payload.event];
	if (!newStatus) {
		console.warn(`[ari] unhandled event ${payload.event} for ${project.id}`);
		return new Response('ok', { status: 200 });
	}

	// Re-delivery guard: same outcome already applied → ack without side effects.
	if (project.status === newStatus) return new Response('ok', { status: 200 });

	const recordId = project.airtableRecordId;
	const note = payload.review?.note_to_maker;
	const [maker] = await db.select().from(users).where(eq(users.id, project.userId)).limit(1);
	const to: Recipient | null = maker
		? { email: maker.email, slackId: maker.slackId, name: maker.name }
		: null;

	await db
		.update(projects)
		.set({ status: newStatus, ariStatus: payload.decision ?? 'queued', ariId: payload.id, updatedAt: new Date() })
		.where(eq(projects.id, project.id));

	switch (payload.event) {
		case 'review.approved': {
			// Award the camp day's reward points (idempotent on the project id).
			let rewardPoints = 0;
			let prizeLabel: string | null = null;
			if (project.campDayId) {
				const [day] = await db
					.select({ rewardPoints: campDays.rewardPoints, prizeLabel: campDays.prizeLabel })
					.from(campDays)
					.where(eq(campDays.id, project.campDayId))
					.limit(1);
				rewardPoints = day?.rewardPoints ?? 0;
				prizeLabel = day?.prizeLabel ?? null;
			}
			await awardShipReward(project.userId, project.id, rewardPoints);
			// Drop the day's prize into the fulfillment queue (one per project).
			if (prizeLabel) {
				await db
					.insert(shopOrders)
					.values({
						id: newId(),
						userId: project.userId,
						itemId: null,
						prizeLabel,
						sourceProjectId: project.id,
						pricePoints: 0,
						status: 'ordered',
						address: project.shipAddress
					})
					.onConflictDoNothing();
			}
			// Record Ari's approved hours + audit note on the YSWS submission (into
			// the override fields) before ticking the Unified-YSWS box.
			const approvedHours =
				payload.review?.approved_hours ??
				(payload.review?.approved_minutes != null
					? Math.round((payload.review.approved_minutes / 60) * 100) / 100
					: null);
			if (recordId)
				await markApproved(recordId, {
					hours: approvedHours,
					justification: payload.review?.audit_note ?? null
				}); // throws -> 500 -> Ari retries
			if (to) await notifyReviewApproved(to, project.title, rewardPoints, prizeLabel, note);
			break;
		}
		case 'review.rejected':
		case 'review.changes': {
			// Both route to the same "make a few changes and ship again" path.
			if (to) await notifyReviewChanges(to, project.title, note);
			break;
		}
		// reverted / requeued: status reset above; no notification.
	}

	return new Response('ok', { status: 200 });
};
