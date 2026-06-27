import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/auth/guards';
import { safeReturnTo } from '$lib/server/auth/oidc';
import {
	decideEligibility,
	eligibilityMessage,
	type CheckResult
} from '$lib/server/auth/eligibility';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	const [row] = await db
		.select({ result: users.yswsCheckResult })
		.from(users)
		.where(eq(users.id, user.id))
		.limit(1);
	const decision = decideEligibility((row?.result ?? null) as CheckResult | null);
	const blocked = decision === 'blocked_over_18' || decision === 'blocked_rejected';
	return {
		verified: user.identityVerified,
		status: event.url.searchParams.get('status'),
		blocked,
		ineligibleMessage: blocked ? eligibilityMessage(decision) : null,
		returnTo: safeReturnTo(event.url.searchParams.get('returnTo'))
	};
};
