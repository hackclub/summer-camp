import { randomBytes } from 'node:crypto';
import { and, eq, ne } from 'drizzle-orm';
import type { Cookies } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { env } from '$env/dynamic/private';
import { base } from '$app/paths';
import {
	checkYswsStatus,
	decideEligibility,
	isEligible,
	type EligibilityDecision
} from '$lib/server/auth/eligibility';

// Hack Club Account (HCA) OAuth2 step-up. This is NOT a login method — it
// attaches verification attributes to the already-logged-in (magic link) user.
// Plain OAuth2 against the documented HCA endpoints (no OIDC discovery / PKCE).
const AUTHORIZE_URL = 'https://auth.hackclub.com/oauth/authorize';
const TOKEN_URL = 'https://auth.hackclub.com/oauth/token';
const USERINFO_URL = 'https://auth.hackclub.com/oauth/userinfo';
const SCOPES = 'openid profile email slack_id verification_status';
const STATE_COOKIE = 'idv_state';

function redirectUri(): string {
	return env.HCA_REDIRECT_URI ?? `${env.ORIGIN}${base}/identity/callback`;
}

export async function buildAuthorizeRedirect(cookies: Cookies, returnTo: string): Promise<string> {
	const state = randomBytes(16).toString('base64url');

	// State + returnTo round-trip through a short-lived cookie.
	cookies.set(STATE_COOKIE, JSON.stringify({ state, returnTo }), {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: 10 * 60
	});

	const params = new URLSearchParams({
		response_type: 'code',
		client_id: env.HCA_CLIENT_ID ?? '',
		redirect_uri: redirectUri(),
		scope: SCOPES,
		state
	});
	return `${AUTHORIZE_URL}?${params}`;
}

export interface IdentityResult {
	verified: boolean;
	decision: EligibilityDecision;
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
	const { state, returnTo } = JSON.parse(stashed) as { state: string; returnTo: string };

	const code = url.searchParams.get('code');
	if (!code || url.searchParams.get('state') !== state) {
		throw new Error('IDV state mismatch');
	}

	const tokenRes = await fetch(TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			code,
			redirect_uri: redirectUri(),
			client_id: env.HCA_CLIENT_ID ?? '',
			client_secret: env.HCA_CLIENT_SECRET ?? ''
		})
	});
	if (!tokenRes.ok) throw new Error(`HCA token exchange failed: ${tokenRes.status}`);
	const { access_token } = (await tokenRes.json()) as { access_token: string };

	const userinfoRes = await fetch(USERINFO_URL, {
		headers: { Authorization: `Bearer ${access_token}` }
	});
	if (!userinfoRes.ok) throw new Error(`HCA userinfo failed: ${userinfoRes.status}`);
	const info = (await userinfoRes.json()) as {
		sub: string;
		name?: string;
		slack_id?: string;
		verification_status?: string;
	};

	// Eligibility comes from Identity's external check API (keyed by the IDV id),
	// not the coarse userinfo claim. If the API is unreachable we fall back to the
	// claim so an outage can't lock everyone out.
	const checkResult = info.sub ? await checkYswsStatus(info.sub) : null;
	let decision = decideEligibility(checkResult);
	if (
		checkResult === null &&
		(info.verification_status === 'verified' || info.verification_status === 'eligible')
	) {
		decision = 'eligible';
	}
	const verified = isEligible(decision);

	// Anti-sybil: one Hack Club identity may verify at most one camp account. If
	// this sub is already linked to a different user, refuse (also enforced by the
	// users_hack_club_id_unique index). The callback turns this into an error page.
	if (info.sub) {
		const [dupe] = await db
			.select({ id: users.id })
			.from(users)
			.where(and(eq(users.hackClubId, info.sub), ne(users.id, userId)))
			.limit(1);
		if (dupe) throw new Error('identity already linked to another account');
	}

	// Always record the identity linkage + latest check result; only flip
	// identityVerified when the camper is actually eligible.
	const current = await db.select().from(users).where(eq(users.id, userId)).limit(1);
	await db
		.update(users)
		.set({
			identityVerified: verified ? true : (current[0]?.identityVerified ?? false),
			yswsCheckResult: checkResult,
			hackClubId: info.sub,
			slackId: info.slack_id ?? current[0]?.slackId ?? null,
			name: current[0]?.name ?? info.name ?? null
		})
		.where(eq(users.id, userId));

	return { verified, decision, returnTo: safeReturnTo(returnTo) };
}

// Only allow same-origin relative paths so returnTo can't be an open redirect.
export function safeReturnTo(value: string | null | undefined): string {
	// Require a leading "/" followed by a non-slash, non-backslash char. Blocks
	// "//evil.com" AND "/\evil.com" (browsers normalize "\"→"/" in the authority),
	// so this can't become an off-site open redirect.
	if (!value || !/^\/[^/\\]/.test(value)) return `${base}/`;
	// Normalize to exactly one base prefix — values arrive with it (from
	// url.pathname) or without it (hardcoded links), and we must never double it.
	if (value === base || value.startsWith(`${base}/`)) return value;
	return `${base}${value}`;
}
