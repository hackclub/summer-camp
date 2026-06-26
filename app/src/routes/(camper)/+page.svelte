<script lang="ts">
	import SessionHero from '$lib/components/today/SessionHero.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { Coins, Rocket } from 'lucide-svelte';

	let { data } = $props();
</script>

<svelte:head><title>Today — Hack Club Summer Camp</title></svelte:head>

<div class="flex flex-col gap-6">
	<SessionHero days={data.days} />

	{#if data.today}
		<Card title="Today's project">
			{#if !data.todayProject}
				<p class="mb-4 text-wood-dark">
					Done with today's workshop? Ship what you built — add the details and send it off for
					points. You get one project for <strong>{data.today.title}</strong>.
				</p>
				<form method="POST" action="?/startToday">
					<Button type="submit" size="lg">
						<Rocket class="size-5" /> Ship today's project
					</Button>
				</form>
			{:else if data.todayProject.status === 'building'}
				<p class="mb-4 text-wood-dark">
					Your <strong>{data.today.title}</strong> project is saved as a draft — finish it up and ship
					it for points.
				</p>
				<div class="flex flex-wrap gap-3">
					<Button href={`/projects/${data.todayProject.id}/ship`} size="lg">
						<Rocket class="size-5" /> Finish &amp; ship it
					</Button>
					<Button href={`/projects/${data.todayProject.id}/edit`} variant="secondary">
						Edit details
					</Button>
				</div>
			{:else if data.todayProject.status === 'rejected'}
				<div class="mb-4 flex items-center gap-3">
					<Badge status="rejected" />
					<p class="text-wood-dark">Counselors asked for a few changes before this one ships.</p>
				</div>
				<Button href={`/projects/${data.todayProject.id}/edit`}>Make changes</Button>
			{:else}
				<div class="flex items-center gap-3">
					<Badge status={data.todayProject.status} />
					<p class="text-wood-dark">
						{data.todayProject.status === 'approved'
							? 'Shipped and approved — nice work! 🎉'
							: 'Shipped! Counselors are reviewing it now.'}
					</p>
				</div>
			{/if}
		</Card>
	{/if}

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
			<p class="text-wood-dark">
				No projects yet — once you've been to a session, ship what you built right from the
				<strong>Today's project</strong> card above.
			</p>
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
