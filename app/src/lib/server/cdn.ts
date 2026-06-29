import { env } from '$env/dynamic/private';

// Uploads a camper screenshot to the Hack Club CDN (v4 API) and returns the
// permanent URL. v4 takes a multipart file upload and returns { url }.

function safeFilename(name: string, type: string): string {
	const ext = type === 'image/jpeg' ? 'jpg' : (type.split('/')[1] ?? 'bin');
	const cleaned =
		(name || 'screenshot').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100) || 'screenshot';
	const dot = cleaned.lastIndexOf('.');
	const stem = dot === -1 ? cleaned : cleaned.slice(0, dot);
	return `${stem}.${ext}`;
}

export async function uploadToCdn(file: File): Promise<string> {
	if (!env.CDN_API_KEY) throw new Error('CDN_API_KEY not configured');

	const fd = new FormData();
	fd.append('file', file, safeFilename(file.name, file.type));

	const res = await fetch('https://cdn.hackclub.com/api/v4/upload', {
		method: 'POST',
		headers: { Authorization: `Bearer ${env.CDN_API_KEY}` },
		body: fd
	});
	if (!res.ok) {
		throw new Error(`CDN upload failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
	}

	const data = (await res.json()) as { url?: string };
	if (!data.url) throw new Error('CDN upload returned no URL');
	return data.url;
}
