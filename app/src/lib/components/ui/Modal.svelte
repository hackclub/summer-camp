<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from './Button.svelte';

	let {
		open = $bindable(false),
		title,
		children,
		confirmLabel = 'Confirm',
		cancelLabel = 'Cancel',
		onconfirm,
		danger = false
	}: {
		open?: boolean;
		title: string;
		children: Snippet;
		confirmLabel?: string;
		cancelLabel?: string;
		onconfirm?: () => void;
		danger?: boolean;
	} = $props();

	let dialog: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (open) dialog?.showModal();
		else dialog?.close();
	});
</script>

<dialog
	bind:this={dialog}
	onclose={() => (open = false)}
	class="m-auto w-full max-w-md rounded-2xl border-4 border-wood bg-cream p-6 shadow-xl backdrop:bg-black/50"
>
	<h2 class="mb-3 font-melon-camp text-2xl text-wood">{title}</h2>
	<div class="mb-6 text-wood-dark">{@render children()}</div>
	<div class="flex justify-end gap-3">
		<Button variant="secondary" onclick={() => (open = false)}>{cancelLabel}</Button>
		{#if onconfirm}
			<Button variant={danger ? 'danger' : 'primary'} onclick={onconfirm}>{confirmLabel}</Button>
		{/if}
	</div>
</dialog>
