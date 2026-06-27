<script lang="ts">
	import PageHeader from '$lib/components/theme/PageHeader.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let { data } = $props();

	// Show only a first name publicly.
	const firstName = (name: string | null) => name?.split(' ')[0] ?? 'A camper';
</script>

<svelte:head><title>Gallery — Hack Club Summer Camp</title></svelte:head>

<PageHeader title="The gallery" subtitle="Real projects, built at camp" />

<form method="GET" class="mx-auto mb-6 flex max-w-md flex-col gap-2 sm:flex-row">
	<input
		type="search"
		name="q"
		value={data.q}
		placeholder="Search projects..."
		class="min-w-0 flex-1 rounded-xl border-4 border-wood bg-peach px-4 py-2 text-wood-dark placeholder-tan focus:ring-4 focus:ring-grass/50 focus:outline-none"
	/>
	<Button type="submit" variant="secondary">Search</Button>
</form>

{#if data.gallery.length === 0}
	<EmptyState
		title={data.q ? 'Nothing matched' : 'Nothing here... yet'}
		body={data.q
			? 'Try a different search?'
			: 'Projects will appear here once campers start shipping. Yours could be first!'}
		actionLabel="Submit a project"
		actionHref="/submit"
	/>
{:else}
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.gallery as project (project.id)}
			<a
				href={`/gallery/${project.id}`}
				class="rounded-2xl border-4 border-wood bg-cream p-4 transition hover:border-dashed"
			>
				{#if project.screenshotUrl}
					<img
						src={project.screenshotUrl}
						alt={project.title}
						class="mb-3 h-40 w-full rounded-xl border-2 border-tan object-cover"
						loading="lazy"
					/>
				{:else}
					<div class="mb-3 h-40 w-full rounded-xl bg-tan"></div>
				{/if}
				<h3 class="font-bold text-wood-dark">{project.title}</h3>
				<p class="text-sm text-wood">by {firstName(project.authorName)}</p>
			</a>
		{/each}
	</div>

	<div class="mt-6 flex justify-center gap-3">
		{#if data.page > 1}
			<Button
				href={`/gallery?q=${encodeURIComponent(data.q)}&page=${data.page - 1}`}
				variant="secondary"
				size="sm"
			>
				← Newer
			</Button>
		{/if}
		{#if data.hasMore}
			<Button
				href={`/gallery?q=${encodeURIComponent(data.q)}&page=${data.page + 1}`}
				variant="secondary"
				size="sm"
			>
				Older →
			</Button>
		{/if}
	</div>
{/if}
