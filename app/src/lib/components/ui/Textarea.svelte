<script lang="ts">
	let {
		label,
		name,
		value = $bindable(''),
		error,
		required = false,
		rows = 4,
		placeholder = ''
	}: {
		label: string;
		name: string;
		value?: string;
		error?: string;
		required?: boolean;
		rows?: number;
		placeholder?: string;
	} = $props();
</script>

<label class="block">
	<span class="mb-1 block font-bold text-wood-dark">{label}</span>
	<textarea
		{name}
		{required}
		{rows}
		{placeholder}
		bind:value
		class="w-full rounded-xl border-4 border-wood bg-peach px-4 py-2 text-wood-dark placeholder-tan focus:ring-4 focus:ring-grass/50 focus:outline-none"
	></textarea>
	{#if error}
		<span class="mt-1 block text-sm font-bold text-berry">{error}</span>
	{/if}
</label>
