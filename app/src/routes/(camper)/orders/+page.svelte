<script lang="ts">
	import { page } from '$app/state';
	import PageHeader from '$lib/components/theme/PageHeader.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';

	let { data } = $props();
</script>

<svelte:head><title>My orders — Hack Club Summer Camp</title></svelte:head>

<PageHeader title="My orders" />

{#if page.url.searchParams.get('placed')}
	<p class="mb-6 text-center text-xl font-bold text-grass-dark">
		Order placed! We'll get it moving. 🎉
	</p>
{/if}

{#if data.orders.length === 0}
	<EmptyState
		title="Nothing ordered yet"
		body="Check out the prize shop — your points are waiting to be spent!"
		actionLabel="Visit the shop"
		actionHref="/shop"
	/>
{:else}
	<div class="mx-auto flex max-w-2xl flex-col gap-3">
		{#each data.orders as order (order.id)}
			<div class="flex items-center gap-4 rounded-2xl border-4 border-wood bg-cream p-4">
				{#if order.itemImage}
					<img
						src={order.itemImage}
						alt=""
						class="size-16 rounded-xl border-2 border-tan object-cover"
					/>
				{:else}
					<div class="size-16 rounded-xl bg-tan"></div>
				{/if}
				<div class="flex-1">
					<h3 class="font-bold text-wood-dark">{order.itemName}</h3>
					<p class="text-sm text-wood">
						{order.pricePoints} pts · {new Date(order.createdAt).toLocaleDateString()}
					</p>
				</div>
				<Badge status={order.status} />
			</div>
		{/each}
	</div>
{/if}
