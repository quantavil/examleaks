<script lang="ts">
	import ColumnChart from '$lib/components/ColumnChart.svelte';
	import Figure from '$lib/components/Figure.svelte';
	import Seo from '$lib/components/Seo.svelte';

	import { MAX_YEAR, MIN_YEAR, YEARS, activeYears, incidents } from '$lib/data';
	import { byYear } from '$lib/data/stats';
	import { STATUSES, STATUS_ORDER } from '$lib/data/types';
	import { compact, num } from '$lib/format';
	import { SITE_NAME, abs } from '$lib/site';

	const statusSeries = STATUSES.map((s) => ({ key: s.key, label: s.label, color: s.color }));
	const buckets = byYear(incidents, YEARS);
	const columns = buckets.map((b) => ({
		key: String(b.year),
		label: String(b.year),
		segments: STATUS_ORDER.map((s) => ({ key: s, value: b.byStatus[s] })),
		total: b.total
	}));

	const withRecords = buckets.filter((b) => b.total > 0).reverse();
	const emptyYears = YEARS.filter((y) => !activeYears.some((a) => a.year === y));

	const description = `Indian examination leak incidents year by year, ${MIN_YEAR} to ${MAX_YEAR} — ${incidents.length} documented incidents, each linked to its source.`;

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: 'Indian exam leaks by year',
		description,
		url: abs('/years'),
		isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: abs('/') },
		mainEntity: {
			'@type': 'ItemList',
			numberOfItems: activeYears.length,
			itemListElement: activeYears.map((y, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				url: abs(`/year/${y.year}`),
				name: String(y.year)
			}))
		}
	};
</script>

<Seo title="Exam leaks by year" {description} path="/years" {jsonLd} />

<main id="main">
	<header class="wrap" style="padding-block:clamp(2rem,5vw,3.5rem) 0">
		<p class="kicker">Chronology</p>
		<h1 class="display" style="margin-top:.9rem;font-size:clamp(2.2rem,6vw,4rem)">
			{MIN_YEAR} to {MAX_YEAR}, year by year.
		</h1>
		<p class="standfirst" style="margin-top:1.25rem">
			{incidents.length} documented incidents across {activeYears.length} years with records.
			{#if emptyYears.length > 0}
				Nothing is recorded for {emptyYears.join(', ')} — near-certainly a gap in coverage rather than
				a clean year.
			{/if}
		</p>
		<hr class="rule-double" style="margin-top:1.75rem" />
	</header>

	<section class="section" style="border-top:0">
		<div class="wrap">
			<Figure
				title="Incidents per year"
				series={statusSeries}
				note="Colour runs dark to light with the strength of the evidence; grey means the claim was officially investigated and rejected."
				table={{
					head: ['Year', ...STATUS_ORDER, 'Total', 'Candidates affected'],
					rows: buckets
						.filter((b) => b.total > 0)
						.map((b) => [
							b.year,
							...STATUS_ORDER.map((s) => b.byStatus[s]),
							b.total,
							b.affected ? num(b.affected) : '—'
						])
				}}
			>
				<ColumnChart
					data={columns}
					series={statusSeries}
					height={300}
					ariaLabel="Documented Indian examination leak incidents per year, {MIN_YEAR} to {MAX_YEAR}"
					unit="incidents"
				/>
			</Figure>
		</div>
	</section>

	<section class="section is-tinted">
		<div class="wrap">
			<div class="section-head">
				<p class="num">Browse</p>
				<h2>Open a year</h2>
			</div>
			<div class="year-grid">
				{#each withRecords as bucket (bucket.year)}
					<a class="year-card" href="/year/{bucket.year}">
						<span class="yc-year tnum">{bucket.year}</span>
						<span class="yc-count tnum">{bucket.total}</span>
						<span class="micro">{bucket.total === 1 ? 'incident' : 'incidents'}</span>
						{#if bucket.affected > 0}
							<span class="micro">{compact(bucket.affected)} candidates</span>
						{/if}
					</a>
				{/each}
			</div>
		</div>
	</section>
</main>

<style>
	.year-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 1px;
		background: var(--rule);
		border: 1px solid var(--rule);
	}

	.year-card {
		background: var(--paper-alt);
		padding: 1rem;
		display: grid;
		gap: 0.1rem;
		text-decoration: none;
		align-content: start;
	}

	.year-card:hover {
		background: var(--surface);
		color: inherit;
	}

	.yc-year {
		font-family: var(--font-sans);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: var(--ink-3);
	}

	.year-card:hover .yc-year {
		color: var(--accent);
	}

	.yc-count {
		font-family: var(--font-sans);
		font-size: 1.9rem;
		font-weight: 700;
		line-height: 1;
		letter-spacing: -0.03em;
	}
</style>
