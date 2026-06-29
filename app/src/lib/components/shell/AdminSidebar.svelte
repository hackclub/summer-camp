<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';

	const links = [
		{ href: '/admin', label: 'Overview' },
		{ href: '/admin/attendance', label: 'Attendance' },
		{ href: '/admin/reviews', label: 'Reviews' },
		{ href: '/admin/days', label: 'Camp days' },
		{ href: '/admin/announcements', label: 'Announcements' },
		{ href: '/admin/shop', label: 'Shop items' },
		{ href: '/admin/orders', label: 'Orders' },
		{ href: '/admin/campers', label: 'Campers' },
		{ href: '/admin/stats', label: 'Stats' }
	];

	const isActive = (href: string) =>
		href === '/admin'
			? page.url.pathname === `${base}/admin`
			: page.url.pathname.startsWith(`${base}${href}`);
</script>

<!-- Admin chrome is deliberately plain: speed over charm. -->
<aside
	class="w-full shrink-0 border-b border-slate-200 bg-white md:min-h-screen md:w-52 md:border-r md:border-b-0"
>
	<div class="p-4">
		<a href="{base}/admin" class="font-melon-camp text-lg text-wood">Camp Admin</a>
	</div>
	<nav class="flex flex-row flex-wrap gap-1 px-2 pb-2 md:flex-col md:pb-4">
		{#each links as link (link.href)}
			<a
				href={`${base}${link.href}`}
				class={[
					'rounded px-3 py-1.5 text-sm',
					isActive(link.href) ? 'bg-slate-800 text-white' : 'text-slate-700 hover:bg-slate-100'
				]}
			>
				{link.label}
			</a>
		{/each}
	</nav>
	<div class="hidden px-4 pb-4 md:block">
		<a href="{base}/" class="text-sm text-slate-500 underline">← Back to camp</a>
	</div>
</aside>
