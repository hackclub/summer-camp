<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		variant = 'primary',
		size = 'md',
		href,
		type = 'button',
		disabled = false,
		...rest
	}: {
		children: Snippet;
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
		size?: 'sm' | 'md' | 'lg' | 'hero';
		href?: string;
		type?: 'button' | 'submit';
		disabled?: boolean;
		[key: string]: unknown;
	} = $props();

	const variants = {
		primary: 'bg-grass text-white border-wood hover:bg-grass-dark',
		secondary: 'bg-peach text-wood-dark border-wood hover:bg-tan',
		danger: 'bg-berry text-white border-wood-dark hover:opacity-90',
		ghost: 'bg-transparent text-wood border-transparent hover:bg-peach'
	};
	const sizes = {
		sm: 'px-3 py-1 text-sm',
		md: 'px-5 py-2',
		lg: 'px-7 py-3 text-lg',
		hero: 'px-10 py-5 text-2xl sm:text-4xl'
	};
	const classes = $derived(
		[
			'font-luckiest-guy inline-flex items-center justify-center gap-2 rounded-full border-4 text-center transition',
			'hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100',
			variants[variant],
			sizes[size]
		].join(' ')
	);
</script>

{#if href && !disabled}
	<a {href} class={classes} {...rest}>{@render children()}</a>
{:else}
	<button {type} {disabled} class={classes} {...rest}>{@render children()}</button>
{/if}
