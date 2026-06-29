<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { base } from '$app/paths';

	interface ProjectFields {
		title?: string | null;
		description?: string | null;
		githubUrl?: string | null;
		playableUrl?: string | null;
		screenshotUrl?: string | null;
	}

	let {
		project = null,
		errors = {},
		locked = false,
		hideSubmit = false
	}: {
		project?: ProjectFields | null;
		errors?: Record<string, string>;
		locked?: boolean;
		hideSubmit?: boolean;
	} = $props();

	let screenshotUrl = $state(project?.screenshotUrl ?? '');
	let uploading = $state(false);
	let uploadError = $state('');

	async function onFileChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		if (file.size > 5 * 1024 * 1024) {
			uploadError = 'Screenshot must be under 5 MB';
			return;
		}
		uploading = true;
		uploadError = '';
		try {
			const body = new FormData();
			body.append('file', file);
			const res = await fetch(`${base}/api/upload`, { method: 'POST', body });
			if (!res.ok) throw new Error(await res.text());
			const { url } = (await res.json()) as { url: string };
			screenshotUrl = url;
		} catch {
			uploadError = "Upload didn't work — try again?";
		} finally {
			uploading = false;
		}
	}
</script>

<div class="flex flex-col gap-4">
	{#if locked}
		<p class="rounded-xl bg-sky/40 p-3 text-sm font-bold text-wood-dark">
			Shipped projects are locked — email camp@hackclub.com if something's wrong.
		</p>
	{/if}

	<Input
		label="Project name"
		name="title"
		value={project?.title ?? ''}
		error={errors.title}
		required
		disabled={locked}
		placeholder="My awesome game"
	/>
	<Textarea
		label="What is it? What did you build?"
		name="description"
		value={project?.description ?? ''}
		error={errors.description}
		rows={5}
		placeholder="Tell other campers (and our reviewers) about your project..."
	/>
	<Input
		label="Code link (GitHub repo)"
		name="githubUrl"
		type="url"
		value={project?.githubUrl ?? ''}
		error={errors.githubUrl}
		disabled={locked}
		placeholder="https://github.com/you/project"
	/>
	<Input
		label="Play / demo link"
		name="playableUrl"
		type="url"
		value={project?.playableUrl ?? ''}
		error={errors.playableUrl}
		disabled={locked}
		placeholder="https://your-project.example.com"
	/>

	<div>
		<span class="mb-1 block font-bold text-wood-dark">Screenshot</span>
		{#if screenshotUrl}
			<img
				src={screenshotUrl}
				alt="Project screenshot"
				class="mb-2 max-h-56 rounded-xl border-4 border-wood"
			/>
		{/if}
		{#if !locked}
			<input
				type="file"
				accept="image/*"
				onchange={onFileChange}
				class="block text-sm text-wood-dark file:mr-3 file:cursor-pointer file:rounded-full file:border-4 file:border-wood file:bg-peach file:px-4 file:py-1 file:font-bold file:text-wood-dark"
			/>
			{#if uploading}<p class="mt-1 text-sm text-wood-dark">Uploading…</p>{/if}
			{#if uploadError}<p class="mt-1 text-sm font-bold text-berry">{uploadError}</p>{/if}
			{#if errors.screenshotUrl}
				<p class="mt-1 text-sm font-bold text-berry">{errors.screenshotUrl}</p>
			{/if}
		{/if}
		<input type="hidden" name="screenshotUrl" value={screenshotUrl} />
	</div>

	{#if !locked && !hideSubmit}
		<div class="flex gap-3">
			<Button type="submit" size="lg">Save</Button>
		</div>
	{/if}
</div>
