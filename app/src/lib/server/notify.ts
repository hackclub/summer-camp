import { queueEmail, type EmailTemplate } from '$lib/server/email';
import { sendSlackDM } from '$lib/server/slack';

// Per-event notification fan-out: email (via the Airtable queue) + Slack DM.
// Everything here is best-effort — callers must not let a notification failure
// break the underlying action, and each channel is independently guarded.

export interface Recipient {
	email: string;
	slackId: string | null;
	name: string | null;
}

async function fanOut(
	template: EmailTemplate,
	to: Recipient,
	vars: Record<string, unknown>,
	slackText: string
): Promise<void> {
	try {
		await queueEmail(template, to.email, vars);
	} catch (e) {
		console.error(`[notify] email ${template} failed:`, e);
	}
	try {
		await sendSlackDM(to.slackId, slackText);
	} catch (e) {
		console.error(`[notify] slack ${template} failed:`, e);
	}
}

export function notifyShipReceived(to: Recipient, projectTitle: string) {
	return fanOut(
		'ship_confirmation',
		to,
		{ projectTitle },
		`📨 We got your project *${projectTitle}* — it's in review. We'll let you know when it's decided!`
	);
}

export function notifyReviewApproved(
	to: Recipient,
	projectTitle: string,
	rewardPoints: number,
	prizeLabel: string | null,
	note?: string
) {
	let txt = `🎉 Your project *${projectTitle}* was approved!`;
	if (rewardPoints > 0) txt += ` +${rewardPoints} points.`;
	if (prizeLabel) txt += ` Your prize (*${prizeLabel}*) is headed your way.`;
	if (note) txt += `\n> ${note}`;
	return fanOut(
		'review_approved',
		to,
		{ projectTitle, rewardPoints, prizeLabel: prizeLabel ?? '', note: note ?? '' },
		txt
	);
}

export function notifyReviewChanges(to: Recipient, projectTitle: string, note?: string) {
	let txt = `✏️ Your project *${projectTitle}* needs a few changes before it's approved.`;
	if (note) txt += `\n> ${note}`;
	txt += `\nMake the changes and ship it again from the Submit page.`;
	return fanOut('review_changes', to, { projectTitle, note: note ?? '' }, txt);
}

export function notifyReviewRejected(to: Recipient, projectTitle: string, note?: string) {
	let txt = `Your project *${projectTitle}* wasn't approved.`;
	if (note) txt += `\n> ${note}`;
	return fanOut('review_rejected', to, { projectTitle, note: note ?? '' }, txt);
}

/** status is one of the notifying order states: packed | shipped | delivered | refunded. */
export function notifyOrderStatus(
	to: Recipient,
	itemName: string,
	status: 'packed' | 'shipped' | 'delivered' | 'refunded',
	trackingUrl?: string | null
) {
	const lines: Record<typeof status, string> = {
		packed: `📦 Your order *${itemName}* is packed and ready to ship.`,
		shipped: `🚚 Your order *${itemName}* has shipped!`,
		delivered: `✅ Your order *${itemName}* was delivered. Enjoy!`,
		refunded: `↩️ Your order *${itemName}* was refunded — your points are back.`
	};
	let txt = lines[status];
	if (status === 'shipped' && trackingUrl) txt += `\nTrack it: ${trackingUrl}`;
	return fanOut(
		`order_${status}` as EmailTemplate,
		to,
		{ itemName, status, trackingUrl: trackingUrl ?? '' },
		txt
	);
}
