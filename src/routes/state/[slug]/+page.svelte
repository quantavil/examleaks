<script lang="ts">
	import ColumnChart from '$lib/components/ColumnChart.svelte';
	import Figure from '$lib/components/Figure.svelte';
	import IncidentDrawer from '$lib/components/IncidentDrawer.svelte';
	import IncidentTable from '$lib/components/IncidentTable.svelte';
	import KpiTile from '$lib/components/KpiTile.svelte';
	import Seo from '$lib/components/Seo.svelte';

	import { MAX_YEAR, MIN_YEAR, YEARS } from '$lib/data';
	import { byBody, byYear, totals } from '$lib/data/stats';
	import { STATUSES, STATUS_ORDER } from '$lib/data/types';
	import type { Incident } from '$lib/data/types';
	import { compactParts, num, pctStr } from '$lib/format';
	import { SITE_NAME, abs } from '$lib/site';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let selected = $state<Incident | null>(null);

	const place = $derived(data.place);
	const list = $derived(data.list);
	const t = $derived(totals(list));
	const affectedParts = $derived(compactParts(t.affected));
	const bodies = $derived(byBody(list).slice(0, 8));

	const statusSeries = STATUSES.map((s) => ({ key: s.key, label: s.label, color: s.color }));
	const yearBuckets = $derived(byYear(list, YEARS));
	const columns = $derived(
		yearBuckets.map((b) => ({
			key: String(b.year),
			label: String(b.year),
			segments: STATUS_ORDER.map((s) => ({ key: s, value: b.byStatus[s] })),
			total: b.total
		}))
	);

	const firstYear = $derived(list.length ? list[0].year : MIN_YEAR);
	const lastYear = $derived(list.length ? list[list.length - 1].year : MAX_YEAR);

	const heading = $derived(place.national ? 'Nationwide examinations' : place.name);

	const description = $derived(
		`${list.length} documented examination leak ${list.length === 1 ? 'incident' : 'incidents'} ` +
			`${place.national ? 'in nationwide Indian examinations' : `in ${place.name}, India`}, ${firstYear}–${lastYear}. ` +
			`${t.byStatus.Confirmed} officially confirmed; ${t.voided} exams cancelled or re-held.`
	);

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: `${heading} — examination leak record`,
		description,
		url: abs(`/state/${place.slug}`),
		isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: abs('/') },
		about: place.national
			? { '@type': 'Country', name: 'India' }
			: { '@type': 'AdministrativeArea', name: place.name, containedInPlace: { '@type': 'Country', name: 'India' } },
		mainEntity: {
			'@type': 'ItemList',
			numberOfItems: list.length,
			itemListElement: list.slice(0, 25).map((incident, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				url: abs(`/incident/${incident.id}`),
				name: incident.examName
			}))
		}
	});
</script>

<Seo
	title={`${heading} exam leaks`}
	{description}
	path={`/state/${place.slug}`}
	image={`/og/state/${place.slug}.svg`}
	imageAlt="Examination leak record for {heading}"
	{jsonLd}
	keywords={[place.name, 'exam paper leak', 'recruitment exam scam', 'India']}
/>

<main id="main">
	<header class="wrap" style="padding-block:clamp(2rem,5vw,3.5rem) 0">
		<nav class="micro" aria-label="Breadcrumb" style="display:flex;gap:.4rem">
			<a href="/" style="text-decoration:none;color:var(--ink-2)">Dashboard</a>
			<span aria-hidden="true">/</span>
			<a href="/states" style="text-decoration:none;color:var(--ink-2)">States</a>
			<span aria-hidden="true">/</span>
			<span>{place.name}</span>
		</nav>

		<p class="kicker" style="margin-top:1.1rem">
			{place.national ? 'All-India examinations' : `${place.zone} India`} · ranked #{data.rank} of {data.totalPlaces}
		</p>

		<h1 class="display" style="margin-top:.85rem;font-size:clamp(2.2rem,6vw,4rem)">{heading}</h1>

		<p class="standfirst" style="margin-top:1.25rem">
			{#if place.national}
				<strong style="color:var(--ink)">{list.length}</strong> nationwide examinations — NEET, SSC,
				CBSE boards, railway and army recruitment — are recorded here as compromised between {firstYear}
				and {lastYear}. These affect candidates in every state.
			{:else}
				<strong style="color:var(--ink)">{list.length}</strong>
				{list.length === 1 ? 'examination' : 'examinations'} conducted in or for {place.name} are recorded
				here as compromised between {firstYear} and {lastYear}, of which
				<strong style="color:var(--ink)">{t.byStatus.Confirmed}</strong> were officially confirmed.
			{/if}
		</p>

		<hr class="rule-double" style="margin-top:1.75rem" />
	</header>

	<div class="wrap">
		<div class="kpi-grid" style="border-top:0">
			<KpiTile label="Incidents" value={num(t.incidents)} foot="{firstYear}–{lastYear}" />
			<KpiTile
				label="Confirmed"
				value={num(t.byStatus.Confirmed)}
				foot="{pctStr(t.byStatus.Confirmed, t.incidents)} of the total"
			/>
			<KpiTile
				label="Candidates affected"
				value={affectedParts.value}
				unit={affectedParts.unit}
				foot="reported in {t.affectedRecorded} incidents"
			/>
			<KpiTile label="Exams voided" value={num(t.voided)} foot="cancelled or re-held" />
			<KpiTile
				label="Arrests recorded"
				value={num(t.arrests)}
				foot="across {t.arrestsRecorded} incidents"
			/>
			<KpiTile label="Bodies involved" value={num(t.distinctBodies)} foot="examination authorities" />
		</div>
	</div>

	<section class="section">
		<div class="wrap">
			<div class="grid-side">
				<Figure
					title="Incidents per year"
					subtitle="Shown against the full {MIN_YEAR}–{MAX_YEAR} range so gaps are visible."
					series={statusSeries}
					note="An empty year means nothing is recorded here for that year — not necessarily that nothing happened."
					table={{
						head: ['Year', ...STATUS_ORDER, 'Total'],
						rows: yearBuckets
							.filter((b) => b.total > 0)
							.map((b) => [b.year, ...STATUS_ORDER.map((s) => b.byStatus[s]), b.total])
					}}
				>
					<ColumnChart
						data={columns}
						series={statusSeries}
						height={260}
						ariaLabel="Documented examination leak incidents per year in {heading}"
						unit="incidents"
					/>
				</Figure>

				<div class="card" style="padding:1.15rem">
					<p class="kicker is-muted">Bodies involved</p>
					<ul class="body-list">
						{#each bodies as body (body.key)}
							<li>
								<span class="bl-name">{body.label}</span>
								<span class="bl-type micro">{body.bodyType}</span>
								<span class="bl-count tnum">{body.total}</span>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</div>
	</section>

	<section class="section" style="border-top:0;padding-top:0">
		<div class="wrap">
			<div class="section-head">
				<p class="num">The record</p>
				<h2>Every {place.national ? 'nationwide' : place.name} incident</h2>
			</div>
			<IncidentTable {list} onselect={(incident) => (selected = incident)} />
		</div>
	</section>

	<section class="section is-tinted">
		<div class="wrap">
			<p class="kicker is-muted">Elsewhere in the record</p>
			<div class="chip-group" style="margin-top:.9rem">
				{#each data.neighbours as other (other.slug)}
					<a class="chip" href="/state/{other.slug}" style="text-decoration:none">
						{other.name}<span class="count">{other.count}</span>
					</a>
				{/each}
				<a class="chip" href="/states" style="text-decoration:none">All states →</a>
			</div>
		</div>
	</section>
</main>

{#if selected}
	<IncidentDrawer incident={selected} onclose={() => (selected = null)} />
{/if}

<style>
	.body-list {
		list-style: none;
		padding: 0;
		margin: 0.6rem 0 0;
		display: grid;
	}

	.body-list li {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		gap: 0.6rem;
		align-items: baseline;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--rule);
	}

	.body-list li:last-child {
		border-bottom: 0;
	}

	.bl-name {
		font-family: var(--font-sans);
		font-size: 0.84rem;
		font-weight: 600;
		line-height: 1.3;
	}

	.bl-count {
		font-family: var(--font-sans);
		font-size: 0.9rem;
		font-weight: 700;
	}
</style>
