<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { MAX_YEAR, MIN_YEAR, incidents } from '$lib/data';
	import { STATUSES } from '$lib/data/types';
	import { totals } from '$lib/data/stats';
	import { num } from '$lib/format';
	import { LINKS, abs } from '$lib/site';

	const t = totals(incidents);
	const approxDated = incidents.filter((i) => i.datePrecision !== 'day').length;
	const deathRows = incidents.filter((i) => (i.deaths ?? 0) > 0).length;

	const SCHEMA: { field: string; type: string; note: string }[] = [
		{ field: 'incident_id', type: 'string', note: 'Stable identifier, PL-0001 upward. Never reused, never renumbered.' },
		{ field: 'date', type: 'ISO date', note: 'The examination or leak date. Where the source gives only a month or year, the day is a placeholder and the note says so.' },
		{ field: 'era', type: 'enum', note: 'Governing coalition at the time. Derived from the date; kept in the file for convenience.' },
		{ field: 'exam_name', type: 'string', note: 'The examination as named in the source, including the year.' },
		{ field: 'conducting_body', type: 'string', note: 'The authority that ran the examination, with its acronym where one exists.' },
		{ field: 'body_type', type: 'Central | State', note: 'Whether the conducting authority is a central or a state institution.' },
		{ field: 'area', type: 'string', note: 'State or “All India”, optionally with a district or city in parentheses.' },
		{ field: 'leak_status', type: 'enum', note: 'Strength of the evidence. See the scale below.' },
		{ field: 'action_taken', type: 'string', note: 'Plus-separated list: exam cancelled, retest, arrests/FIR, probe (with the agency in brackets).' },
		{ field: 'note', type: 'string', note: 'A factual summary of what the source reports, including any caveat about the date.' },
		{ field: 'arrests', type: 'integer?', note: 'People arrested, where the source gives a number. Blank means unquantified, not zero.' },
		{ field: 'convictions', type: 'integer?', note: 'People convicted, where the source gives a number. Usually blank because the source predates the verdict.' },
		{ field: 'aspirants_affected', type: 'integer?', note: 'Candidates affected. Definitions vary by source — see the caveat below.' },
		{ field: 'linked_deaths', type: 'integer?', note: 'Deaths reported by press or officials as connected to the case. Always paired with deaths_note.' },
		{ field: 'deaths_note', type: 'string?', note: 'Mandatory context for any death figure: whose deaths, how contested, and what the count does not mean.' },
		{ field: 'source_name', type: 'string', note: 'Publication or institution.' },
		{ field: 'source_url', type: 'URL', note: 'One primary link per row.' },
		{ field: 'confidence', type: 'High | Medium | Low', note: 'How well-established the row is, judged on the source rather than the allegation.' }
	];

	const description =
		'How the Exam Leaks record is built: inclusion criteria, the evidentiary scale, known biases, the column dictionary, and how to correct an entry.';

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'AboutPage',
		name: 'Method & caveats',
		description,
		url: abs('/about')
	};
</script>

<Seo title="Method & caveats" {description} path="/about" {jsonLd} />

<main id="main">
	<header class="wrap wrap-prose" style="padding-block:clamp(2rem,5vw,3.5rem) 0">
		<p class="kicker">Method</p>
		<h1 class="display" style="margin-top:.9rem;font-size:clamp(2.1rem,5.5vw,3.4rem)">
			How this record is built — and where it falls short.
		</h1>
		<p class="standfirst" style="margin-top:1.25rem">
			{incidents.length} incidents, {MIN_YEAR}–{MAX_YEAR}, assembled from public reporting. Every
			number on this site is only as good as the paragraph that follows.
		</p>
		<hr class="rule-double" style="margin-top:1.75rem" />
	</header>

	<div class="wrap wrap-prose">
		<div class="prose" style="padding-block:2.5rem 4rem">
			<p class="lead" style="font-size:1.15rem">
				This is a <strong>reading aid for public reporting</strong>, not an official register. Each
				row summarises one publicly reported incident and links to the report it came from. It is
				not a legal finding, and it is certainly not a complete census of every examination that
				has been compromised in India.
			</p>

			<h2>What counts as an incident</h2>
			<p>A row is added when all three of these hold:</p>
			<ul>
				<li>
					<strong>A public examination.</strong> A recruitment test, entrance examination, eligibility
					test or school board examination conducted by a government body, public university or
					statutory commission. Private or in-house corporate tests are out of scope.
				</li>
				<li>
					<strong>An integrity failure, broadly defined.</strong> A question paper leaked before or
					during the exam; answer keys sold; OMR sheets or marks manipulated after the fact;
					impersonators or paid solvers sitting in place of candidates; or remote access to exam
					terminals. Individual copying is not an incident. Organised copying is.
				</li>
				<li>
					<strong>A citable public source.</strong> A named news report, court order, official
					notice, commission finding or RTI reply. One primary link per row.
				</li>
			</ul>
			<p>
				Incidents where the allegation was later <em>rejected</em> stay in the record, marked
				<strong>Denied</strong>. A scandal that turned out to be false is part of the story of
				examination integrity in India, and deleting it would quietly inflate the confirmed count.
			</p>

			<h2>The evidentiary scale</h2>
			<p>
				The <code>leak_status</code> column is the most important field on this site, and every chart
				is coloured by it. It describes <em>the strength of the evidence</em>, not the severity of the
				alleged wrongdoing.
			</p>
			<dl class="scale">
				{#each STATUSES as status (status.key)}
					<div class="scale-row">
						<dt>
							<span class="dot" style="background:{status.color}"></span>
							{status.label}
							<span class="tnum muted">{incidents.filter((i) => i.status === status.key).length}</span>
						</dt>
						<dd>{status.blurb}</dd>
					</div>
				{/each}
			</dl>
			<p>
				Separately, <code>confidence</code> rates how solid the <em>row</em> is —
				{t.highConfidence} of {incidents.length} rows are High. A row can be a Low-confidence
				<em>Confirmed</em> incident: the leak is established, but our single source is thin on the
				specifics.
			</p>

			<h2>Known biases — read these before quoting a number</h2>

			<h3>Recent years are over-represented</h3>
			<p>
				A 2024 leak is covered by a dozen outlets, indexed by search engines, litigated in public and
				followed up months later. A 2007 state recruitment scandal may have been reported once, in
				print, in a regional language, and never digitised. The upward slope on the year chart is
				<strong>partly a real increase and partly an artefact of what is findable</strong>. Treat the
				shape as a floor.
			</p>

			<h3>English-language reporting dominates</h3>
			<p>
				Sources here skew heavily to English-language national dailies. States whose examination
				scandals are covered mainly in Hindi, Marathi, Telugu, Tamil, Bengali or Odia press are
				under-counted, and several states with no entries at all almost certainly have incidents we
				have not found.
			</p>

			<h3>“Candidates affected” mixes definitions</h3>
			<p>
				Some sources give everyone registered for the exam, some give everyone who sat it, some give
				only those whose sitting was voided. The dataset records whichever figure the source gives
				and does not attempt to normalise them. The total is an order-of-magnitude signal, and it
				is only summed across the {t.affectedRecorded} of {incidents.length} incidents that report any
				figure at all.
			</p>

			<h3>Convictions are systematically undercounted</h3>
			<p>
				Only {t.withConviction} incidents here carry a conviction count. That is not a claim that the
				other {incidents.length - t.withConviction} produced no convictions — it is a limitation of
				one-source-per-row. Sources are usually written soon after the leak; verdicts arrive years
				later and are rarely back-filled into the same article. If you can add a verdict to an old
				row, that is the single most valuable contribution you can make to this dataset.
			</p>

			<h3>Blank is not zero</h3>
			<p>
				An empty <code>arrests</code> cell means the source did not give a number, not that nobody
				was arrested. Most rows whose <code>action_taken</code> includes an FIR have a blank arrest
				count. The site renders these as <code>—</code> and never as <code>0</code>. The one place a
				literal zero appears is where a source explicitly reported none, as with the UGC-NET 2024
				closure report.
			</p>

			<h3>Dates are often approximate</h3>
			<p>
				Where a source establishes only the year or the month, the CSV stores a placeholder day and
				says so in the note. The site reads that note back and renders those dates as
				<code>≈ 2012</code> or <code>≈ Jun 2012</code> rather than inventing a precise day.
				{approxDated} of the {incidents.length} rows are dated this way.
			</p>

			<h2>On deaths</h2>
			<p>
				{deathRows} entries carry a <code>linked_deaths</code> figure, and they are deliberately excluded
				from every summary statistic on this site. The reason is that summing them would produce a number
				that is arithmetically correct and substantively false: the 23 deaths beside the Vyapam entry
				span a decade-long scam rather than one examination and were investigated with foul play
				ruled out in every case the CBI examined; the single death beside RAS 2013 is the accused
				mastermind, not a candidate; and the NEET figures are press tallies that conflate
				leak-specific distress with India's much older and broader problem of examination-pressure
				suicide. Each figure appears only next to its own caveat.
			</p>

			<h2>On named individuals</h2>
			<p>
				The dataset records institutions, counts and outcomes. It does not name accused individuals,
				and it should not be used to imply anyone's guilt. Arrests are not convictions; charges are
				dropped; several entries here were officially rejected outright. Where a person is
				identifiable from the linked article, that is the publisher's editorial decision, not ours.
			</p>

			<h2 id="schema">Column dictionary</h2>
			<p>
				The canonical file is <code>exam_leaks.csv</code> at the repository root. Everything on this
				site is derived from it at build time — there is no database and no second copy.
			</p>
			<div class="scroll-x">
				<table class="data-table" style="font-size:.8rem">
					<thead>
						<tr><th>Column</th><th>Type</th><th>Meaning</th></tr>
					</thead>
					<tbody>
						{#each SCHEMA as row (row.field)}
							<tr>
								<th scope="row" style="font-family:var(--font-mono);font-size:.9em;white-space:nowrap"
									>{row.field}</th
								>
								<td style="text-align:left;white-space:nowrap;color:var(--ink-3)">{row.type}</td>
								<td style="text-align:left;white-space:normal">{row.note}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<h2>Get the data</h2>
			<ul>
				<li><a href="/data/exam-leaks.csv" download>exam-leaks.csv</a> — the raw file, verbatim.</li>
				<li>
					<a href="/data/exam-leaks.json" download>exam-leaks.json</a> — normalised: parsed dates, resolved
					state slugs, structured actions, permalinks.
				</li>
				<li><a href={LINKS.csvRaw} rel="noopener noreferrer" target="_blank">Raw file on GitHub ↗</a></li>
			</ul>
			<p>
				Licensed <strong>CC BY 4.0</strong>. Use it, chart it, publish from it — please credit
				<em>Exam Leaks</em> and link back so corrections propagate. The linked articles remain the
				copyright of their publishers.
			</p>

			<h2>Corrections</h2>
			<p>
				If a row misstates a source, if you can supply a verdict for a pending case, or if an
				incident is missing entirely,
				<a href={LINKS.correction} rel="noopener noreferrer" target="_blank">open a correction issue</a>
				or edit the CSV directly. Corrections are treated as more valuable than additions.
			</p>
			<div class="row" style="margin-top:1.5rem">
				<a class="btn btn-primary" href="/contribute">How to contribute</a>
				<a class="btn" href={LINKS.repo} rel="noopener noreferrer" target="_blank">Repository ↗</a>
			</div>
		</div>
	</div>
</main>

<style>
	.scale {
		display: grid;
		border-top: 1px solid var(--rule);
		margin-top: 1rem;
	}

	.scale-row {
		display: grid;
		grid-template-columns: 11rem minmax(0, 1fr);
		gap: 0.5rem 1.25rem;
		padding: 0.85rem 0;
		border-bottom: 1px solid var(--rule);
	}

	.scale-row dt {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		font-family: var(--font-sans);
		font-size: 0.85rem;
		font-weight: 700;
	}

	.scale-row dt .dot {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 50%;
		flex: none;
	}

	.scale-row dd {
		margin: 0;
		font-size: 0.95rem;
		color: var(--ink-2);
		line-height: 1.55;
	}

	@media (max-width: 560px) {
		.scale-row {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
