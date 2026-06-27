<script lang="ts">
	import { page } from '$app/state';
	import PageHeader from '$lib/components/theme/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import ProjectForm from '$lib/components/projects/ProjectForm.svelte';

	let { data, form } = $props();

	const justShipped = $derived(page.url.searchParams.get('shipped') === '1');
	const errorsFor = (id: string) => (form?.campDayId === id ? (form?.errors ?? {}) : {});
</script>

<svelte:head><title>Submit a project — Hack Club Summer Camp</title></svelte:head>

<PageHeader title="Submit a project" subtitle="One project per lesson — ship it before it locks" />

<div class="mx-auto flex max-w-xl flex-col gap-6">
	{#if justShipped}
		<p class="rounded-xl bg-grass/20 p-3 text-center font-bold text-grass-dark">
			Shipped! Counselors will review it and your points land once it's approved. 🎉
		</p>
	{/if}

	{#if data.lessons.length === 0}
		<EmptyState
			title="Nothing to submit right now"
			body="You can submit a project for a lesson during its session and the day after. Come back once today's session has started!"
		/>
	{:else}
		{#each data.lessons as lesson (lesson.day.id)}
			<Card title={lesson.day.title}>
				<p class="mb-4 text-sm font-bold text-wood">{lesson.day.label}</p>

				{#if lesson.shipped}
					<div class="flex items-center gap-3">
						<Badge status={lesson.project?.status ?? 'submitted'} />
						<p class="text-wood-dark">
							{lesson.project?.status === 'approved'
								? 'Shipped and approved — nice work!'
								: lesson.project?.status === 'rejected'
									? 'Counselors asked for changes on this one.'
									: 'Shipped! Counselors are reviewing it.'}
						</p>
					</div>
				{:else}
					{#if form?.campDayId === lesson.day.id && form?.shipFailed}
						<p class="mb-4 rounded-lg bg-berry/10 p-3 text-sm font-bold text-berry">
							Something went wrong sending this for review, so it wasn't submitted. Try again in a
							minute — if it keeps happening, contact Jenin.
						</p>
					{/if}
					{#if form?.campDayId === lesson.day.id && form?.saved}
						<p class="mb-4 rounded-lg bg-sky/20 p-3 text-sm font-bold text-wood-dark">
							Draft saved.
						</p>
					{/if}

					<form method="POST">
						<input type="hidden" name="campDayId" value={lesson.day.id} />
						<ProjectForm
							project={lesson.project ?? { title: lesson.day.title }}
							errors={errorsFor(lesson.day.id)}
							hideSubmit
						/>
						{#if !data.identityVerified}
							<p class="mt-4 text-sm text-wood-dark/70">
								You'll verify your identity when you submit (needed before we can mail prizes).
							</p>
						{/if}
						<div class="mt-4 flex flex-wrap gap-3">
							<Button type="submit" formaction="?/ship" size="lg">Submit for review 🚀</Button>
							<Button type="submit" formaction="?/save" variant="secondary">Save draft</Button>
						</div>
					</form>
				{/if}
			</Card>
		{/each}
	{/if}
</div>
