import { describe, expect, it } from 'vitest';
import { etDateString, etWallTime, getCampState, type CampDayLite } from './camp-time';

// June–July 2026 is EDT (UTC-4) throughout: 12:00 ET = 16:00 UTC.
const days: CampDayLite[] = [
	{ id: 'd1', date: '2026-06-23', title: 'Welcome to camp' },
	{ id: 'd2', date: '2026-06-24', title: 'Day 2' },
	{ id: 'd3', date: '2026-06-26', title: 'Day 4 (Friday)' },
	{ id: 'd4', date: '2026-07-17', title: 'Last day' }
];

const utc = (s: string) => new Date(s);

describe('etDateString / etWallTime', () => {
	it('converts UTC instants to ET calendar dates', () => {
		// 2am UTC on the 24th is still 10pm ET on the 23rd.
		expect(etDateString(utc('2026-06-24T02:00:00Z'))).toBe('2026-06-23');
		expect(etDateString(utc('2026-06-24T12:00:00Z'))).toBe('2026-06-24');
	});

	it('maps ET wall time to the correct UTC instant during EDT', () => {
		expect(etWallTime('2026-06-23', 12, 0).toISOString()).toBe('2026-06-23T16:00:00.000Z');
		expect(etWallTime('2026-06-23', 15, 0).toISOString()).toBe('2026-06-23T19:00:00.000Z');
	});

	it('maps ET wall time correctly during EST (winter)', () => {
		expect(etWallTime('2026-01-15', 12, 0).toISOString()).toBe('2026-01-15T17:00:00.000Z');
	});
});

describe('getCampState', () => {
	it('is before-camp before the first day', () => {
		const state = getCampState(utc('2026-06-12T18:00:00Z'), days);
		expect(state.kind).toBe('before-camp');
		if (state.kind === 'before-camp') {
			expect(state.firstDay.id).toBe('d1');
			expect(state.startsAt.toISOString()).toBe('2026-06-23T16:00:00.000Z');
		}
	});

	it('is before-camp on the morning of day one', () => {
		// 9am ET on June 23 — camp exists but hasn't ever started.
		const state = getCampState(utc('2026-06-23T13:00:00Z'), days);
		expect(state.kind).toBe('before-camp');
	});

	it('is pre-session on a later session morning', () => {
		// 9am ET on June 24.
		const state = getCampState(utc('2026-06-24T13:00:00Z'), days);
		expect(state.kind).toBe('pre-session');
		if (state.kind === 'pre-session') {
			expect(state.day.id).toBe('d2');
			// Join opens 11:50 ET = 15:50 UTC.
			expect(state.joinOpensAt.toISOString()).toBe('2026-06-24T15:50:00.000Z');
		}
	});

	it('goes live at the 11:50 ET grace window, including day one', () => {
		expect(getCampState(utc('2026-06-23T15:50:00Z'), days).kind).toBe('live');
		expect(getCampState(utc('2026-06-24T15:49:59Z'), days).kind).toBe('pre-session');
		expect(getCampState(utc('2026-06-24T17:30:00Z'), days).kind).toBe('live');
	});

	it('ends the live window at 3pm ET', () => {
		expect(getCampState(utc('2026-06-24T18:59:59Z'), days).kind).toBe('live');
		const after = getCampState(utc('2026-06-24T19:00:00Z'), days);
		expect(after.kind).toBe('post-session');
		if (after.kind === 'post-session') {
			expect(after.day.id).toBe('d2');
			expect(after.nextDay?.id).toBe('d3');
		}
	});

	it('is no-camp-today on a weekend between sessions', () => {
		// Saturday June 27, noon ET.
		const state = getCampState(utc('2026-06-27T16:00:00Z'), days);
		expect(state.kind).toBe('no-camp-today');
		if (state.kind === 'no-camp-today') expect(state.nextDay.id).toBe('d4');
	});

	it('is no-camp-today on a skipped weekday (June 25 not in list)', () => {
		const state = getCampState(utc('2026-06-25T16:00:00Z'), days);
		expect(state.kind).toBe('no-camp-today');
		if (state.kind === 'no-camp-today') expect(state.nextDay.id).toBe('d3');
	});

	it('is after-camp once the last session has ended', () => {
		expect(getCampState(utc('2026-07-17T19:00:01Z'), days).kind).toBe('post-session');
		expect(getCampState(utc('2026-07-18T16:00:00Z'), days).kind).toBe('after-camp');
	});

	it('is after-camp with no days at all', () => {
		expect(getCampState(utc('2026-06-24T16:00:00Z'), []).kind).toBe('after-camp');
	});
});
