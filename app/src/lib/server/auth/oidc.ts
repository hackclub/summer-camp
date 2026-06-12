import { createHash, randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { Cookies } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { env } from '$env/dynamic/private';

// Hack Club Identity step-up. This is NOT a login method — it attaches
// verification attributes to the already-logged-in (magic link) user, which
// sidesteps account-merge problems when the Identity email differs from the
// camper's login email.
const ISSUER = 'https://auth.hackclub.com';
const SCOPES = 'openid profile email verification_status';
const STATE_COOKIE = 'idv_state';

interface OidcEndpoints {
	authorization_endpoint: string;
	token_endpoint: string;
	userinfo_endpoint: string;
}

let cachedEndpoints: OidcEndpoints | null = null;
async function discover(): Promise<OidcEndpoints> {
	if (cachedEndpoints) return cachedEndpoints;
	const res = await fetch(`${ISSUER}/.well-known/openid-configuration`);
	if (!res.ok) throw new Error(`OIDC discovery failed: ${res.status}`);
	cachedEndpoints = (await res.json()) as OidcEndpoints;
	return cachedEndpoints;
}

function redirectUri(): string {
	return `${env.ORIGIN}/identity/callback`;
}

export async function buildAuthorizeRedirect(cookies: Cookies, returnTo: string): Promise<string> {
	const endpoints = await discover();
	const state = randomBytes(16).toString('base64url');
	const verifier = randomBytes(32).toString('base64url');
	const challenge = createHash('sha256').update(verifier).digest('base64url');

	// State + PKCE verifier + returnTo round-trip through a short-lived cookie.
	cookies.set(STATE_COOKIE, JSON.stringify({ state, verifier, returnTo }), {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: 10 * 60
	});

	const params = new URLSearchParams({
		response_type: 'code',
		client_id: env.HC_OIDC_CLIENT_ID ?? '',
		redirect_uri: redirectUri(),
		scope: SCOPES,
		state,
		code_challenge: challenge,
		code_challenge_method: 'S256'
	});
	return `${endpoints.authorization_endpoint}?${params}`;
}

export interface IdentityResult {
	verified: boolean;
	returnTo: string;
}

export async function handleCallback(
	cookies: Cookies,
	url: URL,
	userId: string
): Promise<IdentityResult> {
	const stashed = cookies.get(STATE_COOKIE);
	cookies.delete(STATE_COOKIE, { path: '/' });
	if (!stashed) throw new Error('Missing IDV state cookie');
	const { state, verifier, returnTo } = JSON.parse(stashed) as {
		state: string;
		verifier: string;
		returnTo: string;
	};

	const code = url.searchParams.get('code');
	if (!code || url.searchParams.get('state') !== state) {
		throw new Error('IDV state mismatch');
	}

	const endpoints = await discover();
	const tokenRes = await fetch(endpoints.token_endpoint, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			code,
			redirect_uri: redirectUri(),
			client_id: env.HC_OIDC_CLIENT_ID ?? '',
			client_secret: env.HC_OIDC_CLIENT_SECRET ?? '',
			code_verifier: verifier
		})
	});
	if (!tokenRes.ok) throw new Error(`OIDC token exchange failed: ${tokenRes.status}`);
	const { access_token } = (await tokenRes.json()) as { access_token: string };

	const userinfoRes = await fetch(endpoints.userinfo_endpoint, {
		headers: { Authorization: `Bearer ${access_token}` }
	});
	if (!userinfoRes.ok) throw new Error(`OIDC userinfo failed: ${userinfoRes.status}`);
	const info = (await userinfoRes.json()) as {
		sub: string;
		name?: string;
		slack_id?: string;
		verification_status?: string;
	};

	const verified =
		info.verification_status === 'verified' || info.verification_status === 'eligible';

	if (verified) {
		const current = await db.select().from(users).where(eq(users.id, userId)).limit(1);
		await db
			.update(users)
			.set({
				identityVerified: true,
				hackClubId: info.sub,
				slackId: info.slack_id ?? current[0]?.slackId ?? null,
				name: current[0]?.name ?? info.name ?? null
			})
			.where(eq(users.id, userId));
	}

	return { verified, returnTo: safeReturnTo(returnTo) };
}

// Only allow same-origin relative paths so returnTo can't be an open redirect.
export function safeReturnTo(value: string | null | undefined): string {
	if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
	return value;
}
