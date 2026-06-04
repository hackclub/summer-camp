<script>
	import { asset } from '$app/paths';

	let { id = 0 } = $props(); // for staggered animation delays

	// Generate random values for each grass instance
	let randomSvg = Math.floor(Math.random() * 11) + 1;
	let randomX = Math.random() * 100;
	let randomY = Math.random() * 100;
</script>

<img
	src={asset(`/grass/${randomSvg}.svg`)}
	alt="grass"
	style="--animation-delay: {id * 0.05}s; left: {randomX}%; top: {randomY}%;"
	class="absolute h-auto w-[2vw]"
/>

<style>
	img {
		animation: sway 3.5s ease-in-out infinite;
		animation-delay: var(--animation-delay);
	}

	@keyframes sway {
		0%,
		100% {
			transform: translateX(0) rotate(0deg);
		}
		25% {
			transform: translateX(2px) rotate(0.5deg);
		}
		50% {
			transform: translateX(0) rotate(0deg);
		}
		75% {
			transform: translateX(-2px) rotate(-0.5deg);
		}
	}
</style>
