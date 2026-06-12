<script lang="ts">
	import Sign from './Sign.svelte';

	let { title, subtitle }: { title: string; subtitle?: string } = $props();
</script>

<div class="mb-6 flex flex-col items-center">
	<Sign type="plank">
		<h1 class="font-luckiest-guy text-3xl sm:text-5xl">{title}</h1>
	</Sign>
	{#if subtitle}
		<p class="mt-2 text-center text-wood-dark">{subtitle}</p>
	{/if}
</div>
