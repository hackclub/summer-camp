import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { destroySession } from '$lib/server/auth/session';

export const actions: Actions = {
	default: async ({ cookies }) => {
		await destroySession(cookies);
		redirect(303, '/login');
	}
};
