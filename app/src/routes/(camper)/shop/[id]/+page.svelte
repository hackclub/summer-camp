<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { base } from '$app/paths';

	let { data, form } = $props();

	const soldOut = $derived(data.item.stock !== null && data.item.stock <= 0);
	const affordable = $derived(data.balance >= data.item.pricePoints);
	const reasons: Record<string, string> = {
		insufficient_points: "You don't have enough points for this (yet!).",
		out_of_stock: 'Just sold out — sorry!',
		unavailable: "This item isn't available right now."
	};
</script>

<svelte:head><title>{data.item.name} — Hack Club Summer Camp</title></svelte:head>

<div class="mx-auto flex max-w-xl flex-col gap-6">
	{#if data.item.imageUrl}
		<img
			src={data.item.imageUrl}
			alt={data.item.name}
			class="w-full rounded-2xl border-4 border-wood shadow-md"
		/>
	{/if}

	<div class="text-center">
		<h1 class="font-melon-camp text-4xl text-wood">{data.item.name}</h1>
		<p class="font-melon-camp text-2xl text-wood-dark">{data.item.pricePoints} pts</p>
		{#if data.item.stock !== null && data.item.stock > 0 && data.item.stock <= 5}
			<p class="font-bold text-berry">Only {data.item.stock} left!</p>
		{/if}
	</div>

	{#if data.item.description}
		<Card>
			<p class="whitespace-pre-line text-wood-dark">{data.item.description}</p>
		</Card>
	{/if}

	{#if form?.reason}
		<p class="text-center font-bold text-berry">{reasons[form.reason] ?? form.reason}</p>
	{/if}

	{#if soldOut}
		<div class="text-center"><Button size="lg" disabled>Sold out</Button></div>
	{:else if !affordable}
		<div class="text-center">
			<Button size="lg" disabled>Need {data.item.pricePoints - data.balance} more pts</Button>
		</div>
	{:else if !data.identityVerified}
		<Card title="Verify first">
			<p class="mb-4 text-wood-dark">
				To send you prizes, Hack Club needs to verify you're a real teen — it takes ~2 minutes,
				once.
			</p>
			<Button href={`${base}/identity/start?returnTo=${encodeURIComponent(`/shop/${data.item.id}`)}`}>
				Verify with Hack Club Identity
			</Button>
		</Card>
	{:else}
		<Card title={data.item.requiresAddress ? 'Where should we send it?' : 'Redeem'}>
			<form method="POST" action="?/order" class="flex flex-col gap-3">
				{#if data.item.requiresAddress}
					<Input label="Address line 1" name="line1" required error={form?.errors?.line1} />
					<Input label="Address line 2 (optional)" name="line2" error={form?.errors?.line2} />
					<div class="grid grid-cols-2 gap-3">
						<Input label="City" name="city" required error={form?.errors?.city} />
						<Input label="State / region" name="state" required error={form?.errors?.state} />
					</div>
					<div class="grid grid-cols-2 gap-3">
						<Input label="ZIP / postal code" name="zip" required error={form?.errors?.zip} />
						<Input label="Country" name="country" required error={form?.errors?.country} />
					</div>
				{/if}
				<Button type="submit" size="lg">Redeem for {data.item.pricePoints} pts</Button>
			</form>
		</Card>
	{/if}
</div>
