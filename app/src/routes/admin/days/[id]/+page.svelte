<script lang="ts">
	import { etDayLabel } from '$lib/camp-time';

	let { data, form } = $props();
</script>

<svelte:head><title>{data.day.title} — Summer Camp Admin</title></svelte:head>

<h1 class="mb-1 text-2xl font-bold text-slate-800">{etDayLabel(data.day.date)}</h1>
<p class="mb-6 text-slate-500">{data.day.date} · 12:00–3:00 PM ET</p>

{#if form?.saved}
	<p class="mb-4 rounded bg-green-100 px-4 py-2 text-green-800">Saved.</p>
{/if}
{#if form?.invalid || form?.materialInvalid}
	<p class="mb-4 rounded bg-red-100 px-4 py-2 text-red-800">Check the fields and try again.</p>
{/if}

<form
	method="POST"
	action="?/update"
	class="mb-8 flex max-w-xl flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4"
>
	<label class="text-sm text-slate-600">
		Title
		<input
			type="text"
			name="title"
			value={data.day.title}
			required
			class="block w-full rounded border border-slate-300 px-2 py-1"
		/>
	</label>
	<label class="text-sm text-slate-600">
		Description (what we're doing)
		<textarea
			name="description"
			rows="4"
			class="block w-full rounded border border-slate-300 px-2 py-1"
			>{data.day.description ?? ''}</textarea
		>
	</label>
	<label class="text-sm text-slate-600">
		Call / join URL
		<input
			type="url"
			name="joinUrl"
			value={data.day.joinUrl ?? ''}
			placeholder="https://zoom.us/..."
			class="block w-full rounded border border-slate-300 px-2 py-1"
		/>
	</label>
	<label class="text-sm text-slate-600">
		Recording URL (paste after the session)
		<input
			type="url"
			name="recordingUrl"
			value={data.day.recordingUrl ?? ''}
			placeholder="https://youtube.com/..."
			class="block w-full rounded border border-slate-300 px-2 py-1"
		/>
	</label>
	<div>
		<button
			type="submit"
			class="rounded bg-slate-800 px-4 py-1.5 font-bold text-white hover:bg-slate-700">Save</button
		>
	</div>
</form>

<h2 class="mb-3 text-lg font-bold text-slate-800">Materials</h2>

<div class="mb-4 max-w-xl rounded-lg border border-slate-200 bg-white">
	{#each data.materials as material (material.id)}
		<div
			class="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2 last:border-b-0"
		>
			<div>
				<span class="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500"
					>{material.kind}</span
				>
				<a href={material.url} target="_blank" rel="noopener" class="ml-1 text-blue-600 underline"
					>{material.title}</a
				>
			</div>
			<form method="POST" action="?/removeMaterial">
				<input type="hidden" name="id" value={material.id} />
				<button type="submit" class="text-sm text-red-600 hover:underline">Remove</button>
			</form>
		</div>
	{:else}
		<p class="px-4 py-3 text-sm text-slate-500">No materials yet.</p>
	{/each}
</div>

<form
	method="POST"
	action="?/addMaterial"
	class="flex max-w-xl flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4"
>
	<label class="text-sm text-slate-600">
		Title
		<input
			type="text"
			name="title"
			required
			class="block rounded border border-slate-300 px-2 py-1"
		/>
	</label>
	<label class="flex-1 text-sm text-slate-600">
		URL
		<input
			type="url"
			name="url"
			required
			class="block w-full rounded border border-slate-300 px-2 py-1"
		/>
	</label>
	<label class="text-sm text-slate-600">
		Kind
		<select name="kind" class="block rounded border border-slate-300 px-2 py-1">
			<option value="link">Link</option>
			<option value="slides">Slides</option>
			<option value="starter">Starter code</option>
		</select>
	</label>
	<button
		type="submit"
		class="rounded bg-slate-800 px-4 py-1.5 font-bold text-white hover:bg-slate-700">Add</button
	>
</form>

<form
	method="POST"
	action="?/remove"
	class="mt-8"
	onsubmit={(e) => {
		if (!confirm('Delete this camp day? Attendance for it will be removed too.'))
			e.preventDefault();
	}}
>
	<button type="submit" class="text-sm text-red-600 hover:underline">Delete this camp day</button>
</form>
