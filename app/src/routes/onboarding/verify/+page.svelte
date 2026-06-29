<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { ShieldCheck, Check, X, Clock } from 'lucide-svelte';

	let { data } = $props();

	const blocked = $derived(
		data.decision === 'blocked_over_18' || data.decision === 'blocked_rejected'
	);
</script>

<svelte:head><title>Verify identity — Hack Club Summer Camp</title></svelte:head>

<p class="mb-2 text-center text-sm font-bold tracking-wide text-wood/80">Step 2 of 2</p>
<h1 class="mb-2 text-center font-melon-camp text-3xl text-wood-dark sm:text-4xl">
	Verify your identity
</h1>
<p class="mx-auto mb-8 max-w-md text-center text-wood-dark">
	Hack Club confirms you’re an eligible teen before mailing prizes. You only do this once.
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
	{:else if data.checked && blocked}
		<div class="flex items-start gap-3">
			<span
				class="flex size-10 shrink-0 items-center justify-center rounded-full border-4 border-berry bg-berry/10 text-berry"
			>
				<X class="size-5" />
			</span>
			<div>
				<h3 class="mb-1 font-bold text-wood-dark">You’re not eligible for prizes</h3>
				<p class="text-wood-dark">{data.message}</p>
				<p class="mt-2 text-sm text-wood-dark/70">
					You can still join sessions and build projects — you just won’t be able to ship for prizes
					or use the shop. Questions? Email
					<a href="mailto:camp@hackclub.com" class="underline">camp@hackclub.com</a>.
				</p>
			</div>
		</div>
	{:else if data.checked && data.decision === 'pending'}
		<div class="flex items-start gap-3">
			<span
				class="flex size-10 shrink-0 items-center justify-center rounded-full border-4 border-sky bg-sky/15 text-wood-dark"
			>
				<Clock class="size-5" />
			</span>
			<div>
				<h3 class="mb-1 font-bold text-wood-dark">Verification in review</h3>
				<p class="text-wood-dark">{data.message}</p>
				<div class="mt-3">
					<Button href="/identity/start?returnTo=/onboarding/verify" variant="secondary">
						Check again
					</Button>
				</div>
			</div>
		</div>
	{:else}
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
	<Button href="/onboarding/start" size="lg">
		{data.identityVerified ? 'Finish →' : 'Continue →'}
	</Button>
</div>
