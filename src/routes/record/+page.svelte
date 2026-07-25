<script lang="ts">
	import { untrack } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/state';

	import FilterBar from '$lib/components/FilterBar.svelte';
	import IncidentDrawer from '$lib/components/IncidentDrawer.svelte';
	import IncidentTable from '$lib/components/IncidentTable.svelte';
	import Seo from '$lib/components/Seo.svelte';

	import { MAX_YEAR, MIN_YEAR, byId, incidents } from '$lib/data';
	import { byBody, byPlace, countByStatus } from '$lib/data/stats';
	import type { Incident } from '$lib/data/types';
	import { applyFilter, applyParams, emptyFilter, filterToParams } from '$lib/filters';
	import { num } from '$lib/format';
	import { SITE_NAME, abs } from '$lib/site';

	const filter = $state(emptyFilter());
	let selected = $state<Incident | null>(null);

	const filtered = $derived(applyFilter(incidents, filter));
	const allCounts = countByStatus(incidents);

	const PLACE_LABELS: Record<string, string> = Object.fromEntries(
		byPlace(incidents).map((p) => [p.slug, p.name])
	);
	const BODY_LABELS: Record<string, string> = Object.fromEntries(
		byBody(incidents).map((b) => [b.key, b.label])
	);

	// Read the query string on arrival and on any SvelteKit navigation — this is
	// how a selection made on the dashboard lands here intact. Guarded to the
	// browser because a prerendered page must not touch url.searchParams on the
	// server; untracked so writing the filter cannot re-trigger the read.
	$effect(() => {
		const search = page.url.search;
		untrack(() => applyParams(filter, new URLSearchParams(search)));
	});

	// Mirror the filter back into the address bar so any view is shareable.
	// Native replaceState, so it does not feed back into page.url above.
	$effect(() => {
		const query = filterToParams(filter).toString();
		if (!browser) return;
		history.replaceState(history.state, '', query ? `?${query}` : location.pathname);
	});

	function openIncident(incident: Incident): void {
		selected = incident;
	}

	// /record?incident=PL-0093 opens straight into a record.
	$effect(() => {
		const id = new URLSearchParams(location.search).get('incident');
		if (id) selected = byId.get(id) ?? null;
	});

	const description = `Search and filter every documented Indian examination leak incident, ${MIN_YEAR}–${MAX_YEAR}. ${incidents.length} incidents, each linked to the report it was drawn from.`;

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: 'The record — every documented Indian exam leak',
		description,
		url: abs('/record'),
		isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: abs('/') },
		mainEntity: {
			'@type': 'ItemList',
			numberOfItems: incidents.length,
			itemListElement: incidents.map((incident, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				url: abs(`/incident/${incident.id}`),
				name: incident.examName
			}))
		}
	};
</script>

<Seo
	title="The record"
	{description}
	path="/record"
	{jsonLd}
	keywords={['exam paper leak database', 'India', 'searchable record', 'recruitment exam scam']}
/>

<main id="main">
	<header class="wrap" style="padding-block:clamp(1.75rem,4vw,2.75rem) 0">
		<p class="kicker">The record</p>
		<h1 style="margin-top:.85rem;font-size:clamp(1.9rem,4.4vw,2.9rem)">
			Every incident, every source.
		</h1>
		<p class="dek" style="margin-top:.85rem;max-width:62ch">
			{num(incidents.length)} documented incidents, {MIN_YEAR}–{MAX_YEAR}. Search the exam names,
			bodies, states and summaries; sort any column; select a row for the full account and the
			report it came from.
		</p>
	</header>

	<div class="wrap">
		<FilterBar
			{filter}
			counts={allCounts}
			shown={filtered.length}
			total={incidents.length}
			placeLabels={PLACE_LABELS}
			bodyLabels={BODY_LABELS}
		/>

		<div style="padding-block:1.5rem 4rem">
			<IncidentTable list={filtered} onselect={openIncident} />
		</div>
	</div>
</main>

{#if selected}
	<IncidentDrawer incident={selected} onclose={() => (selected = null)} />
{/if}
