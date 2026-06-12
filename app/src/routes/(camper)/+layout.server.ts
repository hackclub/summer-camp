import type { LayoutServerLoad } from './$types';
import { getBalance } from '$lib/server/points';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user,
		balance: locals.user ? await getBalance(locals.user.id) : 0
	};
};
