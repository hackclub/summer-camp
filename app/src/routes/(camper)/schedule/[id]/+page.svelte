<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { etDateString, etDayLabel, etWallTime, JOIN_OPENS, SESSION_END } from '$lib/camp-time';
	import { FileText, Link as LinkIcon, Play, Presentation } from 'lucide-svelte';

	let { data } = $props();

	const now = new Date();
	const joinWindowOpen = $derived(
		data.day.date === etDateString(now) &&
			now >= etWallTime(data.day.date, JOIN_OPENS.hour, JOIN_OPENS.minute) &&
			now < etWallTime(data.day.date, SESSION_END.hour, SESSION_END.minute)
	);

	const icons = { slides: Presentation, starter: FileText, link: LinkIcon };
</script>

<svelte:head><title>{data.day.title} — Hack Club Summer Camp</title></svelte:head>

<div class="mx-auto flex max-w-2xl flex-col gap-6">
	<div class="text-center">
		<p class="font-bold text-wood-dark uppercase">{etDayLabel(data.day.date)} · 12:00–3:00 PM ET</p>
		<h1 class="font-luckiest-guy text-4xl text-wood">{data.day.title}</h1>
	</div>

	{#if joinWindowOpen && data.day.joinUrl}
		<div class="text-center">
			<Button href={data.day.joinUrl} size="hero" target="_blank" rel="noopener">
				JOIN THE SESSION
			</Button>
		</div>
	{/if}

	{#if data.day.description}
		<Card title="What we're doing">
			<p class="whitespace-pre-line text-wood-dark">{data.day.description}</p>
		</Card>
	{/if}

	{#if data.materials.length > 0}
		<Card title="Materials">
			<div class="flex flex-col gap-2">
				{#each data.materials as material (material.id)}
					{@const Icon = icons[material.kind]}
					<a
						href={material.url}
						target="_blank"
						rel="noopener"
						class="flex items-center gap-2 rounded-xl border-2 border-tan p-3 font-bold text-wood-dark transition hover:border-dashed hover:border-wood"
					>
						<Icon class="size-5 text-wood" />
						{material.title}
					</a>
				{/each}
			</div>
		</Card>
	{/if}

	{#if data.day.recordingUrl}
		<Card title="Recording">
			<a
				href={data.day.recordingUrl}
				target="_blank"
				rel="noopener"
				class="flex items-center gap-2 rounded-xl border-2 border-tan p-3 font-bold text-wood-dark transition hover:border-dashed hover:border-wood"
			>
				<Play class="size-5 text-wood" />
				Watch the session recording
			</a>
		</Card>
	{/if}
</div>
