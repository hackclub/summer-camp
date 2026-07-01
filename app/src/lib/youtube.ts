// Recognize YouTube links (youtube.com/watch, youtu.be, /embed, /shorts, /live)
// and turn them into a privacy-friendly embed URL. Pure — usable client + server.

/** The 11-ish char video id from any common YouTube URL shape, or null. */
export function youtubeId(url: string): string | null {
	let u: URL;
	try {
		u = new URL(url.trim());
	} catch {
		return null;
	}
	const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
	let id: string | null = null;
	if (host === 'youtu.be') {
		id = u.pathname.slice(1).split('/')[0] || null;
	} else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
		if (u.pathname === '/watch') id = u.searchParams.get('v');
		else {
			const m = u.pathname.match(/^\/(embed|shorts|live)\/([^/?#]+)/);
			if (m) id = m[2];
		}
	}
	// Guard the id so it can only ever be a safe token in an embed src.
	return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
}

/** nocookie embed URL for a YouTube link, or null if it isn't one. */
export function youtubeEmbedUrl(url: string): string | null {
	const id = youtubeId(url);
	return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}
