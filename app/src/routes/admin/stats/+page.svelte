<script lang="ts">
	let { data } = $props();
	const max = $derived(Math.max(1, ...data.funnel.map((f) => f.value)));
</script>

<svelte:head><title>Stats — Summer Camp Admin</title></svelte:head>

<h1 class="mb-6 text-2xl font-bold text-slate-800">Stats</h1>

<div class="mb-8 max-w-xl">
	<h2 class="mb-3 text-lg font-bold text-slate-800">Funnel</h2>
	<div class="flex flex-col gap-2">
		{#each data.funnel as step (step.label)}
			<div class="flex items-center gap-3">
				<span class="w-40 text-sm text-slate-600">{step.label}</span>
				<div class="h-6 flex-1 overflow-hidden rounded bg-slate-100">
					<div
						class="flex h-full items-center justify-end rounded bg-slate-700 px-2 text-xs font-bold text-white"
						style:width={`${Math.max(6, (step.value / max) * 100)}%`}
					>
						{step.value}
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>

<div class="mb-8 grid max-w-xl grid-cols-3 gap-3">
	<div class="rounded-lg border border-slate-200 bg-white p-4">
		<p class="text-xs text-slate-500 uppercase">Attendance hours</p>
		<p class="text-2xl font-bold text-slate-800 tabular-nums">{data.attendanceHours}</p>
	</div>
	<div class="rounded-lg border border-slate-200 bg-white p-4">
		<p class="text-xs text-slate-500 uppercase">Points earned</p>
		<p class="text-2xl font-bold text-green-700 tabular-nums">{data.pointsEarned}</p>
	</div>
	<div class="rounded-lg border border-slate-200 bg-white p-4">
		<p class="text-xs text-slate-500 uppercase">Points spent</p>
		<p class="text-2xl font-bold text-red-700 tabular-nums">{data.pointsSpent}</p>
	</div>
</div>

<div class="max-w-xl">
	<h2 class="mb-3 text-lg font-bold text-slate-800">Orders by status</h2>
	{#if data.ordersByStatus.length === 0}
		<p class="text-sm text-slate-500">No orders yet.</p>
	{:else}
		<div class="flex flex-wrap gap-2">
			{#each data.ordersByStatus as o (o.status)}
				<span class="rounded bg-slate-100 px-3 py-1 text-sm text-slate-700">
					<span class="font-bold tabular-nums">{o.n}</span>
					{o.status}
				</span>
			{/each}
		</div>
	{/if}
</div>
