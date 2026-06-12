<script lang="ts">
	import { cdn, fallback } from '$lib/cdn';
	import type { Snippet } from 'svelte';

	let {
		children,
		type = 'plank',
		flipped = false
	}: { type?: 'plank' | 'sign'; flipped?: boolean; children: Snippet } = $props();
</script>

<div class="relative inline-block h-fit w-fit">
	<img
		src={type == 'plank' ? cdn.plank : cdn.sign}
		onerror={fallback(type == 'plank' ? '/plank.png' : '/sign.png')}
		alt="sign"
		class={[
			'block h-auto  max-w-none ',
			flipped && '-scale-x-100',
			type == 'sign' && 'w-72 sm:w-170',
			type == 'plank' && 'w-100 max-w-[96vw] sm:w-170 sm:max-w-none'
		]}
	/>
	<div
		class={[
			'painted absolute flex text-center',
			type == 'plank' && 'inset-0 h-full w-full items-center justify-center px-6 pt-1 sm:pt-3',
			// For the directional sign, confine the content to the board (the top
			// ~45% of the image), avoiding the arrow taper and the post below.
			type == 'sign' && 'top-[7%] h-[40%] items-center justify-center px-2 sm:px-0',
			type == 'sign' && !flipped && 'left-[5%] right-[19%]',
			type == 'sign' && flipped && 'left-[19%] right-[5%]'
		]}
	>
		{@render children()}
	</div>
</div>

<style>
	/* Painted-on lettering: cream paint with a flat dark offset shadow (like
	   the art's cartoon outlines) so the words sit on the board instead of
	   floating over it. Shadow is in em so it scales with each sign's text. */
	.painted {
		color: #ffe9cf;
		text-shadow: 0.045em 0.07em 0 rgba(58, 21, 11, 0.55);
	}
</style>
