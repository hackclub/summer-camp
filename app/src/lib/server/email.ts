import Airtable from 'airtable';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

// Outbound email is a row in the Airtable "Emails" table (the Loops-connected
// base): each record sets `Email` plus the per-email "Loops - summerCamp…" merge
// columns, and a Loops automation reads those to send. The app never talks to a
// mail provider directly. In dev / with no Airtable key, it logs instead.

const EMAIL_BASE_ID = env.EMAIL_BASE_ID ?? 'appk8Y5N1aKZCxgQ6';
const EMAIL_TABLE = env.EMAIL_TABLE ?? 'tblZHkWirGjYahkFz';

function table() {
	if (!env.AIRTABLE_API_KEY) return null;
	return new Airtable({ apiKey: env.AIRTABLE_API_KEY }).base(EMAIL_BASE_ID)(EMAIL_TABLE);
}

/** Create one Emails-table row. `fields` must include `Email` plus the relevant
 *  "Loops - summerCamp…" columns for this email type. */
export async function createEmailRecord(fields: Record<string, unknown>): Promise<void> {
	const t = table();
	if (dev || !t) {
		console.log('[email]', JSON.stringify(fields));
		return;
	}
	await t.create([{ fields }]);
}

/** Magic-link login email. Throws on a queue failure so login surfaces `sendError`. */
export async function sendMagicLink(email: string, link: string): Promise<void> {
	await createEmailRecord({ Email: email, 'Loops - summerCampMagicLink': link });
}
