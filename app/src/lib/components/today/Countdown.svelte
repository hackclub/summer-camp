<script lang="ts">
	import { countdownParts } from '$lib/camp-time';

	let { target, now }: { target: Date; now: Date } = $props();

	const parts = $derived(countdownParts(now, target));
	const pad = (n: number) => String(n).padStart(2, '0');
</script>

<span class="font-luckiest-guy tabular-nums">
	{#if parts.days > 0}{parts.days}d
	{/if}{pad(parts.hours)}:{pad(parts.minutes)}:{pad(parts.seconds)}
</span>
