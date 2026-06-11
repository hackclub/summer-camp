<script lang="ts">
	import { asset } from '$app/paths';
	import type { Snippet } from 'svelte';

	let {
		children,
		type = 'plank',
		flipped = false
	}: { type?: 'plank' | 'sign'; flipped?: boolean; children: Snippet } = $props();
</script>

<div class="relative inline-block h-fit w-fit">
	<img
		src={asset(type == 'plank' ? '/plank.png' : '/sign.png')}
		alt="sign"
		class={[
			'block h-auto  max-w-none ',
			flipped && '-scale-x-100',
			type == 'sign' && 'w-60 sm:w-170',
			type == 'plank' && 'w-100 sm:w-170'
		]}
	/>
	<div
		class={[
			'absolute inset-0 flex h-full w-full justify-center',
			type == 'sign' && 'pt-5 sm:pt-17',
			type == 'sign' && !flipped && 'translate-x-[-2%] ',
			type == 'sign' && flipped && 'translate-x-[2%]',
			type == 'plank' && 'items-center justify-center px-6 pt-1 sm:pt-3'
		]}
	>
		{@render children()}
	</div>
</div>
