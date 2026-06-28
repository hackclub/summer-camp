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

{#if data.groups.length === 0}
	<EmptyState
		title="Shop opens soon"
		body="Prizes are being stocked — keep earning points by showing up and shipping projects!"
	/>
{:else}
	<div class="flex flex-col gap-8">
		{#each data.groups as group (group.name)}
			<section>
				{#if group.name}
					<h2 class="mb-3 font-luckiest-guy text-2xl text-wood">{group.name}</h2>
				{/if}
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each group.items as item (item.id)}
						{@const soldOut = item.stock !== null && item.stock <= 0}
						{@const affordable = data.balance >= item.pricePoints}
						<a
							href={`/shop/${item.id}`}
							class={[
								'rounded-2xl border-4 border-wood bg-cream p-4 transition hover:border-dashed',
								(!affordable || soldOut) && 'opacity-70 saturate-50'
							]}
						>
							{#if item.imageUrl}
								<img
									src={item.imageUrl}
									alt={item.name}
									class="mb-3 h-40 w-full rounded-xl border-2 border-tan object-cover"
									loading="lazy"
								/>
							{:else}
								<div class="mb-3 h-40 w-full rounded-xl bg-tan"></div>
							{/if}
							<div class="flex items-center justify-between gap-2">
								<h3 class="font-bold text-wood-dark">{item.name}</h3>
								<span class="font-luckiest-guy whitespace-nowrap text-wood">{item.pricePoints} pts</span>
							</div>
							{#if soldOut}
								<p class="text-sm font-bold text-berry">Sold out</p>
							{:else if !affordable}
								<p class="text-sm font-bold text-wood">
									{item.pricePoints - data.balance} more pts to go
								</p>
							{/if}
						</a>
					{/each}
				</div>
			</section>
		{/each}
	</div>
{/if}
