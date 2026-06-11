import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		// adapter-node builds a standalone Node server (build/index.js) for self-hosting (e.g. Docker).
		// See https://svelte.dev/docs/kit/adapter-node for more information.
		adapter: adapter(),
		// Content Security Policy. 'auto' mode hashes SvelteKit's own inline
		// bootstrap script, so no 'unsafe-inline' is needed for scripts.
		csp: {
			directives: {
				'default-src': ['self'],
				// 'unsafe-hashes' + this hash allow Svelte's SSR event-capture
				// attribute (onerror="this.__e=event"), which records pre-hydration
				// events (e.g. a CDN image failing) so handlers can replay them.
				// Without it the CDN-to-local image fallback can't fire.
				'script-src': ['self', 'unsafe-hashes', 'sha256-7dQwUgLau1NFCCGjfn9FsYptB6ZtWxJin6VohGIu20I='],
				// Google Fonts: the stylesheet is fetched from fonts.googleapis.com
				// (layout.css @import) and the font files from fonts.gstatic.com.
				'style-src': ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
				// Site art (forest, road, signs, grass) is served from the Hack Club
				// CDN, which 302-redirects to user-cdn.hackclub-assets.com — CSP
				// checks every URL in the redirect chain, so both hosts are needed.
				'img-src': ['self', 'data:', 'https://cdn.hackclub.com', 'https://user-cdn.hackclub-assets.com'],
				'font-src': ['self', 'https://fonts.gstatic.com'],
				'connect-src': ['self'],
				'object-src': ['none'],
				'base-uri': ['self'],
				'frame-ancestors': ['none'],
				'form-action': ['self']
			}
		}
	}
};

export default config;
