import type { LayoutServerLoad } from './$types';
import { requireAdmin } from '$lib/server/auth/guards';

export const load: LayoutServerLoad = async (event) => {
	requireAdmin(event);
	return {};
};
