import { randomBytes } from 'node:crypto';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { magicLinkTokens, users } from '$lib/server/db/schema';
import { newId } from '$lib/server/ids';
import { sha256 } from './session';
import { env } from '$env/dynamic/private';

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_TOKENS_PER_EMAIL = 3; // per 10 minutes

/** Creates a login token; returns the raw token to embed in the email link, or
 *  null if this email has requested too many links recently. */
export async function createMagicLink(email: string, requestIp: string): Promise<string | null> {
	const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
	const [{ count }] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(magicLinkTokens)
		.where(and(eq(magicLinkTokens.email, email), gt(magicLinkTokens.createdAt, tenMinutesAgo)));
	if (count >= MAX_TOKENS_PER_EMAIL) return null;

	const rawToken = randomBytes(32).toString('base64url');
	await db.insert(magicLinkTokens).values({
		id: newId(),
		tokenHash: sha256(rawToken),
		email,
		expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
		requestIp
	});
	return rawToken;
}

/** Consumes a token; finds-or-creates the user. Returns the user id, or null
 *  if the token is invalid/expired/used. */
export async function consumeMagicLink(rawToken: string): Promise<string | null> {
	const rows = await db
		.select()
		.from(magicLinkTokens)
		.where(
			and(
				eq(magicLinkTokens.tokenHash, sha256(rawToken)),
				isNull(magicLinkTokens.consumedAt),
				gt(magicLinkTokens.expiresAt, new Date())
			)
		)
		.limit(1);
	const token = rows[0];
	if (!token) return null;

	await db
		.update(magicLinkTokens)
		.set({ consumedAt: new Date() })
		.where(eq(magicLinkTokens.id, token.id));

	const adminEmails = (env.ADMIN_EMAILS ?? '')
		.split(',')
		.map((e) => e.trim().toLowerCase())
		.filter(Boolean);
	const isAdmin = adminEmails.includes(token.email);

	const existing = await db.select().from(users).where(eq(users.email, token.email)).limit(1);
	if (existing[0]) {
		if (existing[0].banned) return null;
		// Bootstrap admins are promoted on every login so the env var is the
		// source of truth even for accounts created before it was set.
		if (isAdmin && existing[0].role !== 'admin') {
			await db.update(users).set({ role: 'admin' }).where(eq(users.id, existing[0].id));
		}
		return existing[0].id;
	}

	const userId = newId();
	await db.insert(users).values({
		id: userId,
		email: token.email,
		role: isAdmin ? 'admin' : 'camper'
	});
	return userId;
}
