import { building } from '$app/environment';
import { base } from '$app/paths';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { validateSession } from '$lib/server/auth/session';

// Boot-time work: run committed migrations once. (The old periodic Airtable
// roster/projects sync is retired — Ari is the reviewer now, and ship records go
// to Airtable on ship + on each Ari decision via the webhook.)
if (!building) {
	const { runMigrations } = await import('$lib/server/db');
	await runMigrations();
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
	// url.pathname includes the base ('/dash/...'). Compare on the base-less route,
	// but redirect to base-prefixed locations.
	const full = event.url.pathname;
	const route = base && full.startsWith(base) ? full.slice(base.length) || '/' : full;
	const isPublic =
		route === '/login' ||
		route.startsWith('/login/') ||
		route.startsWith('/gallery') ||
		route === '/api/health' ||
		route === '/api/ari/webhook' ||
		route === '/robots.txt';

	if (!isPublic && !event.locals.user) {
		redirect(303, `${base}/login?next=${encodeURIComponent(full)}`);
	}

	// First-run onboarding: any logged-in account that hasn't finished it is
	// walked through the flow before anything else. Onboarding, the identity
	// step-up it offers, and logout are exempt so the flow can complete.
	if (
		event.locals.user &&
		!event.locals.user.onboarded &&
		!route.startsWith('/onboarding') &&
		!route.startsWith('/identity') &&
		route !== '/logout'
	) {
		redirect(303, `${base}/onboarding`);
	}
	return resolve(event);
};

export const handle = sequence(securityHeaders, auth, guard);
