import Airtable from 'airtable';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

// Launch funnel tracking in Airtable (same base as Emails). Two tables:
//  - RSVP    : the signup list (one row per email; landing + new signups).
//  - Funnel  : one row per email with timestamps for each stage they reach
//              (Signed Up At / Logged In At / First Ship At). Counting non-empty
//              columns gives the funnel numbers shown on the admin stats page.
// Everything here is best-effort — a tracking failure must never block auth/ship.

const BASE_ID = env.EMAIL_BASE_ID ?? 'appk8Y5N1aKZCxgQ6';
const RSVP_TABLE = env.RSVP_TABLE ?? 'RSVP';
const FUNNEL_TABLE = env.FUNNEL_TABLE ?? 'Funnel';

function base() {
	if (!env.AIRTABLE_API_KEY) return null;
	return new Airtable({ apiKey: env.AIRTABLE_API_KEY }).base(BASE_ID);
}

// Escape a value for an Airtable filterByFormula string literal.
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

async function funnelRow(b: NonNullable<ReturnType<typeof base>>, lowerEmail: string) {
	const recs = await b(FUNNEL_TABLE)
		.select({ filterByFormula: `LOWER({Email})='${esc(lowerEmail)}'`, maxRecords: 1 })
		.firstPage();
	return recs[0] ?? null;
}

async function stampOnce(email: string, field: 'Logged In At' | 'First Ship At'): Promise<void> {
	const b = base();
	if (dev || !b) {
		console.log('[funnel]', field, email);
		return;
	}
	const now = new Date().toISOString();
	const row = await funnelRow(b, email.toLowerCase());
	if (!row) await b(FUNNEL_TABLE).create([{ fields: { Email: email, [field]: now } }]);
	else if (!row.get(field)) await b(FUNNEL_TABLE).update([{ id: row.id, fields: { [field]: now } }]);
}

/** Signup: add to the RSVP list (deduped) + stamp Signed Up At (once). */
export async function markSignedUp(email: string): Promise<void> {
	const b = base();
	if (dev || !b) {
		console.log('[funnel] signedUp', email);
		return;
	}
	const lower = email.toLowerCase();
	// RSVP list — dedupe by email.
	const existing = await b(RSVP_TABLE)
		.select({ filterByFormula: `LOWER({Email})='${esc(lower)}'`, maxRecords: 1 })
		.firstPage();
	if (!existing.length) await b(RSVP_TABLE).create([{ fields: { Email: email } }]);
	// Funnel — stamp Signed Up At once.
	const row = await funnelRow(b, lower);
	const now = new Date().toISOString();
	if (!row) await b(FUNNEL_TABLE).create([{ fields: { Email: email, 'Signed Up At': now } }]);
	else if (!row.get('Signed Up At'))
		await b(FUNNEL_TABLE).update([{ id: row.id, fields: { 'Signed Up At': now } }]);
}

export const markLoggedIn = (email: string) => stampOnce(email, 'Logged In At');
export const markFirstShip = (email: string) => stampOnce(email, 'First Ship At');

export interface FunnelCounts {
	rsvp: number;
	signedUp: number;
	loggedIn: number;
	shipped: number;
}

/** Funnel totals for the admin stats page. Reads both tables; safe on failure. */
export async function funnelCounts(): Promise<FunnelCounts> {
	const b = base();
	const out: FunnelCounts = { rsvp: 0, signedUp: 0, loggedIn: 0, shipped: 0 };
	if (!b) return out;
	try {
		const rsvpRecs = await b(RSVP_TABLE).select().all();
		out.rsvp = rsvpRecs.length;
	} catch (e) {
		console.error('[funnel] rsvp count failed:', e);
	}
	try {
		const recs = await b(FUNNEL_TABLE)
			.select({ fields: ['Signed Up At', 'Logged In At', 'First Ship At'] })
			.all();
		for (const r of recs) {
			if (r.get('Signed Up At')) out.signedUp++;
			if (r.get('Logged In At')) out.loggedIn++;
			if (r.get('First Ship At')) out.shipped++;
		}
	} catch (e) {
		console.error('[funnel] count failed:', e);
	}
	return out;
}
