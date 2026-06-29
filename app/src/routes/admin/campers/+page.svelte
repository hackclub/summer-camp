<script lang="ts">
	import { base } from '$app/paths';

	let { data } = $props();
</script>

<svelte:head><title>Campers — Summer Camp Admin</title></svelte:head>

<h1 class="mb-4 text-2xl font-bold text-slate-800">Campers</h1>

<form method="GET" class="mb-4 flex max-w-sm gap-2">
	<input
		type="search"
		name="q"
		value={data.q}
		placeholder="Search by name or email"
		class="w-full rounded border border-slate-300 px-3 py-1.5"
	/>
	<button
		type="submit"
		class="rounded bg-slate-800 px-4 py-1.5 text-sm font-bold text-white hover:bg-slate-700"
	>
		Search
	</button>
</form>

<div class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
	<table class="w-full text-left text-sm">
		<thead class="bg-slate-100 text-slate-600">
			<tr>
				<th class="px-4 py-2">Camper</th>
				<th class="px-4 py-2">IDV</th>
				<th class="px-4 py-2 text-right">Hours</th>
				<th class="px-4 py-2 text-right">Points</th>
				<th class="px-4 py-2">Role</th>
			</tr>
		</thead>
		<tbody>
			{#each data.campers as camper (camper.id)}
				<tr class={['border-t border-slate-100 hover:bg-slate-50', camper.banned && 'opacity-50']}>
					<td class="px-4 py-2">
						<a href={`${base}/admin/campers/${camper.id}`} class="text-blue-600 underline">
							{camper.name ?? camper.email}
						</a>
						{#if camper.name}<span class="ml-1 text-xs text-slate-400">{camper.email}</span>{/if}
						{#if camper.banned}<span class="ml-1 text-xs font-bold text-red-600">BANNED</span>{/if}
					</td>
					<td class="px-4 py-2">{camper.identityVerified ? '✅' : '—'}</td>
					<td class="px-4 py-2 text-right tabular-nums">{Number(camper.totalHours).toFixed(1)}</td>
					<td class="px-4 py-2 text-right tabular-nums">{camper.points}</td>
					<td class="px-4 py-2">{camper.role}</td>
				</tr>
			{:else}
				<tr><td colspan="5" class="px-4 py-6 text-center text-slate-500">No campers found.</td></tr>
			{/each}
		</tbody>
	</table>
</div>
