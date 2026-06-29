<script lang="ts">
	import Button from './Button.svelte';

	let {
		title,
		body,
		actionLabel,
		actionHref
	}: { title: string; body: string; actionLabel?: string; actionHref?: string } = $props();
</script>

<div class="rounded-2xl border-4 border-dashed border-wood bg-cream/60 px-6 py-12 text-center">
	<h3 class="mb-2 font-melon-camp text-2xl text-wood">{title}</h3>
	<p class="mb-6 text-wood-dark">{body}</p>
	{#if actionLabel && actionHref}
		<Button href={actionHref}>{actionLabel}</Button>
	{/if}
</div>
