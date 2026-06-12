<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
</script>

<svelte:head><title>Announcements — Summer Camp Admin</title></svelte:head>

<h1 class="mb-6 text-2xl font-bold text-slate-800">Announcements</h1>

{#if form?.saved}
	<p class="mb-4 rounded bg-green-100 px-4 py-2 text-green-800">Saved.</p>
{/if}

<form
	method="POST"
	action="?/create"
	class="mb-6 flex max-w-xl flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4"
>
	<label class="text-sm text-slate-600">
		Title
		<input
			type="text"
			name="title"
			required
			class="block w-full rounded border border-slate-300 px-2 py-1"
		/>
	</label>
	<label class="text-sm text-slate-600">
		Body
		<textarea
			name="body"
			rows="3"
			required
			class="block w-full rounded border border-slate-300 px-2 py-1"
		></textarea>
	</label>
	<div>
		<button
			type="submit"
			class="rounded bg-slate-800 px-4 py-1.5 font-bold text-white hover:bg-slate-700"
		>
			Post
		</button>
		<span class="ml-2 text-xs text-slate-500">Shows on every camper's dashboard.</span>
	</div>
</form>

<div class="flex max-w-xl flex-col gap-3">
	{#each data.items as item (item.id)}
		<div class="rounded-lg border border-slate-200 bg-white p-4">
			<div class="flex items-start justify-between gap-2">
				<div>
					<h3 class="font-bold text-slate-800">{item.title}</h3>
					<p class="text-sm whitespace-pre-line text-slate-600">{item.body}</p>
					<p class="mt-1 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
				</div>
				<div class="flex shrink-0 gap-2">
					<form method="POST" action="?/togglePublish" use:enhance>
						<input type="hidden" name="id" value={item.id} />
						<input type="hidden" name="published" value={String(!item.published)} />
						<button
							type="submit"
							class={[
								'rounded px-2 py-0.5 text-xs font-bold',
								item.published ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'
							]}
						>
							{item.published ? 'Live' : 'Hidden'}
						</button>
					</form>
					<form method="POST" action="?/remove" use:enhance>
						<input type="hidden" name="id" value={item.id} />
						<button type="submit" class="text-sm text-red-600 hover:underline">Delete</button>
					</form>
				</div>
			</div>
		</div>
	{:else}
		<p class="rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-slate-500">
			Nothing posted yet.
		</p>
	{/each}
</div>
