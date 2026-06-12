<script lang="ts">
	import Header from '$lib/components/shell/Header.svelte';
	import BottomNav from '$lib/components/shell/BottomNav.svelte';
	import GrassStrip from '$lib/components/theme/GrassStrip.svelte';

	let { data, children } = $props();
</script>

<div class="flex min-h-screen flex-col bg-sand">
	<Header user={data.user} balance={data.balance} />
	<main class="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 sm:pb-6">
		{@render children()}
	</main>
	<GrassStrip />
	<BottomNav />
</div>
