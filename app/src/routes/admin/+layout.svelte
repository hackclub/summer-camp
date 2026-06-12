<script lang="ts">
	import AdminSidebar from '$lib/components/shell/AdminSidebar.svelte';

	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col bg-slate-50 md:flex-row">
	<AdminSidebar />
	<main class="flex-1 p-4 md:p-8">
		{@render children()}
	</main>
</div>
