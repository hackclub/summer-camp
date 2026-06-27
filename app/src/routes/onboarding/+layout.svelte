<script lang="ts">
	import { cdn } from '$lib/cdn';

	let { children } = $props();

	// Same illustrated forest as the rest of the app, but no Header/BottomNav —
	// onboarding is a focused, distraction-free flow.
	const backdrop = `linear-gradient(rgba(255,233,207,0.55), rgba(255,233,207,0.30)), url('${cdn.forest}')`;
</script>

<div class="relative flex min-h-screen flex-col">
	<div
		class="pointer-events-none fixed inset-0 -z-10 bg-cover bg-bottom bg-no-repeat"
		style:background-image={backdrop}
		aria-hidden="true"
	></div>

	<main class="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-10">
		{@render children()}
	</main>
</div>
