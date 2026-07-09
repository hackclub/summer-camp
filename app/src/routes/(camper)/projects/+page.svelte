<script lang="ts">
	import PageHeader from '$lib/components/theme/PageHeader.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { base } from '$app/paths';

	let { data } = $props();
</script>

<svelte:head><title>My projects — Hack Club Summer Camp</title></svelte:head>

<PageHeader title="My projects" subtitle="Everything you've shipped" />

{#if data.myProjects.length === 0}
	<EmptyState
		title="Nothing shipped yet"
		body="Projects show up here once you submit them for review. Head to Submit to ship a lesson's project!"
		actionLabel="Go to Submit"
		actionHref={`${base}/submit`}
	/>
{:else}
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.myProjects as project (project.id)}
			<a
				href={`${base}/projects/${project.id}/edit`}
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
				{#if project.status === 'submitted' && project.rewardPoints && project.rewardPoints > 0}
					<p class="mt-1 text-xs text-wood-dark">+{project.rewardPoints} Stardust pending review</p>
				{/if}
			</a>
		{/each}
	</div>
{/if}
