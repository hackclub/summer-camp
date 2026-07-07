<script lang="ts">
	import { page } from '$app/state';
	import PageHeader from '$lib/components/theme/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import ProjectForm from '$lib/components/projects/ProjectForm.svelte';
	import AddressFields from '$lib/components/projects/AddressFields.svelte';
	import { isLaunchGraceOpen } from '$lib/camp-time';

	let { data, form } = $props();

	const justShipped = $derived(page.url.searchParams.get('shipped') === '1');
	const errorsFor = (id: string) => (form?.campDayId === id ? (form?.errors ?? {}) : {});
	const graceOpen = isLaunchGraceOpen(new Date());

	// Which lesson's form is showing. Prefer ?day= (deep link from the home
	// cards), then a form-error target, then the first open lesson.
	let selectedId = $state(
		page.url.searchParams.get('day') ?? form?.campDayId ?? data.lessons[0]?.day.id
	);
	const selected = $derived(
		data.lessons.find((l) => l.day.id === selectedId) ?? data.lessons[0] ?? null
	);
</script>

<svelte:head><title>Submit a project — Hack Club Summer Camp</title></svelte:head>

<PageHeader title="Submit a project" subtitle="One project per lesson — ship it before it locks" />

<div class="mx-auto flex max-w-xl flex-col gap-6">
	{#if graceOpen}
		<p class="rounded-xl border-4 border-wood bg-cream p-3 text-center font-bold text-wood-dark">
			You can submit days 1–4 until Wednesday at 11:59 PM ET! Pick the day below to ship it.
		</p>
	{/if}

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
		{#if data.lessons.length > 1}
			<label class="flex flex-col gap-1">
				<span class="font-bold text-wood-dark">Which lesson?</span>
				<select
					bind:value={selectedId}
					class="rounded-xl border-4 border-wood bg-cream px-3 py-2 font-bold text-wood-dark"
				>
					{#each data.lessons as lesson (lesson.day.id)}
						<option value={lesson.day.id}>
							{lesson.day.label} — {lesson.day.title}{lesson.shipped ? ' (shipped)' : ''}
						</option>
					{/each}
				</select>
			</label>
		{/if}

		{#if selected}
			{@const lesson = selected}
			<Card title={lesson.day.title}>
				<p class="text-sm font-bold text-wood">{lesson.day.label}</p>
				{#if lesson.day.rewardPoints > 0 || lesson.day.prizeLabel}
					<p class="mb-4 text-sm text-grass-dark">
						Approved gets you
						{#if lesson.day.rewardPoints > 0}<strong>+{lesson.day.rewardPoints} pts</strong>{/if}{#if lesson.day.rewardPoints > 0 && lesson.day.prizeLabel}
							and{/if}{#if lesson.day.prizeLabel}
							the prize <strong>{lesson.day.prizeLabel}</strong>{/if}.
					</p>
				{:else}
					<div class="mb-4"></div>
				{/if}

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

						<div class="mt-4">
							<p class="mb-2 font-bold text-wood-dark">Mailing address</p>
							<p class="mb-3 text-sm text-wood-dark/70">
								Required to ship — Hack Club needs it to send anything you earn.
							</p>
							<AddressFields address={lesson.address} errors={errorsFor(lesson.day.id)} />
						</div>

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
		{/if}
	{/if}
</div>
