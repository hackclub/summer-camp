<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import { Github, Play } from 'lucide-svelte';

	let { data } = $props();
	const firstName = $derived(data.project.authorName?.split(' ')[0] ?? 'A camper');
</script>

<svelte:head>
	<title>{data.project.title} — Hack Club Summer Camp</title>
	<meta property="og:title" content={data.project.title} />
	<meta
		property="og:description"
		content={data.project.description ?? 'Built at Hack Club Summer Camp'}
	/>
	{#if data.project.screenshotUrl}
		<meta property="og:image" content={data.project.screenshotUrl} />
	{/if}
</svelte:head>

<div class="mx-auto flex max-w-2xl flex-col gap-6">
	{#if data.project.screenshotUrl}
		<img
			src={data.project.screenshotUrl}
			alt={data.project.title}
			class="w-full rounded-2xl border-4 border-wood shadow-md"
		/>
	{/if}

	<div class="text-center">
		<h1 class="font-luckiest-guy text-4xl text-wood">{data.project.title}</h1>
		<p class="text-wood-dark">by {firstName}</p>
	</div>

	{#if data.project.description}
		<Card>
			<p class="whitespace-pre-line text-wood-dark">{data.project.description}</p>
		</Card>
	{/if}

	<div class="flex flex-wrap justify-center gap-3">
		{#if data.project.playableUrl}
			<Button href={data.project.playableUrl} target="_blank" rel="noopener" size="lg">
				<Play class="size-5" /> Play it
			</Button>
		{/if}
		{#if data.project.githubUrl}
			<Button
				href={data.project.githubUrl}
				target="_blank"
				rel="noopener"
				variant="secondary"
				size="lg"
			>
				<Github class="size-5" /> The code
			</Button>
		{/if}
	</div>
</div>
