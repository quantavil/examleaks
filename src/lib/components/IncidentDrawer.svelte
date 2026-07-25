<script lang="ts">
	import ActionTags from './ActionTags.svelte';
	import StatusPill from './StatusPill.svelte';
	import type { Incident } from '$lib/data/types';
	import { PRECISION_NOTE, compact, fmtDateLong, isApprox, num } from '$lib/format';

	let { incident, onclose }: { incident: Incident; onclose: () => void } = $props();

	// "All All India cases" — the nationwide pseudo-state needs its own wording.
	const placeLink = $derived(
		incident.primaryState === 'All India'
			? 'All nationwide exams'
			: `All ${incident.primaryState} cases`
	);

	let closeBtn = $state<HTMLButtonElement | null>(null);
	let panel = $state<HTMLElement | null>(null);
	let copied = $state(false);

	$effect(() => {
		// Track the incident so re-opening on a different row re-runs the effect.
		void incident.id;
		const restore = document.activeElement as HTMLElement | null;
		document.body.classList.add('is-locked');
		closeBtn?.focus();

		return () => {
			document.body.classList.remove('is-locked');
			if (restore && document.contains(restore)) restore.focus();
		};
	});

	function trapTab(event: KeyboardEvent): void {
		if (event.key !== 'Tab' || !panel) return;
		const focusable = panel.querySelectorAll<HTMLElement>(
			'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		if (focusable.length === 0) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}

	async function copyLink(): Promise<void> {
		try {
			await navigator.clipboard.writeText(`${location.origin}/incident/${incident.id}`);
			copied = true;
			setTimeout(() => (copied = false), 1800);
		} catch {
			// Clipboard blocked — the permalink button beside this still works.
		}
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') onclose();
	}}
/>

<button class="drawer-backdrop" onclick={onclose} aria-label="Close details" tabindex="-1"></button>

<div
	class="drawer"
	role="dialog"
	aria-modal="true"
	aria-labelledby="drawer-title"
	tabindex="-1"
	bind:this={panel}
	onkeydown={trapTab}
>
	<div class="drawer-head">
		<div class="row" style="gap:.5rem">
			<span class="mono muted">{incident.id}</span>
			<StatusPill status={incident.status} title />
			<span class="tag">{incident.confidence} confidence</span>
		</div>
		<div class="row" style="justify-content:space-between;flex-wrap:nowrap;align-items:flex-start;gap:1rem">
			<h2 id="drawer-title" style="font-size:1.3rem;line-height:1.2">{incident.examName}</h2>
			<button class="icon-btn" bind:this={closeBtn} onclick={onclose} aria-label="Close details">
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
					<path d="M5 5l14 14M19 5L5 19" />
				</svg>
			</button>
		</div>
	</div>

	<div class="drawer-body">
		<p style="font-size:1.02rem;line-height:1.62">{incident.note}</p>

		<dl class="deflist">
			<div class="defrow">
				<dt>Date</dt>
				<dd>
					{isApprox(incident.datePrecision) ? '≈ ' : ''}{fmtDateLong(
						incident.date,
						incident.datePrecision
					)}
					{#if isApprox(incident.datePrecision)}
						<span class="micro" style="display:block;margin-top:.2rem"
							>{PRECISION_NOTE[incident.datePrecision]}</span
						>
					{/if}
				</dd>
			</div>

			<div class="defrow">
				<dt>Conducted by</dt>
				<dd>{incident.conductingBody} <span class="muted">· {incident.bodyType}</span></dd>
			</div>

			<div class="defrow">
				<dt>Where</dt>
				<dd>{incident.area}</dd>
			</div>

			<div class="defrow">
				<dt>Action taken</dt>
				<dd><ActionTags actions={incident.actions} /></dd>
			</div>

			{#if incident.arrests !== null}
				<div class="defrow">
					<dt>Arrests</dt>
					<dd class="tnum">{num(incident.arrests)}</dd>
				</div>
			{/if}

			{#if incident.convictions !== null}
				<div class="defrow">
					<dt>Convictions</dt>
					<dd class="tnum">{num(incident.convictions)}</dd>
				</div>
			{/if}

			{#if incident.affected !== null}
				<div class="defrow">
					<dt>Candidates</dt>
					<dd class="tnum">
						{num(incident.affected)}
						<span class="muted">({compact(incident.affected)})</span>
					</dd>
				</div>
			{/if}

			<div class="defrow">
				<dt>Period</dt>
				<dd>{incident.eraLabel}</dd>
			</div>

			<div class="defrow">
				<dt>Source</dt>
				<dd>
					<a href={incident.sourceUrl} rel="noopener noreferrer nofollow" target="_blank"
						>{incident.sourceName} ↗</a
					>
				</dd>
			</div>
		</dl>

		{#if incident.deaths !== null && incident.deathsNote}
			<div class="callout">
				<p class="kicker is-plain">Deaths linked to this case — read the caveat</p>
				<p>
					<strong>{num(incident.deaths)} reported.</strong>
					{incident.deathsNote}
				</p>
			</div>
		{/if}

		<div class="callout is-quiet">
			<p class="micro" style="color:var(--ink-3)">
				This entry summarises the linked report. It records institutions and outcomes, not the
				names of accused individuals. An arrest is not a conviction; where a claim was officially
				rejected, the status above says so.
			</p>
		</div>
	</div>

	<div class="drawer-foot">
		<a class="btn btn-sm btn-primary" href="/incident/{incident.id}">Open full page</a>
		<button class="btn btn-sm" onclick={copyLink}>{copied ? 'Link copied' : 'Copy link'}</button>
		{#if incident.primaryStateSlug}
			<a class="btn btn-sm" href="/state/{incident.primaryStateSlug}">{placeLink}</a>
		{/if}
		<a class="btn btn-sm" href="/year/{incident.year}">{incident.year}</a>
	</div>
</div>
