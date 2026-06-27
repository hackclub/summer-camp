import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/auth/guards';
import {
	decideEligibility,
	eligibilityMessage,
	type CheckResult
} from '$lib/server/auth/eligibility';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	// Step 2 — must have done step 1 (name) first.
	if (!user.name) redirect(303, '/onboarding/setup');

	const [row] = await db
		.select({ result: users.yswsCheckResult })
		.from(users)
		.where(eq(users.id, user.id))
		.limit(1);
	const checked = row?.result != null;
	const decision = decideEligibility((row?.result ?? null) as CheckResult | null);

	return {
		identityVerified: user.identityVerified,
		checked, // have we run a check against Identity yet?
		decision, // eligible | blocked_over_18 | blocked_rejected | pending
		message: eligibilityMessage(decision)
	};
};
