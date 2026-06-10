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
		adapter: adapter()
	}
};

export default config;
