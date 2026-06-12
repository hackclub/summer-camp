// Simple in-memory per-key rate limiter. Scoped to a single pod and reset on
// restart, which is fine as a cheap abuse brake (same pattern as the landing
// page's RSVP form).
const hits = new Map<string, number[]>();

export function isRateLimited(key: string, max: number, windowMs: number): boolean {
	const now = Date.now();
	const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
	recent.push(now);
	hits.set(key, recent);
	return recent.length > max;
}
