<script lang="ts">
	import { clampTooltip, rect, roundedRight } from '$lib/charts/scale';
	import type { Row, Series } from '$lib/charts/types';

	let {
		data,
		series,
		rowHeight = 22,
		rowGap = 10,
		valueFormat = (n: number) => String(n),
		selected = new Set<string>(),
		onselect,
		ariaLabel,
		unit = '',
		maxOverride
	}: {
		data: Row[];
		series: Series[];
		rowHeight?: number;
		rowGap?: number;
		valueFormat?: (n: number) => string;
		selected?: Set<string>;
		onselect?: (key: string) => void;
		ariaLabel: string;
		unit?: string;
		maxOverride?: number;
	} = $props();

	const GAP = 2; // surface gap between stacked segments
	const PAD_RIGHT = 8;

	let width = $state(0);
	let hover = $state<number | null>(null);
	let tipW = $state(190);
	let tipH = $state(90);

	const pitch = $derived(rowHeight + rowGap);
	const height = $derived(Math.max(pitch, data.length * pitch));
	const labelW = $derived(Math.round(Math.max(84, Math.min(width * 0.34, 172))));
	const valueW = $derived(data.length ? 52 : 0);
	const innerW = $derived(Math.max(24, width - labelW - valueW - PAD_RIGHT));
	const maxTotal = $derived(
		maxOverride ?? data.reduce((m, d) => Math.max(m, d.total), 0) ?? 0
	);

	const x = (v: number): number => (maxTotal > 0 ? (v / maxTotal) * innerW : 0);
	const rowY = (i: number): number => i * pitch;

	const hasSelection = $derived(selected.size > 0);

	function stack(row: Row) {
		const out: { key: string; color: string; path: string }[] = [];
		const visible = series.filter(
			(s) => (row.segments.find((g) => g.key === s.key)?.value ?? 0) > 0
		);

		let cursor = 0;
		for (let i = 0; i < visible.length; i += 1) {
			const s = visible[i];
			const value = row.segments.find((g) => g.key === s.key)?.value ?? 0;
			const xStart = labelW + x(cursor);
			const xEnd = labelW + x(cursor + value);
			const isLast = i === visible.length - 1;
			// 2px surface gap before every segment except the first.
			const left = xStart + (i === 0 ? 0 : GAP);
			const w = Math.max(1, xEnd - left);
			out.push({
				key: s.key,
				color: s.color,
				path: isLast ? roundedRight(left, 0, w, rowHeight, 4) : rect(left, 0, w, rowHeight)
			});
			cursor += value;
		}
		return out;
	}

	const tip = $derived.by(() => {
		if (hover === null || !data[hover] || width === 0) return null;
		const row = data[hover];
		const pos = clampTooltip(
			labelW + x(row.total) / 2,
			rowY(hover) + rowHeight / 2,
			tipW,
			tipH,
			width,
			height
		);
		return {
			row,
			left: pos.left,
			top: pos.top,
			rows: series
				.map((s) => ({
					label: s.label,
					color: s.color,
					value: row.segments.find((g) => g.key === s.key)?.value ?? 0
				}))
				.filter((r) => r.value > 0)
		};
	});
</script>

<div
	class="chart"
	bind:clientWidth={width}
	onpointerleave={() => (hover = null)}
	role="group"
	aria-label={ariaLabel}
>
	{#if width > 0}
		<svg {height} viewBox="0 0 {width} {height}" role="img" aria-label={ariaLabel}>
			<line class="baseline" x1={labelW} x2={labelW} y1={0} y2={height} />

			{#each data as row, i (row.key)}
				{@const dim = hasSelection && !selected.has(row.key) && hover !== i}
				<g transform="translate(0,{rowY(i)})" class="mark" class:is-dim={dim}>
					{#if hover === i}
						<rect class="hover-wash" x={0} y={-rowGap / 2} width={width} height={pitch} />
					{/if}

					{#if row.href}
						<a href={row.href} aria-label="Open {row.label}">
							<text
								class="cat-label"
								x={labelW - 10}
								y={rowHeight / 2}
								text-anchor="end"
								dominant-baseline="middle"
								style="text-decoration:underline;text-underline-offset:2px">{row.label}</text
							>
						</a>
					{:else}
						<text
							class="cat-label"
							x={labelW - 10}
							y={rowHeight / 2}
							text-anchor="end"
							dominant-baseline="middle">{row.label}</text
						>
					{/if}

					{#each stack(row) as seg (seg.key)}
						<path d={seg.path} fill={seg.color} />
					{/each}

					<text
						class="value-label"
						x={labelW + x(row.total) + 8}
						y={rowHeight / 2}
						dominant-baseline="middle">{valueFormat(row.total)}</text
					>
				</g>
			{/each}

			{#each data as row, i (row.key)}
				{#if onselect}
					<rect
						class="hit"
						x={0}
						y={rowY(i) - rowGap / 2}
						width={width}
						height={pitch}
						role="button"
						tabindex="0"
						aria-label={`${row.label}${row.sublabel ? `, ${row.sublabel}` : ''}: ${valueFormat(row.total)}${unit ? ` ${unit}` : ''}. Activate to filter.`}
						aria-pressed={selected.has(row.key)}
						onpointerenter={() => (hover = i)}
						onfocus={() => (hover = i)}
						onblur={() => (hover = null)}
						onclick={() => onselect(row.key)}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								onselect(row.key);
							}
						}}
					/>
				{:else}
					<!-- Hover affordance only; the row label is already a link and the
					     figure's data table carries the same values. -->
					<rect
						class="hit"
						x={0}
						y={rowY(i) - rowGap / 2}
						width={width}
						height={pitch}
						aria-hidden="true"
						onpointerenter={() => (hover = i)}
					/>
				{/if}
			{/each}
		</svg>
	{:else}
		<div style="height:{height}px"></div>
	{/if}

	{#if tip}
		<div
			class="chart-tooltip"
			style="left:{tip.left}px; top:{tip.top}px"
			bind:clientWidth={tipW}
			bind:clientHeight={tipH}
		>
			<div class="tt-title">{tip.row.label}</div>
			{#if tip.row.sublabel}
				<div class="tt-row" style="margin-bottom:.25rem">
					<span class="tt-key">{tip.row.sublabel}</span>
				</div>
			{/if}
			{#each tip.rows as r (r.label)}
				<div class="tt-row">
					<span class="tt-key">
						<span class="tt-swatch" style="background:{r.color}"></span>{r.label}
					</span>
					<span class="tt-val">{valueFormat(r.value)}</span>
				</div>
			{/each}
			{#if tip.rows.length > 1}
				<div class="tt-row" style="margin-top:.25rem">
					<span class="tt-key" style="font-weight:700;color:var(--ink)">Total</span>
					<span class="tt-val">{valueFormat(tip.row.total)}</span>
				</div>
			{/if}
			{#if tip.row.foot}
				<div class="tt-foot">{tip.row.foot}</div>
			{:else if onselect}
				<div class="tt-foot">Click to filter the page</div>
			{/if}
		</div>
	{/if}
</div>
