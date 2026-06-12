<script lang="ts">
	let { data, form } = $props();
</script>

<svelte:head><title>Review · {data.project.title} — Summer Camp Admin</title></svelte:head>

<h1 class="mb-1 text-2xl font-bold text-slate-800">{data.project.title}</h1>
<p class="mb-6 text-slate-600">
	by {data.camper.name ?? data.camper.email}
	· IDV {data.camper.identityVerified ? '✅ verified' : '❌ not verified'}
</p>

{#if form?.notPending}
	<p class="mb-4 rounded bg-yellow-100 px-4 py-2 text-yellow-800">
		This project isn't pending review (someone may have just handled it).
	</p>
{/if}

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
		<form
			method="POST"
			action="?/approve"
			class="rounded-lg border border-green-200 bg-green-50 p-4"
		>
			<h2 class="mb-2 font-bold text-green-800">Approve (+{data.shipBonus} pts)</h2>
			<textarea
				name="feedback"
				rows="2"
				placeholder="Optional note to the camper"
				class="mb-3 block w-full rounded border border-slate-300 px-2 py-1"
			></textarea>
			<button
				type="submit"
				class="rounded bg-green-700 px-5 py-2 font-bold text-white hover:bg-green-600"
			>
				Approve
			</button>
		</form>

		<form method="POST" action="?/reject" class="rounded-lg border border-red-200 bg-red-50 p-4">
			<h2 class="mb-2 font-bold text-red-800">Request changes</h2>
			{#if form?.feedbackRequired}
				<p class="mb-2 text-sm font-bold text-red-700">
					Feedback is required so the camper knows what to fix.
				</p>
			{/if}
			<textarea
				name="feedback"
				rows="3"
				required
				placeholder="What should they fix before re-shipping?"
				class="mb-3 block w-full rounded border border-slate-300 px-2 py-1"
			></textarea>
			<button
				type="submit"
				class="rounded bg-red-700 px-5 py-2 font-bold text-white hover:bg-red-600"
			>
				Send back
			</button>
		</form>
	</div>
</div>
