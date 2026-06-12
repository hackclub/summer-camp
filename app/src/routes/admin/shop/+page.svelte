<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let editing = $state<string | null>(null);
</script>

<svelte:head><title>Shop items — Summer Camp Admin</title></svelte:head>

<h1 class="mb-6 text-2xl font-bold text-slate-800">Shop items</h1>

{#if form?.saved}
	<p class="mb-4 rounded bg-green-100 px-4 py-2 text-green-800">Saved.</p>
{/if}
{#if form?.invalid}
	<p class="mb-4 rounded bg-red-100 px-4 py-2 text-red-800">Check the fields and try again.</p>
{/if}

{#snippet itemFields(item: (typeof data.items)[number] | null)}
	<div class="grid gap-3 sm:grid-cols-2">
		<label class="text-sm text-slate-600">
			Name
			<input
				type="text"
				name="name"
				value={item?.name ?? ''}
				required
				class="block w-full rounded border border-slate-300 px-2 py-1"
			/>
		</label>
		<label class="text-sm text-slate-600">
			Image URL
			<input
				type="url"
				name="imageUrl"
				value={item?.imageUrl ?? ''}
				class="block w-full rounded border border-slate-300 px-2 py-1"
			/>
		</label>
		<label class="text-sm text-slate-600">
			Price (points)
			<input
				type="number"
				name="pricePoints"
				value={item?.pricePoints ?? 100}
				min="1"
				required
				class="block w-full rounded border border-slate-300 px-2 py-1"
			/>
		</label>
		<label class="text-sm text-slate-600">
			Stock (blank = unlimited)
			<input
				type="number"
				name="stock"
				value={item?.stock ?? ''}
				min="0"
				class="block w-full rounded border border-slate-300 px-2 py-1"
			/>
		</label>
		<label class="text-sm text-slate-600 sm:col-span-2">
			Description
			<textarea
				name="description"
				rows="2"
				class="block w-full rounded border border-slate-300 px-2 py-1"
				>{item?.description ?? ''}</textarea
			>
		</label>
		<label class="flex items-center gap-2 text-sm text-slate-600">
			<input
				type="checkbox"
				name="requiresAddress"
				value="true"
				checked={item?.requiresAddress ?? true}
			/>
			Needs a shipping address (physical prize)
		</label>
		<label class="text-sm text-slate-600">
			Sort order
			<input
				type="number"
				name="sort"
				value={item?.sort ?? 0}
				class="block w-24 rounded border border-slate-300 px-2 py-1"
			/>
		</label>
	</div>
{/snippet}

<details class="mb-6 rounded-lg border border-slate-200 bg-white p-4">
	<summary class="cursor-pointer font-bold text-slate-800">+ New item</summary>
	<form method="POST" action="?/create" class="mt-3">
		{@render itemFields(null)}
		<button
			type="submit"
			class="mt-3 rounded bg-slate-800 px-4 py-1.5 font-bold text-white hover:bg-slate-700"
		>
			Create
		</button>
	</form>
</details>

<div class="flex flex-col gap-3">
	{#each data.items as item (item.id)}
		<div class="rounded-lg border border-slate-200 bg-white p-4">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<div class="flex items-center gap-3">
					{#if item.imageUrl}
						<img src={item.imageUrl} alt="" class="size-10 rounded object-cover" />
					{/if}
					<div>
						<span class="font-bold text-slate-800">{item.name}</span>
						<span class="ml-2 text-sm text-slate-500 tabular-nums">
							{item.pricePoints} pts · stock {item.stock ?? '∞'}
						</span>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<form method="POST" action="?/toggleActive" use:enhance>
						<input type="hidden" name="id" value={item.id} />
						<input type="hidden" name="active" value={String(!item.active)} />
						<button
							type="submit"
							class={[
								'rounded px-2 py-0.5 text-xs font-bold',
								item.active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'
							]}
						>
							{item.active ? 'Active' : 'Hidden'}
						</button>
					</form>
					<button
						type="button"
						class="text-sm text-blue-600 underline"
						onclick={() => (editing = editing === item.id ? null : item.id)}
					>
						{editing === item.id ? 'Close' : 'Edit'}
					</button>
				</div>
			</div>
			{#if editing === item.id}
				<form method="POST" action="?/update" class="mt-4 border-t border-slate-100 pt-4">
					<input type="hidden" name="id" value={item.id} />
					{@render itemFields(item)}
					<button
						type="submit"
						class="mt-3 rounded bg-slate-800 px-4 py-1.5 font-bold text-white hover:bg-slate-700"
					>
						Save
					</button>
				</form>
			{/if}
		</div>
	{:else}
		<p class="rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-slate-500">
			No items yet — add the first prize above.
		</p>
	{/each}
</div>
