<script lang="ts">
	import { STATUSES } from '$lib/data/types';
	import type { StatusCounts } from '$lib/data/stats';
	import { isActive, resetFilter, toggle } from '$lib/filters';
	import type { Filter } from '$lib/filters';
	import { num } from '$lib/format';

	let {
		filter,
		counts,
		shown,
		total,
		placeLabels = {},
		bodyLabels = {},
		recordHref,
		showSearch = true
	}: {
		/** A $state proxy owned by the page — mutations here flow back up. */
		filter: Filter;
		counts: StatusCounts;
		shown: number;
		total: number;
		placeLabels?: Record<string, string>;
		bodyLabels?: Record<string, string>;
		/** When set, renders the hand-off to the record with this selection. */
		recordHref?: string;
		showSearch?: boolean;
	} = $props();

	const BODY_TYPES: { key: Filter['bodyType']; label: string }[] = [
		{ key: 'all', label: 'All bodies' },
		{ key: 'Central', label: 'Central' },
		{ key: 'State', label: 'State' }
	];

	const ERAS: { key: Filter['era']; label: string }[] = [
		{ key: 'all', label: 'All years' },
		{ key: 'upa', label: 'UPA 2004–14' },
		{ key: 'nda', label: 'NDA 2014–' }
	];

	const active = $derived(isActive(filter));

	const pins = $derived([
		...filter.years.map((y) => ({
			label: String(y),
			kind: 'Year',
			remove: () => toggle(filter.years, y)
		})),
		...filter.places.map((slug) => ({
			label: placeLabels[slug] ?? slug,
			kind: 'Place',
			remove: () => toggle(filter.places, slug)
		})),
		...filter.bodies.map((key) => ({
			label: bodyLabels[key] ?? key,
			kind: 'Body',
			remove: () => toggle(filter.bodies, key)
		}))
	]);
</script>

<div class="filter-bar" id="filters">
	<div class="fb-row">
		{#if showSearch}
			<div class="field" style="flex:1 1 15rem;max-width:24rem">
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
					<circle cx="11" cy="11" r="7" /><path d="M20 20l-3.6-3.6" />
				</svg>
				<input
					type="search"
					placeholder="Search exams, bodies, states, notes…"
					aria-label="Search the record"
					bind:value={filter.query}
				/>
			</div>
		{/if}

		<p class="fb-count ui">
			<strong class="tnum">{num(shown)}</strong>
			<span class="muted">of {num(total)} incidents</span>
		</p>

		{#if active}
			<button class="btn btn-sm" onclick={() => resetFilter(filter)}>Clear all filters</button>
		{/if}

		{#if recordHref}
			<a class="btn btn-sm btn-primary" href={recordHref}>
				See {active ? `these ${num(shown)}` : 'all'}
				{shown === 1 ? 'incident' : 'incidents'} →
			</a>
		{/if}
	</div>

	<div class="fb-row fb-facets">
		<div class="chip-group" role="group" aria-label="Filter by evidentiary status">
			{#each STATUSES as status (status.key)}
				<button
					class="chip"
					aria-pressed={filter.statuses.includes(status.key)}
					title={status.blurb}
					onclick={() => toggle(filter.statuses, status.key)}
				>
					<span class="swatch" style="background:{status.color}"></span>
					{status.label}
					<span class="count">{counts[status.key]}</span>
				</button>
			{/each}
		</div>

		<span class="fb-sep" aria-hidden="true"></span>

		<div class="chip-group" role="group" aria-label="Filter by conducting body type">
			{#each BODY_TYPES as option (option.key)}
				<button
					class="chip"
					aria-pressed={filter.bodyType === option.key}
					onclick={() => (filter.bodyType = option.key)}>{option.label}</button
				>
			{/each}
		</div>

		<span class="fb-sep" aria-hidden="true"></span>

		<div class="chip-group" role="group" aria-label="Filter by political period">
			{#each ERAS as option (option.key)}
				<button
					class="chip"
					aria-pressed={filter.era === option.key}
					onclick={() => (filter.era = option.key)}>{option.label}</button
				>
			{/each}
		</div>
	</div>

	{#if pins.length > 0}
		<div class="fb-row">
			<span class="micro" style="font-weight:700">From the charts:</span>
			<div class="chip-group">
				{#each pins as pin (pin.kind + pin.label)}
					<button class="chip chip-remove" onclick={pin.remove}>
						<span class="muted">{pin.kind}</span>
						{pin.label}
						<span aria-hidden="true">×</span>
						<span class="sr-only">remove filter</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.filter-bar {
		display: grid;
		gap: 0.7rem;
		padding: 1rem 0 1.1rem;
		border-top: 1px solid var(--rule);
		border-bottom: 2px solid var(--ink);
	}

	.fb-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem 0.9rem;
	}

	.fb-facets {
		gap: 0.5rem 0.75rem;
	}

	.fb-count {
		font-size: 0.82rem;
		margin-left: auto;
		white-space: nowrap;
	}

	.fb-count strong {
		font-size: 1.05rem;
	}

	.fb-sep {
		width: 1px;
		align-self: stretch;
		background: var(--rule);
		margin-inline: 0.15rem;
	}

	@media (max-width: 720px) {
		.fb-sep {
			display: none;
		}
		.fb-count {
			margin-left: 0;
		}
	}
</style>
