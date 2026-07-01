<script lang="ts">
	import { onMount } from 'svelte';
	import SessionHero from '$lib/components/today/SessionHero.svelte';
	import Countdown from '$lib/components/today/Countdown.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { Coins, Rocket, Presentation, Package, Link as LinkIcon, Video, DoorOpen } from 'lucide-svelte';
	import { base } from '$app/paths';
	import { isLaunchGraceOpen, submissionCloseAt } from '$lib/camp-time';

	let { data } = $props();

	// Ticking clock for the submission-close countdown.
	let now = $state(new Date());
	onMount(() => {
		const i = setInterval(() => (now = new Date()), 1000);
		return () => clearInterval(i);
	});
	const graceOpen = $derived(isLaunchGraceOpen(now));
	const closeAt = submissionCloseAt();

	const materialIcon = (kind: string) =>
		kind === 'slides' ? Presentation : kind === 'starter' ? Package : LinkIcon;
</script>

<svelte:head><title>Today — Hack Club Summer Camp</title></svelte:head>

<div class="flex flex-col gap-6">
	<SessionHero days={data.days} />

	{#if graceOpen}
		<div
			class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-2xl border-4 border-wood bg-cream px-5 py-3 text-center"
		>
			<span class="font-bold text-wood-dark">You can submit days 1–5 until Sunday at 11:59 PM ET!</span>
			<span class="font-melon-camp text-xl text-wood">
				<Countdown target={closeAt} {now} /> left
			</span>
		</div>
	{/if}

	{#if data.openCount > 0}
		<Card title="Submit a project">
			{#if data.toSubmit > 0}
				<p class="mb-4 text-wood-dark">
					You have <strong>{data.toSubmit}</strong>
					{data.toSubmit === 1 ? 'lesson' : 'lessons'} open for submission. Ship what you built before
					it locks!
				</p>
				<Button href="{base}/submit" size="lg">
					<Rocket class="size-5" /> Submit a project
				</Button>
			{:else}
				<p class="text-wood-dark">
					You've submitted everything that's open right now — nice work! 🎉
				</p>
			{/if}
		</Card>
	{/if}

	<!-- My points + the open lessons, side by side. Only open days show; the grid
	     scales to however many there are. Each lesson expands to its resources. -->
	<div class="grid gap-4 sm:grid-cols-3">
		<Card title="My points">
			<div class="flex items-center gap-2">
				<Coins class="size-8 text-wood" />
				<span class="text-3xl font-bold text-wood-dark tabular-nums">{data.balance}</span>
			</div>
			<p class="mt-2 text-sm text-wood-dark">Earn points by showing up and shipping.</p>
			<div class="mt-4">
				<Button href="{base}/shop" variant="secondary" size="sm">Visit the shop</Button>
			</div>
		</Card>

		{#each data.openDays as d (d.id)}
			<details class="group rounded-2xl border-4 border-tan bg-cream open:border-wood">
				<summary
					class="flex cursor-pointer list-none items-start justify-between gap-2 p-4 font-bold text-wood-dark"
				>
					<span class="flex flex-col">
						<span class="text-sm font-bold text-wood">{d.label}</span>
						<span>{d.title}</span>
					</span>
					{#if d.shipped}
						<Badge status={d.status ?? 'submitted'} />
					{:else}
						<span class="rounded-full bg-wood px-2 py-0.5 text-xs font-bold text-cream">Open</span>
					{/if}
				</summary>

				<div class="flex flex-col gap-3 border-t-2 border-tan px-4 pt-3 pb-4">
					{#if d.rewardPoints > 0 || d.prizeLabel}
						<p class="text-sm text-grass-dark">
							Approved gets you
							{#if d.rewardPoints > 0}<strong>+{d.rewardPoints} pts</strong>{/if}{#if d.rewardPoints > 0 && d.prizeLabel}
								and{/if}{#if d.prizeLabel} the prize <strong>{d.prizeLabel}</strong>{/if}.
						</p>
					{/if}

					{#if d.materials.length > 0}
						<div class="flex flex-col gap-1.5">
							<p class="text-xs font-bold tracking-wide text-wood uppercase">Resources</p>
							{#each d.materials as m (m.url)}
								{@const Icon = materialIcon(m.kind)}
								<a
									href={m.url}
									target="_blank"
									rel="noopener"
									class="flex items-center gap-2 text-sm text-wood-dark underline hover:text-wood"
								>
									<Icon class="size-4 shrink-0 text-wood" />{m.title}
								</a>
							{/each}
						</div>
					{/if}

					<div class="flex flex-wrap gap-2">
						{#if d.joinUrl}
							<a
								href={d.joinUrl}
								target="_blank"
								rel="noopener"
								class="flex items-center gap-1.5 text-sm font-bold text-wood underline"
							>
								<DoorOpen class="size-4" /> Join
							</a>
						{/if}
						{#if d.recordingUrl}
							<a
								href={d.recordingUrl}
								target="_blank"
								rel="noopener"
								class="flex items-center gap-1.5 text-sm font-bold text-wood underline"
							>
								<Video class="size-4" /> Recording
							</a>
						{/if}
					</div>

					{#if d.shipped}
						<p class="text-sm text-wood-dark">Already shipped — you're all set for this one. 🎉</p>
					{:else}
						<Button href="{base}/submit?day={d.id}" size="sm">
							<Rocket class="size-4" /> Submit for this lesson
						</Button>
					{/if}
				</div>
			</details>
		{/each}
	</div>

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

	<Card title="My projects">
		{#if data.myProjects.length === 0}
			<p class="text-wood-dark">
				Nothing shipped yet — once a session has happened, submit what you built from the
				<strong>Submit a project</strong> card above.
			</p>
		{:else}
			<div class="flex flex-col gap-2">
				{#each data.myProjects as project (project.id)}
					<a
						href={`${base}/projects/${project.id}/edit`}
						class="flex items-center justify-between gap-2 rounded-xl border-2 border-tan p-3 transition hover:border-dashed hover:border-wood"
					>
						<span class="font-bold text-wood-dark">{project.title}</span>
						<Badge status={project.status} />
					</a>
				{/each}
			</div>
			<div class="mt-4">
				<Button href="{base}/projects" variant="secondary" size="sm">All projects</Button>
			</div>
		{/if}
	</Card>
</div>
