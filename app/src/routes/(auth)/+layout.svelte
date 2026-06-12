<script lang="ts">
	import Grass from '$lib/components/theme/Grass.svelte';

	let { children } = $props();

	// Auth pages can afford a fuller grass field than the dashboard.
	const BLADES = 48;
</script>

<div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-grass p-4">
	<div class="pointer-events-none absolute inset-0" aria-hidden="true">
		{#each Array(BLADES), i (i)}
			<Grass id={i} />
		{/each}
	</div>
	<main class="relative z-10 w-full max-w-md">
		{@render children()}
	</main>
</div>
