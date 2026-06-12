<script lang="ts">
	import Grass from './Grass.svelte';

	// A thin decorative strip of grass for page bottoms. Deliberately few
	// blades — the landing renders hundreds, which crashes mobile WebKit; a
	// dashboard people keep open all afternoon must stay cheap.
	const BLADES = 16;
</script>

<div class="pointer-events-none relative h-12 w-full overflow-hidden" aria-hidden="true">
	{#each Array(BLADES), i (i)}
		<Grass id={i} />
	{/each}
</div>
