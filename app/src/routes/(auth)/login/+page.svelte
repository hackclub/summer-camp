<script lang="ts">
	import Sign from '$lib/components/theme/Sign.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let { form } = $props();
</script>

<svelte:head><title>Log in — Hack Club Summer Camp</title></svelte:head>

<div class="flex flex-col items-center gap-6">
	<Sign type="plank">
		<span class="font-melon-camp text-3xl sm:text-5xl">Welcome back!</span>
	</Sign>

	<Card class="w-full">
		<p class="mb-4 text-wood-dark">
			Enter your email and we'll send you a magic link — no password needed.
		</p>
		<form method="POST" class="flex flex-col gap-4">
			<Input label="Email" name="email" type="email" required placeholder="you@example.com" />
			<!-- Honeypot: bots fill every field; humans never see this one. -->
			<div class="hidden" aria-hidden="true">
				<input type="text" name="company" tabindex="-1" autocomplete="off" />
			</div>
			{#if form?.invalid}
				<p class="font-bold text-berry">That email doesn't look right — try again?</p>
			{/if}
			{#if form?.rateLimited}
				<p class="font-bold text-berry">Whoa, slow down! Try again in a few minutes.</p>
			{/if}
			{#if form?.sendError}
				<p class="font-bold text-berry">
					We couldn't send the email. Try again, or contact camp@hackclub.com.
				</p>
			{/if}
			<Button type="submit" size="lg">Send my link</Button>
		</form>
	</Card>
</div>
