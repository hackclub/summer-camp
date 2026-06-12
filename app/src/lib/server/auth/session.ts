import { createHash, randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { Cookies } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { authSessions, users } from '$lib/server/db/schema';
import type { SessionUser } from '$lib/types';

const SESSION_COOKIE = 'session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const RENEW_BELOW_MS = 15 * 24 * 60 * 60 * 1000; // slide expiry when < 15 days remain

export function sha256(input: string): string {
	return createHash('sha256').update(input).digest('hex');
}

export async function createSession(cookies: Cookies, userId: string): Promise<void> {
	const rawToken = randomBytes(32).toString('base64url');
	await db.insert(authSessions).values({
		id: sha256(rawToken),
		userId,
		expiresAt: new Date(Date.now() + SESSION_TTL_MS)
	});
	cookies.set(SESSION_COOKIE, rawToken, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: SESSION_TTL_MS / 1000
	});
}

export async function validateSession(
	cookies: Cookies
): Promise<{ user: SessionUser; sessionId: string } | null> {
	const rawToken = cookies.get(SESSION_COOKIE);
	if (!rawToken) return null;

	const sessionId = sha256(rawToken);
	const rows = await db
		.select({ session: authSessions, user: users })
		.from(authSessions)
		.innerJoin(users, eq(authSessions.userId, users.id))
		.where(eq(authSessions.id, sessionId))
		.limit(1);
	const row = rows[0];

	if (!row || row.session.expiresAt < new Date() || row.user.banned) {
		if (row) await db.delete(authSessions).where(eq(authSessions.id, sessionId));
		cookies.delete(SESSION_COOKIE, { path: '/' });
		return null;
	}

	if (row.session.expiresAt.getTime() - Date.now() < RENEW_BELOW_MS) {
		await db
			.update(authSessions)
			.set({ expiresAt: new Date(Date.now() + SESSION_TTL_MS) })
			.where(eq(authSessions.id, sessionId));
	}

	return {
		sessionId,
		user: {
			id: row.user.id,
			email: row.user.email,
			name: row.user.name,
			role: row.user.role,
			identityVerified: row.user.identityVerified
		}
	};
}

export async function destroySession(cookies: Cookies): Promise<void> {
	const rawToken = cookies.get(SESSION_COOKIE);
	if (rawToken) {
		await db.delete(authSessions).where(eq(authSessions.id, sha256(rawToken)));
	}
	cookies.delete(SESSION_COOKIE, { path: '/' });
}
