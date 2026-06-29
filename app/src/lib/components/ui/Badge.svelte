<script lang="ts">
	let { status }: { status: string } = $props();

	const styles: Record<string, { label: string; class: string }> = {
		live: { label: 'LIVE', class: 'bg-berry text-white animate-pulse' },
		building: { label: 'Draft', class: 'bg-tan text-wood-dark' },
		submitted: { label: 'Pending review', class: 'bg-sky text-wood-dark' },
		approved: { label: 'Shipped!', class: 'bg-grass text-white' },
		rejected: { label: 'Needs changes', class: 'bg-berry text-white' },
		recorded: { label: 'Recorded', class: 'bg-sky text-wood-dark' },
		upcoming: { label: 'Upcoming', class: 'bg-tan text-wood-dark' },
		today: { label: 'Today', class: 'bg-grass text-white' },
		pending: { label: 'Pending', class: 'bg-sky text-wood-dark' },
		fulfilled: { label: 'Fulfilled', class: 'bg-grass text-white' },
		ordered: { label: 'Ordered', class: 'bg-sky text-wood-dark' },
		packed: { label: 'Packed', class: 'bg-sky text-wood-dark' },
		shipped: { label: 'Shipped', class: 'bg-grass text-white' },
		refunded: { label: 'Refunded', class: 'bg-tan text-wood-dark' },
		canceled: { label: 'Canceled', class: 'bg-tan text-wood-dark' }
	};
	const style = $derived(styles[status] ?? { label: status, class: 'bg-tan text-wood-dark' });
</script>

<span class={['inline-block rounded-full px-3 py-0.5 text-xs font-bold uppercase', style.class]}>
	{style.label}
</span>
