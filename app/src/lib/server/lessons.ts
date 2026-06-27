import { getCampState, etDateString, type CampDayLite } from '$lib/camp-time';

/** Shift a YYYY-MM-DD date string by whole days (pure calendar arithmetic). */
function shiftDate(dateStr: string, deltaDays: number): string {
	const [y, m, d] = dateStr.split('-').map(Number);
	const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
	const p = (n: number) => String(n).padStart(2, '0');
	return `${dt.getUTCFullYear()}-${p(dt.getUTCMonth() + 1)}-${p(dt.getUTCDate())}`;
}

/**
 * The lessons a camper may submit/ship a project for right now (newest first):
 *   - today's lesson, once its session has started (live or wrapped), and
 *   - the immediately previous calendar day's lesson (a strict one-day grace).
 * Anything older is locked. So a lesson is shippable on its own session day and
 * the next calendar day only.
 */
export function openLessons(now: Date, days: CampDayLite[]): CampDayLite[] {
	const today = etDateString(now);
	const yesterday = shiftDate(today, -1);
	const state = getCampState(now, days);
	const todayLaunched = state.kind === 'live' || state.kind === 'post-session';

	return days
		.filter((d) => (d.date === today && todayLaunched) || d.date === yesterday)
		.sort((a, b) => b.date.localeCompare(a.date));
}

/** Whether a specific camp day is currently open for submission. */
export function isLessonOpen(dayId: string, now: Date, days: CampDayLite[]): boolean {
	return openLessons(now, days).some((d) => d.id === dayId);
}
