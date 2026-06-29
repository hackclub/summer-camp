<script lang="ts">
	import { Coins } from 'lucide-svelte';
	import { base } from '$app/paths';

	let { balance }: { balance: number } = $props();
</script>

<a
	href="{base}/shop"
	class="flex items-center gap-1.5 rounded-full border-4 border-wood bg-cream px-3 py-1 font-bold text-wood-dark transition hover:scale-105"
	title="Your points — spend them in the shop!"
>
	<Coins class="size-4 text-wood" />
	<span class="tabular-nums">{balance}</span>
</a>
