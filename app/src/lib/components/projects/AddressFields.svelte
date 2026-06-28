<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import type { Address } from '$lib/types';

	let {
		address = null,
		errors = {}
	}: { address?: Address | null; errors?: Record<string, string> } = $props();
</script>

<div class="flex flex-col gap-3">
	<Input label="Address line 1" name="line1" value={address?.line1 ?? ''} required error={errors.line1} />
	<Input label="Address line 2 (optional)" name="line2" value={address?.line2 ?? ''} error={errors.line2} />
	<div class="grid grid-cols-2 gap-3">
		<Input label="City" name="city" value={address?.city ?? ''} required error={errors.city} />
		<Input label="State / region" name="state" value={address?.state ?? ''} required error={errors.state} />
	</div>
	<div class="grid grid-cols-2 gap-3">
		<Input label="ZIP / postal code" name="zip" value={address?.zip ?? ''} required error={errors.zip} />
		<Input label="Country" name="country" value={address?.country ?? ''} required error={errors.country} />
	</div>
</div>
