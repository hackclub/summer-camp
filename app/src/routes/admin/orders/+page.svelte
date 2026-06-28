<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Address } from '$lib/types';

	let { data } = $props();

	const tabs = ['ordered', 'packed', 'shipped', 'delivered', 'refunded', 'canceled', 'all'];
	const nextLabel: Record<string, string> = {
		ordered: 'Mark packed',
		packed: 'Mark shipped',
		shipped: 'Mark delivered'
	};
	const active = new Set(['ordered', 'packed', 'shipped']); // can still be advanced/refunded

	const formatAddress = (a: Address | null) =>
		a
			? [a.line1, a.line2, `${a.city}, ${a.state} ${a.zip}`, a.country].filter(Boolean).join(', ')
			: '—';
</script>

<svelte:head><title>Orders — Summer Camp Admin</title></svelte:head>

<div class="mb-4 flex items-center justify-between gap-3">
	<h1 class="text-2xl font-bold text-slate-800">Orders</h1>
	<a
		href={`/admin/orders/export${data.status === 'all' ? '' : `?status=${data.status}`}`}
		class="rounded bg-slate-800 px-3 py-1.5 text-sm font-bold text-white hover:bg-slate-700"
	>
		Export CSV
	</a>
</div>

<div class="mb-4 flex flex-wrap gap-2">
	{#each tabs as tab (tab)}
		<a
			href={`/admin/orders?status=${tab}`}
			class={[
				'rounded px-3 py-1 text-sm capitalize',
				data.status === tab ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
			]}
		>
			{tab}
		</a>
	{/each}
</div>

<div class="flex flex-col gap-3">
	{#each data.rows as row (row.order.id)}
		{@const isPrize = !row.order.itemId}
		<div class="rounded-lg border border-slate-200 bg-white p-4">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p class="font-bold text-slate-800">
						{row.itemName ?? row.order.prizeLabel ?? 'Order'}
						{#if isPrize}<span class="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">prize</span>{/if}
					</p>
					<p class="text-sm text-slate-600">
						{row.camperName ?? row.camperEmail} · {row.order.pricePoints} pts ·
						{new Date(row.order.createdAt).toLocaleString()}
					</p>
					<p class="mt-1 text-sm text-slate-500">{formatAddress(row.order.address)}</p>
					{#if row.order.trackingUrl}
						<p class="mt-1 text-sm">
							Tracking: <a href={row.order.trackingUrl} target="_blank" rel="noopener" class="text-blue-600 underline">{row.order.trackingUrl}</a>
						</p>
					{/if}
					{#if row.order.notes}<p class="mt-1 text-sm text-slate-500">Note: {row.order.notes}</p>{/if}
				</div>
				<span class="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 uppercase">
					{row.order.status}
				</span>
			</div>

			{#if active.has(row.order.status)}
				<div class="mt-3 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
					<form method="POST" action="?/advance" use:enhance>
						<input type="hidden" name="id" value={row.order.id} />
						<button type="submit" class="rounded bg-green-700 px-3 py-1.5 text-sm font-bold text-white hover:bg-green-600">
							{nextLabel[row.order.status]}
						</button>
					</form>
					<form method="POST" action="?/setDetails" use:enhance class="flex flex-wrap items-end gap-2">
						<input type="hidden" name="id" value={row.order.id} />
						<input
							name="trackingUrl"
							value={row.order.trackingUrl ?? ''}
							placeholder="Tracking URL"
							class="rounded border border-slate-300 px-2 py-1 text-sm"
						/>
						<input
							name="notes"
							value={row.order.notes ?? ''}
							placeholder="Note"
							class="rounded border border-slate-300 px-2 py-1 text-sm"
						/>
						<button type="submit" class="rounded bg-slate-200 px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-300">
							Save
						</button>
					</form>
					{#if isPrize}
						<form method="POST" action="?/cancel" use:enhance>
							<input type="hidden" name="id" value={row.order.id} />
							<button type="submit" class="rounded bg-red-700 px-3 py-1.5 text-sm font-bold text-white hover:bg-red-600">Cancel</button>
						</form>
					{:else}
						<form method="POST" action="?/refund" use:enhance>
							<input type="hidden" name="id" value={row.order.id} />
							<button type="submit" class="rounded bg-red-700 px-3 py-1.5 text-sm font-bold text-white hover:bg-red-600">Refund</button>
						</form>
					{/if}
				</div>
			{/if}
		</div>
	{:else}
		<p class="rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-slate-500">
			No {data.status === 'all' ? '' : data.status} orders.
		</p>
	{/each}
</div>
