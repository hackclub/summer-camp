import { error, redirect, type RequestEvent } from '@sveltejs/kit';
import { base } from '$app/paths';
import type { SessionUser } from '$lib/types';

export function requireUser(event: RequestEvent): SessionUser {
	if (!event.locals.user) {
		redirect(303, `${base}/login?next=${encodeURIComponent(event.url.pathname)}`);
	}
	return event.locals.user;
}

export function requireAdmin(event: RequestEvent): SessionUser {
	const user = requireUser(event);
	// 404, not 403 — don't advertise that an admin panel exists.
	if (user.role !== 'admin') error(404, 'Not found');
	return user;
}
