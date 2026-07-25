<script lang="ts">
	import BarChart from '$lib/components/BarChart.svelte';
	import Figure from '$lib/components/Figure.svelte';
	import IncidentDrawer from '$lib/components/IncidentDrawer.svelte';
	import IncidentTable from '$lib/components/IncidentTable.svelte';
	import KpiTile from '$lib/components/KpiTile.svelte';
	import Seo from '$lib/components/Seo.svelte';

	import { byPlace, totals } from '$lib/data/stats';
	import { STATUSES, STATUS_ORDER } from '$lib/data/types';
	import type { Incident } from '$lib/data/types';
	import { compactParts, num, pctStr } from '$lib/format';
	import { SITE_NAME, abs } from '$lib/site';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let selected = $state<Incident | null>(null);

	const list = $derived(data.list);
	const t = $derived(totals(list));
	const affectedParts = $derived(compactParts(t.affected));

	const statusSeries = STATUSES.map((s) => ({ key: s.key, label: s.label, color: s.color }));
	const places = $derived(byPlace(list));
	const placeRows = $derived(
		places.map((p) => ({
			key: p.slug,
			label: p.name,
			href: `/state/${p.slug}`,
			segments: STATUS_ORDER.map((s) => ({ key: s, value: p.byStatus[s] })),
			total: p.total
		}))
	);

	const description = $derived(
		`${list.length} documented Indian examination leak ${list.length === 1 ? 'incident' : 'incidents'} in ${data.year}: ` +
			`${t.byStatus.Confirmed} confirmed, ${t.voided} exams cancelled or re-held, ${num(t.arrests)} arrests recorded.`
	);

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: `Indian examination leaks in ${data.year}`,
		description,
		url: abs(`/year/${data.year}`),
		isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: abs('/') },
		mainEntity: {
			'@type': 'ItemList',
			numberOfItems: list.length,
			itemListElement: list.map((incident, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				url: abs(`/incident/${incident.id}`),
				name: incident.examName
			}))
		}
	});
</script>

<Seo
	title={`Exam leaks in ${data.year}`}
	{description}
	path={`/year/${data.year}`}
	{jsonLd}
	keywords={[`exam paper leak ${data.year}`, 'India', 'recruitment exam scam']}
/>

<main id="main">
	<header class="wrap" style="padding-block:clamp(2rem,5vw,3.5rem) 0">
		<nav class="micro" aria-label="Breadcrumb" style="display:flex;gap:.4rem">
			<a href="/" style="text-decoration:none;color:var(--ink-2)">Record</a>
			<span aria-hidden="true">/</span>
			<a href="/years" style="text-decoration:none;color:var(--ink-2)">Years</a>
			<span aria-hidden="true">/</span>
			<span>{data.year}</span>
		</nav>

		<p class="kicker" style="margin-top:1.1rem">The year in exam integrity</p>

		<h1 class="display" style="margin-top:.85rem">{data.year}</h1>

		<p class="standfirst" style="margin-top:1.25rem">
			<strong style="color:var(--ink)">{list.length}</strong>
			{list.length === 1 ? 'examination was' : 'examinations were'} publicly reported as compromised in
			{data.year}, across
			<strong style="color:var(--ink)">{places.length}</strong>
			{places.length === 1 ? 'jurisdiction' : 'jurisdictions'}.
		</p>

		<hr class="rule-double" style="margin-top:1.75rem" />
	</header>

	<div class="wrap">
		<div class="kpi-grid" style="border-top:0">
			<KpiTile label="Incidents" value={num(t.incidents)} foot="reported in {data.year}" />
			<KpiTile
				label="Confirmed"
				value={num(t.byStatus.Confirmed)}
				foot="{pctStr(t.byStatus.Confirmed, t.incidents)} of the year"
			/>
			<KpiTile
				label="Candidates affected"
				value={affectedParts.value}
				unit={affectedParts.unit}
				foot="reported in {t.affectedRecorded} incidents"
			/>
			<KpiTile label="Exams voided" value={num(t.voided)} foot="cancelled or re-held" />
			<KpiTile label="Arrests recorded" value={num(t.arrests)} foot="across {t.arrestsRecorded} incidents" />
			<KpiTile label="Central vs state" value="{t.central} / {t.state}" foot="conducting bodies" />
		</div>
	</div>

	<section class="section">
		<div class="wrap">
			<Figure
				title="Where the {data.year} incidents were recorded"
				series={statusSeries}
				note="Incidents spanning two states are counted in both."
				table={{
					head: ['Place', ...STATUS_ORDER, 'Total'],
					rows: places.map((p) => [p.name, ...STATUS_ORDER.map((s) => p.byStatus[s]), p.total])
				}}
			>
				<BarChart
					data={placeRows}
					series={statusSeries}
					ariaLabel="Documented examination leak incidents by place in {data.year}"
					unit="incidents"
				/>
			</Figure>
		</div>
	</section>

	<section class="section" style="border-top:0;padding-top:0">
		<div class="wrap">
			<div class="section-head">
				<p class="num">The record</p>
				<h2>Every incident recorded in {data.year}</h2>
			</div>
			<IncidentTable {list} onselect={(incident) => (selected = incident)} />
		</div>
	</section>

	<section class="section is-tinted">
		<div class="wrap">
			<nav class="pager-simple">
				{#if data.previous}
					<a class="btn" href="/year/{data.previous}">← {data.previous}</a>
				{:else}<span></span>{/if}
				<a class="btn" href="/years">All years</a>
				{#if data.next}
					<a class="btn" href="/year/{data.next}">{data.next} →</a>
				{:else}<span></span>{/if}
			</nav>
		</div>
	</section>
</main>

{#if selected}
	<IncidentDrawer incident={selected} onclose={() => (selected = null)} />
{/if}

<style>
	.pager-simple {
		display: flex;
		gap: 0.6rem;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
	}
</style>
