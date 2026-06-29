import { createEmailRecord } from '$lib/server/email';

// Per-event notification fan-out: an Emails row (with the matching
// "Loops - summerCamp…" columns) carries the real content. Slack DMs are
// DISABLED for now — re-enable by restoring the sendSlackDM call below (and the
// import). Best-effort — a notification failure must never break the action.

export interface Recipient {
	email: string;
	slackId: string | null;
	name: string | null;
}

async function fanOut(to: Recipient, loopsFields: Record<string, unknown>): Promise<void> {
	try {
		await createEmailRecord({ Email: to.email, ...loopsFields });
	} catch (e) {
		console.error('[notify] email failed:', e);
	}
	// Slack disabled for now — see slack.ts. Restore:
	//   import { sendSlackDM } from '$lib/server/slack';
	//   try { await sendSlackDM(to.slackId, 'Hey! You got a notification from the
	//     Summer Camp team. Check your email!'); } catch (e) { ... }
}

export function notifyShipReceived(to: Recipient, projectTitle: string) {
	return fanOut(to, { 'Loops - summerCampShipConfirmed': projectTitle });
}

export function notifyReviewApproved(
	to: Recipient,
	projectTitle: string,
	rewardPoints: number,
	prizeLabel: string | null,
	note?: string
) {
	return fanOut(to, {
		'Loops - summerCampReviewApprovedProjectTitle': projectTitle,
		'Loops - summerCampReviewApprovedRewardPoints': rewardPoints,
		'Loops - summerCampReviewApprovedPrize': prizeLabel ?? '',
		'Loops - summerCampReviewApprovedNote': note ?? ''
	});
}

export function notifyReviewChanges(to: Recipient, projectTitle: string, note?: string) {
	return fanOut(to, {
		'Loops - summerCampReviewChangesProjectTitle': projectTitle,
		'Loops - summerCampReviewChangesNote': note ?? ''
	});
}

/** status is one of the notifying order states: packed | shipped. */
export function notifyOrderStatus(
	to: Recipient,
	itemName: string,
	status: 'packed' | 'shipped',
	trackingUrl?: string | null
) {
	const fieldsByStatus: Record<typeof status, Record<string, unknown>> = {
		packed: { 'Loops - summerCampOrderPackedItemName': itemName },
		shipped: {
			'Loops - summerCampOrderShippedItemName': itemName,
			'Loops - summerCampOrderShippedTrackingUrl': trackingUrl ?? ''
		}
	};
	return fanOut(to, fieldsByStatus[status]);
}
