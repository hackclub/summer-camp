import {
	getCampState,
	etDateString,
	isLaunchGraceOpen,
	LAUNCH_WEEK_DATES,
	type CampDayLite
} from '$lib/camp-time';

// Launch-week grace (dates + cutoff live in camp-time so the UI shares them):
// the first lessons stay open to submit/ship until the end of Wed Jul 8 ET.
const GRACE_DATES = new Set<string>(LAUNCH_WEEK_DATES);

// Dates that are never submittable, even if the today/yesterday/grace rules
// would otherwise open them (e.g. Mon Jul 6 — campers finish days 1–4 first).
const BLOCKED_DATES = new Set<string>(['2026-07-06']);

/** Shift a YYYY-MM-DD date string by whole days (pure calendar arithmetic). */
function shiftDate(dateStr: string, deltaDays: number): string {
	const [y, m, d] = dateStr.split('-').map(Number);
	const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
	const p = (n: number) => String(n).padStart(2, '0');
	return `${dt.getUTCFullYear()}-${p(dt.getUTCMonth() + 1)}-${p(dt.getUTCDate())}`;
}

/**
 * The lessons a camper may submit/ship a project for right now (newest first):
 *   - today's lesson, once its session has started (live or wrapped),
 *   - the immediately previous calendar day's lesson (a strict one-day grace), and
 *   - during launch week, any of days 1–5 until the end of Sun Jul 5 ET.
 * Anything else is locked.
 */
export function openLessons(now: Date, days: CampDayLite[]): CampDayLite[] {
	const today = etDateString(now);
	const yesterday = shiftDate(today, -1);
	const state = getCampState(now, days);
	const todayLaunched = state.kind === 'live' || state.kind === 'post-session';
	const inGrace = isLaunchGraceOpen(now);

	return days
		.filter(
			(d) =>
				!BLOCKED_DATES.has(d.date) &&
				((d.date === today && todayLaunched) ||
					d.date === yesterday ||
					(inGrace && GRACE_DATES.has(d.date)))
		)
		.sort((a, b) => b.date.localeCompare(a.date));
}

/** Whether a specific camp day is currently open for submission. */
export function isLessonOpen(dayId: string, now: Date, days: CampDayLite[]): boolean {
	return openLessons(now, days).some((d) => d.id === dayId);
}
