// Static art served from the Hack Club CDN instead of this app's origin.
// Each upload gets an immutable UUID path, so cache-busting is never needed —
// replacing an image means uploading a new file and updating the URL here.
// The originals stay in /static as a fallback (see `fallback` below).
import { asset } from '$app/paths';

const CDN = 'https://cdn.hackclub.com';

// onerror handler: if the CDN copy fails to load, swap to the local copy in
// /static. Clears onerror first so a broken local copy can't loop.
export function fallback(localPath: string) {
	return (e: Event) => {
		const img = e.currentTarget as HTMLImageElement;
		img.onerror = null;
		img.src = asset(localPath);
	};
}

export const cdn = {
	title: `${CDN}/019eb6d3-b5c7-7761-b141-90fde028585e/title.png`,
	forest: `${CDN}/019eb6d4-1d0a-7a2d-91f4-c37bb2865ada/forest.png`,
	plank: `${CDN}/019eb6d4-22a2-768a-ae7d-4f06023911da/plank.png`,
	road: `${CDN}/019eb6d4-289f-7334-a696-47af9865373e/road.png`,
	sign: `${CDN}/019eb6d4-2d50-768b-ab58-7b53edbb43f3/sign.png`,
	// Indexed 1–11 to match the existing random-pick logic in grass.svelte.
	grass: {
		1: `${CDN}/019eb6d4-31e9-7cd8-82ee-8137a6bc2b5b/1.svg`,
		2: `${CDN}/019eb6d4-35e3-7383-baee-eafe672ef2fa/2.svg`,
		3: `${CDN}/019eb6d4-39d7-761f-bb47-75320253ff13/3.svg`,
		4: `${CDN}/019eb6d4-3eae-7e6c-8c86-df318babff68/4.svg`,
		5: `${CDN}/019eb6d4-426b-7de8-964d-6e458123cba2/5.svg`,
		6: `${CDN}/019eb6d4-464d-7cb4-82ef-151c53265150/6.svg`,
		7: `${CDN}/019eb6d4-4aa2-7528-8c1f-67ff12ce8244/7.svg`,
		8: `${CDN}/019eb6d4-4e73-7140-86a5-70b152ab2807/8.svg`,
		9: `${CDN}/019eb6d4-5275-792f-8744-53ca5d00efed/9.svg`,
		10: `${CDN}/019eb6d4-561a-7233-a302-6fd193e0d6dd/10.svg`,
		11: `${CDN}/019eb6d4-59ef-787e-87a5-0de3c65fabef/11.svg`
	} as Record<number, string>
};
