<script lang="ts">
	import { etDayLabel } from '$lib/camp-time';
	import { base } from '$app/paths';

	let { data } = $props();
</script>

<svelte:head><title>Attendance — Summer Camp Admin</title></svelte:head>

<h1 class="mb-6 text-2xl font-bold text-slate-800">Attendance</h1>

<div class="overflow-hidden rounded-lg border border-slate-200 bg-white">
	<table class="w-full text-left text-sm">
		<thead class="bg-slate-100 text-slate-600">
			<tr>
				<th class="px-4 py-2">Day</th>
				<th class="px-4 py-2">Session</th>
				<th class="px-4 py-2 text-right">Entries</th>
			</tr>
		</thead>
		<tbody>
			{#each data.days as day (day.id)}
				<tr class="border-t border-slate-100 hover:bg-slate-50">
					<td class="px-4 py-2">
						<a href={`${base}/admin/attendance/${day.id}`} class="text-blue-600 underline">
							{etDayLabel(day.date)}
						</a>
					</td>
					<td class="px-4 py-2 text-slate-700">{day.title}</td>
					<td class="px-4 py-2 text-right text-slate-700 tabular-nums">{day.entries}</td>
				</tr>
			{:else}
				<tr
					><td colspan="3" class="px-4 py-6 text-center text-slate-500">
						No camp days yet — <a href="{base}/admin/days" class="text-blue-600 underline">create them</a
						>.
					</td></tr
				>
			{/each}
		</tbody>
	</table>
</div>
