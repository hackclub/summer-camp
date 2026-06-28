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
				// Site art + camper-uploaded screenshots live on the Hack Club CDN, which
				// 302-redirects to user-cdn.hackclub-assets.com — CSP checks every URL in
				// the redirect chain, so both hosts are needed.
				'img-src': [
					'self',
					'data:',
					'https://cdn.hackclub.com',
					'https://user-cdn.hackclub-assets.com',
					// Error pages show the matching cat from http.cat for the status code.
					'https://http.cat'
				],
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
