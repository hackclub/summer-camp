<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	let { data, form } = $props();
	let name = $state(form?.name ?? data.name ?? '');
</script>

<svelte:head><title>Set up — Hack Club Summer Camp</title></svelte:head>

<p class="mb-2 text-center text-sm font-bold tracking-wide text-wood/80">Step 1 of 2</p>
<h1 class="mb-2 text-center font-melon-camp text-3xl text-wood-dark sm:text-4xl">
	What should we call you?
</h1>
<p class="mx-auto mb-8 max-w-md text-center text-wood-dark">
	This is the name other campers and counselors will see.
</p>

<Card>
	<form method="POST" action="?/saveName" class="flex flex-col gap-4">
		<Input
			label="Your name"
			name="name"
			bind:value={name}
			required
			placeholder="e.g. John Hackclub"
			error={form?.error}
		/>
		<div class="flex justify-end">
			<Button type="submit" size="lg">Save &amp; continue →</Button>
		</div>
	</form>
</Card>

<div class="mt-6 text-center">
	<a href="/onboarding" class="text-sm font-bold text-wood underline">← back</a>
</div>
