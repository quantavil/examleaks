<script lang="ts">
	import { statusMeta } from '$lib/data/types';
	import type { LeakStatus } from '$lib/data/types';

	let { status, title }: { status: LeakStatus; title?: boolean } = $props();
	const meta = $derived(statusMeta(status));
</script>

<span class="pill" title={title ? meta.blurb : undefined}>
	<span class="dot" style="background:{meta.color}"></span>{meta.label}
</span>
