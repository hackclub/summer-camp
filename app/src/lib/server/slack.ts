import { env } from '$env/dynamic/private';

// Slack notifications via the bot token. Every function is a no-op when
// SLACK_BOT_TOKEN is unset (dev) — it just logs — so nothing breaks locally.

/** DM a camper. Best-effort: logs Slack API errors, never throws. */
export async function sendSlackDM(slackId: string | null | undefined, text: string): Promise<void> {
	if (!slackId) return;
	if (!env.SLACK_BOT_TOKEN) {
		console.log(`[slack] DM → ${slackId}: ${text}`);
		return;
	}
	const res = await fetch('https://slack.com/api/chat.postMessage', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ channel: slackId, text, mrkdwn: true })
	});
	try {
		const data = (await res.json()) as { ok?: boolean; error?: string };
		if (!data.ok) console.error('[slack] chat.postMessage failed:', data.error);
	} catch {
		// ignore body parse issues
	}
}

/** Add a camper to a channel (e.g. an #approved-builders on approval). */
export async function inviteToChannel(
	slackId: string | null | undefined,
	channelId: string | undefined
): Promise<void> {
	if (!slackId || !channelId || !env.SLACK_BOT_TOKEN) return;
	await fetch('https://slack.com/api/conversations.invite', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ channel: channelId, users: slackId })
	}).catch(() => {});
}
