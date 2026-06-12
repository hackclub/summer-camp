<script lang="ts">
	import { page } from '$app/state';
	import { Tent, CalendarDays, Rocket, Trees, Coins } from 'lucide-svelte';

	const links = [
		{ href: '/', label: 'Today', icon: Tent },
		{ href: '/schedule', label: 'Schedule', icon: CalendarDays },
		{ href: '/projects', label: 'Projects', icon: Rocket },
		{ href: '/gallery', label: 'Gallery', icon: Trees },
		{ href: '/shop', label: 'Shop', icon: Coins }
	];

	const isActive = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
</script>

<!-- Thumb-reachable tab bar on phones; desktop uses the top nav. -->
<nav
	class="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t-4 border-wood bg-cream py-1 sm:hidden"
	style="padding-bottom: env(safe-area-inset-bottom)"
>
	{#each links as link (link.href)}
		{@const Icon = link.icon}
		<a
			href={link.href}
			class={[
				'flex min-w-14 flex-col items-center rounded-xl px-2 py-1',
				isActive(link.href) ? 'text-grass-dark' : 'text-wood'
			]}
		>
			<Icon class="size-5" />
			<span class="text-[10px] font-bold">{link.label}</span>
		</a>
	{/each}
</nav>
