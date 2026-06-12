<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import { Mail } from 'lucide-svelte';
</script>

<svelte:head><title>Check your email — Hack Club Summer Camp</title></svelte:head>

<Card class="text-center">
	<Mail class="mx-auto mb-4 size-12 text-wood" />
	<h1 class="mb-3 font-luckiest-guy text-3xl text-wood">Check your email!</h1>
	<p class="mb-2 text-wood-dark">
		If that address is good, a login link is on its way. It works once and expires in 15 minutes.
	</p>
	<p class="text-sm text-wood-dark">
		Nothing arriving? Check spam, or <a href="/login" class="underline">try again</a>.
	</p>
</Card>
