<script lang="ts">
	import PageHeader from '$lib/components/theme/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { Coins } from 'lucide-svelte';

	let { data } = $props();
</script>

<svelte:head><title>Prize shop — Hack Club Summer Camp</title></svelte:head>

<PageHeader title="Prize shop" subtitle="Camp is moving to Stardance" />

<div class="mb-6 flex justify-center">
	<div class="flex items-center gap-2 rounded-full border-4 border-wood bg-cream px-5 py-2">
		<Coins class="size-6 text-wood" />
		<span class="text-xl font-bold text-wood-dark tabular-nums">{data.balance} Stardust</span>
	</div>
</div>

<div class="mx-auto max-w-xl rounded-2xl border-4 border-wood bg-cream p-6 text-center">
	<h2 class="font-melon-camp text-2xl text-wood">Spend it in the Stardance shop</h2>
	<p class="mt-2 text-wood-dark">
		Camp is moving to Stardance! Instead of a camp shop, you'll be given <strong>Stardust</strong>
		to spend in the Stardance shop. Head over to check out what you can get.
	</p>
	<div class="mt-4 flex justify-center">
		<Button href="https://stardance.hackclub.com/shop" target="_blank" rel="noopener">
			Go to the Stardance shop
		</Button>
	</div>
</div>
