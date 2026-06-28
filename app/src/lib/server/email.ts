import Airtable from 'airtable';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

// Outbound email goes through an Airtable queue (mirrors airtable-ships.ts): we
// drop a Pending row, and an Airtable automation hands it to Loops to actually
// send. The app never talks to a mail provider directly. In dev / with no
// Airtable key, the email is logged to the console instead.

// The email queue lives in its own base (the Loops-connected one), separate from
// the YSWS submission base.
const EMAIL_BASE_ID = env.EMAIL_BASE_ID ?? 'appk8Y5N1aKZCxgQ6';
const EMAIL_TABLE = env.EMAIL_TABLE ?? 'tblZHkWirGjYahkFz';

export type EmailTemplate =
	| 'magic_link'
	| 'ship_confirmation'
	| 'review_approved'
	| 'review_changes'
	| 'review_rejected'
	| 'order_packed'
	| 'order_shipped'
	| 'order_delivered'
	| 'order_refunded';

function table() {
	if (!env.AIRTABLE_API_KEY) return null;
	return new Airtable({ apiKey: env.AIRTABLE_API_KEY }).base(EMAIL_BASE_ID)(EMAIL_TABLE);
}

/** Queue an email by dropping a Pending row in Airtable; a Loops automation
 *  renders + sends it from the Template + Variables. */
export async function queueEmail(
	template: EmailTemplate,
	to: string,
	variables: Record<string, unknown> = {}
): Promise<void> {
	const t = table();
	if (dev || !t) {
		console.log(`[email] ${template} → ${to}`, variables);
		return;
	}
	await t.create([
		{
			fields: {
				Email: to,
				Template: template,
				Variables: JSON.stringify(variables),
				Status: 'Pending'
			}
		}
	]);
}

/** Magic-link login email. Thin wrapper so the login flow is untouched; still
 *  throws on a queue failure so login surfaces `sendError`. */
export async function sendMagicLink(email: string, link: string): Promise<void> {
	await queueEmail('magic_link', email, { link });
}
