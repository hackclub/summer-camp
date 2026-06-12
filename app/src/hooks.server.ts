import { building, dev } from '$app/environment';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { validateSession } from '$lib/server/auth/session';
import { env } from '$env/dynamic/private';

// Boot-time work: run committed migrations once, then start the Airtable sync
// loop. Guarded so neither runs during `vite build` prerendering.
if (!building) {
	const { runMigrations } = await import('$lib/server/db');
	await runMigrations();

	if (env.SYNC_ENABLED === 'true' && !dev) {
		const { runSync } = await import('$lib/server/airtable');
		setInterval(
			() => {
				runSync().catch((e) => console.error('[sync] failed:', e));
			},
			5 * 60 * 1000
		);
	}
}

// Baseline security headers applied to every response. CSP itself is configured
// in svelte.config.js (kit.csp) so SvelteKit can hash its own inline bootstrap.
const securityHeaders: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	return response;
};

const auth: Handle = async ({ event, resolve }) => {
	const result = await validateSession(event.cookies);
	event.locals.user = result?.user ?? null;
	event.locals.sessionId = result?.sessionId ?? null;
	return resolve(event);
};

// Coarse route guards; per-route loads/actions also call requireUser/requireAdmin
// for defense in depth.
const guard: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	const isPublic =
		path === '/login' ||
		path.startsWith('/login/') ||
		path.startsWith('/gallery') ||
		path === '/api/health' ||
		path === '/robots.txt';

	if (!isPublic && !event.locals.user) {
		redirect(303, `/login?next=${encodeURIComponent(path)}`);
	}
	return resolve(event);
};

export const handle = sequence(securityHeaders, auth, guard);
