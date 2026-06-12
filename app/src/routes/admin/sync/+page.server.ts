import type { Actions, PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/auth/guards';
import { lastSync, runSync } from '$lib/server/airtable';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	return { lastSync };
};

export const actions: Actions = {
	default: async (event) => {
		requireAdmin(event);
		const result = await runSync();
		return { result };
	}
};
