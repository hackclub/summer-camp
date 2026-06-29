<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head><title>{page.status} — Hack Club Summer Camp</title></svelte:head>

<div class="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
	<img
		src={`https://http.cat/${page.status}.jpg`}
		alt={`HTTP ${page.status}`}
		class="w-full max-w-sm rounded-2xl border-4 border-wood shadow-md"
	/>
	<h1 class="font-melon-camp text-4xl text-wood-dark">{page.status}</h1>
	{#if page.error?.message}
		<p class="text-wood-dark">{page.error.message}</p>
	{/if}
	<a
		href="/"
		class="rounded-full border-4 border-grass-dark bg-grass px-5 py-2 font-bold text-cream"
	>
		Back to camp
	</a>
</div>
