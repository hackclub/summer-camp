import { error } from '@sveltejs/kit';
import { asc, and, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { campDayMaterials, campDays } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/auth/guards';

export const load: PageServerLoad = async (event) => {
	requireUser(event);

	const [day] = await db
		.select()
		.from(campDays)
		.where(and(eq(campDays.id, event.params.id), eq(campDays.published, true)))
		.limit(1);
	if (!day) error(404, 'Camp day not found');

	const materials = await db
		.select()
		.from(campDayMaterials)
		.where(eq(campDayMaterials.campDayId, day.id))
		.orderBy(asc(campDayMaterials.sort));

	return { day, materials };
};
