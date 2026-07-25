<script lang="ts">
	import BarChart from '$lib/components/BarChart.svelte';
	import ColumnChart from '$lib/components/ColumnChart.svelte';
	import Figure from '$lib/components/Figure.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import IncidentDrawer from '$lib/components/IncidentDrawer.svelte';
	import KpiTile from '$lib/components/KpiTile.svelte';
	import Meter from '$lib/components/Meter.svelte';
	import Seo from '$lib/components/Seo.svelte';

	import { FIRST_DATE, LAST_DATE, MAX_YEAR, MIN_YEAR, YEARS, byId, incidents } from '$lib/data';
	import { byBody, byEra, byPlace, byYear, countByStatus, topBy, totals } from '$lib/data/stats';
	import { STATUSES, STATUS_ORDER } from '$lib/data/types';
	import type { Incident } from '$lib/data/types';
	import { applyFilter, emptyFilter, isActive, recordHref, toggle } from '$lib/filters';
	import { compact, compactParts, compactShort, fmtDate, num, pctStr } from '$lib/format';
	import { LINKS, SITE_DESCRIPTION, SITE_NAME, SITE_URL, abs } from '$lib/site';

	/* ----------------------------------------------------------- state */

	const filter = $state(emptyFilter());
	let selected = $state<Incident | null>(null);

	const filtered = $derived(applyFilter(incidents, filter));
	const t = $derived(totals(filtered));
	const all = totals(incidents);
	const allCounts = countByStatus(incidents);

	/* ---------------------------------------------------------- series */

	const statusSeries = STATUSES.map((s) => ({ key: s.key, label: s.label, color: s.color }));
	const authoritySeries = [
		{ key: 'Central', label: 'Central body', color: 'var(--cat-1)' },
		{ key: 'State', label: 'State body', color: 'var(--cat-2)' }
	];
	const scaleSeries = [
		{ key: 'affected', label: 'Candidates affected', color: 'var(--series-1)' }
	];

	/* ------------------------------------------------------ aggregates */

	const yearBuckets = $derived(byYear(filtered, YEARS));

	const yearColumns = $derived(
		yearBuckets.map((b) => ({
			key: String(b.year),
			label: String(b.year),
			segments: STATUS_ORDER.map((s) => ({ key: s, value: b.byStatus[s] })),
			total: b.total
		}))
	);

	const scaleColumns = $derived(
		yearBuckets.map((b) => ({
			key: String(b.year),
			label: String(b.year),
			segments: [{ key: 'affected', value: b.affected }],
			total: b.affected,
			foot:
				b.affectedRecorded > 0
					? `${b.affectedRecorded} of ${b.total} incidents that year report a figure`
					: 'No candidate figures recorded this year'
		}))
	);

	const eraBands = $derived([
		{ from: '2004', to: '2013', label: 'UPA' },
		{ from: '2014', to: String(MAX_YEAR), label: 'NDA' }
	]);

	const placeBuckets = $derived(byPlace(filtered));
	const TOP_PLACES = 15;
	const placeRows = $derived(
		placeBuckets.slice(0, TOP_PLACES).map((p) => ({
			key: p.slug,
			label: p.name,
			href: `/state/${p.slug}`,
			segments: STATUS_ORDER.map((s) => ({ key: s, value: p.byStatus[s] })),
			total: p.total
		}))
	);
	const placesHidden = $derived(Math.max(0, placeBuckets.length - TOP_PLACES));

	const bodyBuckets = $derived(byBody(filtered));
	const bodyRows = $derived(
		bodyBuckets.slice(0, 12).map((b) => ({
			key: b.key,
			label: b.label,
			sublabel: b.jurisdiction ? `${b.bodyType} body · ${b.jurisdiction}` : `${b.bodyType} body`,
			segments: [{ key: b.bodyType, value: b.total }],
			total: b.total
		}))
	);
	const worstBody = $derived(bodyBuckets[0] ?? null);

	const affectedParts = $derived(compactParts(t.affected));

	// The era panel exists to contrast the two base rates, so it must ignore the
	// era and year facets — filtering to "NDA" would otherwise zero the UPA row
	// and make the comparison meaningless. Every other facet still applies, so
	// filtering to Rajasthan gives Rajasthan's own two-era comparison.
	const eraBaseline = $derived(applyFilter(incidents, { ...filter, era: 'all', years: [] }));
	const eras = $derived(byEra(eraBaseline, LAST_DATE));
	const eraFacetIgnored = $derived(filter.era !== 'all' || filter.years.length > 0);
	const biggest = $derived(topBy(filtered, (i) => i.affected, 6));
	const deathCases = $derived(filtered.filter((i) => (i.deaths ?? 0) > 0));
	const deathTotal = $derived(deathCases.reduce((s, i) => s + (i.deaths ?? 0), 0));

	/* --------------------------------------------------- cross-filters */

	const yearSelection = $derived(new Set(filter.years.map(String)));
	const placeSelection = $derived(new Set(filter.places));
	const bodySelection = $derived(new Set(filter.bodies));

	const PLACE_LABELS: Record<string, string> = Object.fromEntries(
		byPlace(incidents).map((p) => [p.slug, p.name])
	);
	const BODY_LABELS: Record<string, string> = Object.fromEntries(
		byBody(incidents).map((b) => [b.key, b.label])
	);

	/* ------------------------------------------------------ the drawer */

	function openIncident(incident: Incident): void {
		selected = incident;
		history.replaceState(history.state, '', `?incident=${incident.id}`);
	}

	function closeIncident(): void {
		selected = null;
		history.replaceState(history.state, '', location.pathname);
	}

	// Deep link: /?incident=PL-0093 opens straight into a record.
	$effect(() => {
		const id = new URLSearchParams(location.search).get('incident');
		if (id) selected = byId.get(id) ?? null;
	});

	/* ------------------------------------------------------------- seo */

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Dataset',
		name: `Indian public examination leak incidents, ${MIN_YEAR}–${MAX_YEAR}`,
		description: SITE_DESCRIPTION,
		url: abs('/'),
		license: 'https://creativecommons.org/licenses/by/4.0/',
		isAccessibleForFree: true,
		temporalCoverage: `${FIRST_DATE}/${LAST_DATE}`,
		spatialCoverage: { '@type': 'Place', name: 'India' },
		creator: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
		keywords: [
			'exam paper leak',
			'India',
			'recruitment exam scam',
			'NEET',
			'Vyapam',
			'question paper leak',
			'public examination integrity'
		],
		distribution: [
			{
				'@type': 'DataDownload',
				encodingFormat: 'application/json',
				contentUrl: abs('/data/exam-leaks.json')
			},
			{ '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: LINKS.csvRaw }
		]
	};
</script>

<Seo path="/" {jsonLd} />

<main id="main">
	<!-- ============================================================ hero -->
	<section class="wrap" style="padding-block:clamp(2.5rem,7vw,5rem) 0">
		<p class="kicker">Open record · {MIN_YEAR}–{MAX_YEAR}</p>

		<h1 class="display" style="margin-top:1.1rem">
			When the paper<br />gets out.
		</h1>

		<div class="hero-grid">
			<p class="standfirst">
				Between {MIN_YEAR} and {MAX_YEAR}, at least <strong style="color:var(--ink)"
					>{all.incidents} public examinations in India</strong
				> were publicly reported as compromised — question papers photographed in strongrooms, OMR sheets
				altered after the fact, paid impersonators sitting in place of candidates, and answer keys
				moving on WhatsApp hours before the bell.
			</p>
			<p class="dek small">
				This is the running record: one row per incident, every row linked to the report it came
				from. It counts institutions and outcomes, not people. Filter it, chart it, download it —
				and if a leak is missing, add it.
			</p>
		</div>

		<ul class="dateline">
			<li><strong>{all.incidents}</strong> incidents</li>
			<li><strong>{all.distinctPlaces}</strong> states &amp; territories</li>
			<li><strong>{all.distinctBodies}</strong> examination bodies</li>
			<li><strong>{compact(all.affected)}</strong> candidates affected</li>
			<li><strong>{all.byStatus.Confirmed}</strong> officially confirmed</li>
		</ul>
	</section>

	<!-- ========================================================= filters -->
	<div class="wrap">
		<FilterBar
			{filter}
			counts={allCounts}
			shown={filtered.length}
			total={incidents.length}
			placeLabels={PLACE_LABELS}
			bodyLabels={BODY_LABELS}
			recordHref={recordHref(filter)}
		/>
	</div>

	<!-- ============================================================ kpis -->
	<div class="wrap">
		<div class="kpi-grid">
			<KpiTile
				label="Incidents"
				value={num(t.incidents)}
				foot={isActive(filter) ? `of ${all.incidents} in the record` : `${MIN_YEAR}–${MAX_YEAR}`}
			/>
			<KpiTile
				label="Officially confirmed"
				value={num(t.byStatus.Confirmed)}
				foot="{pctStr(t.byStatus.Confirmed, t.incidents)} of the selection"
				title="A leak or organised manipulation established by an official body, court, or police investigation."
			/>
			<KpiTile
				label="Candidates affected"
				value={affectedParts.value}
				unit={affectedParts.unit}
				foot="reported in {t.affectedRecorded} of {t.incidents} incidents"
				title="Sums only the incidents where a source gives a figure. Definitions vary between registered, appeared and affected."
			/>
			<KpiTile
				label="Exams voided"
				value={num(t.voided)}
				foot="cancelled or re-held"
				title="Incidents where the examination was cancelled, a retest was ordered, or both."
			/>
			<KpiTile
				label="Arrests recorded"
				value={num(t.arrests)}
				foot="across {t.arrestsRecorded} incidents"
				title="Sum of the arrest counts given in the linked sources. Many rows record an FIR without a number."
			/>
			<KpiTile
				label="Convictions recorded"
				value={num(t.convictions)}
				foot="in just {t.withConviction} incidents"
				title="Convictions named in the linked source. Most cases in this record are still pending or untracked."
			/>
		</div>
	</div>

	<!-- =========================================================== trend -->
	<section class="section" id="trend">
		<div class="wrap">
			<div class="section-head">
				<p class="num">01 — The trend</p>
				<h2>Reported leaks have not tapered off. They have compounded.</h2>
				<p class="dek">
					Each column is a year; each block is one incident, shaded by how strong the evidence is.
					Click a year to filter the whole page to it.
				</p>
			</div>

			<div class="grid-side">
				<Figure
					title="Incidents per year, by strength of evidence"
					subtitle="Colour runs dark to light with evidentiary strength. Grey sits outside the scale: officially investigated and rejected."
					series={statusSeries}
					note="Bands mark the governing coalition at the time; the 2014 boundary falls in May, so that year straddles both. Counts reflect what has been reported and indexed, not everything that happened — see the caveat on the right."
					table={{
						head: ['Year', ...STATUS_ORDER, 'Total'],
						rows: yearBuckets
							.filter((b) => b.total > 0)
							.map((b) => [b.year, ...STATUS_ORDER.map((s) => b.byStatus[s]), b.total])
					}}
				>
					<ColumnChart
						data={yearColumns}
						series={statusSeries}
						bands={eraBands}
						height={330}
						selected={yearSelection}
						onselect={(key) => toggle(filter.years, Number(key))}
						ariaLabel="Documented Indian examination leak incidents per year, {MIN_YEAR} to {MAX_YEAR}, stacked by evidentiary status"
						unit="incidents"
					/>
				</Figure>

				<div class="stack" style="--gap:1.4rem">
					<div class="card" style="padding:1.15rem">
						<p class="kicker is-muted">Rate per year</p>
						{#each eras as era (era.key)}
							<div class="era-row">
								<div>
									<div class="era-label">{era.label}</div>
									<div class="micro">
										{#if era.total === 0}
											Nothing recorded in this period
										{:else}
											{num(era.total)}
											{era.total === 1 ? 'incident' : 'incidents'} over {era.years.toFixed(1)} years
										{/if}
									</div>
								</div>
								<div class="era-rate tnum">
									{#if era.total === 0}
										<span class="muted">—</span>
									{:else}
										{era.perYear.toFixed(1)}<span class="micro">/yr</span>
									{/if}
								</div>
							</div>
						{/each}
						{#if eraFacetIgnored}
							<p class="micro" style="margin-top:.7rem">
								Ignores the period and year filters — otherwise one side is always zero and there is
								nothing left to compare.
							</p>
						{/if}
					</div>

					<div class="callout">
						<p class="kicker is-plain">Read this carefully</p>
						<p>
							The rise here is <strong>partly real and partly an artefact</strong>. Recent leaks are
							covered by more outlets, indexed by search engines, and litigated in public — a 2007
							state recruitment scandal reported once in a regional daily may simply never have
							reached this list. Treat the shape as the floor of the problem, not its measurement.
						</p>
					</div>

					<blockquote class="pullquote">
						Only {all.withConviction} of the {all.incidents} incidents in this record have a conviction
						attached to them.
						<cite>Sources are one report per row — pending cases stay uncounted</cite>
					</blockquote>
				</div>
			</div>
		</div>
	</section>

	<!-- =========================================================== where -->
	<section class="section is-tinted" id="where">
		<div class="wrap">
			<div class="section-head">
				<p class="num">02 — Geography</p>
				<h2>A handful of states carry most of the record.</h2>
				<p class="dek">
					Click a bar to filter the page; click the state's name to open its own page. “All India”
					covers nationwide examinations — NEET, SSC, CBSE boards, railway recruitment — which
					affect candidates everywhere.
				</p>
			</div>

			<div class="grid-side">
				<Figure
					title="Incidents by state or territory"
					subtitle={placesHidden > 0
						? `Top ${TOP_PLACES} of ${placeBuckets.length} places in the current selection.`
						: 'Every place in the current selection.'}
					series={statusSeries}
					note="An incident spanning two states is counted in both, so the bars sum to more than the incident total. Nationwide exams appear only under “All India”."
					table={{
						head: ['Place', ...STATUS_ORDER, 'Total'],
						rows: placeBuckets.map((p) => [
							p.name,
							...STATUS_ORDER.map((s) => p.byStatus[s]),
							p.total
						])
					}}
				>
					<BarChart
						data={placeRows}
						series={statusSeries}
						selected={placeSelection}
						onselect={(key) => toggle(filter.places, key)}
						ariaLabel="Documented examination leak incidents by Indian state or territory"
						unit="incidents"
					/>
					{#if placesHidden > 0}
						<p class="micro" style="margin-top:.6rem">
							+{placesHidden} more with fewer incidents — <a href="/states">see every state</a>.
						</p>
					{/if}
				</Figure>

				<div class="stack" style="--gap:1.4rem">
					<div class="card" style="padding:1.15rem">
						<p class="kicker is-muted">Largest single incidents</p>
						<p class="micro" style="margin-bottom:.6rem">By candidates affected, where reported.</p>
						<ol class="rank">
							{#each biggest as incident, i (incident.id)}
								<li>
									<span class="rank-n tnum">{i + 1}</span>
									<button class="rank-btn" onclick={() => openIncident(incident)}>
										<span class="rank-title">{incident.examName}</span>
										<span class="micro"
											>{fmtDate(incident.date, incident.datePrecision)} ·
											{incident.primaryState ?? '—'}</span
										>
									</button>
									<span class="rank-val tnum">{compactShort(incident.affected)}</span>
								</li>
							{/each}
						</ol>
					</div>

					<div class="callout is-quiet">
						<p class="micro" style="color:var(--ink-3)">
							Figures mix definitions — some sources count everyone registered for the exam, others
							only those whose sitting was voided. They are an order-of-magnitude signal, not a
							precise headcount.
						</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- ============================================================= who -->
	<section class="section" id="who">
		<div class="wrap">
			<div class="section-head">
				<p class="num">03 — Institutions</p>
				<h2>Mostly state recruitment boards — but no tier is clean.</h2>
				<p class="dek">
					Central agencies run the largest examinations, so their failures affect the most people.
					State boards fail far more often.
				</p>
			</div>

			<div class="split-panel card">
				<div class="split-head">
					<div>
						<div class="split-num tnum">{num(t.state)}</div>
						<div class="split-label"><span class="sw" style="background:var(--cat-2)"></span>State bodies</div>
						<div class="micro">{pctStr(t.state, t.incidents)} of incidents</div>
					</div>
					<div style="text-align:right">
						<div class="split-num tnum">{num(t.central)}</div>
						<div class="split-label" style="justify-content:flex-end">
							Central bodies<span class="sw" style="background:var(--cat-1)"></span>
						</div>
						<div class="micro">{pctStr(t.central, t.incidents)} of incidents</div>
					</div>
				</div>
				<div class="split-bar" role="img" aria-label="{t.state} incidents at state bodies, {t.central} at central bodies">
					<div style="flex:{t.state || 0.001};background:var(--cat-2)"></div>
					<div style="flex:{t.central || 0.001};background:var(--cat-1)"></div>
				</div>
			</div>

			<div class="grid-side" style="margin-top:2rem">
				<Figure
					title="Examination bodies with the most incidents"
					subtitle="Renamed institutions are merged — Vyapam, MPPEB and MP ESB are one body across three names."
					series={authoritySeries}
					note="Jurisdiction is inferred from where each body's examinations were held. Click a bar to filter the page to that body."
					table={{
						head: ['Body', 'Type', 'Jurisdiction', 'Incidents'],
						rows: bodyBuckets
							.slice(0, 20)
							.map((b) => [b.label, b.bodyType, b.jurisdiction || '—', b.total])
					}}
				>
					<BarChart
						data={bodyRows}
						series={authoritySeries}
						selected={bodySelection}
						onselect={(key) => toggle(filter.bodies, key)}
						ariaLabel="Indian examination bodies ranked by number of documented leak incidents"
						unit="incidents"
					/>
				</Figure>

				<div class="stack" style="--gap:1.4rem">
					{#if worstBody}
						<blockquote class="pullquote">
							{worstBody.label} appears <strong>{worstBody.total} times</strong> in this record —
							{worstBody.total === 1 ? 'one examination' : `${worstBody.total} separate examinations`}
							{worstBody.jurisdiction ? `in ${worstBody.jurisdiction}` : ''}.
							<cite>The most-repeated body in the current selection</cite>
						</blockquote>
					{/if}

					<div class="callout is-quiet">
						<p>
							<strong>Why the imbalance?</strong> There are far more state recruitment exams than
							central ones, and state boards are typically smaller, more locally staffed and more
							exposed to political pressure. Several — Himachal's HPSSC, Uttarakhand's UKSSSC —
							were suspended, dissolved or had their functions transferred after the incidents
							listed here.
						</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- =========================================================== scale -->
	<section class="section is-tinted" id="scale">
		<div class="wrap">
			<div class="section-head">
				<p class="num">04 — Scale</p>
				<h2>One cancelled exam can void a year for millions.</h2>
				<p class="dek">
					A different measure from the one above: not how many exams failed, but how many people
					were sitting them.
				</p>
			</div>

			<Figure
				title="Candidates affected per year"
				subtitle="Summed across incidents where a source gives a figure. Blank years are years with no reported figure, not years with no incident."
				note="This is deliberately a separate chart from the incident counts — the two measures share no axis and must not be read against one another. A single 2024 entry, the UP Police constable recruitment, accounts for 48 lakh candidates on its own."
				table={{
					head: ['Year', 'Candidates affected', 'Incidents reporting a figure'],
					rows: yearBuckets
						.filter((b) => b.affected > 0)
						.map((b) => [b.year, num(b.affected), `${b.affectedRecorded} of ${b.total}`])
				}}
			>
				<ColumnChart
					data={scaleColumns}
					series={scaleSeries}
					height={260}
					tickFormat={compactShort}
					valueFormat={num}
					selected={yearSelection}
					onselect={(key) => toggle(filter.years, Number(key))}
					ariaLabel="Candidates affected by documented examination leaks, per year"
					unit="candidates"
				/>
			</Figure>
		</div>
	</section>

	<!-- ================================================== accountability -->
	<section class="section" id="accountability">
		<div class="wrap">
			<div class="section-head">
				<p class="num">05 — What happened next</p>
				<h2>Exams get cancelled. Cases rarely close.</h2>
				<p class="dek">
					The response to a leak is fast and visible; the consequences for those who caused it are
					slow and mostly invisible in the public record.
				</p>
			</div>

			<div class="grid-side">
				<div class="card" style="padding:1.3rem 1.4rem">
					<Meter
						label="An FIR was filed or arrests were made"
						value={t.arrestAction}
						total={t.incidents}
						color="var(--st-alleged)"
					/>
					<Meter
						label="An official probe was opened (CBI, SIT, STF, ED)"
						value={t.probe}
						total={t.incidents}
						color="var(--st-alleged)"
					/>
					<Meter
						label="The examination was cancelled"
						value={t.cancelled}
						total={t.incidents}
						color="var(--st-confirmed)"
					/>
					<Meter
						label="A retest was held"
						value={t.retest}
						total={t.incidents}
						color="var(--st-confirmed)"
					/>
					<Meter
						label="At least one conviction is recorded here"
						value={t.withConviction}
						total={t.incidents}
						color="var(--accent)"
						note="This is the weakest number on the page. Each row carries one source, usually written soon after the leak; convictions arrive years later and are rarely back-filled. Read it as “convictions we can currently evidence”, not “convictions that exist”."
					/>
					<Meter
						label="No action of any kind was reported"
						value={t.noAction}
						total={t.incidents}
						color="var(--ink-3)"
					/>
				</div>

				<div class="stack" style="--gap:1.4rem">
					<div class="card" style="padding:1.15rem">
						<p class="kicker is-muted">Totals in the current selection</p>
						<dl class="deflist" style="margin-top:.5rem">
							<div class="defrow">
								<dt>Arrests</dt>
								<dd class="tnum">{num(t.arrests)} <span class="muted small">across {t.arrestsRecorded} incidents</span></dd>
							</div>
							<div class="defrow">
								<dt>Convictions</dt>
								<dd class="tnum">{num(t.convictions)} <span class="muted small">across {t.withConviction} incidents</span></dd>
							</div>
							<div class="defrow">
								<dt>High confidence</dt>
								<dd class="tnum">{num(t.highConfidence)} <span class="muted small">of {t.incidents} rows</span></dd>
							</div>
						</dl>
					</div>

					<div class="callout">
						<p>
							<strong>An arrest is not a conviction.</strong> Several entries here ended with the
							allegation officially rejected — the UGC-NET 2024 cancellation was closed by the CBI
							after the “leaked” screenshot proved to be doctored by a student, and Rajasthan's 2021
							Patwari case turned on a fake paper sold to candidates. Those rows are marked
							<em>Denied</em>, and they stay in the record because a retracted scandal is part of
							the story too.
						</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- ========================================================== deaths -->
	{#if deathCases.length > 0}
		<section class="section is-tinted" id="deaths">
			<div class="wrap">
				<div class="section-head">
					<p class="num">06 — Deaths</p>
					<h2>The deaths reported alongside these scandals, with their caveats intact.</h2>
					<p class="dek">
						{deathTotal} deaths appear in {deathCases.length} entries. They are deliberately kept out
						of the summary figures at the top of this page, because the number does not mean what a
						headline would make it mean.
					</p>
				</div>

				<div class="death-grid">
					{#each deathCases as incident (incident.id)}
						<article class="card death-card">
							<div class="row" style="gap:.5rem;margin-bottom:.6rem">
								<span class="death-n tnum">{num(incident.deaths)}</span>
								<span class="micro">reported deaths</span>
							</div>
							<h3 style="font-size:1.05rem">{incident.examName}</h3>
							<p class="micro" style="margin:.3rem 0 .8rem">
								{fmtDate(incident.date, incident.datePrecision)} · {incident.primaryState ?? '—'}
							</p>
							<p class="small" style="color:var(--ink-2)">{incident.deathsNote}</p>
							<button class="btn btn-sm" style="margin-top:.9rem" onclick={() => openIncident(incident)}>
								Full record
							</button>
						</article>
					{/each}
				</div>

				<div class="callout" style="margin-top:1.5rem;max-width:none">
					<p>
						<strong>Why these are not added together anywhere on this site.</strong> The 23 deaths
						attached to the Vyapam entry span an entire decade-long scam, not one examination, and
						the CBI ruled out foul play in every case it examined. The single death in the RAS 2013
						entry is the accused mastermind, not a candidate. The NEET figures are press tallies
						that mix leak-specific distress with the broader, older phenomenon of exam-pressure
						suicide in India. Each of these is a real reported death and each has a different
						relationship to the leak beside it. Summing them would produce a number that is
						technically arithmetic and substantively false.
					</p>
					<p class="micro">
						If you or someone you know is struggling: Tele-MANAS, India's national mental-health
						helpline, is at <strong>14416</strong>, free and available 24×7.
					</p>
				</div>
			</div>
		</section>
	{/if}

	<!-- ========================================================== hand-off -->
	<section class="section" id="record">
		<div class="wrap">
			<div class="handoff">
				<div>
					<p class="num">07 — The record</p>
					<h2 style="margin-top:.6rem">
						{isActive(filter) ? 'Read the incidents behind this selection.' : 'Read the record itself.'}
					</h2>
					<p class="dek" style="margin-top:.85rem">
						{#if isActive(filter)}
							The filters above narrow the record to
							<strong style="color:var(--ink)">{num(filtered.length)}</strong>
							{filtered.length === 1 ? 'incident' : 'incidents'}. They carry across, so the table
							opens on exactly this selection — and the link is shareable.
						{:else}
							All {num(incidents.length)} incidents in one searchable, sortable table. Every row opens
							the full account and the report it was drawn from.
						{/if}
					</p>
					<div class="row" style="margin-top:1.5rem;gap:.6rem">
						<a class="btn btn-primary" href={recordHref(filter)}>
							{isActive(filter)
								? `See these ${num(filtered.length)} ${filtered.length === 1 ? 'incident' : 'incidents'}`
								: `Search all ${num(incidents.length)} incidents`} →
						</a>
						<a class="btn" href="/states">Browse by state</a>
						<a class="btn" href="/years">Browse by year</a>
					</div>
				</div>

				<ul class="handoff-preview">
					<!-- Newest first, matching the record table's default sort. -->
					{#each filtered.slice(-5).reverse() as incident (incident.id)}
						<li>
							<a href="/incident/{incident.id}">
								<span class="hp-date tnum">{fmtDate(incident.date, incident.datePrecision)}</span>
								<span class="hp-title">{incident.examName}</span>
							</a>
						</li>
					{/each}
					{#if filtered.length > 5}
						<li class="hp-more">
							<a href={recordHref(filter)}>+{num(filtered.length - 5)} more →</a>
						</li>
					{/if}
				</ul>
			</div>
		</div>
	</section>
</main>

{#if selected}
	<IncidentDrawer incident={selected} onclose={closeIncident} />
{/if}

<style>
	.hero-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
		gap: clamp(1.25rem, 4vw, 3rem);
		margin-top: 1.75rem;
		align-items: start;
	}

	@media (max-width: 820px) {
		.hero-grid {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	.dateline {
		list-style: none;
		padding: 0;
		margin: 2rem 0 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1.6rem;
		font-family: var(--font-sans);
		font-size: 0.8rem;
		color: var(--ink-3);
		border-top: 1px solid var(--rule);
		padding-top: 1rem;
	}

	.dateline strong {
		color: var(--ink);
		font-variant-numeric: tabular-nums;
		font-size: 0.95rem;
		margin-right: 0.25rem;
	}

	/* Era rate rows */
	.era-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.7rem 0;
		border-bottom: 1px solid var(--rule);
	}

	.era-row:last-child {
		border-bottom: 0;
		padding-bottom: 0;
	}

	.era-label {
		font-family: var(--font-sans);
		font-size: 0.85rem;
		font-weight: 700;
	}

	.era-rate {
		font-family: var(--font-sans);
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		white-space: nowrap;
	}

	.era-rate .micro {
		font-size: 0.7rem;
		margin-left: 0.15rem;
	}

	/* Ranked list */
	.rank {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
	}

	.rank li {
		display: grid;
		grid-template-columns: 1.2rem minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.6rem;
		padding: 0.55rem 0;
		border-bottom: 1px solid var(--rule);
	}

	.rank li:last-child {
		border-bottom: 0;
	}

	.rank-n {
		font-family: var(--font-sans);
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--ink-3);
	}

	.rank-btn {
		background: none;
		border: 0;
		padding: 0;
		text-align: left;
		cursor: pointer;
		display: grid;
		gap: 0.1rem;
		min-width: 0;
	}

	.rank-title {
		font-family: var(--font-sans);
		font-size: 0.82rem;
		font-weight: 600;
		line-height: 1.3;
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.rank-btn:hover .rank-title {
		color: var(--accent);
	}

	.rank-val {
		font-family: var(--font-sans);
		font-size: 0.85rem;
		font-weight: 700;
	}

	/* Central vs state split */
	.split-panel {
		padding: 1.3rem 1.4rem;
	}

	.split-head {
		display: flex;
		justify-content: space-between;
		gap: 1.5rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.split-num {
		font-family: var(--font-sans);
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 700;
		line-height: 1;
		letter-spacing: -0.03em;
	}

	.split-label {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-family: var(--font-sans);
		font-size: 0.82rem;
		font-weight: 600;
		margin-top: 0.4rem;
	}

	.split-label .sw {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 2px;
		flex: none;
	}

	.split-bar {
		display: flex;
		gap: 2px;
		height: 14px;
		border-radius: 2px;
		overflow: hidden;
	}

	.split-bar > div:first-child {
		border-radius: 2px 0 0 2px;
	}

	.split-bar > div:last-child {
		border-radius: 0 2px 2px 0;
	}

	/* Hand-off to the record */
	.handoff {
		display: grid;
		grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
		gap: clamp(1.5rem, 4vw, 3.5rem);
		align-items: start;
	}

	@media (max-width: 820px) {
		.handoff {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	.handoff .num {
		font-family: var(--font-sans);
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		color: var(--ink-3);
	}

	.handoff-preview {
		list-style: none;
		padding: 0;
		margin: 0;
		border-top: 1px solid var(--rule);
	}

	.handoff-preview li {
		border-bottom: 1px solid var(--rule);
	}

	.handoff-preview a {
		display: grid;
		grid-template-columns: 5.5rem minmax(0, 1fr);
		gap: 0.75rem;
		align-items: baseline;
		padding: 0.6rem 0;
		text-decoration: none;
		font-family: var(--font-sans);
		font-size: 0.82rem;
	}

	.handoff-preview .hp-date {
		font-size: 0.72rem;
		color: var(--ink-3);
		white-space: nowrap;
	}

	.handoff-preview .hp-title {
		font-weight: 600;
		line-height: 1.35;
	}

	.handoff-preview a:hover .hp-title {
		color: var(--accent);
	}

	.handoff-preview .hp-more a {
		grid-template-columns: minmax(0, 1fr);
		font-weight: 700;
		color: var(--accent);
	}

	/* Deaths */
	.death-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 1.25rem;
	}

	.death-card {
		padding: 1.2rem;
		border-left: 3px solid var(--accent);
	}

	.death-n {
		font-family: var(--font-sans);
		font-size: 1.9rem;
		font-weight: 700;
		line-height: 1;
		letter-spacing: -0.03em;
	}
</style>
