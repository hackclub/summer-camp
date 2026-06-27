<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { ShieldCheck, Check } from 'lucide-svelte';

	let { data, form } = $props();
	let name = $state(form?.name ?? data.name ?? '');
</script>

<svelte:head><title>Set up — Hack Club Summer Camp</title></svelte:head>

<h1 class="mb-2 text-center font-luckiest-guy text-3xl text-wood-dark sm:text-4xl">
	Let’s set you up
</h1>
<p class="mx-auto mb-8 max-w-md text-center text-wood-dark">
	Two quick things and you’re ready to start camp.
</p>

<div class="flex flex-col gap-5">
	<Card title="What should we call you?">
		<form method="POST" action="?/saveName" class="flex flex-col gap-4">
			<Input
				label="Your name"
				name="name"
				bind:value={name}
				required
				placeholder="e.g. Mira Okonkwo"
				error={form?.error}
			/>
			<div class="flex justify-end">
				<Button type="submit" size="lg">Save &amp; continue →</Button>
			</div>
		</form>
	</Card>

	<Card title="Verify your identity">
		{#if data.identityVerified}
			<div class="flex items-center gap-3">
				<span
					class="flex size-10 shrink-0 items-center justify-center rounded-full border-4 border-grass-dark bg-grass text-cream"
				>
					<Check class="size-5" />
				</span>
				<p class="text-wood-dark">
					You’re verified — prizes can ship to you. Nothing more to do here!
				</p>
			</div>
		{:else}
			<p class="mb-4 text-wood-dark">
				Hack Club needs to confirm you’re a real teen before we mail you anything. It takes about two
				minutes and you only do it once.
			</p>
			<div class="flex flex-wrap items-center gap-4">
				<Button href="/identity/start?returnTo=/onboarding/setup">
					<ShieldCheck class="size-5" /> Verify now
				</Button>
				<span class="text-sm text-wood-dark/70">
					Or skip it for now — you’ll just need it before you ship a project or shop.
				</span>
			</div>
		{/if}
	</Card>
</div>

<div class="mt-6 text-center">
	<a href="/onboarding" class="text-sm font-bold text-wood underline">← back</a>
</div>
