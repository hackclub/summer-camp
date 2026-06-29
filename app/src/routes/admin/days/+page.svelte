<script lang="ts">
	import { enhance } from '$app/forms';
	import { etDayLabel } from '$lib/camp-time';
	import { base } from '$app/paths';

	let { data, form } = $props();
</script>

<svelte:head><title>Camp days — Summer Camp Admin</title></svelte:head>

<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
	<h1 class="text-2xl font-bold text-slate-800">Camp days</h1>
	{#if data.days.length === 0}
		<form method="POST" action="?/seed" use:enhance>
			<button
				type="submit"
				class="rounded bg-slate-800 px-4 py-2 font-bold text-white hover:bg-slate-700"
			>
				Seed Jun 23 – Jul 17 weekdays
			</button>
		</form>
	{/if}
</div>

{#if form?.seeded}
	<p class="mb-4 rounded bg-green-100 px-4 py-2 text-green-800">Seeded {form.seeded} camp days.</p>
{/if}

<form
	method="POST"
	action="?/create"
	class="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4"
>
	<label class="text-sm text-slate-600">
		Date
		<input
			type="date"
			name="date"
			required
			class="block rounded border border-slate-300 px-2 py-1"
		/>
	</label>
	<label class="flex-1 text-sm text-slate-600">
		Title
		<input
			type="text"
			name="title"
			required
			placeholder="Build your first game"
			class="block w-full rounded border border-slate-300 px-2 py-1"
		/>
	</label>
	<button
		type="submit"
		class="rounded bg-slate-800 px-4 py-1.5 font-bold text-white hover:bg-slate-700"
	>
		Add day
	</button>
</form>

<div class="overflow-hidden rounded-lg border border-slate-200 bg-white">
	<table class="w-full text-left text-sm">
		<thead class="bg-slate-100 text-slate-600">
			<tr>
				<th class="px-4 py-2">Date</th>
				<th class="px-4 py-2">Title</th>
				<th class="px-4 py-2">Links</th>
				<th class="px-4 py-2">Published</th>
			</tr>
		</thead>
		<tbody>
			{#each data.days as day (day.id)}
				<tr class="border-t border-slate-100">
					<td class="px-4 py-2 whitespace-nowrap text-slate-700">{etDayLabel(day.date)}</td>
					<td class="px-4 py-2">
						<a href={`${base}/admin/days/${day.id}`} class="text-blue-600 underline">{day.title}</a>
					</td>
					<td class="px-4 py-2 text-xs text-slate-500">
						{day.joinUrl ? '📞 call' : '⚠️ no call link'}
						{day.recordingUrl ? ' · 🎬 recording' : ''}
					</td>
					<td class="px-4 py-2">
						<form method="POST" action="?/togglePublish" use:enhance>
							<input type="hidden" name="id" value={day.id} />
							<input type="hidden" name="published" value={String(!day.published)} />
							<button
								type="submit"
								class={[
									'rounded px-2 py-0.5 text-xs font-bold',
									day.published ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'
								]}
							>
								{day.published ? 'Published' : 'Draft'}
							</button>
						</form>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
