<script lang="ts">
	let { data } = $props();
</script>

<svelte:head><title>Review · {data.project.title} — Summer Camp Admin</title></svelte:head>

<h1 class="mb-1 text-2xl font-bold text-slate-800">{data.project.title}</h1>
<p class="mb-6 text-slate-600">
	by {data.camper.name ?? data.camper.email}
	· IDV {data.camper.identityVerified ? '✅ verified' : '❌ not verified'}
</p>

<div class="grid gap-6 lg:grid-cols-2">
	<div class="flex flex-col gap-4">
		{#if data.project.screenshotUrl}
			<img
				src={data.project.screenshotUrl}
				alt="Screenshot"
				class="rounded-lg border border-slate-200"
			/>
		{/if}
		<div class="rounded-lg border border-slate-200 bg-white p-4">
			<h2 class="mb-2 font-bold text-slate-800">Description</h2>
			<p class="whitespace-pre-line text-slate-700">{data.project.description ?? '—'}</p>
		</div>
		<div class="rounded-lg border border-slate-200 bg-white p-4 text-sm">
			<p>
				Code: <a
					href={data.project.githubUrl}
					target="_blank"
					rel="noopener"
					class="text-blue-600 underline">{data.project.githubUrl}</a
				>
			</p>
			<p>
				Demo: <a
					href={data.project.playableUrl}
					target="_blank"
					rel="noopener"
					class="text-blue-600 underline">{data.project.playableUrl}</a
				>
			</p>
		</div>
	</div>

	<div class="flex flex-col gap-4">
		<div class="rounded-lg border border-slate-200 bg-white p-4 text-sm">
			<h2 class="mb-2 font-bold text-slate-800">Review status</h2>
			<p class="mb-3 text-slate-600">
				Reviews are handled by <strong>Ari</strong>. Decisions arrive automatically and update the
				status below — there's nothing to approve here. Approval awards +{data.shipBonus} pts and pushes
				the record to the Unified YSWS DB.
			</p>
			<dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
				<dt class="text-slate-500">Status</dt>
				<dd class="font-bold text-slate-800">{data.project.status}</dd>
				<dt class="text-slate-500">Ari state</dt>
				<dd class="font-bold text-slate-800">{data.project.ariStatus ?? '—'}</dd>
				{#if data.project.ariId}
					<dt class="text-slate-500">Ari ID</dt>
					<dd class="text-slate-800">{data.project.ariId}</dd>
				{/if}
			</dl>
			{#if data.project.ariError}
				<p class="mt-3 rounded bg-red-50 px-3 py-2 text-red-700">
					Last ingest error: {data.project.ariError}
				</p>
			{/if}
		</div>
	</div>
</div>
