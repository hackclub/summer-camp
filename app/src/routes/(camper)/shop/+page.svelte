<script lang="ts">
	import PageHeader from '$lib/components/theme/PageHeader.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { Coins } from 'lucide-svelte';

	let { data } = $props();
</script>

<svelte:head><title>Prize shop — Hack Club Summer Camp</title></svelte:head>

<PageHeader title="Prize shop" subtitle="Earn points at camp, spend them here" />

<div class="mb-6 flex justify-center">
	<div class="flex items-center gap-2 rounded-full border-4 border-wood bg-cream px-5 py-2">
		<Coins class="size-6 text-wood" />
		<span class="text-xl font-bold text-wood-dark tabular-nums">{data.balance} pts</span>
	</div>
</div>

<EmptyState
	title="Shop coming soon"
	body="Prizes are being stocked — keep earning points by showing up and shipping projects. The shop opens soon!"
/>
