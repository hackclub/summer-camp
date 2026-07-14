import { fail, redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import { and, desc, eq, inArray, isNotNull } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { campDays, projects, users, type Project } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/auth/guards';
import { newId } from '$lib/server/ids';
import { addressSchema, flattenErrors, projectSchema, shipSchema } from '$lib/server/validation';
import { openLessons } from '$lib/server/lessons';
import { activeExtensionDayIds } from '$lib/server/extensions';
import { shipProject } from '$lib/server/ship';
import { etDayLabel, isResubmitOpen, type CampDayLite } from '$lib/camp-time';
import type { Address } from '$lib/types';
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

/** Camp-day ids of the user's projects Ari sent back (changes/rejected) — kept
 *  open for re-shipping until the resubmit window closes (end of Fri Jul 17 ET). */
async function sentBackDayIds(userId: string, now: Date): Promise<Set<string>> {
	if (!isResubmitOpen(now)) return new Set();
	const rows = await db
		.select({ campDayId: projects.campDayId })
		.from(projects)
		.where(
			and(
				eq(projects.userId, userId),
				eq(projects.status, 'building'),
				inArray(projects.ariStatus, ['changes', 'rejected']),
				isNotNull(projects.campDayId)
			)
		);
	return new Set(rows.map((r) => r.campDayId).filter((x): x is string => !!x));
}

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	const now = new Date();
	const days = await loadDays();
	const sentBack = await sentBackDayIds(user.id, now);
	const extended = await activeExtensionDayIds(user.id, now);
	const forceOpen = new Set([...sentBack, ...extended]);
	const open = openLessons(now, days, forceOpen);

	// Reward info (points + prize) for the open days, and a prior address to
	// prefill the (always-required) ship address.
	const meta = open.length
		? await db
				.select({ id: campDays.id, rewardPoints: campDays.rewardPoints, prizeLabel: campDays.prizeLabel })
				.from(campDays)
				.where(inArray(campDays.id, open.map((d) => d.id)))
		: [];
	const metaById = new Map(meta.map((m) => [m.id, m]));
	const [lastAddr] = await db
		.select({ a: projects.shipAddress })
		.from(projects)
		.where(and(eq(projects.userId, user.id), isNotNull(projects.shipAddress)))
		.orderBy(desc(projects.updatedAt))
		.limit(1);

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
				day: {
					id: day.id,
					title: day.title,
					label: etDayLabel(day.date),
					rewardPoints: metaById.get(day.id)?.rewardPoints ?? 0,
					prizeLabel: metaById.get(day.id)?.prizeLabel ?? null
				},
				project: project ?? null,
				shipped: project ? shippedStatuses.has(project.status) : false,
				address: project?.shipAddress ?? lastAddr?.a ?? null,
				missing: check && !check.success ? flattenErrors(check.error) : {}
			};
		})
	);

	return {
		lessons,
		identityVerified: user.identityVerified,
		hasSentBack: sentBack.size > 0,
		hasExtension: extended.size > 0
	};
};

/** Find the requested open lesson, or null if it's missing/closed. Honors the
 *  per-user resubmit window for sent-back projects + admin-granted extensions. */
async function resolveOpenDay(campDayId: string | undefined, userId: string) {
	if (!campDayId) return null;
	const now = new Date();
	const forceOpen = new Set([
		...(await sentBackDayIds(userId, now)),
		...(await activeExtensionDayIds(userId, now))
	]);
	const open = openLessons(now, await loadDays(), forceOpen);
	return open.find((d) => d.id === campDayId) ?? null;
}

/** Create or update (never overwrite a shipped one) the camper's project for a
 *  lesson from the submitted fields. Returns the fresh row. */
async function upsertLessonProject(
	userId: string,
	campDayId: string,
	data: { title: string; description: string; githubUrl: string; playableUrl: string; screenshotUrl: string },
	shipAddress?: Address
): Promise<Project> {
	const fields = {
		title: data.title,
		description: data.description || null,
		githubUrl: data.githubUrl || null,
		playableUrl: data.playableUrl || null,
		screenshotUrl: data.screenshotUrl || null,
		...(shipAddress ? { shipAddress } : {}),
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
	// Save a draft for an open lesson without shipping (no address required yet).
	save: async (event) => {
		const user = requireUser(event);
		const form = await event.request.formData();
		const campDayId = form.get('campDayId')?.toString();
		const day = await resolveOpenDay(campDayId, user.id);
		if (!day) return fail(400, { campDayId, closed: true });

		const parsed = projectSchema.safeParse(Object.fromEntries(form));
		if (!parsed.success) return fail(400, { campDayId, errors: flattenErrors(parsed.error) });

		await upsertLessonProject(user.id, day.id, parsed.data);
		return { campDayId, saved: true };
	},

	// Save the latest fields + address, then ship the lesson's project for review.
	ship: async (event) => {
		const user = requireUser(event);
		const form = await event.request.formData();
		const campDayId = form.get('campDayId')?.toString();
		const day = await resolveOpenDay(campDayId, user.id);
		if (!day) return fail(400, { campDayId, closed: true });

		const data = Object.fromEntries(form);
		const draft = projectSchema.safeParse(data);
		// Address is always required to ship — Unified YSWS needs it to mail prizes.
		const addr = addressSchema.safeParse(data);
		if (!draft.success || !addr.success) {
			return fail(400, {
				campDayId,
				errors: {
					...(draft.success ? {} : flattenErrors(draft.error)),
					...(addr.success ? {} : flattenErrors(addr.error))
				}
			});
		}

		const project = await upsertLessonProject(user.id, day.id, draft.data, addr.data);
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
			redirect(303, `${base}/verify-identity?returnTo=${encodeURIComponent('/submit')}`);
		}

		const [maker] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
		if (!maker) return fail(500, { campDayId, shipFailed: true });

		const outcome = await shipProject(project, maker, env.ORIGIN ?? event.url.origin);
		if (!outcome.ok) return fail(502, { campDayId, shipFailed: true });

		redirect(303, `${base}/submit?shipped=1`);
	}
};
