<script lang="ts">
	import ActionTags from '$lib/components/ActionTags.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import StatusPill from '$lib/components/StatusPill.svelte';
	import { statusMeta } from '$lib/data/types';
	import { PRECISION_NOTE, compact, fmtDate, fmtDateLong, isApprox, num } from '$lib/format';
	import { LINKS, SITE_NAME, abs } from '$lib/site';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const incident = $derived(data.incident);
	const meta = $derived(statusMeta(incident.status));

	// The nationwide pseudo-state would otherwise read "All All India incidents".
	const isNational = $derived(incident.primaryState === 'All India');
	const placeHeading = $derived(isNational ? 'other nationwide exams' : incident.primaryState);
	const placeLink = $derived(
		isNational ? 'All nationwide exams' : `All ${incident.primaryState} incidents`
	);

	const description = $derived(
		`${incident.status}: ${incident.examName} (${fmtDate(incident.date, incident.datePrecision)}, ${
			incident.primaryState ?? 'India'
		}). ${incident.note.slice(0, 180)}${incident.note.length > 180 ? '…' : ''}`
	);

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: incident.examName,
		description: incident.note.slice(0, 300),
		datePublished: incident.date,
		url: abs(`/incident/${incident.id}`),
		image: abs(`/og/incident/${incident.id}.svg`),
		isPartOf: { '@type': 'Dataset', name: 'Indian public examination leak incidents', url: abs('/') },
		publisher: { '@type': 'Organization', name: SITE_NAME, url: abs('/') },
		license: 'https://creativecommons.org/licenses/by/4.0/',
		citation: {
			'@type': 'CreativeWork',
			name: incident.sourceName,
			url: incident.sourceUrl
		},
		contentLocation: { '@type': 'Place', name: incident.primaryState ?? 'India' },
		about: { '@type': 'Thing', name: incident.conductingBody }
	});
</script>

<Seo
	title={incident.examName}
	{description}
	path={`/incident/${incident.id}`}
	image={`/og/incident/${incident.id}.svg`}
	imageAlt="{incident.status} leak: {incident.examName}"
	type="article"
	publishedTime={incident.date}
	{jsonLd}
	keywords={[
		incident.examName,
		incident.conductingBody,
		incident.primaryState ?? 'India',
		'exam paper leak',
		String(incident.year)
	]}
/>

<main id="main">
	<article>
		<!-- ------------------------------------------------------ header -->
		<header class="wrap" style="padding-block:clamp(2rem,5vw,3.5rem) 0;max-width:1000px">
			<nav class="crumbs micro" aria-label="Breadcrumb">
				<a href="/">Record</a>
				<span aria-hidden="true">/</span>
				{#if incident.primaryStateSlug}
					<a href="/state/{incident.primaryStateSlug}">{incident.primaryState}</a>
					<span aria-hidden="true">/</span>
				{/if}
				<a href="/year/{incident.year}">{incident.year}</a>
				<span aria-hidden="true">/</span>
				<span class="mono">{incident.id}</span>
			</nav>

			<div class="row" style="gap:.5rem;margin-top:1.25rem">
				<StatusPill status={incident.status} />
				<span class="tag">{incident.confidence} source confidence</span>
				<span class="tag">{incident.bodyType} body</span>
			</div>

			<h1 style="margin-top:1rem;font-size:clamp(1.9rem,4.6vw,3rem)">{incident.examName}</h1>

			<p class="article-dateline">
				<strong
					>{isApprox(incident.datePrecision) ? '≈ ' : ''}{fmtDateLong(
						incident.date,
						incident.datePrecision
					)}</strong
				>
				<span aria-hidden="true">·</span>
				{incident.area}
				<span aria-hidden="true">·</span>
				{incident.conductingBody}
			</p>

			{#if isApprox(incident.datePrecision)}
				<p class="micro" style="margin-top:.5rem">⚠ {PRECISION_NOTE[incident.datePrecision]}</p>
			{/if}

			<hr class="rule-double" style="margin-top:1.75rem" />
		</header>

		<!-- ------------------------------------------------------ figures -->
		<div class="wrap" style="max-width:1000px">
			<div class="kpi-grid" style="border-top:0">
				<div class="kpi">
					<div class="kpi-label">Status</div>
					<div class="kpi-value" style="font-size:1.5rem">{incident.status}</div>
					<div class="kpi-foot">{meta.blurb}</div>
				</div>
				<div class="kpi">
					<div class="kpi-label">Candidates affected</div>
					<div class="kpi-value">
						{incident.affected === null ? '—' : compact(incident.affected)}
					</div>
					<div class="kpi-foot">
						{incident.affected === null ? 'No figure in the source' : num(incident.affected)}
					</div>
				</div>
				<div class="kpi">
					<div class="kpi-label">Arrests</div>
					<div class="kpi-value">{incident.arrests === null ? '—' : num(incident.arrests)}</div>
					<div class="kpi-foot">
						{incident.arrests === null ? 'Not quantified in the source' : 'reported at the time'}
					</div>
				</div>
				<div class="kpi">
					<div class="kpi-label">Convictions</div>
					<div class="kpi-value">
						{incident.convictions === null ? '—' : num(incident.convictions)}
					</div>
					<div class="kpi-foot">
						{incident.convictions === null ? 'None recorded here' : 'recorded in the source'}
					</div>
				</div>
			</div>
		</div>

		<!-- --------------------------------------------------- the account -->
		<div class="wrap article-body" style="max-width:1000px">
			<div>
				<section>
					<h2 class="sec-h">What happened</h2>
					<p class="lead">{incident.note}</p>
				</section>

				<section>
					<h2 class="sec-h">What was done</h2>
					{#if incident.actions.length === 0}
						<p class="dek">
							No official response is recorded for this entry. That may mean none was reported, or
							simply that the source did not say.
						</p>
					{:else}
						<div class="stack" style="--gap:.65rem">
							{#each incident.actions as action (action.kind)}
								<div class="action-row">
									<strong>{action.label}</strong>
									{#if action.detail}<span class="muted"> — {action.detail}</span>{/if}
								</div>
							{/each}
						</div>
					{/if}
				</section>

				{#if incident.deaths !== null && incident.deathsNote}
					<section>
						<h2 class="sec-h">Deaths reported alongside this case</h2>
						<div class="callout">
							<p style="font-family:var(--font-sans);font-size:1.6rem;font-weight:700;color:var(--ink);line-height:1">
								{num(incident.deaths)}
							</p>
							<p>{incident.deathsNote}</p>
							<p class="micro">
								This figure is recorded because the reporting exists, not because a causal link is
								established. It is excluded from every aggregate on this site. Tele-MANAS, India's
								national mental-health helpline: <strong>14416</strong>.
							</p>
						</div>
					</section>
				{/if}

				<section>
					<h2 class="sec-h">Source</h2>
					<a class="source-card" href={incident.sourceUrl} rel="noopener noreferrer nofollow" target="_blank">
						<span class="micro">Primary reference</span>
						<span class="source-name">{incident.sourceName} ↗</span>
						<span class="micro source-url">{incident.sourceUrl}</span>
					</a>
					<p class="micro" style="margin-top:.75rem">
						This entry summarises the linked report. Where the summary and the source disagree, the
						source wins — and please
						<a href={LINKS.correction} rel="noopener noreferrer" target="_blank">tell us</a>.
					</p>
				</section>
			</div>

			<!-- ------------------------------------------------------ aside -->
			<aside class="stack" style="--gap:1.5rem">
				<div class="card" style="padding:1.15rem">
					<p class="kicker is-muted">The row, as recorded</p>
					<dl class="deflist" style="margin-top:.6rem">
						<div class="defrow"><dt>ID</dt><dd class="mono">{incident.id}</dd></div>
						<div class="defrow"><dt>Date</dt><dd class="tnum">{incident.date}</dd></div>
						<div class="defrow"><dt>Precision</dt><dd>{incident.datePrecision}</dd></div>
						<div class="defrow"><dt>Body</dt><dd>{incident.conductingBody}</dd></div>
						<div class="defrow"><dt>Type</dt><dd>{incident.bodyType}</dd></div>
						<div class="defrow"><dt>Area</dt><dd>{incident.area}</dd></div>
						<div class="defrow"><dt>Status</dt><dd>{incident.status}</dd></div>
						<div class="defrow"><dt>Confidence</dt><dd>{incident.confidence}</dd></div>
						<div class="defrow"><dt>Period</dt><dd>{incident.eraLabel}</dd></div>
						<div class="defrow">
							<dt>Actions</dt>
							<dd><ActionTags actions={incident.actions} compact /></dd>
						</div>
					</dl>
					<div class="row" style="margin-top:1rem">
						<a class="btn btn-sm" href="/data/exam-leaks.json" download>Full dataset</a>
						<a class="btn btn-sm" href={LINKS.editCsv} rel="noopener noreferrer" target="_blank">
							Correct this row
						</a>
					</div>
				</div>

				<div class="card" style="padding:1.15rem">
					<p class="kicker is-muted">Share card</p>
					<img
						src="/og/incident/{incident.id}.svg"
						alt="Share card for {incident.examName}"
						width="1200"
						height="630"
						style="width:100%;height:auto;border:1px solid var(--rule);margin-top:.6rem"
						loading="lazy"
					/>
				</div>
			</aside>
		</div>

		<!-- ----------------------------------------------------- related -->
		<div class="wrap" style="max-width:1000px;margin-top:3rem">
			{#if data.sameBody.length > 0}
				<section class="related">
					<h2 class="sec-h">
						{data.sameBody.length}
						other {data.sameBody.length === 1 ? 'incident' : 'incidents'} at {incident.bodyLabel}
					</h2>
					<ul class="rel-list">
						{#each data.sameBody as other (other.id)}
							<li>
								<a href="/incident/{other.id}">
									<span class="rel-date tnum">{fmtDate(other.date, other.datePrecision)}</span>
									<span class="rel-title">{other.examName}</span>
									<StatusPill status={other.status} />
								</a>
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			{#if data.samePlace.length > 0}
				<section class="related">
					<h2 class="sec-h">Also in {placeHeading ?? 'this region'}</h2>
					<ul class="rel-list">
						{#each data.samePlace as other (other.id)}
							<li>
								<a href="/incident/{other.id}">
									<span class="rel-date tnum">{fmtDate(other.date, other.datePrecision)}</span>
									<span class="rel-title">{other.examName}</span>
									<StatusPill status={other.status} />
								</a>
							</li>
						{/each}
					</ul>
					{#if incident.primaryStateSlug}
						<a class="btn btn-sm" href="/state/{incident.primaryStateSlug}" style="margin-top:.9rem">
							{placeLink}
						</a>
					{/if}
				</section>
			{/if}

			<nav class="pager" aria-label="Chronological navigation">
				{#if data.previous}
					<a href="/incident/{data.previous.id}" class="pager-link">
						<span class="micro">← Previous in time</span>
						<span class="pager-title">{data.previous.examName}</span>
					</a>
				{:else}
					<span></span>
				{/if}
				{#if data.next}
					<a href="/incident/{data.next.id}" class="pager-link is-next">
						<span class="micro">Next in time →</span>
						<span class="pager-title">{data.next.examName}</span>
					</a>
				{/if}
			</nav>
		</div>
	</article>
</main>

<style>
	.crumbs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		align-items: center;
	}

	.crumbs a {
		text-decoration: none;
		color: var(--ink-2);
	}

	.crumbs a:hover {
		color: var(--accent);
		text-decoration: underline;
	}

	.article-dateline {
		font-family: var(--font-sans);
		font-size: 0.88rem;
		color: var(--ink-2);
		margin-top: 0.9rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: baseline;
	}

	.article-dateline strong {
		color: var(--ink);
	}

	.article-body {
		display: grid;
		grid-template-columns: minmax(0, 1.85fr) minmax(0, 1fr);
		gap: clamp(1.5rem, 4vw, 3rem);
		margin-top: 2.5rem;
		align-items: start;
	}

	@media (max-width: 900px) {
		.article-body {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	.article-body section + section {
		margin-top: 2.5rem;
	}

	.sec-h {
		font-size: 0.7rem;
		font-family: var(--font-sans);
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--ink-3);
		border-bottom: 1px solid var(--rule);
		padding-bottom: 0.55rem;
		margin-bottom: 1rem;
	}

	.lead {
		font-size: 1.16rem;
		line-height: 1.62;
	}

	.action-row {
		font-family: var(--font-sans);
		font-size: 0.92rem;
		padding: 0.6rem 0.85rem;
		background: var(--surface);
		border: 1px solid var(--rule);
		border-left: 3px solid var(--ink-3);
		border-radius: 2px;
	}

	.source-card {
		display: grid;
		gap: 0.25rem;
		padding: 1rem 1.15rem;
		background: var(--surface);
		border: 1px solid var(--rule);
		border-left: 3px solid var(--accent);
		border-radius: 2px;
		text-decoration: none;
	}

	.source-card:hover {
		background: var(--surface-2);
		color: inherit;
	}

	.source-name {
		font-family: var(--font-sans);
		font-weight: 700;
		font-size: 1rem;
	}

	.source-url {
		overflow-wrap: anywhere;
	}

	.related {
		border-top: 1px solid var(--rule);
		padding-top: 1.75rem;
		margin-bottom: 2.5rem;
	}

	.rel-list {
		list-style: none;
		padding: 0;
		display: grid;
	}

	.rel-list li {
		border-bottom: 1px solid var(--rule);
	}

	.rel-list a {
		display: grid;
		grid-template-columns: 6.5rem minmax(0, 1fr) auto;
		gap: 0.9rem;
		align-items: center;
		padding: 0.7rem 0;
		text-decoration: none;
		font-family: var(--font-sans);
		font-size: 0.86rem;
	}

	.rel-list a:hover .rel-title {
		color: var(--accent);
	}

	.rel-date {
		color: var(--ink-3);
		font-size: 0.78rem;
		white-space: nowrap;
	}

	.rel-title {
		font-weight: 600;
		line-height: 1.35;
	}

	@media (max-width: 640px) {
		.rel-list a {
			grid-template-columns: minmax(0, 1fr);
			gap: 0.3rem;
		}
	}

	.pager {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1px;
		background: var(--rule);
		border-block: 1px solid var(--rule);
		margin-top: 1rem;
	}

	.pager-link {
		background: var(--paper);
		padding: 1.1rem 1.15rem;
		display: grid;
		gap: 0.3rem;
		text-decoration: none;
	}

	.pager-link:hover {
		background: var(--surface-2);
		color: inherit;
	}

	.pager-link.is-next {
		text-align: right;
	}

	.pager-title {
		font-family: var(--font-serif);
		font-weight: 700;
		font-size: 1rem;
		line-height: 1.3;
	}

	.pager-link:hover .pager-title {
		color: var(--accent);
	}
</style>
