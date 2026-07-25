<script lang="ts">
	import { num, pctStr } from '$lib/format';

	let {
		label,
		value,
		total,
		note,
		color = 'var(--series-1)'
	}: {
		label: string;
		value: number;
		total: number;
		note?: string;
		color?: string;
	} = $props();

	const share = $derived(total > 0 ? Math.min(100, (value / total) * 100) : 0);
</script>

<div class="meter-row">
	<div class="meter-head">
		<span class="meter-label">{label}</span>
		<span class="meter-figure">
			{num(value)}<span class="pct">{pctStr(value, total)}</span>
		</span>
	</div>
	<div
		class="meter-track"
		role="meter"
		aria-valuenow={value}
		aria-valuemin={0}
		aria-valuemax={total}
		aria-label={`${label}: ${num(value)} of ${num(total)}`}
	>
		<div class="meter-fill" style="width:{share}%; background:{color}"></div>
	</div>
	{#if note}<p class="meter-note">{note}</p>{/if}
</div>
