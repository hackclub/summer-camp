<script lang="ts">
	import { enhance } from '$app/forms';
	import { etDayLabel } from '$lib/camp-time';

	let { data, form } = $props();
</script>

<svelte:head><title>Attendance · {data.day.title} — Summer Camp Admin</title></svelte:head>

<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
	<div>
		<h1 class="text-2xl font-bold text-slate-800">{etDayLabel(data.day.date)}</h1>
		<p class="text-slate-600">{data.day.title}</p>
	</div>
	<form method="POST" action="?/markAll" use:enhance>
		<button
			type="submit"
			class="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
		>
			Mark everyone 3.0h
		</button>
	</form>
</div>

{#if form?.saved}
	<p class="mb-4 rounded bg-green-100 px-4 py-2 text-green-800">Saved {form.count} entries.</p>
{/if}
{#if form?.invalid}
	<p class="mb-4 rounded bg-red-100 px-4 py-2 text-red-800">
		Hours must be a number between 0 and 3.5.
	</p>
{/if}

<form method="POST" action="?/save">
	<div class="overflow-hidden rounded-lg border border-slate-200 bg-white">
		<table class="w-full text-left text-sm">
			<thead class="bg-slate-100 text-slate-600">
				<tr>
					<th class="px-4 py-2">Camper</th>
					<th class="w-32 px-4 py-2">Hours (0–3.5)</th>
				</tr>
			</thead>
			<tbody>
				{#each data.campers as camper (camper.id)}
					<tr class="border-t border-slate-100">
						<td class="px-4 py-1.5">
							<span class="font-medium text-slate-800">{camper.name ?? camper.email}</span>
							{#if camper.name}
								<span class="ml-1 text-xs text-slate-400">{camper.email}</span>
							{/if}
						</td>
						<td class="px-4 py-1.5">
							<input
								type="number"
								name={`hours_${camper.id}`}
								value={camper.hours ?? ''}
								min="0"
								max="3.5"
								step="0.5"
								class="w-24 rounded border border-slate-300 px-2 py-1 tabular-nums"
							/>
						</td>
					</tr>
				{:else}
					<tr><td colspan="2" class="px-4 py-6 text-center text-slate-500">No campers yet.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
	<div class="mt-4">
		<button
			type="submit"
			class="rounded bg-slate-800 px-5 py-2 font-bold text-white hover:bg-slate-700"
		>
			Save all
		</button>
		<span class="ml-2 text-sm text-slate-500">Blank = absent. Tab down the column, type, save.</span
		>
	</div>
</form>
