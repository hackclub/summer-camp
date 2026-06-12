<script lang="ts">
	import PageHeader from '$lib/components/theme/PageHeader.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';

	let { data } = $props();
</script>

<svelte:head><title>My projects — Hack Club Summer Camp</title></svelte:head>

<PageHeader title="My projects" />

<div class="mb-6 text-center">
	<Button href="/projects/new">+ New project</Button>
</div>

{#if data.myProjects.length === 0}
	<EmptyState
		title="No projects yet"
		body="Every great camper starts somewhere. Start building and ship it for points!"
		actionLabel="Start your first project"
		actionHref="/projects/new"
	/>
{:else}
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.myProjects as project (project.id)}
			<a
				href={`/projects/${project.id}/edit`}
				class="rounded-2xl border-4 border-wood bg-cream p-4 transition hover:border-dashed"
			>
				{#if project.screenshotUrl}
					<img
						src={project.screenshotUrl}
						alt=""
						class="mb-3 h-32 w-full rounded-xl border-2 border-tan object-cover"
					/>
				{:else}
					<div class="mb-3 h-32 w-full rounded-xl bg-tan"></div>
				{/if}
				<div class="flex items-center justify-between gap-2">
					<h3 class="font-bold text-wood-dark">{project.title}</h3>
					<Badge status={project.status} />
				</div>
				{#if project.status === 'submitted'}
					<p class="mt-1 text-xs text-wood-dark">+50 pts pending review</p>
				{/if}
			</a>
		{/each}
	</div>
{/if}
