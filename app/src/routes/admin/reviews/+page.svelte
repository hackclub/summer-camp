<script lang="ts">
	let { data } = $props();
</script>

<svelte:head><title>Reviews — Summer Camp Admin</title></svelte:head>

<h1 class="mb-6 text-2xl font-bold text-slate-800">Review queue</h1>

{#if data.queue.length === 0}
	<p class="rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-slate-500">
		All caught up.
	</p>
{:else}
	<div class="overflow-hidden rounded-lg border border-slate-200 bg-white">
		<table class="w-full text-left text-sm">
			<thead class="bg-slate-100 text-slate-600">
				<tr>
					<th class="px-4 py-2">Project</th>
					<th class="px-4 py-2">Camper</th>
					<th class="px-4 py-2">IDV</th>
					<th class="px-4 py-2">Shipped</th>
				</tr>
			</thead>
			<tbody>
				{#each data.queue as item (item.id)}
					<tr class="border-t border-slate-100 hover:bg-slate-50">
						<td class="px-4 py-2">
							<a href={`/admin/reviews/${item.id}`} class="text-blue-600 underline">{item.title}</a>
						</td>
						<td class="px-4 py-2 text-slate-700">{item.camperName ?? item.camperEmail}</td>
						<td class="px-4 py-2">{item.identityVerified ? '✅' : '❌'}</td>
						<td class="px-4 py-2 text-slate-500">
							{item.shippedAt ? new Date(item.shippedAt).toLocaleString() : '—'}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
