<script lang="ts">
	import { clampTooltip, niceScale, rect, roundedTop } from '$lib/charts/scale';
	import type { Band, Column, Series } from '$lib/charts/types';

	let {
		data,
		series,
		height = 320,
		tickFormat = (n: number) => String(n),
		valueFormat = (n: number) => String(n),
		bands = [],
		selected = new Set<string>(),
		onselect,
		ariaLabel,
		barMaxWidth = 46,
		unit = ''
	}: {
		data: Column[];
		series: Series[];
		height?: number;
		tickFormat?: (n: number) => string;
		valueFormat?: (n: number) => string;
		bands?: Band[];
		selected?: Set<string>;
		onselect?: (key: string) => void;
		ariaLabel: string;
		barMaxWidth?: number;
		unit?: string;
	} = $props();

	const PAD = { top: 20, right: 8, bottom: 28, left: 46 };
	const GAP = 2; // surface gap between stacked segments

	let width = $state(0);
	let hover = $state<number | null>(null);
	let tipW = $state(180);
	let tipH = $state(90);

	const innerW = $derived(Math.max(40, width - PAD.left - PAD.right));
	const innerH = $derived(Math.max(60, height - PAD.top - PAD.bottom));
	const maxTotal = $derived(data.reduce((m, d) => Math.max(m, d.total), 0));
	const scale = $derived(niceScale(maxTotal, 4));
	const step = $derived(data.length ? innerW / data.length : innerW);
	const barW = $derived(Math.max(3, Math.min(barMaxWidth, step * 0.68)));

	const y = (v: number): number => PAD.top + innerH - (v / scale.max) * innerH;
	const colX = (i: number): number => PAD.left + i * step + (step - barW) / 2;

	const labelEvery = $derived(
		Math.max(1, Math.ceil(data.length / Math.max(1, Math.floor(innerW / 40))))
	);

	/**
	 * Ticks at a fixed interval, plus the final category so the axis always
	 * states where the series ends. If that last one lands too close to the
	 * regular tick before it — which it does on a phone, where 2024 and 2026
	 * are 24px apart and the labels are wider than that — the regular tick
	 * gives way rather than the two printing on top of each other.
	 */
	const labelIndices = $derived.by(() => {
		const last = data.length - 1;
		if (last < 0) return new Set<number>();

		const out = new Set<number>();
		for (let i = 0; i < last; i += labelEvery) {
			if (last - i >= labelEvery) out.add(i);
		}
		out.add(last);
		return out;
	});

	const hasSelection = $derived(selected.size > 0);

	const bandRects = $derived(
		bands
			.map((b) => {
				const start = data.findIndex((d) => d.key === b.from);
				const end = data.findIndex((d) => d.key === b.to);
				if (start === -1 || end === -1) return null;
				return { label: b.label, x: PAD.left + start * step, w: (end - start + 1) * step };
			})
			.filter((b): b is { label: string; x: number; w: number } => b !== null)
	);

	/** Stacked geometry for one column, in coordinates local to its group. */
	function stack(col: Column) {
		const out: { key: string; color: string; path: string }[] = [];
		const visible = series.filter(
			(s) => (col.segments.find((g) => g.key === s.key)?.value ?? 0) > 0
		);

		let cursor = 0;
		for (let i = 0; i < visible.length; i += 1) {
			const s = visible[i];
			const value = col.segments.find((g) => g.key === s.key)?.value ?? 0;
			const yBottom = y(cursor);
			const yTop = y(cursor + value);
			// Reserve a 2px surface gap above every segment except the lowest.
			const h = Math.max(1, yBottom - yTop - (i === 0 ? 0 : GAP));
			const yy = yBottom - h;
			const isTop = i === visible.length - 1;
			out.push({
				key: s.key,
				color: s.color,
				path: isTop ? roundedTop(0, yy, barW, h, 4) : rect(0, yy, barW, h)
			});
			cursor += value;
		}
		return out;
	}

	const tip = $derived.by(() => {
		if (hover === null || !data[hover] || width === 0) return null;
		const col = data[hover];
		const cx = PAD.left + hover * step + step / 2;
		const pos = clampTooltip(cx, y(col.total), tipW, tipH, width, height);
		return {
			col,
			left: pos.left,
			top: pos.top,
			rows: series
				.map((s) => ({
					label: s.label,
					color: s.color,
					value: col.segments.find((g) => g.key === s.key)?.value ?? 0
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
			<!-- Alternate bands are shaded; every boundary gets a dashed divider,
			     so two adjacent eras never read as one uniform wash. -->
			{#each bandRects as band, bi (band.label)}
				{#if bi % 2 === 0}
					<rect class="band" x={band.x} y={PAD.top} width={band.w} height={innerH} />
				{/if}
				{#if bi > 0}
					<line
						class="band-divider"
						x1={band.x}
						x2={band.x}
						y1={PAD.top - 2}
						y2={PAD.top + innerH}
					/>
				{/if}
				<text class="band-label" x={band.x + 6} y={PAD.top - 7}>{band.label}</text>
			{/each}

			{#each scale.ticks as t (t)}
				<line class="gridline" x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} />
				<text
					class="tick-label"
					x={PAD.left - 9}
					y={y(t)}
					text-anchor="end"
					dominant-baseline="middle">{tickFormat(t)}</text
				>
			{/each}

			{#if hover !== null}
				<rect
					class="hover-wash"
					x={PAD.left + hover * step}
					y={PAD.top}
					width={step}
					height={innerH}
				/>
			{/if}

			{#each data as col, i (col.key)}
				<g
					transform="translate({colX(i)},0)"
					class="mark"
					class:is-dim={hasSelection && !selected.has(col.key) && hover !== i}
				>
					{#each stack(col) as seg (seg.key)}
						<path d={seg.path} fill={seg.color} />
					{/each}
				</g>
			{/each}

			<line
				class="baseline"
				x1={PAD.left}
				x2={width - PAD.right}
				y1={PAD.top + innerH}
				y2={PAD.top + innerH}
			/>

			{#each data as col, i (col.key)}
				{#if labelIndices.has(i)}
					<text
						class="tick-label"
						x={PAD.left + i * step + step / 2}
						y={PAD.top + innerH + 16}
						text-anchor="middle">{col.label}</text
					>
				{/if}
			{/each}

			{#each data as col, i (col.key)}
				{#if onselect}
					<rect
						class="hit"
						x={PAD.left + i * step}
						y={PAD.top}
						width={step}
						height={innerH}
						role="button"
						tabindex="0"
						aria-label={`${col.fullLabel ?? col.label}: ${valueFormat(col.total)}${unit ? ` ${unit}` : ''}. Activate to filter.`}
						aria-pressed={selected.has(col.key)}
						onpointerenter={() => (hover = i)}
						onfocus={() => (hover = i)}
						onblur={() => (hover = null)}
						onclick={() => onselect(col.key)}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								onselect(col.key);
							}
						}}
					/>
				{:else}
					<!-- Hover affordance only; the figure's data table carries the
					     same values for keyboard and screen-reader users. -->
					<rect
						class="hit"
						x={PAD.left + i * step}
						y={PAD.top}
						width={step}
						height={innerH}
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
			<div class="tt-title">{tip.col.fullLabel ?? tip.col.label}</div>
			{#each tip.rows as row (row.label)}
				<div class="tt-row">
					<span class="tt-key">
						<span class="tt-swatch" style="background:{row.color}"></span>{row.label}
					</span>
					<span class="tt-val">{valueFormat(row.value)}</span>
				</div>
			{/each}
			{#if tip.rows.length === 0}
				<div class="tt-row"><span class="tt-key">No records</span></div>
			{:else if tip.rows.length > 1}
				<div class="tt-row" style="margin-top:.25rem">
					<span class="tt-key" style="font-weight:700;color:var(--ink)">Total</span>
					<span class="tt-val">{valueFormat(tip.col.total)}</span>
				</div>
			{/if}
			{#if tip.col.foot}
				<div class="tt-foot">{tip.col.foot}</div>
			{:else if onselect}
				<div class="tt-foot">Click to filter the page</div>
			{/if}
		</div>
	{/if}
</div>
