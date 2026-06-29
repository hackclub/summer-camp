<script lang="ts">
	import PageHeader from '$lib/components/theme/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import ProjectForm from '$lib/components/projects/ProjectForm.svelte';
	import { base } from '$app/paths';

	let { data, form } = $props();

	const locked = $derived(
		data.project.status === 'submitted' || data.project.status === 'approved'
	);
	let deleteOpen = $state(false);
	let deleteForm: HTMLFormElement | undefined = $state();
</script>

<svelte:head><title>{data.project.title} — Hack Club Summer Camp</title></svelte:head>

<PageHeader title="Edit project" />

<div class="mx-auto flex max-w-2xl flex-col gap-6">
	<div class="flex items-center justify-between">
		<Badge status={data.project.status} />
		{#if form?.saved}
			<span class="font-bold text-grass-dark">Saved!</span>
		{/if}
	</div>

	{#if data.project.status === 'rejected' && data.latestReview?.feedback}
		<Card title="Reviewer feedback">
			<p class="whitespace-pre-line text-wood-dark">{data.latestReview.feedback}</p>
			<p class="mt-2 text-sm text-wood-dark">Make the changes, then ship it again!</p>
		</Card>
	{/if}

	<Card>
		<form method="POST" action="?/update">
			<ProjectForm project={data.project} errors={form?.errors ?? {}} {locked} />
		</form>
	</Card>

	{#if !locked}
		<div class="flex justify-between">
			<Button href={`${base}/projects/${data.project.id}/ship`} size="lg">Ship it! 🚀</Button>
			<Button variant="danger" size="sm" onclick={() => (deleteOpen = true)}>Delete</Button>
		</div>
		<form method="POST" action="?/delete" bind:this={deleteForm} class="hidden"></form>
		<Modal
			bind:open={deleteOpen}
			title="Delete this project?"
			confirmLabel="Delete it"
			danger
			onconfirm={() => deleteForm?.submit()}
		>
			<p>This can't be undone. Your draft will be gone for good.</p>
		</Modal>
	{/if}
</div>
