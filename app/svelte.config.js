import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		// adapter-node builds a standalone Node server (build/index.js) for self-hosting (e.g. Docker).
		adapter: adapter(),
		paths: { base: '/dash' },
		csp: {
			directives: {
				'default-src': ['self'],
				'script-src': ['self'],
				'style-src': ['self', 'unsafe-inline'],
				// Allow any https image: camper screenshots land on the Hack Club CDN
				// (v4 returns hc-cdn.hl.hackclub.com URLs) and error pages pull from
				// http.cat — listing every host is brittle, so allow https + data.
				'img-src': ['self', 'data:', 'https:'],
				// Melon Camp is self-hosted under /fonts, so 'self' is all we need.
				'font-src': ['self'],
				'connect-src': ['self'],
				'object-src': ['none'],
				// Allow embedding YouTube (day-page video embeds); nothing else.
				'frame-src': ['self', 'https://www.youtube-nocookie.com', 'https://www.youtube.com'],
				'base-uri': ['self'],
				'frame-ancestors': ['none'],
				'form-action': ['self']
			}
		}
	}
};

export default config;
