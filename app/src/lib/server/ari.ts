import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';
import type { Project, User } from '$lib/server/db/schema';

// Ari integration. Two directions:
//  - Outbound (us -> Ari): POST a signed ship to /api/ingest/<program_id> when a
//    camper ships. Any 2xx means it's queued for review.
//  - Inbound (Ari -> us): Ari POSTs a signed decision to our webhook; we verify
//    the signature before trusting it.
// Both directions sign with the per-program secret from Ari's Settings -> Webhooks.

const ARI_BASE = env.ARI_BASE_URL ?? 'https://ari.hackclub.com';

/** True only when both the program id and signing secret are configured. */
export function ariConfigured(): boolean {
	return Boolean(env.ARI_PROGRAM_ID && env.ARI_SECRET);
}

function hmacHex(raw: string, secret: string): string {
	return createHmac('sha256', secret).update(raw).digest('hex');
}

// Ari uses two separate secrets: ARI_SECRET signs our outbound ingest, and a
// distinct outbound/webhook secret signs Ari's inbound decision webhooks. Fall
// back to ARI_SECRET if the webhook one isn't set.
function webhookSecret(): string {
	return env.ARI_WEBHOOK_SECRET ?? env.ARI_SECRET ?? '';
}

export interface ShipPayload {
	external_id: string;
	title: string;
	description: string;
	maker: { email: string; name: string; slack_id: string; program_hours: number };
	repo_url: string;
	demo_url?: string;
	thumbnail_url: string;
	hackatime_projects?: string[];
	journals?: { at: string; minutes: number; text: string }[];
	evidence: string[];
	meta?: Record<string, string>;
}

/** Pull the GitHub owner/repo out of a repo URL for the meta block. Best-effort. */
function githubSlug(url: string | null): string | null {
	if (!url) return null;
	const m = url.match(/github\.com\/([^/]+\/[^/?#]+)/i);
	return m ? m[1].replace(/\.git$/, '') : null;
}

/** Build the ingest payload from a project + its maker. external_id is the
 *  project id so decision webhooks can be matched straight back to the row.
 *  Time is logged as a single journal entry of (campDayHours × 60) minutes —
 *  this is how camp satisfies Ari's "hackatime_projects OR journals" rule
 *  without Hackatime. */
export function buildShipPayload(
	project: Project,
	user: User,
	origin: string,
	campDayHours: number
): ShipPayload {
	const hackatime = (project.hackatimeProjects ?? '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
	const at = (project.shippedAt ?? new Date()).toISOString().slice(0, 10); // YYYY-MM-DD

	const payload: ShipPayload = {
		external_id: project.id,
		title: project.title,
		description: project.description ?? '',
		maker: {
			email: user.email,
			name: user.name ?? '',
			slack_id: user.slackId ?? '',
			program_hours: campDayHours // hours credited for this ship's camp day
		},
		repo_url: project.githubUrl ?? '',
		thumbnail_url: project.screenshotUrl ?? '',
		journals: [
			{
				at,
				minutes: Math.round(campDayHours * 60),
				text: project.description || project.title
			}
		],
		evidence: ['commits', 'elapsed', 'devlog'],
		meta: { 'Project page': `${origin}/projects/${project.id}` }
	};
	if (project.playableUrl) payload.demo_url = project.playableUrl;
	if (hackatime.length) payload.hackatime_projects = hackatime;
	return payload;
}

export interface IngestResult {
	ok: boolean; // true on any 2xx
	status: number;
	body: string;
}

/** Sign and POST a ship to Ari. ok is true for any 2xx (queued or duplicate). */
export async function ingestShip(payload: ShipPayload): Promise<IngestResult> {
	const raw = JSON.stringify(payload);
	const res = await fetch(`${ARI_BASE}/api/ingest/${env.ARI_PROGRAM_ID}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Ari-Signature': hmacHex(raw, env.ARI_SECRET ?? '')
		},
		body: raw
	});
	const body = await res.text();
	return { ok: res.status >= 200 && res.status < 300, status: res.status, body };
}

/** Pull an already-queued ship back off Ari's review queue (e.g. on un-ship). */
export async function withdrawShip(externalId: string): Promise<IngestResult> {
	const raw = JSON.stringify({ external_id: externalId });
	const res = await fetch(`${ARI_BASE}/api/ingest/${env.ARI_PROGRAM_ID}/withdraw`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Ari-Signature': hmacHex(raw, env.ARI_SECRET ?? '')
		},
		body: raw
	});
	const body = await res.text();
	return { ok: res.status >= 200 && res.status < 300, status: res.status, body };
}

/** Verify an inbound decision webhook. Signature is HMAC of
 *  `timestamp.delivery_id.body`; we also reject anything older than 5 minutes. */
export function verifyWebhook(opts: {
	rawBody: string;
	signature: string | null;
	timestamp: string | null;
	deliveryId: string | null;
	now: number;
}): boolean {
	const { rawBody, signature, timestamp, deliveryId, now } = opts;
	const secret = webhookSecret();
	if (!signature || !timestamp || !deliveryId || !secret) return false;

	const ts = Number(timestamp);
	if (!Number.isFinite(ts)) return false;
	if (Math.abs(now / 1000 - ts) > 5 * 60) return false; // 5-minute replay window

	const expected = hmacHex(`${timestamp}.${deliveryId}.${rawBody}`, secret);
	const a = Buffer.from(expected);
	const b = Buffer.from(signature);
	return a.length === b.length && timingSafeEqual(a, b);
}

// The decision payload, narrowed to the fields we act on.
export interface AriWebhook {
	event:
		| 'review.approved'
		| 'review.changes'
		| 'review.rejected'
		| 'review.reverted'
		| 'review.requeued'
		| 'review.fraud';
	decision: 'approved' | 'changes' | 'rejected' | null;
	id: string;
	external_id: string;
	review?: { note_to_maker?: string };
}
