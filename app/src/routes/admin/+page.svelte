<script lang="ts">
	import { etDayLabel } from '$lib/camp-time';

	let { data } = $props();

	const cards = $derived([
		{ label: 'Campers', value: data.campers, href: '/admin/campers' },
		{ label: 'Pending reviews', value: data.pendingReviews, href: '/admin/reviews' },
		{ label: 'Pending orders', value: data.pendingOrders, href: '/admin/orders' }
	]);
</script>

<svelte:head><title>Admin — Summer Camp</title></svelte:head>

<h1 class="mb-6 text-2xl font-bold text-slate-800">Overview</h1>

<div class="grid gap-4 sm:grid-cols-3">
	{#each cards as card (card.label)}
		<a
			href={card.href}
			class="rounded-lg border border-slate-200 bg-white p-5 hover:border-slate-400"
		>
			<p class="text-sm text-slate-500">{card.label}</p>
			<p class="text-3xl font-bold text-slate-800 tabular-nums">{card.value}</p>
		</a>
	{/each}
</div>

<div class="mt-6 rounded-lg border border-slate-200 bg-white p-5">
	{#if data.today}
		<p class="text-sm text-slate-500">Today · {etDayLabel(data.today.day.date)}</p>
		<p class="text-lg font-bold text-slate-800">{data.today.day.title}</p>
		<p class="mt-1 text-slate-600">
			{data.today.entered} attendance {data.today.entered === 1 ? 'entry' : 'entries'} so far —
			<a href={`/admin/attendance/${data.today.day.id}`} class="text-blue-600 underline">
				enter hours
			</a>
		</p>
	{:else}
		<p class="text-slate-600">No camp day scheduled for today.</p>
	{/if}
</div>
