import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/auth/guards';
import { uploadToCdn } from '$lib/server/cdn';
import { isRateLimited } from '$lib/server/ratelimit';

const MAX_BYTES = 5 * 1024 * 1024;

export const POST: RequestHandler = async (event) => {
	const user = requireUser(event);
	if (isRateLimited(`upload:${user.id}`, 20, 10 * 60 * 1000)) {
		error(429, 'Too many uploads — try again in a few minutes');
	}

	const form = await event.request.formData();
	const file = form.get('file');
	if (!(file instanceof File)) error(400, 'Missing file');
	if (file.size > MAX_BYTES) error(400, 'File too large (max 5 MB)');
	if (!file.type.startsWith('image/')) error(400, 'Only images allowed');

	const url = await uploadToCdn(file);
	return json({ url });
};
