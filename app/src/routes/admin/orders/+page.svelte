<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Address } from '$lib/types';

	let { data } = $props();

	const tabs = ['pending', 'fulfilled', 'rejected', 'all'];

	const formatAddress = (a: Address | null) =>
		a
			? [a.line1, a.line2, `${a.city}, ${a.state} ${a.zip}`, a.country].filter(Boolean).join(', ')
			: '—';
</script>

<svelte:head><title>Orders — Summer Camp Admin</title></svelte:head>

<h1 class="mb-4 text-2xl font-bold text-slate-800">Orders</h1>

<div class="mb-4 flex gap-2">
	{#each tabs as tab (tab)}
		<a
			href={`/admin/orders?status=${tab}`}
			class={[
				'rounded px-3 py-1 text-sm capitalize',
				data.status === tab
					? 'bg-slate-800 text-white'
					: 'bg-white text-slate-600 hover:bg-slate-100'
			]}
		>
			{tab}
		</a>
	{/each}
</div>

<div class="flex flex-col gap-3">
	{#each data.rows as row (row.order.id)}
		<div class="rounded-lg border border-slate-200 bg-white p-4">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p class="font-bold text-slate-800">{row.itemName}</p>
					<p class="text-sm text-slate-600">
						{row.camperName ?? row.camperEmail} · {row.order.pricePoints} pts ·
						{new Date(row.order.createdAt).toLocaleString()}
					</p>
					<p class="mt-1 text-sm text-slate-500">{formatAddress(row.order.address)}</p>
				</div>
				{#if row.order.status === 'pending'}
					<div class="flex gap-2">
						<form method="POST" action="?/fulfill" use:enhance>
							<input type="hidden" name="id" value={row.order.id} />
							<button
								type="submit"
								class="rounded bg-green-700 px-3 py-1.5 text-sm font-bold text-white hover:bg-green-600"
							>
								Fulfilled
							</button>
						</form>
						<form method="POST" action="?/reject" use:enhance>
							<input type="hidden" name="id" value={row.order.id} />
							<button
								type="submit"
								class="rounded bg-red-700 px-3 py-1.5 text-sm font-bold text-white hover:bg-red-600"
							>
								Reject + refund
							</button>
						</form>
					</div>
				{:else}
					<span class="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 uppercase">
						{row.order.status}
					</span>
				{/if}
			</div>
		</div>
	{:else}
		<p class="rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-slate-500">
			No {data.status === 'all' ? '' : data.status} orders.
		</p>
	{/each}
</div>
