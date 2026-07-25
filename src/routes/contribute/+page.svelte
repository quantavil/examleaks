<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { MAX_YEAR, incidents } from '$lib/data';
	import { LINKS, REPO_SLUG, abs } from '$lib/site';

	const sample = `PL-0111,2026-08-14,NDA (May2014-now),Example State Clerk Recruitment Exam 2026,\
Example Staff Selection Commission (ESSC),State,Example State (Capital City),Confirmed,\
Exam cancelled + Arrests-FIR,"Question paper circulated on Telegram 40 minutes before the \
shift began; the board cancelled that shift the same evening and police arrested 4. Day known.",\
4,,52000,,,The Example Herald,https://example.com/article,High`;

	const description =
		'How to add a missing exam leak, correct an existing row, or improve a source in the Exam Leaks dataset. One CSV file, one pull request.';

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'HowTo',
		name: 'Contribute an incident to the Exam Leaks dataset',
		description,
		url: abs('/contribute'),
		step: [
			{ '@type': 'HowToStep', name: 'Find a citable source', text: 'A named news report, court order, official notice or RTI reply.' },
			{ '@type': 'HowToStep', name: 'Add one row to exam_leaks.csv', text: 'Follow the column dictionary. Leave a field blank rather than guessing.' },
			{ '@type': 'HowToStep', name: 'Open a pull request', text: 'A preview build validates the CSV and a maintainer checks the source against the claim.' }
		]
	};
</script>

<Seo title="Contribute" {description} path="/contribute" {jsonLd} />

<main id="main">
	<header class="wrap wrap-prose" style="padding-block:clamp(2rem,5vw,3.5rem) 0">
		<p class="kicker">Open data</p>
		<h1 class="display" style="margin-top:.9rem;font-size:clamp(2.1rem,5.5vw,3.4rem)">
			Add the leak we missed.
		</h1>
		<p class="standfirst" style="margin-top:1.25rem">
			The whole dataset is one CSV file with {incidents.length} rows. There is no database, no login
			and no submission portal — just a file you can edit in the browser.
		</p>
		<div class="row" style="margin-top:1.6rem;gap:.6rem">
			<a class="btn btn-accent" href={LINKS.newIncident} rel="noopener noreferrer" target="_blank"
				>Submit an incident</a
			>
			<a class="btn" href={LINKS.editCsv} rel="noopener noreferrer" target="_blank">Edit the CSV</a>
			<a class="btn" href={LINKS.correction} rel="noopener noreferrer" target="_blank">Report an error</a>
		</div>
		<hr class="rule-double" style="margin-top:2rem" />
	</header>

	<div class="wrap wrap-prose">
		<div class="prose" style="padding-block:2.5rem 4rem">
			<h2 style="margin-top:0;border-top:0;padding-top:0">Three ways in, easiest first</h2>

			<div class="ways">
				<div class="way">
					<span class="way-n">A</span>
					<div>
						<h3 style="margin:0 0 .35rem">Open an issue — no code needed</h3>
						<p>
							Paste the link and whatever you know. Use the
							<a href={LINKS.newIncident} rel="noopener noreferrer" target="_blank">new incident form</a>
							— it asks for the fields in order and someone will transcribe it into the CSV. This is a
							completely legitimate way to contribute and it is how most rows should arrive.
						</p>
					</div>
				</div>

				<div class="way">
					<span class="way-n">B</span>
					<div>
						<h3 style="margin:0 0 .35rem">Edit the CSV in GitHub's web editor</h3>
						<p>
							<a href={LINKS.editCsv} rel="noopener noreferrer" target="_blank">Click here</a>, add
							your row at the bottom, and GitHub will open a pull request for you. No git, no local
							setup.
						</p>
					</div>
				</div>

				<div class="way">
					<span class="way-n">C</span>
					<div>
						<h3 style="margin:0 0 .35rem">Clone and run it locally</h3>
						<p>Useful if you are adding several rows and want to see them render before you push.</p>
						<pre><code>git clone https://github.com/{REPO_SLUG}.git
cd {REPO_SLUG.split('/')[1]}
bun install
bun run dev</code></pre>
					</div>
				</div>
			</div>

			<h2>What makes a row acceptable</h2>
			<ul>
				<li>
					<strong>One citable public source.</strong> A named news report, a court order, an official
					notice, a commission finding or an RTI reply. Not a forum post, not a WhatsApp forward, not
					a YouTube claim, not an anonymous tip.
				</li>
				<li>
					<strong>A public examination.</strong> Government recruitment, entrance, eligibility or
					school-board tests. Private and corporate testing is out of scope.
				</li>
				<li>
					<strong>Organised failure.</strong> A leak, an answer-key sale, marks or OMR manipulation,
					impersonation rackets, remote access to exam terminals. One student copying is not an
					incident.
				</li>
				<li>
					<strong>No named individuals.</strong> Record the institution, the counts and the outcome.
					Do not add the names of accused people, even when the source prints them.
				</li>
			</ul>

			<div class="callout">
				<p>
					<strong>The most valuable contribution is not a new row.</strong> It is a verdict added to
					an old one. Most entries here were sourced from articles written days after the leak, so
					convictions handed down years later are missing across the board. If you can point to a
					judgment for a case from 2013 or 2017, that materially improves the dataset in a way a
					new 2026 row does not.
				</p>
			</div>

			<h2>Filling in the fields</h2>
			<p>
				The full column dictionary is on the <a href="/about#schema">method page</a>. The rules that
				actually trip people up:
			</p>
			<ul>
				<li>
					<strong>Blank beats a guess.</strong> An empty <code>arrests</code> cell means "the source
					does not say". Never write <code>0</code> unless the source explicitly reports none.
				</li>
				<li>
					<strong>Pick the status honestly.</strong> <code>Confirmed</code> requires an official
					finding — a cancellation citing a leak, a court order, a police confirmation.
					A newspaper reporting that an opposition party alleged a leak is <code>Alleged</code>. If
					officials investigated and rejected it, that is <code>Denied</code>, and the row still
					belongs in the file.
				</li>
				<li>
					<strong>Say so when the date is fuzzy.</strong> If the source gives only a year, use
					<code>YYYY-01-01</code> and write “Only year of exam known, Jan placeholder.” in the note.
					The site reads that sentence and renders the date as <code>≈ YYYY</code> instead of
					pretending to a precision nobody established.
				</li>
				<li>
					<strong>Any death figure needs its caveat.</strong> <code>linked_deaths</code> may never be
					filled in without a <code>deaths_note</code> explaining whose deaths, how contested the link
					is, and what the number does not mean.
				</li>
				<li>
					<strong>Use the next free ID.</strong> Sequential, zero-padded, never reused.
				</li>
			</ul>

			<h3>A worked example</h3>
			<p>One row, wrapped here for readability — in the file it is a single line:</p>
			<pre><code>{sample}</code></pre>
			<p class="micro">
				Note the quoting: the free-text <code>note</code> contains commas, so it is wrapped in double
				quotes. A literal quote inside a quoted field is doubled (<code>""</code>).
			</p>

			<h2>What happens to your pull request</h2>
			<ol>
				<li>
					A preview build parses the CSV and rebuilds the site — a malformed row fails immediately,
					before anyone reviews it.
				</li>
				<li>
					A maintainer opens your source and checks it says what the row says. Rows are rejected for
					overstating the source far more often than for anything else.
				</li>
				<li>
					Once merged, your incident gets a permanent page at <code>/incident/PL-XXXX</code>, a
					share card, and a place in every chart and download on the site.
				</li>
			</ol>

			<h2>Gaps we know about</h2>
			<p>If you are looking for somewhere useful to start:</p>
			<ul>
				<li>
					<strong>Pre-2015 state recruitment exams.</strong> The record thins out badly before the
					mid-2010s and the drop is far too steep to be real.
				</li>
				<li>
					<strong>Regional-language reporting.</strong> Sources here skew to English national
					dailies. Incidents covered only in Hindi, Marathi, Telugu, Tamil, Bengali or Odia press
					are systematically missing.
				</li>
				<li>
					<strong>States with no entries at all.</strong> See the bottom of the
					<a href="/states">states page</a>. Empty almost certainly means unfound, not clean.
				</li>
				<li>
					<strong>Outcomes after {MAX_YEAR - 3}.</strong> Convictions, acquittals, quashed
					recruitments, exam boards dissolved.
				</li>
			</ul>

			<h2>Reporting a problem with the site itself</h2>
			<p>
				Broken charts, a link that 404s, an accessibility failure, a bad translation of a figure —
				<a href={LINKS.issues} rel="noopener noreferrer" target="_blank">open an issue</a>. The code is
				GPL-3.0-licensed and the data is CC BY 4.0; fork either freely.
			</p>

			<div class="row" style="margin-top:2rem;gap:.6rem">
				<a class="btn btn-accent" href={LINKS.newIncident} rel="noopener noreferrer" target="_blank"
					>Submit an incident</a
				>
				<a class="btn" href={LINKS.contributing} rel="noopener noreferrer" target="_blank"
					>CONTRIBUTING.md ↗</a
				>
				<a class="btn" href="/about">Method &amp; caveats</a>
			</div>
		</div>
	</div>
</main>

<style>
	.ways {
		display: grid;
		gap: 0;
		border-top: 1px solid var(--rule);
		margin-top: 1.25rem;
	}

	.way {
		display: grid;
		grid-template-columns: 2.1rem minmax(0, 1fr);
		gap: 1rem;
		padding: 1.3rem 0;
		border-bottom: 1px solid var(--rule);
	}

	.way-n {
		font-family: var(--font-sans);
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--accent-ink);
		background: var(--accent);
		width: 1.9rem;
		height: 1.9rem;
		display: grid;
		place-items: center;
		border-radius: 2px;
	}

	.way h3 {
		font-family: var(--font-serif);
		font-size: 1.12rem;
	}

	.way p {
		font-size: 0.98rem;
	}

	.ways pre {
		margin-top: 0.75rem;
	}
</style>
