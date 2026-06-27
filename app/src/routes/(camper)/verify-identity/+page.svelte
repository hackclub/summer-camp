<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import PageHeader from '$lib/components/theme/PageHeader.svelte';

	let { data } = $props();
</script>

<svelte:head><title>Verify identity — Hack Club Summer Camp</title></svelte:head>

<PageHeader title="One quick thing!" />

<div class="mx-auto max-w-xl">
	{#if data.verified}
		<Card title="You're verified! 🎉">
			<p class="mb-4 text-wood-dark">All set — you can ship projects and order prizes.</p>
			<Button href={data.returnTo}>Keep going</Button>
		</Card>
	{:else if data.blocked}
		<Card title="You're not eligible for prizes">
			<p class="mb-4 text-wood-dark">{data.ineligibleMessage}</p>
			<p class="text-sm text-wood-dark/70">
				You can still join sessions and build projects — shipping for prizes and the shop just aren't
				available. Questions? Email
				<a href="mailto:camp@hackclub.com" class="underline">camp@hackclub.com</a>.
			</p>
		</Card>
	{:else if data.status === 'pending'}
		<Card title="Verification in review">
			<p class="mb-4 text-wood-dark">
				Your verification is being reviewed — that usually takes less than a day. Your project is
				safe in drafts; ship it once you're verified.
			</p>
			<Button
				href={`/identity/start?returnTo=${encodeURIComponent(data.returnTo)}`}
				variant="secondary"
			>
				Check again
			</Button>
		</Card>
	{:else if data.status === 'error'}
		<Card title="Something went wrong">
			<p class="mb-4 text-wood-dark">
				Verification hit a snag. Try again — and if it keeps happening, email
				<a href="mailto:camp@hackclub.com" class="underline">camp@hackclub.com</a> and we'll sort it out.
			</p>
			<Button href={`/identity/start?returnTo=${encodeURIComponent(data.returnTo)}`}>
				Try again
			</Button>
		</Card>
	{:else}
		<Card title="Verify you're you">
			<p class="mb-4 text-wood-dark">
				To send you prizes, Hack Club needs to verify you're a real teen. It takes ~2 minutes and
				you only do it once.
			</p>
			<Button href={`/identity/start?returnTo=${encodeURIComponent(data.returnTo)}`} size="lg">
				Verify with Hack Club Identity
			</Button>
		</Card>
	{/if}
</div>
