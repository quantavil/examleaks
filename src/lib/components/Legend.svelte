<script lang="ts">
	import type { Series } from '$lib/charts/types';

	let {
		series,
		counts
	}: {
		series: Series[];
		/** Optional per-series count shown after the label. */
		counts?: Record<string, number>;
	} = $props();
</script>

<ul class="legend" style="list-style:none;padding:0;margin:.15rem 0 0">
	{#each series as s (s.key)}
		<li class="legend-item">
			<span class="legend-swatch" style="background:{s.color}"></span>
			<span>{s.label}{#if counts}<span class="tnum muted"> · {counts[s.key] ?? 0}</span>{/if}</span>
		</li>
	{/each}
</ul>
