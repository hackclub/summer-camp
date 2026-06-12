import { env } from '$env/dynamic/private';

// Uploads a camper screenshot to the Hack Club CDN (v3 API) and returns the
// permanent URL. The v3 API takes source URLs, so we first need the bytes
// somewhere fetchable — it also accepts data: URLs, which avoids hosting
// temporary files ourselves.
export async function uploadToCdn(file: File): Promise<string> {
	if (!env.CDN_API_KEY) throw new Error('CDN_API_KEY not configured');

	const buffer = Buffer.from(await file.arrayBuffer());
	const dataUrl = `data:${file.type};base64,${buffer.toString('base64')}`;

	const res = await fetch('https://cdn.hackclub.com/api/v3/new', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.CDN_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify([dataUrl])
	});
	if (!res.ok) throw new Error(`CDN upload failed: ${res.status} ${await res.text()}`);

	const data = (await res.json()) as { files: { deployedUrl: string }[] };
	const url = data.files?.[0]?.deployedUrl;
	if (!url) throw new Error('CDN upload returned no URL');
	return url;
}
