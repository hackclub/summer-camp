<script lang="ts">
	let { data, form } = $props();

	const result = $derived(form?.result ?? data.lastSync);
</script>

<svelte:head><title>Airtable sync — Summer Camp Admin</title></svelte:head>

<h1 class="mb-2 text-2xl font-bold text-slate-800">Airtable sync</h1>
<p class="mb-6 max-w-xl text-slate-600">
	Pushes attendance hours (camper roster) and approved projects to the Unified YSWS base. Runs
	automatically every 5 minutes in production; use this to force a run after fixing data.
</p>

<form method="POST" class="mb-6">
	<button
		type="submit"
		class="rounded bg-slate-800 px-5 py-2 font-bold text-white hover:bg-slate-700"
	>
		Sync now
	</button>
</form>

{#if result}
	<div class="max-w-xl rounded-lg border border-slate-200 bg-white p-4">
		<p class="mb-2 text-sm text-slate-500">Last run: {result.ranAt}</p>
		<p class="text-slate-700">
			Roster records synced: <strong>{result.rosterSynced}</strong> · Projects synced:
			<strong>{result.projectsSynced}</strong>
		</p>
		{#if result.errors.length > 0}
			<div class="mt-3 rounded bg-red-50 p-3">
				<p class="mb-1 font-bold text-red-800">Errors</p>
				<ul class="list-inside list-disc text-sm text-red-700">
					{#each result.errors as err, i (i)}
						<li>{err}</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
{:else}
	<p class="text-slate-500">No sync has run yet this boot.</p>
{/if}
