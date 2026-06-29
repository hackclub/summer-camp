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
		csp: {
			directives: {
				'default-src': ['self'],
				'script-src': ['self'],
				// Google Fonts: stylesheet from fonts.googleapis.com, files from fonts.gstatic.com.
				'style-src': ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
				// Allow any https image: camper screenshots land on the Hack Club CDN
				// (v4 returns hc-cdn.hl.hackclub.com URLs) and error pages pull from
				// http.cat — listing every host is brittle, so allow https + data.
				'img-src': ['self', 'data:', 'https:'],
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
