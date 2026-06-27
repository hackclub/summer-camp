<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { CalendarDays, Hammer, Rocket, Gift } from 'lucide-svelte';

	const steps = [
		{ icon: CalendarDays, title: 'Show up', desc: 'Join the daily sessions on Zoom. Every hour you spend earns you points!' },
		{ icon: Hammer, title: 'Build something', desc: "During the call, you'll be guided through how to make a project based on that theme. It can be small, just make it unique :)" },
		{ icon: Rocket, title: 'Ship it', desc: 'Send it off for review. When it’s approved, you get a points bonus.' },
		{ icon: Gift, title: 'Spend your points', desc: 'Trade them for real prizes in the camp shop.' }
	];
</script>

<svelte:head><title>Welcome — Hack Club Summer Camp</title></svelte:head>

<h1 class="mb-3 text-center font-luckiest-guy text-4xl text-wood-dark sm:text-5xl">
	Welcome to Summer Camp!
</h1>
<p class="mx-auto mb-8 max-w-md text-center text-lg text-wood-dark">
	A few weeks of building cool things with other teens — and earning points you can spend on real
	prizes. Here’s how it works.
</p>

<Card title="How camp works">
	<ol class="flex flex-col gap-5">
		{#each steps as step, i (step.title)}
			{@const Icon = step.icon}
			<li class="flex items-start gap-4">
				<span
					class="flex size-11 shrink-0 items-center justify-center rounded-full border-4 border-grass-dark bg-grass text-cream"
				>
					<Icon class="size-5" />
				</span>
				<div>
					<h3 class="font-bold text-wood-dark">
						<span class="text-grass-dark">{i + 1}.</span>
						{step.title}
					</h3>
					<p class="text-wood-dark/80">{step.desc}</p>
				</div>
			</li>
		{/each}
	</ol>
</Card>

<div class="mt-8 flex justify-center">
	<Button href="/onboarding/setup" size="lg">Let’s go! 🏕️</Button>
</div>
