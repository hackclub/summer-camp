<script lang="ts">
	import { page } from '$app/state';
	import PointsChip from './PointsChip.svelte';
	import type { SessionUser } from '$lib/types';

	let { user, balance }: { user: SessionUser | null; balance: number } = $props();

	const links = [
		{ href: '/', label: 'Today' },
		{ href: '/schedule', label: 'Schedule' },
		{ href: '/submit', label: 'Submit' },
		{ href: '/projects', label: 'Projects' },
		{ href: '/gallery', label: 'Gallery' },
		{ href: '/shop', label: 'Shop' }
	];

	const isActive = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
</script>

<header class="sticky top-0 z-40 border-b-4 border-wood bg-cream/80 backdrop-blur">
	<div class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2">
		<a href="/" class="font-luckiest-guy text-xl whitespace-nowrap text-wood sm:text-2xl">
			Summer Camp
		</a>

		<nav class="hidden items-center gap-1 sm:flex">
			{#each links as link (link.href)}
				<a
					href={link.href}
					class={[
						'rounded-full px-3 py-1 font-luckiest-guy transition',
						isActive(link.href) ? 'bg-grass text-white' : 'text-wood hover:bg-peach'
					]}
				>
					{link.label}
				</a>
			{/each}
		</nav>

		<div class="flex items-center gap-2">
			{#if user}
				<PointsChip {balance} />
				{#if user.role === 'admin'}
					<a href="/admin" class="hidden text-sm font-bold text-wood underline sm:inline">Admin</a>
				{/if}
				<form method="POST" action="/logout">
					<button type="submit" class="hidden cursor-pointer text-sm text-wood underline sm:inline">
						Log out
					</button>
				</form>
			{:else}
				<a href="/login" class="font-luckiest-guy text-wood underline">Log in</a>
			{/if}
		</div>
	</div>
</header>
