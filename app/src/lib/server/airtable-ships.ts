import Airtable from 'airtable';
import { env } from '$env/dynamic/private';
import type { Project, User } from '$lib/server/db/schema';

// Writes ship records into the "YSWS Project Submission" table. The flow:
//  - On ship: create one record per project (we store its id on the project).
//  - On Ari approval: tick "Automation - Submit to Unified YSWS" so the base's
//    own automation pushes the record into the Unified YSWS DB.
//  - On Ari rejection: tick "Rejected".
// Base/table default to the Summer Camp YSWS base but are env-overridable.

const BASE_ID = env.YSWS_BASE_ID ?? 'appjUKVl6jWStgicR';
const TABLE_ID = env.YSWS_SUBMISSION_TABLE ?? 'tblFTKKHAJy6U8lle';

const APPROVE_FIELD = 'Automation - Submit to Unified YSWS';
const REJECT_FIELD = 'Rejected';
const OVERRIDE_HOURS_FIELD = 'Optional - Override Hours Spent';
const OVERRIDE_HOURS_JUSTIFICATION_FIELD = 'Optional - Override Hours Spent Justification';

function table() {
	if (!env.AIRTABLE_API_KEY) return null;
	return new Airtable({ apiKey: env.AIRTABLE_API_KEY }).base(BASE_ID)(TABLE_ID);
}

function githubUsername(url: string | null): string {
	if (!url) return '';
	const m = url.match(/github\.com\/([^/?#]+)/i);
	return m ? m[1] : '';
}

/** Create the submission record for a freshly shipped project; returns the
 *  Airtable record id (stored on the project for later approve/reject ticks). */
export async function createSubmissionRecord(project: Project, user: User): Promise<string> {
	const t = table();
	if (!t) throw new Error('AIRTABLE_API_KEY / YSWS_BASE_ID not configured');

	const [firstName, ...rest] = (user.name ?? '').trim().split(/\s+/);
	const fields: Airtable.FieldSet = {
		'Code URL': project.githubUrl ?? '',
		'Playable URL': project.playableUrl ?? '',
		'First Name': firstName ?? '',
		'Last Name': rest.join(' '),
		Email: user.email,
		Description: project.description ?? '',
		'GitHub Username': githubUsername(project.githubUrl)
	};
	if (project.screenshotUrl) {
		// Airtable accepts {url} for new attachments; its TS type wants the full
		// server-populated Attachment shape, hence the cast (same as airtable.ts).
		fields.Screenshot = [{ url: project.screenshotUrl }] as unknown as Airtable.Attachment[];
	}
	// Mailing address (captured at ship time) — Unified YSWS needs it to send prizes.
	const addr = project.shipAddress;
	if (addr) {
		fields['Address (Line 1)'] = addr.line1 ?? '';
		fields['Address (Line 2)'] = addr.line2 ?? '';
		fields['City'] = addr.city ?? '';
		fields['State / Province'] = addr.state ?? '';
		fields['ZIP / Postal Code'] = addr.zip ?? '';
		fields['Country'] = addr.country ?? '';
	}

	const created = await t.create([{ fields }]);
	return created[0].id;
}

/** Tick the Unified-YSWS automation checkbox after Ari approves. Ari's approved
 *  hours + audit note are written into the override fields FIRST (in a separate
 *  update) so the base's automation, which fires on the checkbox, sees them. */
export async function markApproved(
	recordId: string,
	override?: { hours?: number | null; justification?: string | null }
): Promise<void> {
	const t = table();
	if (!t) throw new Error('AIRTABLE_API_KEY / YSWS_BASE_ID not configured');

	const pre: Airtable.FieldSet = {};
	if (override?.hours != null) pre[OVERRIDE_HOURS_FIELD] = override.hours;
	if (override?.justification) pre[OVERRIDE_HOURS_JUSTIFICATION_FIELD] = override.justification;
	if (Object.keys(pre).length) await t.update(recordId, pre);

	await t.update(recordId, { [APPROVE_FIELD]: true });
}

/** Tick the Rejected checkbox after Ari rejects. */
export async function markRejected(recordId: string): Promise<void> {
	const t = table();
	if (!t) throw new Error('AIRTABLE_API_KEY / YSWS_BASE_ID not configured');
	await t.update(recordId, { [REJECT_FIELD]: true });
}
