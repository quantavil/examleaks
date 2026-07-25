<script lang="ts">
	let {
		label,
		value,
		unit,
		foot,
		title
	}: {
		label: string;
		value: string;
		unit?: string;
		foot?: string;
		title?: string;
	} = $props();
</script>

<div class="kpi" {title}>
	<div class="kpi-label">{label}</div>
	<div class="kpi-value">
		{value}{#if unit}<span class="unit">{unit}</span>{/if}
	</div>
	{#if foot}<div class="kpi-foot">{foot}</div>{/if}
</div>
