import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import Airtable from 'airtable';
import { env } from '$env/dynamic/private';

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const email = form.get('email')?.toString().trim();

		if (!email) {
			return fail(400, {
				missing: true
			});
		}

		if (!env.API_KEY || !env.BASE_ID) {
			console.error('Missing API_KEY or BASE_ID environment variable');
			return fail(500, {
				error: true
			});
		}

		const base = new Airtable({ apiKey: env.API_KEY }).base(env.BASE_ID);

		try {
			await new Promise((resolve, reject) => {
				base('RSVP').create(
					[
						{
							fields: {
								Email: email
							}
						}
					],
					function (err, records) {
						if (err) {
							reject(err);
						} else {
							resolve(records);
						}
					}
				);
			});
		} catch (err) {
			console.error(err);
			return fail(500, {
				error: true
			});
		}

		return { success: true };
	}
};
