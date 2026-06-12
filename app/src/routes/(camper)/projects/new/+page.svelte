<script lang="ts">
	import PageHeader from '$lib/components/theme/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import ProjectForm from '$lib/components/projects/ProjectForm.svelte';

	let { form } = $props();
</script>

<svelte:head><title>New project — Hack Club Summer Camp</title></svelte:head>

<PageHeader title="New project" subtitle="Save a draft now, ship it when it's ready" />

<div class="mx-auto max-w-2xl">
	<Card>
		<form method="POST">
			<ProjectForm errors={form?.errors ?? {}} />
		</form>
	</Card>
</div>
