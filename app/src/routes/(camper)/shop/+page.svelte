<script lang="ts">
	import PageHeader from '$lib/components/theme/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
</script>

<svelte:head><title>Prize shop — Hack Club Summer Camp</title></svelte:head>

<PageHeader title="Prize shop" subtitle="Camp is moving to Stardance" />

<div
	class="mx-auto mb-6 max-w-xl rounded-2xl border-4 border-grass bg-grass/15 p-5 text-center text-wood-dark"
>
	<p class="font-melon-camp text-xl text-grass-dark">🎽 Ship all 7 days to earn an exclusive t-shirt!</p>
	<p class="mt-1 text-sm">Get every one of the 7 lessons shipped by <strong>Saturday, July 11</strong> and we'll send you a limited-edition camp tee.</p>
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
