<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
</script>

<svelte:head><title>Link expired — Hack Club Summer Camp</title></svelte:head>

<Card class="text-center">
	<h1 class="mb-3 font-luckiest-guy text-3xl text-wood">That link didn't work</h1>
	<p class="mb-6 text-wood-dark">
		It may have expired (links last 15 minutes) or already been used. No worries — grab a fresh one.
	</p>
	<Button href="/login" size="lg">Send me a new link</Button>
</Card>
