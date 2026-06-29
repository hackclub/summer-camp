import { z } from 'zod';

const httpUrl = z
	.string()
	.trim()
	.max(2000)
	.url()
	.refine((u) => u.startsWith('http://') || u.startsWith('https://'), 'Must be an http(s) URL');

// Screenshots must be files we uploaded to the Hack Club CDN — not an arbitrary
// URL. Stops a camper pointing the official YSWS screenshot at any host (and the
// second-order Airtable server-side fetch that follows).
const cdnUrl = z
	.string()
	.trim()
	.max(2000)
	.url()
	.refine(
		(u) => /^https:\/\/(hc-cdn\.hl\.hackclub\.com|cdn\.hackclub\.com)\//.test(u),
		'Upload a screenshot instead of pasting a link'
	);

export const projectSchema = z.object({
	title: z.string().trim().min(1, 'Give your project a name').max(100),
	description: z.string().trim().max(2000).optional().default(''),
	githubUrl: httpUrl.optional().or(z.literal('')),
	playableUrl: httpUrl.optional().or(z.literal('')),
	screenshotUrl: cdnUrl.optional().or(z.literal(''))
});

// Shipping has a higher bar than saving a draft: reviewers (and the YSWS
// Airtable push) need code, a way to try it, and a screenshot.
export const shipSchema = z.object({
	title: z.string().trim().min(1).max(100),
	description: z.string().trim().min(10, 'Tell us a bit about what you built').max(2000),
	githubUrl: httpUrl,
	playableUrl: httpUrl,
	screenshotUrl: cdnUrl
});

/** First zod issue per field, keyed by top-level field name — handy shape for
 *  rendering form errors. */
export function flattenErrors(error: { issues: { path: PropertyKey[]; message: string }[] }) {
	const out: Record<string, string> = {};
	for (const issue of error.issues) {
		const key = String(issue.path[0] ?? 'form');
		if (!out[key]) out[key] = issue.message;
	}
	return out;
}

export const addressSchema = z.object({
	line1: z.string().trim().min(1, 'Required').max(200),
	line2: z.string().trim().max(200).optional().default(''),
	city: z.string().trim().min(1, 'Required').max(100),
	state: z.string().trim().min(1, 'Required').max(100),
	zip: z.string().trim().min(1, 'Required').max(20),
	country: z.string().trim().min(1, 'Required').max(100)
});
