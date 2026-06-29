import { error, fail, redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import { and, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { shopItems } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/auth/guards';
import { getBalance, purchase } from '$lib/server/points';
import { addressSchema, flattenErrors } from '$lib/server/validation';

async function activeItem(id: string) {
	const [item] = await db
		.select()
		.from(shopItems)
		.where(and(eq(shopItems.id, id), eq(shopItems.active, true)))
		.limit(1);
	if (!item) error(404, 'Item not found');
	return item;
}

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	const item = await activeItem(event.params.id);
	return {
		item,
		balance: await getBalance(user.id),
		identityVerified: user.identityVerified
	};
};

export const actions: Actions = {
	order: async (event) => {
		const user = requireUser(event);
		const item = await activeItem(event.params.id);

		// Same bar as shipping: prizes only go to verified campers.
		if (!user.identityVerified) {
			redirect(303, `${base}/verify-identity?returnTo=${encodeURIComponent(`/shop/${item.id}`)}`);
		}

		let address = null;
		if (item.requiresAddress) {
			const form = await event.request.formData();
			const parsed = addressSchema.safeParse(Object.fromEntries(form));
			if (!parsed.success) return fail(400, { errors: flattenErrors(parsed.error) });
			address = parsed.data;
		}

		const result = await purchase(user.id, item.id, address);
		if (!result.ok) return fail(400, { reason: result.reason });

		redirect(303, `${base}/orders?placed=1`);
	}
};
