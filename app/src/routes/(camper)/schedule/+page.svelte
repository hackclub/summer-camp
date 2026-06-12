<script lang="ts">
	import PageHeader from '$lib/components/theme/PageHeader.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { etDateString, etDayLabel } from '$lib/camp-time';
	import { Check } from 'lucide-svelte';

	let { data } = $props();

	const today = etDateString(new Date());
	const attended = $derived(new Set(data.attendedDayIds));

	// Group camp days into weeks (Mon–Fri) for display.
	const weeks = $derived.by(() => {
		const out: (typeof data.days)[] = [];
		let current: typeof data.days = [];
		let currentWeek = 0;
		for (const day of data.days) {
			// Week key = epoch ms of the Monday of that week, via pure date math
			// (1970-01-01 was a Thursday, hence the +4 for day-of-week).
			const [y, m, d] = day.date.split('-').map(Number);
			const ms = Date.UTC(y, m - 1, d);
			const dow = (Math.floor(ms / 86_400_000) + 4) % 7; // 0 = Sunday
			const key = ms - ((dow + 6) % 7) * 86_400_000;
			if (key !== currentWeek) {
				if (current.length) out.push(current);
				current = [];
				currentWeek = key;
			}
			current.push(day);
		}
		if (current.length) out.push(current);
		return out;
	});

	function status(day: (typeof data.days)[number]): string {
		if (day.date === today) return 'today';
		if (day.date < today) return day.recordingUrl ? 'recorded' : 'past';
		return 'upcoming';
	}
</script>

<svelte:head><title>Schedule — Hack Club Summer Camp</title></svelte:head>

<PageHeader title="Schedule" subtitle="Weekdays, 12:00–3:00 PM ET" />

{#if data.days.length === 0}
	<EmptyState
		title="Schedule coming soon"
		body="Camp days will show up here once they're published. Hang tight!"
	/>
{:else}
	<div class="flex flex-col gap-8">
		{#each weeks as week, i (i)}
			<section>
				<h2 class="mb-3 font-luckiest-guy text-2xl text-wood">Week {i + 1}</h2>
				<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
					{#each week as day (day.id)}
						<a
							href={`/schedule/${day.id}`}
							class={[
								'rounded-2xl border-4 bg-cream p-4 transition hover:border-dashed',
								day.date === today ? 'border-grass' : 'border-wood'
							]}
						>
							<div class="mb-2 flex items-center justify-between gap-1">
								<span class="text-xs font-bold text-wood-dark uppercase">
									{etDayLabel(day.date)}
								</span>
								{#if attended.has(day.id)}
									<span title="You were there!">
										<Check class="size-4 text-grass-dark" />
									</span>
								{/if}
							</div>
							<h3 class="mb-2 font-bold text-wood-dark">{day.title}</h3>
							{#if status(day) !== 'past'}
								<Badge status={status(day)} />
							{/if}
						</a>
					{/each}
				</div>
			</section>
		{/each}
	</div>
{/if}
