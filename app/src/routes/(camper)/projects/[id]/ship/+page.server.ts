import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { projects, users } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/auth/guards';
import { flattenErrors, shipSchema } from '$lib/server/validation';
import { ariConfigured, buildShipPayload, ingestShip } from '$lib/server/ari';
import { createSubmissionRecord } from '$lib/server/airtable-ships';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	const [project] = await db
		.select()
		.from(projects)
		.where(and(eq(projects.id, event.params.id), eq(projects.userId, user.id)))
		.limit(1);
	if (!project) error(404, 'Project not found');
	if (project.status === 'submitted' || project.status === 'approved') {
		redirect(303, `/projects/${project.id}/edit`);
	}

	// Checklist state for the page: what's missing before shipping is allowed.
	const check = shipSchema.safeParse({
		title: project.title,
		description: project.description ?? '',
		githubUrl: project.githubUrl ?? '',
		playableUrl: project.playableUrl ?? '',
		screenshotUrl: project.screenshotUrl ?? ''
	});

	return {
		project,
		missing: check.success ? {} : flattenErrors(check.error),
		identityVerified: user.identityVerified
	};
};

export const actions: Actions = {
	default: async (event) => {
		const user = requireUser(event);
		const [project] = await db
			.select()
			.from(projects)
			.where(and(eq(projects.id, event.params.id), eq(projects.userId, user.id)))
			.limit(1);
		if (!project) error(404, 'Project not found');
		if (project.status === 'submitted' || project.status === 'approved') {
			return fail(400, { alreadyShipped: true });
		}

		const check = shipSchema.safeParse({
			title: project.title,
			description: project.description ?? '',
			githubUrl: project.githubUrl ?? '',
			playableUrl: project.playableUrl ?? '',
			screenshotUrl: project.screenshotUrl ?? ''
		});
		if (!check.success) return fail(400, { errors: flattenErrors(check.error) });

		// The IDV step-up gate: shipping is the first moment verification matters.
		if (!user.identityVerified) {
			redirect(
				303,
				`/verify-identity?returnTo=${encodeURIComponent(`/projects/${project.id}/ship`)}`
			);
		}

		// Ari is the reviewer: a ship isn't real until Ari accepts the ingest. If
		// anything below fails we leave the project in 'building' and tell the
		// camper to contact Jenin, so nobody silently ships into the void.
		if (!ariConfigured()) {
			console.error('[ari] ingest skipped: ARI_PROGRAM_ID / ARI_SECRET not configured');
			return fail(503, { shipFailed: true });
		}

		const [maker] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
		if (!maker) error(500, 'User record not found');

		// 1) Airtable record first (reuse one from a previous failed attempt so
		//    retries don't pile up duplicate rows).
		let recordId = project.airtableRecordId;
		if (!recordId) {
			try {
				recordId = await createSubmissionRecord(project, maker);
			} catch (e) {
				const msg = e instanceof Error ? e.message : String(e);
				console.error('[ari] airtable record create failed:', msg);
				await db
					.update(projects)
					.set({ ariStatus: 'error', ariError: `airtable: ${msg}`, updatedAt: new Date() })
					.where(eq(projects.id, project.id));
				return fail(502, { shipFailed: true });
			}
			await db
				.update(projects)
				.set({ airtableRecordId: recordId, updatedAt: new Date() })
				.where(eq(projects.id, project.id));
		}

		// 2) Send the ship to Ari; any non-2xx blocks the ship.
		const origin = env.ORIGIN ?? event.url.origin;
		const result = await ingestShip(buildShipPayload(project, maker, origin));
		if (!result.ok) {
			const msg = `ingest ${result.status}: ${result.body.slice(0, 500)}`;
			console.error('[ari] ingest failed:', msg);
			await db
				.update(projects)
				.set({ ariStatus: 'error', ariError: msg, updatedAt: new Date() })
				.where(eq(projects.id, project.id));
			return fail(502, { shipFailed: true });
		}

		// 3) Queued for review.
		await db
			.update(projects)
			.set({
				status: 'submitted',
				shippedAt: new Date(),
				ariStatus: 'queued',
				ariError: null,
				updatedAt: new Date()
			})
			.where(eq(projects.id, project.id));
		redirect(303, `/projects/${project.id}/edit`);
	}
};
