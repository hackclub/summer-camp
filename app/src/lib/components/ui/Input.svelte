<script lang="ts">
	let {
		label,
		name,
		type = 'text',
		value = $bindable(''),
		error,
		required = false,
		placeholder = '',
		...rest
	}: {
		label: string;
		name: string;
		type?: string;
		value?: string;
		error?: string;
		required?: boolean;
		placeholder?: string;
		[key: string]: unknown;
	} = $props();
</script>

<label class="block">
	<span class="mb-1 block font-bold text-wood-dark">{label}</span>
	<input
		{type}
		{name}
		{required}
		{placeholder}
		bind:value
		class="w-full rounded-xl border-4 border-wood bg-peach px-4 py-2 text-wood-dark placeholder-tan focus:ring-4 focus:ring-grass/50 focus:outline-none"
		{...rest}
	/>
	{#if error}
		<span class="mt-1 block text-sm font-bold text-berry">{error}</span>
	{/if}
</label>
