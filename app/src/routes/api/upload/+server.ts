import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/auth/guards';
import { uploadToCdn } from '$lib/server/cdn';
import { isRateLimited } from '$lib/server/ratelimit';

const MAX_BYTES = 5 * 1024 * 1024;

// Sniff the real type from magic bytes — never trust the client-supplied part
// Content-Type. Allowlist raster images only; SVG is rejected (it can carry
// script). Returns the canonical MIME or null if unrecognized.
async function detectImageType(file: File): Promise<string | null> {
	const b = new Uint8Array(await file.slice(0, 16).arrayBuffer());
	if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
	if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
	if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return 'image/gif';
	if (
		b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
		b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
	)
		return 'image/webp';
	return null;
}

export const POST: RequestHandler = async (event) => {
	const user = requireUser(event);
	if (isRateLimited(`upload:${user.id}`, 20, 10 * 60 * 1000)) {
		error(429, 'Too many uploads — try again in a few minutes');
	}

	const form = await event.request.formData();
	const file = form.get('file');
	if (!(file instanceof File)) error(400, 'Missing file');
	if (file.size > MAX_BYTES) error(400, 'File too large (max 5 MB)');

	const detected = await detectImageType(file);
	if (!detected) error(400, 'Only PNG, JPEG, GIF, or WebP images allowed');

	const url = await uploadToCdn(file, detected);
	return json({ url });
};
