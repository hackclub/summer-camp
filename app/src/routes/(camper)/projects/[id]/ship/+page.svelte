<script lang="ts">
	import PageHeader from '$lib/components/theme/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { Check, X } from 'lucide-svelte';

	let { data } = $props();

	const checklist = $derived([
		{ label: 'Project has a name', ok: !data.missing.title },
		{ label: 'Description tells us what you built', ok: !data.missing.description },
		{ label: 'Code link (GitHub repo)', ok: !data.missing.githubUrl },
		{ label: 'A way to play / try it', ok: !data.missing.playableUrl },
		{ label: 'A screenshot', ok: !data.missing.screenshotUrl }
	]);
	const ready = $derived(checklist.every((c) => c.ok));
</script>

<svelte:head><title>Ship it — Hack Club Summer Camp</title></svelte:head>

<PageHeader title="Ship it!" subtitle={data.project.title} />

<div class="mx-auto flex max-w-xl flex-col gap-6">
	<Card title="Pre-flight checklist">
		<ul class="flex flex-col gap-2">
			{#each checklist as item (item.label)}
				<li class="flex items-center gap-2">
					{#if item.ok}
						<Check class="size-5 shrink-0 text-grass-dark" />
					{:else}
						<X class="size-5 shrink-0 text-berry" />
					{/if}
					<span class={['text-wood-dark', !item.ok && 'font-bold']}>{item.label}</span>
				</li>
			{/each}
		</ul>
		{#if !ready}
			<div class="mt-4">
				<Button href={`/projects/${data.project.id}/edit`} variant="secondary">
					Finish it up first
				</Button>
			</div>
		{/if}
	</Card>

	{#if ready}
		{#if !data.identityVerified}
			<Card title="One quick thing before you ship!">
				<p class="mb-4 text-wood-dark">
					To send you prizes, Hack Club needs to verify you're a real teen. It takes ~2 minutes and
					you only do it once. Your project is saved — we'll bring you right back here.
				</p>
				<Button
					href={`/identity/start?returnTo=${encodeURIComponent(`/projects/${data.project.id}/ship`)}`}
					size="lg"
				>
					Verify with Hack Club Identity
				</Button>
			</Card>
		{:else}
			<Card>
				<p class="mb-4 text-wood-dark">
					Once you ship, counselors will review it — points land when it's approved. Shipped
					projects are locked, so make sure it's ready!
				</p>
				<form method="POST">
					<Button type="submit" size="lg">Ship it for real 🚀</Button>
				</form>
			</Card>
		{/if}
	{/if}
</div>
