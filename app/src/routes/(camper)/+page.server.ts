import { and, desc, eq, inArray, isNotNull } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { announcements, campDays, campDayMaterials, projects } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/auth/guards';
import { openLessons } from '$lib/server/lessons';
import { etDayLabel, isResubmitOpen, type CampDayLite } from '$lib/camp-time';

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

const shippedStatuses = ['submitted', 'approved', 'rejected'] as const;

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);

	const [days, latestAnnouncements, myProjects] = await Promise.all([
		loadDays(),
		db
			.select()
			.from(announcements)
			.where(eq(announcements.published, true))
			.orderBy(desc(announcements.createdAt))
			.limit(3),
		db
			.select()
			.from(projects)
			.where(and(eq(projects.userId, user.id), inArray(projects.status, [...shippedStatuses])))
			.orderBy(desc(projects.updatedAt))
			.limit(4)
	]);

	// Open lessons (today once launched + yesterday, plus launch-week grace days).
	// Build a rich card per open day: its materials, reward, and ship status.
	const open = openLessons(new Date(), days);
	const openIds = open.map((d) => d.id);

	const [materials, rewardMeta, myOpenProjects] = await Promise.all([
		openIds.length
			? db
					.select({
						campDayId: campDayMaterials.campDayId,
						title: campDayMaterials.title,
						url: campDayMaterials.url,
						kind: campDayMaterials.kind
					})
					.from(campDayMaterials)
					.where(inArray(campDayMaterials.campDayId, openIds))
					.orderBy(campDayMaterials.sort)
			: [],
		openIds.length
			? db
					.select({
						id: campDays.id,
						rewardPoints: campDays.rewardPoints,
						prizeLabel: campDays.prizeLabel
					})
					.from(campDays)
					.where(inArray(campDays.id, openIds))
			: [],
		openIds.length
			? db
					.select({ campDayId: projects.campDayId, status: projects.status })
					.from(projects)
					.where(and(eq(projects.userId, user.id), inArray(projects.campDayId, openIds)))
			: []
	]);

	const materialsByDay = new Map<string, { title: string; url: string; kind: string }[]>();
	for (const m of materials) {
		const list = materialsByDay.get(m.campDayId) ?? [];
		list.push({ title: m.title, url: m.url, kind: m.kind });
		materialsByDay.set(m.campDayId, list);
	}
	const rewardById = new Map(rewardMeta.map((r) => [r.id, r]));
	const statusByDay = new Map(myOpenProjects.map((p) => [p.campDayId, p.status]));
	const isShipped = (s: string | undefined) =>
		!!s && shippedStatuses.includes(s as (typeof shippedStatuses)[number]);

	const openDays = open.map((d) => {
		const status = statusByDay.get(d.id);
		return {
			id: d.id,
			title: d.title,
			label: etDayLabel(d.date),
			joinUrl: d.joinUrl ?? null,
			recordingUrl: d.recordingUrl ?? null,
			materials: materialsByDay.get(d.id) ?? [],
			rewardPoints: rewardById.get(d.id)?.rewardPoints ?? 0,
			prizeLabel: rewardById.get(d.id)?.prizeLabel ?? null,
			shipped: isShipped(status),
			status: status ?? null
		};
	});
	const toSubmit = openDays.filter((d) => !d.shipped).length;

	// Any Ari-sent-back project still inside the resubmit window? Drives the banner.
	const sentBack = isResubmitOpen(new Date())
		? await db
				.select({ id: projects.id })
				.from(projects)
				.where(
					and(
						eq(projects.userId, user.id),
						eq(projects.status, 'building'),
						inArray(projects.ariStatus, ['changes', 'rejected']),
						isNotNull(projects.campDayId)
					)
				)
				.limit(1)
		: [];

	return {
		days,
		announcements: latestAnnouncements,
		myProjects,
		openCount: open.length,
		toSubmit,
		openDays,
		hasSentBack: sentBack.length > 0
	};
};
