<script lang="ts">
	import { getCampState, etDayLabel, type CampDayLite } from '$lib/camp-time';
	import Countdown from './Countdown.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	let { days }: { days: CampDayLite[] } = $props();

	// Re-evaluate on a ticking clock so the JOIN button flips to live on its own.
	let now = $state(new Date());
	$effect(() => {
		const interval = setInterval(() => (now = new Date()), 1000);
		return () => clearInterval(interval);
	});

	const campState = $derived(getCampState(now, days));
</script>

<section
	class="relative flex min-h-64 flex-col items-center justify-center gap-4 rounded-2xl border-4 border-wood bg-cream p-6 text-center shadow-md sm:p-10"
>
	{#if campState.kind === 'before-camp'}
		<p class="font-luckiest-guy text-2xl text-wood sm:text-3xl">Camp starts in</p>
		<p class="text-4xl text-wood-dark sm:text-6xl">
			<Countdown target={campState.startsAt} {now} />
		</p>
		<p class="text-wood-dark">
			First session: <strong>{campState.firstDay.title}</strong> — {etDayLabel(
				campState.firstDay.date
			)} at 12:00 PM ET
		</p>
		<Button href="/schedule" variant="secondary">Browse the schedule</Button>
	{:else if campState.kind === 'pre-session'}
		<p class="font-bold tracking-wide text-wood-dark uppercase">{etDayLabel(campState.day.date)}</p>
		<h1 class="font-luckiest-guy text-3xl text-wood sm:text-5xl">{campState.day.title}</h1>
		<p class="font-luckiest-guy text-xl text-wood">Starts in</p>
		<p class="text-4xl text-wood-dark sm:text-5xl">
			<Countdown target={campState.startsAt} {now} />
		</p>
		<Button href={`/schedule/${campState.day.id}`} variant="secondary">
			Get ready — see today's materials
		</Button>
	{:else if campState.kind === 'live'}
		<Badge status="live" />
		<p class="font-bold tracking-wide text-wood-dark uppercase">{etDayLabel(campState.day.date)}</p>
		<h1 class="font-luckiest-guy text-3xl text-wood sm:text-5xl">{campState.day.title}</h1>
		{#if campState.day.joinUrl}
			<Button href={campState.day.joinUrl} size="hero" target="_blank" rel="noopener">
				JOIN TODAY'S SESSION
			</Button>
		{:else}
			<Button size="hero" disabled>JOIN TODAY'S SESSION</Button>
			<p class="text-sm text-wood-dark">The link drops right before noon — refresh in a minute!</p>
		{/if}
		<p class="text-wood-dark">Running until 3:00 PM ET</p>
	{:else if campState.kind === 'post-session'}
		<h1 class="font-luckiest-guy text-3xl text-wood sm:text-4xl">Today's session has wrapped!</h1>
		{#if campState.day.recordingUrl}
			<Button href={campState.day.recordingUrl} size="lg" target="_blank" rel="noopener">
				Watch the recording
			</Button>
		{:else}
			<p class="text-wood-dark">Recording coming soon — check back later.</p>
		{/if}
		<a href={`/schedule/${campState.day.id}`} class="text-wood underline">Today's materials</a>
		{#if campState.nextDay && campState.nextStartsAt}
			<p class="text-sm text-wood-dark">
				Next session: <strong>{campState.nextDay.title}</strong> in
				<Countdown target={campState.nextStartsAt} {now} />
			</p>
		{/if}
	{:else if campState.kind === 'no-camp-today'}
		<h1 class="font-luckiest-guy text-3xl text-wood sm:text-4xl">No camp today</h1>
		<p class="text-wood-dark">
			Back for <strong>{campState.nextDay.title}</strong> — {etDayLabel(campState.nextDay.date)} at 12:00
			PM ET
		</p>
		<p class="text-3xl text-wood-dark"><Countdown target={campState.nextStartsAt} {now} /></p>
		<div class="flex flex-wrap justify-center gap-3">
			<Button href="/projects" variant="secondary">Work on your project</Button>
			<Button href="/gallery" variant="secondary">Browse the gallery</Button>
		</div>
	{:else}
		<h1 class="font-luckiest-guy text-3xl text-wood sm:text-4xl">That's a wrap on Summer Camp!</h1>
		<p class="text-wood-dark">
			Thanks for an amazing summer. Your projects live on in the gallery — and don't forget to spend
			your points!
		</p>
		<div class="flex flex-wrap justify-center gap-3">
			<Button href="/gallery" variant="secondary">The gallery</Button>
			<Button href="/shop">Spend your points</Button>
		</div>
	{/if}
</section>
