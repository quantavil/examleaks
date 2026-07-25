<script lang="ts">
	import BarChart from '$lib/components/BarChart.svelte';
	import Figure from '$lib/components/Figure.svelte';
	import Seo from '$lib/components/Seo.svelte';

	import { PLACES, activePlaces, incidents } from '$lib/data';
	import { byPlace } from '$lib/data/stats';
	import { STATUSES, STATUS_ORDER } from '$lib/data/types';
	import type { Zone } from '$lib/data/places';
	import { compact, num } from '$lib/format';
	import { SITE_NAME, abs } from '$lib/site';

	const buckets = byPlace(incidents);
	const statusSeries = STATUSES.map((s) => ({ key: s.key, label: s.label, color: s.color }));

	const rows = buckets.map((p) => ({
		key: p.slug,
		label: p.name,
		href: `/state/${p.slug}`,
		segments: STATUS_ORDER.map((s) => ({ key: s, value: p.byStatus[s] })),
		total: p.total
	}));

	const ZONES: Zone[] = ['National', 'North', 'Central', 'West', 'East', 'South', 'North-East'];

	const zoneOf = (slug: string): Zone => PLACES.find((p) => p.slug === slug)?.zone ?? 'North';

	const grouped = ZONES.map((zone) => ({
		zone,
		places: buckets.filter((b) => zoneOf(b.slug) === zone)
	})).filter((g) => g.places.length > 0);

	const untouched = PLACES.filter((p) => !activePlaces.some((a) => a.slug === p.slug));

	const description = `Documented examination leak incidents in India broken down by state and union territory — ${activePlaces.length} jurisdictions, ${incidents.length} incidents, each linked to its source.`;

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: 'Indian exam leaks by state',
		description,
		url: abs('/states'),
		isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: abs('/') },
		mainEntity: {
			'@type': 'ItemList',
			numberOfItems: buckets.length,
			itemListElement: buckets.map((p, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				url: abs(`/state/${p.slug}`),
				name: p.name
			}))
		}
	};
</script>

<Seo title="Exam leaks by state" {description} path="/states" {jsonLd} />

<main id="main">
	<header class="wrap" style="padding-block:clamp(2rem,5vw,3.5rem) 0">
		<p class="kicker">Geography</p>
		<h1 class="display" style="margin-top:.9rem;font-size:clamp(2.2rem,6vw,4rem)">
			Every state in the record.
		</h1>
		<p class="standfirst" style="margin-top:1.25rem">
			{activePlaces.length} of India's {PLACES.length - 1} states and union territories appear in this
			record, plus a separate entry for nationwide examinations. Each has its own page.
		</p>
		<hr class="rule-double" style="margin-top:1.75rem" />
	</header>

	<section class="section" style="border-top:0">
		<div class="wrap">
			<Figure
				title="Incidents by state or territory"
				subtitle="Ranked. Click a state's name to open its page."
				series={statusSeries}
				note="Nationwide examinations are grouped under “All India” rather than attributed to every state. An incident spanning two states counts in both."
				table={{
					head: ['Place', ...STATUS_ORDER, 'Total', 'Candidates affected'],
					rows: buckets.map((p) => [
						p.name,
						...STATUS_ORDER.map((s) => p.byStatus[s]),
						p.total,
						p.affected ? num(p.affected) : '—'
					])
				}}
			>
				<BarChart
					data={rows}
					series={statusSeries}
					ariaLabel="All Indian states and territories ranked by documented examination leak incidents"
					unit="incidents"
				/>
			</Figure>
		</div>
	</section>

	<section class="section is-tinted">
		<div class="wrap">
			<div class="section-head">
				<p class="num">By region</p>
				<h2>Browse the state pages</h2>
			</div>

			{#each grouped as group (group.zone)}
				<div class="zone">
					<h3 class="zone-h">{group.zone === 'National' ? 'Nationwide' : `${group.zone} India`}</h3>
					<div class="zone-grid">
						{#each group.places as place (place.slug)}
							<a class="place-card" href="/state/{place.slug}">
								<span class="pc-count tnum">{place.total}</span>
								<span class="pc-name">{place.name}</span>
								<span class="micro">
									{place.byStatus.Confirmed} confirmed
									{#if place.affected > 0}· {compact(place.affected)} candidates{/if}
								</span>
							</a>
						{/each}
					</div>
				</div>
			{/each}

			{#if untouched.length > 0}
				<div class="callout is-quiet" style="margin-top:2rem">
					<p class="micro">
						<strong style="color:var(--ink-2)">No incidents recorded (yet) in:</strong>
						{untouched.map((p) => p.name).join(', ')}. That is almost certainly a gap in the record
						rather than a clean bill of health — regional-language reporting is badly
						under-represented here. <a href="/contribute">Help fill it in.</a>
					</p>
				</div>
			{/if}
		</div>
	</section>
</main>

<style>
	.zone + .zone {
		margin-top: 2.25rem;
	}

	.zone-h {
		font-family: var(--font-sans);
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--ink-3);
		border-bottom: 1px solid var(--rule);
		padding-bottom: 0.5rem;
		margin-bottom: 1rem;
	}

	.zone-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1px;
		background: var(--rule);
		border: 1px solid var(--rule);
	}

	.place-card {
		background: var(--paper-alt);
		padding: 0.95rem 1rem;
		display: grid;
		gap: 0.15rem;
		text-decoration: none;
		align-content: start;
	}

	.place-card:hover {
		background: var(--surface);
		color: inherit;
	}

	.pc-count {
		font-family: var(--font-sans);
		font-size: 1.5rem;
		font-weight: 700;
		line-height: 1;
		letter-spacing: -0.02em;
	}

	.pc-name {
		font-family: var(--font-sans);
		font-size: 0.88rem;
		font-weight: 600;
		line-height: 1.25;
	}

	.place-card:hover .pc-name {
		color: var(--accent);
	}
</style>
