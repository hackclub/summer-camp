<script lang="ts">
	import { enhance } from '$app/forms';
	import { etDayLabel } from '$lib/camp-time';

	let { data, form } = $props();
</script>

<svelte:head><title>{data.camper.name ?? data.camper.email} — Summer Camp Admin</title></svelte:head
>

<h1 class="mb-1 text-2xl font-bold text-slate-800">{data.camper.name ?? data.camper.email}</h1>
<p class="mb-6 text-slate-600">
	{data.camper.email}
	· IDV {data.camper.identityVerified ? '✅' : '—'}
	· {data.balance} pts
	{#if data.camper.banned}· <span class="font-bold text-red-600">BANNED</span>{/if}
</p>

{#if form?.saved}
	<p class="mb-4 rounded bg-green-100 px-4 py-2 text-green-800">Saved.</p>
{/if}

<div class="mb-6 flex flex-wrap gap-3">
	<form method="POST" action="?/setRole" use:enhance>
		<input type="hidden" name="role" value={data.camper.role === 'admin' ? 'camper' : 'admin'} />
		<button
			type="submit"
			class="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100"
		>
			{data.camper.role === 'admin' ? 'Demote to camper' : 'Promote to admin'}
		</button>
	</form>
	<form
		method="POST"
		action="?/setBanned"
		use:enhance
		onsubmit={(e) => {
			if (!data.camper.banned && !confirm('Ban this camper? They will be logged out immediately.'))
				e.preventDefault();
		}}
	>
		<input type="hidden" name="banned" value={String(!data.camper.banned)} />
		<button
			type="submit"
			class="rounded border border-red-300 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
		>
			{data.camper.banned ? 'Unban' : 'Ban'}
		</button>
	</form>
</div>

<div class="grid gap-6 lg:grid-cols-2">
	<div>
		<h2 class="mb-2 font-bold text-slate-800">Adjust points</h2>
		<form
			method="POST"
			action="?/adjustPoints"
			class="mb-6 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-4"
		>
			<label class="text-sm text-slate-600">
				Amount (±)
				<input
					type="number"
					name="amount"
					required
					class="block w-28 rounded border border-slate-300 px-2 py-1"
				/>
			</label>
			<label class="flex-1 text-sm text-slate-600">
				Reason
				<input
					type="text"
					name="note"
					required
					class="block w-full rounded border border-slate-300 px-2 py-1"
				/>
			</label>
			<button
				type="submit"
				class="rounded bg-slate-800 px-4 py-1.5 text-sm font-bold text-white hover:bg-slate-700"
			>
				Apply
			</button>
			{#if form?.adjustInvalid}
				<p class="w-full text-sm font-bold text-red-700">Amount and reason are both required.</p>
			{/if}
		</form>

		<h2 class="mb-2 font-bold text-slate-800">Attendance</h2>
		<div class="rounded-lg border border-slate-200 bg-white">
			{#each data.hours as row, i (i)}
				<div
					class="flex justify-between border-b border-slate-100 px-4 py-1.5 text-sm last:border-b-0"
				>
					<span class="text-slate-700">{etDayLabel(row.date)} · {row.title}</span>
					<span class="tabular-nums">{Number(row.hours).toFixed(1)}h</span>
				</div>
			{:else}
				<p class="px-4 py-3 text-sm text-slate-500">No attendance yet.</p>
			{/each}
		</div>
	</div>

	<div>
		<h2 class="mb-2 font-bold text-slate-800">Projects</h2>
		<div class="mb-6 rounded-lg border border-slate-200 bg-white">
			{#each data.camperProjects as project (project.id)}
				<div
					class="flex justify-between border-b border-slate-100 px-4 py-1.5 text-sm last:border-b-0"
				>
					<span class="text-slate-700">{project.title}</span>
					<span class="text-slate-500">{project.status}</span>
				</div>
			{:else}
				<p class="px-4 py-3 text-sm text-slate-500">No projects.</p>
			{/each}
		</div>

		<h2 class="mb-2 font-bold text-slate-800">Points ledger (latest 50)</h2>
		<div class="rounded-lg border border-slate-200 bg-white">
			{#each data.ledger as tx (tx.id)}
				<div
					class="flex justify-between gap-2 border-b border-slate-100 px-4 py-1.5 text-sm last:border-b-0"
				>
					<span class="text-slate-700">{tx.kind}{tx.note ? ` — ${tx.note}` : ''}</span>
					<span class={['tabular-nums', tx.amount < 0 ? 'text-red-700' : 'text-green-700']}>
						{tx.amount > 0 ? '+' : ''}{tx.amount}
					</span>
				</div>
			{:else}
				<p class="px-4 py-3 text-sm text-slate-500">No transactions.</p>
			{/each}
		</div>
	</div>
</div>
