<script lang="ts">
	import SessionHero from '$lib/components/today/SessionHero.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { Coins } from 'lucide-svelte';

	let { data } = $props();
</script>

<svelte:head><title>Today — Hack Club Summer Camp</title></svelte:head>

<div class="flex flex-col gap-6">
	<SessionHero days={data.days} />

	<div class="grid gap-6 sm:grid-cols-3">
		<div class="sm:col-span-2">
			{#if data.announcements.length > 0}
				<Card title="Announcements">
					<div class="flex flex-col gap-4">
						{#each data.announcements as a (a.id)}
							<div class="border-b-2 border-tan pb-3 last:border-b-0 last:pb-0">
								<h3 class="font-bold text-wood-dark">{a.title}</h3>
								<p class="text-sm whitespace-pre-line text-wood-dark">{a.body}</p>
							</div>
						{/each}
					</div>
				</Card>
			{/if}
		</div>

		<Card title="My points">
			<div class="flex items-center gap-2">
				<Coins class="size-8 text-wood" />
				<span class="text-3xl font-bold text-wood-dark tabular-nums">{data.balance}</span>
			</div>
			<p class="mt-2 text-sm text-wood-dark">
				Earn points by showing up to camp and shipping projects.
			</p>
			<div class="mt-4">
				<Button href="/shop" variant="secondary" size="sm">Visit the shop</Button>
			</div>
		</Card>
	</div>

	<Card title="My projects">
		{#if data.myProjects.length === 0}
			<p class="mb-4 text-wood-dark">No projects yet — every great camper starts somewhere!</p>
			<Button href="/projects/new">Start your first project</Button>
		{:else}
			<div class="flex flex-col gap-2">
				{#each data.myProjects as project (project.id)}
					<a
						href={`/projects/${project.id}/edit`}
						class="flex items-center justify-between gap-2 rounded-xl border-2 border-tan p-3 transition hover:border-dashed hover:border-wood"
					>
						<span class="font-bold text-wood-dark">{project.title}</span>
						<Badge status={project.status} />
					</a>
				{/each}
			</div>
			<div class="mt-4">
				<Button href="/projects" variant="secondary" size="sm">All projects</Button>
			</div>
		{/if}
	</Card>
</div>
