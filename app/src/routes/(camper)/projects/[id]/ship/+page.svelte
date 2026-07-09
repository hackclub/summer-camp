<script lang="ts">
	import PageHeader from '$lib/components/theme/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import AddressFields from '$lib/components/projects/AddressFields.svelte';
	import { Check, X } from 'lucide-svelte';
	import { base } from '$app/paths';

	let { data, form } = $props();

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
				<Button href={`${base}/projects/${data.project.id}/edit`} variant="secondary">
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
					href={`${base}/identity/start?returnTo=${encodeURIComponent(`/projects/${data.project.id}/ship`)}`}
					size="lg"
				>
					Verify with Hack Club Identity
				</Button>
			</Card>
		{:else}
			<Card>
				<p class="mb-4 text-wood-dark">
					Once you ship, counselors will review it — Stardust lands when it's approved. Shipped
					projects are locked, so make sure it's ready!
				</p>
				{#if form?.shipFailed}
					<p class="mb-4 rounded-lg bg-berry/10 p-3 text-sm font-bold text-berry">
						Something went wrong sending your ship for review, so it wasn't submitted. Please try
						again in a minute — if it keeps happening, contact Jenin.
					</p>
				{/if}
				<form method="POST">
					<div class="mb-4">
						<p class="mb-2 font-bold text-wood-dark">Mailing address</p>
						<p class="mb-3 text-sm text-wood-dark/70">
							Required to ship — Hack Club needs it to send anything you earn.
						</p>
						<AddressFields address={data.project.shipAddress} errors={form?.errors ?? {}} />
					</div>
					<Button type="submit" size="lg">Ship it for real 🚀</Button>
				</form>
			</Card>
		{/if}
	{/if}
</div>
