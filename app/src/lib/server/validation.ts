import { z } from 'zod';

const httpUrl = z
	.string()
	.trim()
	.max(2000)
	.url()
	.refine((u) => u.startsWith('http://') || u.startsWith('https://'), 'Must be an http(s) URL');

export const projectSchema = z.object({
	title: z.string().trim().min(1, 'Give your project a name').max(100),
	description: z.string().trim().max(2000).optional().default(''),
	githubUrl: httpUrl.optional().or(z.literal('')),
	playableUrl: httpUrl.optional().or(z.literal('')),
	screenshotUrl: httpUrl.optional().or(z.literal(''))
});

// Shipping has a higher bar than saving a draft: reviewers (and the YSWS
// Airtable push) need code, a way to try it, and a screenshot.
export const shipSchema = z.object({
	title: z.string().trim().min(1).max(100),
	description: z.string().trim().min(10, 'Tell us a bit about what you built').max(2000),
	githubUrl: httpUrl,
	playableUrl: httpUrl,
	screenshotUrl: httpUrl
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
