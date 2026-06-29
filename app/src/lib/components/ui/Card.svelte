<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		title,
		interactive = false,
		class: extra = ''
	}: { children: Snippet; title?: string; interactive?: boolean; class?: string } = $props();
</script>

<div
	class={[
		'rounded-2xl border-4 border-wood bg-cream p-4 shadow-md sm:p-6',
		interactive && 'transition hover:border-dashed',
		extra
	]}
>
	{#if title}
		<h2 class="mb-3 font-melon-camp text-xl text-wood sm:text-2xl">{title}</h2>
	{/if}
	{@render children()}
</div>
