<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import { CalendarDays, Hammer, Home } from 'lucide-svelte';
	import { base } from '$app/paths';

	const options = [
		{ icon: Home, title: 'Go to my dashboard', desc: 'See today’s session, your points, and your projects.', destination: '/' },
		{ icon: CalendarDays, title: 'See the schedule', desc: 'Check what’s on and when the next workshop starts.', destination: '/schedule' },
		{ icon: Hammer, title: 'Submit a project', desc: 'Ship what you built in a session for points.', destination: '/submit' }
	];
</script>

<svelte:head><title>You’re all set! — Hack Club Summer Camp</title></svelte:head>

<h1 class="mb-2 text-center font-melon-camp text-3xl text-wood-dark sm:text-4xl">
	You’re all set! 🎉
</h1>
<p class="mx-auto mb-8 max-w-md text-center text-wood-dark">
	Where do you want to start?
</p>

<div class="grid gap-4 sm:grid-cols-3">
	{#each options as opt (opt.title)}
		{@const Icon = opt.icon}
		<form method="POST" action="?/finish" class="contents">
			<input type="hidden" name="destination" value={opt.destination} />
			<button type="submit" class="block text-left">
				<Card interactive class="h-full">
					<span
						class="mb-3 flex size-12 items-center justify-center rounded-full border-4 border-grass-dark bg-grass text-cream"
					>
						<Icon class="size-6" />
					</span>
					<h3 class="mb-1 font-bold text-wood-dark">{opt.title}</h3>
					<p class="text-sm text-wood-dark/80">{opt.desc}</p>
				</Card>
			</button>
		</form>
	{/each}
</div>

<div class="mt-6 text-center">
	<a href="{base}/onboarding/verify" class="text-sm font-bold text-wood underline">← back</a>
</div>
