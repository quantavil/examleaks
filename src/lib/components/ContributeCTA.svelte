<script lang="ts">
	import { LINKS } from '$lib/site';

	let {
		heading = 'This record is incomplete. Help finish it.',
		blurb = 'Every row here is one news report away from being verifiable — and there are leaks we have certainly missed, especially state recruitment exams before 2015 and cases reported only in regional-language press. The dataset is one CSV file. Adding to it takes a pull request.'
	}: { heading?: string; blurb?: string } = $props();
</script>

<section class="cta" id="contribute-cta">
	<div class="wrap inner">
		<div>
			<p class="kicker">Open data · CC BY 4.0</p>
			<h2 style="margin-top:.7rem">{heading}</h2>
			<p>{blurb}</p>
			<div class="row" style="margin-top:1.5rem;gap:.6rem">
				<a class="btn btn-accent" href={LINKS.newIncident}>
					Submit a leak
				</a>
				<a class="btn" href={LINKS.editCsv}>
					Edit the CSV
				</a>
				<a class="btn" href={LINKS.correction}>
					Report an error
				</a>
			</div>
		</div>

		<div class="cta-steps">
			<div class="cta-step">
				<span class="n">1</span>
				<span><b>Find a source.</b> A named news report, court order, official notice or RTI reply. One incident, one primary link.</span>
			</div>
			<div class="cta-step">
				<span class="n">2</span>
				<span><b>Add one row</b> to <code style="font-family:var(--font-mono);font-size:.85em">exam_leaks.csv</code>. Leave a field blank rather than guessing it.</span>
			</div>
			<div class="cta-step">
				<span class="n">3</span>
				<span><b>Open a pull request.</b> A preview build validates the row; a maintainer checks the source against the claim.</span>
			</div>
			<div class="cta-step">
				<span class="n">4</span>
				<span><b>Not a coder?</b> Open an issue with the link and we will transcribe it for you.</span>
			</div>
		</div>
	</div>
</section>
