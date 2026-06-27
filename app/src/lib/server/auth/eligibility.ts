// YSWS eligibility via Hack Club Identity's external check API. We OAuth the
// camper in (oidc.ts), then ask this endpoint — keyed by their IDV id (the HCA
// `sub`) — whether they're actually eligible, rather than trusting a coarse
// OIDC claim. No auth is required on the check endpoint.

const CHECK_URL = 'https://auth.hackclub.com/api/external/check';

/** Possible `result` values from GET /api/external/check. */
export type CheckResult =
	| 'needs_submission'
	| 'pending'
	| 'verified_eligible'
	| 'verified_but_over_18'
	| 'rejected'
	| 'not_found';

export type EligibilityDecision = 'eligible' | 'blocked_over_18' | 'blocked_rejected' | 'pending';

const VALID_RESULTS: CheckResult[] = [
	'needs_submission',
	'pending',
	'verified_eligible',
	'verified_but_over_18',
	'rejected',
	'not_found'
];

/**
 * Look up a camper's YSWS verification status by their IDV id (HCA `sub`).
 * Returns the result string, or null if the endpoint is unreachable, errors, or
 * returns something unexpected — callers decide what to do on null.
 */
export async function checkYswsStatus(idvId: string): Promise<CheckResult | null> {
	if (!idvId) return null;
	try {
		const res = await fetch(`${CHECK_URL}?idv_id=${encodeURIComponent(idvId)}`, {
			headers: { Accept: 'application/json' }
		});
		if (!res.ok) return null;
		const data = (await res.json()) as { result?: string };
		return VALID_RESULTS.includes(data?.result as CheckResult)
			? (data.result as CheckResult)
			: null;
	} catch {
		return null;
	}
}

/** Collapse a check result into a single decision. `pending` covers everything
 *  that's neither a clear pass nor a hard fail (still processing, or unknown). */
export function decideEligibility(result: CheckResult | null): EligibilityDecision {
	if (result === 'verified_eligible') return 'eligible';
	if (result === 'verified_but_over_18') return 'blocked_over_18';
	if (result === 'rejected') return 'blocked_rejected';
	return 'pending'; // needs_submission | pending | not_found | null
}

export const isEligible = (d: EligibilityDecision): boolean => d === 'eligible';

/** Human-facing explanation for a non-eligible decision. */
export function eligibilityMessage(d: EligibilityDecision): string {
	switch (d) {
		case 'blocked_over_18':
			return "Your Hack Club Identity shows you're over 18, so you're not eligible for camp prizes.";
		case 'blocked_rejected':
			return 'Your Hack Club Identity verification was rejected, so you’re not eligible for camp prizes.';
		case 'pending':
			return 'Your verification is still being reviewed — this usually takes less than a day. Check back soon!';
		default:
			return '';
	}
}
