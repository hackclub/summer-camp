import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { campDays, projects, users, type Project } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/auth/guards';
import { newId } from '$lib/server/ids';
import { flattenErrors, projectSchema, shipSchema } from '$lib/server/validation';
import { openLessons } from '$lib/server/lessons';
import { shipProject } from '$lib/server/ship';
import { etDayLabel, type CampDayLite } from '$lib/camp-time';
import { env } from '$env/dynamic/private';

function loadDays(): Promise<CampDayLite[]> {
	return db
		.select({
			id: campDays.id,
			date: campDays.date,
			title: campDays.title,
			joinUrl: campDays.joinUrl,
			recordingUrl: campDays.recordingUrl
		})
		.from(campDays)
		.where(eq(campDays.published, true));
}

function projectFor(userId: string, campDayId: string) {
	return db
		.select()
		.from(projects)
		.where(and(eq(projects.userId, userId), eq(projects.campDayId, campDayId)))
		.limit(1);
}

const shippedStatuses = new Set(['submitted', 'approved', 'rejected']);

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	const open = openLessons(new Date(), await loadDays());

	const lessons = await Promise.all(
		open.map(async (day) => {
			const [project] = await projectFor(user.id, day.id);
			const check = project
				? shipSchema.safeParse({
						title: project.title,
						description: project.description ?? '',
						githubUrl: project.githubUrl ?? '',
						playableUrl: project.playableUrl ?? '',
						screenshotUrl: project.screenshotUrl ?? ''
					})
				: null;
			return {
				day: { id: day.id, title: day.title, label: etDayLabel(day.date) },
				project: project ?? null,
				shipped: project ? shippedStatuses.has(project.status) : false,
				missing: check && !check.success ? flattenErrors(check.error) : {}
			};
		})
	);

	return { lessons, identityVerified: user.identityVerified };
};

/** Find the requested open lesson, or null if it's missing/closed. */
async function resolveOpenDay(campDayId: string | undefined) {
	if (!campDayId) return null;
	const open = openLessons(new Date(), await loadDays());
	return open.find((d) => d.id === campDayId) ?? null;
}

/** Create or update (never overwrite a shipped one) the camper's project for a
 *  lesson from the submitted fields. Returns the fresh row. */
async function upsertLessonProject(
	userId: string,
	campDayId: string,
	data: { title: string; description: string; githubUrl: string; playableUrl: string; screenshotUrl: string }
): Promise<Project> {
	const fields = {
		title: data.title,
		description: data.description || null,
		githubUrl: data.githubUrl || null,
		playableUrl: data.playableUrl || null,
		screenshotUrl: data.screenshotUrl || null,
		updatedAt: new Date()
	};
	const [existing] = await projectFor(userId, campDayId);
	if (existing) {
		await db.update(projects).set(fields).where(eq(projects.id, existing.id));
		return { ...existing, ...fields };
	}
	const id = newId();
	await db.insert(projects).values({ id, userId, campDayId, ...fields });
	const [created] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
	return created;
}

export const actions: Actions = {
	// Save a draft for an open lesson without shipping.
	save: async (event) => {
		const user = requireUser(event);
		const form = await event.request.formData();
		const campDayId = form.get('campDayId')?.toString();
		const day = await resolveOpenDay(campDayId);
		if (!day) return fail(400, { campDayId, closed: true });

		const parsed = projectSchema.safeParse(Object.fromEntries(form));
		if (!parsed.success) return fail(400, { campDayId, errors: flattenErrors(parsed.error) });

		await upsertLessonProject(user.id, day.id, parsed.data);
		return { campDayId, saved: true };
	},

	// Save the latest fields, then ship the lesson's project for review.
	ship: async (event) => {
		const user = requireUser(event);
		const form = await event.request.formData();
		const campDayId = form.get('campDayId')?.toString();
		const day = await resolveOpenDay(campDayId);
		if (!day) return fail(400, { campDayId, closed: true });

		// Save whatever they have so nothing is lost even if shipping is blocked.
		const draft = projectSchema.safeParse(Object.fromEntries(form));
		if (!draft.success) return fail(400, { campDayId, errors: flattenErrors(draft.error) });
		const project = await upsertLessonProject(user.id, day.id, draft.data);

		if (shippedStatuses.has(project.status)) return fail(400, { campDayId, alreadyShipped: true });

		const check = shipSchema.safeParse({
			title: project.title,
			description: project.description ?? '',
			githubUrl: project.githubUrl ?? '',
			playableUrl: project.playableUrl ?? '',
			screenshotUrl: project.screenshotUrl ?? ''
		});
		if (!check.success) return fail(400, { campDayId, errors: flattenErrors(check.error) });

		// IDV step-up gate.
		if (!user.identityVerified) {
			redirect(303, `/verify-identity?returnTo=${encodeURIComponent('/submit')}`);
		}

		const [maker] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
		if (!maker) return fail(500, { campDayId, shipFailed: true });

		const outcome = await shipProject(project, maker, env.ORIGIN ?? event.url.origin);
		if (!outcome.ok) return fail(502, { campDayId, shipFailed: true });

		redirect(303, '/submit?shipped=1');
	}
};
