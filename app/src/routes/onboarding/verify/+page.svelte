<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { ShieldCheck, Check } from 'lucide-svelte';

	let { data } = $props();
</script>

<svelte:head><title>Verify identity — Hack Club Summer Camp</title></svelte:head>

<p class="mb-2 text-center text-sm font-bold tracking-wide text-wood/80">Step 2 of 2</p>
<h1 class="mb-2 text-center font-luckiest-guy text-3xl text-wood-dark sm:text-4xl">
	Verify your identity
</h1>
<p class="mx-auto mb-8 max-w-md text-center text-wood-dark">
	Hack Club confirms you’re a real teen before mailing prizes. You only do this once.
</p>

<Card>
	{#if data.identityVerified}
		<div class="flex items-center gap-3">
			<span
				class="flex size-10 shrink-0 items-center justify-center rounded-full border-4 border-grass-dark bg-grass text-cream"
			>
				<Check class="size-5" />
			</span>
			<p class="text-wood-dark">You’re verified — prizes can ship to you. 🎉</p>
		</div>
	{:else}
		{#if data.idv === 'pending'}
			<p class="mb-4 rounded-lg bg-sky/15 p-3 text-sm font-bold text-wood-dark">
				We couldn’t confirm your verification yet. If you just submitted it, it may still be
				processing — you can keep going and it’ll pick up once it clears.
			</p>
		{/if}
		<p class="mb-4 text-wood-dark">
			It takes about two minutes. You can also skip it for now — you’ll just need it before you ship
			a project or shop for prizes.
		</p>
		<div class="flex flex-wrap items-center gap-4">
			<Button href="/identity/start?returnTo=/onboarding/verify">
				<ShieldCheck class="size-5" /> Verify now
			</Button>
			<a href="/onboarding/start" class="text-sm font-bold text-wood underline">Skip for now →</a>
		</div>
	{/if}
</Card>

<div class="mt-6 flex items-center justify-between">
	<a href="/onboarding/setup" class="text-sm font-bold text-wood underline">← back</a>
	{#if data.identityVerified}
		<Button href="/onboarding/start" size="lg">Finish →</Button>
	{/if}
</div>
