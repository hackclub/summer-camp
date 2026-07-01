import { getCampState, etDateString, etWallTime, type CampDayLite } from '$lib/camp-time';

// Launch-week grace: the first five lessons (Mon Jun 29 – Fri Jul 3) stay open
// to submit/ship anytime until the end of Sun Jul 5 ET, so campers can catch up
// over the first weekend. Self-expires — after the cutoff the normal
// today+yesterday window applies to every day.
const GRACE_DATES = new Set([
	'2026-06-29',
	'2026-06-30',
	'2026-07-01',
	'2026-07-02',
	'2026-07-03'
]);
// Exclusive cutoff = midnight Jul 6 ET, i.e. open through 11:59 PM Sun Jul 5.
const graceOpen = (now: Date) => now < etWallTime('2026-07-06', 0, 0);

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
	const inGrace = graceOpen(now);

	return days
		.filter(
			(d) =>
				(d.date === today && todayLaunched) ||
				d.date === yesterday ||
				(inGrace && GRACE_DATES.has(d.date))
		)
		.sort((a, b) => b.date.localeCompare(a.date));
}

/** Whether a specific camp day is currently open for submission. */
export function isLessonOpen(dayId: string, now: Date, days: CampDayLite[]): boolean {
	return openLessons(now, days).some((d) => d.id === dayId);
}
