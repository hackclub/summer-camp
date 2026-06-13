<script lang="ts">
	import Header from '$lib/components/shell/Header.svelte';
	import BottomNav from '$lib/components/shell/BottomNav.svelte';
	import { cdn } from '$lib/cdn';

	let { data, children } = $props();

	// The same illustrated forest the landing page uses, pinned to the bottom of
	// the viewport so the campfire/tent ground every screen. A soft cream wash
	// (heavier toward the top, where the reading happens) keeps the scene ambient
	// so the content panels stay the focus.
	const backdrop =
		`linear-gradient(rgba(255,233,207,0.62), rgba(255,233,207,0.32)), url('${cdn.forest}')`;
</script>

<div class="relative flex min-h-screen flex-col">
	<div
		class="pointer-events-none fixed inset-0 -z-10 bg-cover bg-bottom bg-no-repeat"
		style:background-image={backdrop}
		aria-hidden="true"
	></div>

	<Header user={data.user} balance={data.balance} />
	<main class="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 sm:pb-6">
		{@render children()}
	</main>
	<BottomNav />
</div>
