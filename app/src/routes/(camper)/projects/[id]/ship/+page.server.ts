import { error, fail, redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import { and, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { projects, users } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/auth/guards';
import { addressSchema, flattenErrors, shipSchema } from '$lib/server/validation';
import { shipProject } from '$lib/server/ship';
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
		redirect(303, `${base}/projects/${project.id}/edit`);
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
		// Address is always required to ship — Unified YSWS needs it to mail prizes.
		const addr = addressSchema.safeParse(Object.fromEntries(await event.request.formData()));
		if (!check.success || !addr.success) {
			return fail(400, {
				errors: {
					...(check.success ? {} : flattenErrors(check.error)),
					...(addr.success ? {} : flattenErrors(addr.error))
				}
			});
		}

		// The IDV step-up gate: shipping is the first moment verification matters.
		if (!user.identityVerified) {
			redirect(
				303,
				`/verify-identity?returnTo=${encodeURIComponent(`/projects/${project.id}/ship`)}`
			);
		}

		const [maker] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
		if (!maker) error(500, 'User record not found');

		await db
			.update(projects)
			.set({ shipAddress: addr.data, updatedAt: new Date() })
			.where(eq(projects.id, project.id));

		const outcome = await shipProject(
			{ ...project, shipAddress: addr.data },
			maker,
			env.ORIGIN ?? event.url.origin
		);
		if (!outcome.ok) return fail(502, { shipFailed: true });
		redirect(303, `${base}/projects/${project.id}/edit`);
	}
};
