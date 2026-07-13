// Camp clock logic. All camp scheduling is anchored to Eastern Time wall-clock
// (sessions run 12:00–3:00 PM ET on published camp days). This module is pure
// so it can be unit-tested and reused on server and client; the client
// re-evaluates it on an interval so the JOIN button flips live on its own.

export const SESSION_START = { hour: 12, minute: 0 };
export const SESSION_END = { hour: 15, minute: 0 };
// Join opens a little early so nobody is locked out at 12:00:01.
export const JOIN_OPENS = { hour: 11, minute: 50 };

// Final wind-down grace (camp is moving to Stardance): EVERY lesson stays open
// to submit until this instant (end of Fri Jul 11 ET). Shared by the server-side
// open-window logic and the UI banner/countdown.
export function submissionCloseAt(): Date {
	return etWallTime('2026-07-12', 0, 0); // midnight Jul 12 ET = through 11:59 PM Sat Jul 11
}
export function isLaunchGraceOpen(now: Date): boolean {
	return now < submissionCloseAt();
}

// A project Ari sent back (changes/rejected) can be fixed and re-shipped past the
// general close, until this instant (end of Fri Jul 17 ET).
export function resubmitCloseAt(): Date {
	return etWallTime('2026-07-18', 0, 0); // midnight Jul 18 ET = through 11:59 PM Fri Jul 17
}
export function isResubmitOpen(now: Date): boolean {
	return now < resubmitCloseAt();
}

const ET = 'America/New_York';

export interface CampDayLite {
	id: string;
	date: string; // YYYY-MM-DD (ET calendar date)
	title: string;
	joinUrl?: string | null;
	recordingUrl?: string | null;
}

export type CampState =
	| { kind: 'before-camp'; firstDay: CampDayLite; startsAt: Date }
	| { kind: 'pre-session'; day: CampDayLite; joinOpensAt: Date; startsAt: Date }
	| { kind: 'live'; day: CampDayLite; endsAt: Date }
	| {
			kind: 'post-session';
			day: CampDayLite;
			nextDay: CampDayLite | null;
			nextStartsAt: Date | null;
	  }
	| { kind: 'no-camp-today'; nextDay: CampDayLite; nextStartsAt: Date }
	| { kind: 'after-camp' };

/** The ET calendar date (YYYY-MM-DD) for an instant. */
export function etDateString(now: Date): string {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: ET,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(now);
	return parts; // en-CA formats as YYYY-MM-DD
}

/** UTC instant for an ET wall-clock time on a given ET calendar date.
 *  Tries the two possible US-Eastern offsets and picks the one that round-trips. */
export function etWallTime(dateStr: string, hour: number, minute: number): Date {
	const [y, m, d] = dateStr.split('-').map(Number);
	for (const offset of [4, 5]) {
		const candidate = new Date(Date.UTC(y, m - 1, d, hour + offset, minute));
		const parts = new Intl.DateTimeFormat('en-US', {
			timeZone: ET,
			hour12: false,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		}).formatToParts(candidate);
		const get = (type: string) => parts.find((p) => p.type === type)?.value;
		const hourVal = Number(get('hour')) % 24; // Intl can emit "24" for midnight
		if (
			Number(get('year')) === y &&
			Number(get('month')) === m &&
			Number(get('day')) === d &&
			hourVal === hour &&
			Number(get('minute')) === minute
		) {
			return candidate;
		}
	}
	// Unreachable for real US-Eastern dates; fall back to EDT.
	return new Date(Date.UTC(y, m - 1, d, hour + 4, minute));
}

export function getCampState(now: Date, days: CampDayLite[]): CampState {
	const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
	if (sorted.length === 0) return { kind: 'after-camp' };

	const today = etDateString(now);
	const day = sorted.find((d) => d.date === today) ?? null;
	const nextDay = sorted.find((d) => d.date > today) ?? null;
	const firstDay = sorted[0];

	if (day) {
		const joinOpensAt = etWallTime(day.date, JOIN_OPENS.hour, JOIN_OPENS.minute);
		const startsAt = etWallTime(day.date, SESSION_START.hour, SESSION_START.minute);
		const endsAt = etWallTime(day.date, SESSION_END.hour, SESSION_END.minute);

		if (now < joinOpensAt) {
			// Today's first session ever doubles as the "camp starts in" moment.
			if (day.date === firstDay.date) {
				return { kind: 'before-camp', firstDay, startsAt };
			}
			return { kind: 'pre-session', day, joinOpensAt, startsAt };
		}
		if (now < endsAt) return { kind: 'live', day, endsAt };
		return {
			kind: 'post-session',
			day,
			nextDay,
			nextStartsAt: nextDay
				? etWallTime(nextDay.date, SESSION_START.hour, SESSION_START.minute)
				: null
		};
	}

	if (today < firstDay.date) {
		return {
			kind: 'before-camp',
			firstDay,
			startsAt: etWallTime(firstDay.date, SESSION_START.hour, SESSION_START.minute)
		};
	}

	if (nextDay) {
		return {
			kind: 'no-camp-today',
			nextDay,
			nextStartsAt: etWallTime(nextDay.date, SESSION_START.hour, SESSION_START.minute)
		};
	}

	return { kind: 'after-camp' };
}

/** "2d 04:32:10"-style parts for countdown displays. */
export function countdownParts(now: Date, target: Date) {
	let ms = Math.max(0, target.getTime() - now.getTime());
	const days = Math.floor(ms / 86_400_000);
	ms -= days * 86_400_000;
	const hours = Math.floor(ms / 3_600_000);
	ms -= hours * 3_600_000;
	const minutes = Math.floor(ms / 60_000);
	ms -= minutes * 60_000;
	const seconds = Math.floor(ms / 1000);
	return { days, hours, minutes, seconds };
}

/** Friendly ET label like "Wednesday, July 1" for a camp-day date string. */
export function etDayLabel(dateStr: string): string {
	const noonUtc = etWallTime(dateStr, 12, 0);
	return new Intl.DateTimeFormat('en-US', {
		timeZone: ET,
		weekday: 'long',
		month: 'long',
		day: 'numeric'
	}).format(noonUtc);
}
