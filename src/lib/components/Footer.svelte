<script lang="ts">
	import { LAST_DATE, MAX_YEAR, MIN_YEAR, incidents } from '$lib/data';
	import { fmtDateLong } from '$lib/format';
	import { LINKS } from '$lib/site';
</script>

<footer class="site-footer">
	<div class="wrap">
		<div class="footer-grid">
			<div class="footer-col">
				<h4>The record</h4>
				<ul>
					<li><a href="/">Dashboard</a></li>
					<li><a href="/states">Browse by state</a></li>
					<li><a href="/years">Browse by year</a></li>
					<li><a href="/about">Method &amp; caveats</a></li>
				</ul>
			</div>

			<div class="footer-col">
				<h4>Data</h4>
				<ul>
					<li><a href="/data/exam-leaks.json" download>Download JSON</a></li>
					<li><a href={LINKS.csvRaw} rel="noopener noreferrer" target="_blank">Source CSV ↗</a></li>
					<li><a href="/about#schema">Column dictionary</a></li>
					<li><a href="/sitemap.xml">Sitemap</a></li>
				</ul>
			</div>

			<div class="footer-col">
				<h4>Contribute</h4>
				<ul>
					<li><a href="/contribute">How to add a leak</a></li>
					<li><a href={LINKS.newIncident} rel="noopener noreferrer" target="_blank">Submit an incident ↗</a></li>
					<li><a href={LINKS.correction} rel="noopener noreferrer" target="_blank">Report an error ↗</a></li>
					<li><a href={LINKS.repo} rel="noopener noreferrer" target="_blank">Source on GitHub ↗</a></li>
				</ul>
			</div>

			<div class="footer-col">
				<h4>Coverage</h4>
				<ul>
					<li class="micro" style="color:var(--ink-2)">
						{incidents.length} incidents, {MIN_YEAR}–{MAX_YEAR}
					</li>
					<li class="micro" style="color:var(--ink-2)">
						Latest record: {fmtDateLong(LAST_DATE)}
					</li>
				</ul>
			</div>
		</div>

		<div class="footer-fine">
			<p>
				<strong style="color:var(--ink-2)">What this is.</strong> A community-maintained index of
				publicly reported examination-integrity failures in India. Every row links to the report it
				was drawn from. It is a reading aid for those reports — not an official register, not a
				legal finding, and not a complete census of every leak that has occurred.
			</p>
			<p>
				<strong style="color:var(--ink-2)">On named individuals.</strong> The dataset records
				institutions, counts and outcomes. It does not name accused individuals, and it should not
				be used to imply guilt: an arrest is not a conviction, and several entries here were
				later officially rejected or found to involve fake papers. Where a case was denied or
				disproved, the record says so.
			</p>
			<p>
				Text and data licensed
				<a href={`${LINKS.repo}/blob/main/LICENSE-DATA`} rel="noopener noreferrer" target="_blank"
					>CC BY 4.0</a
				>. Source code licensed
				<a href={`${LINKS.repo}/blob/main/LICENSE`} rel="noopener noreferrer" target="_blank"
					>GPL-3.0</a
				>. Linked articles remain the copyright of their publishers.
			</p>
		</div>
	</div>
</footer>
