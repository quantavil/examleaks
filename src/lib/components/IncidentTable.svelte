<script lang="ts">
	import ActionTags from './ActionTags.svelte';
	import StatusPill from './StatusPill.svelte';
	import { toCsv } from '$lib/data/csv';
	import { STATUS_ORDER } from '$lib/data/types';
	import type { Incident } from '$lib/data/types';
	import { compactShort, fmtDate, isApprox, num } from '$lib/format';

	let {
		list,
		onselect,
		showExport = true
	}: {
		list: Incident[];
		onselect: (incident: Incident) => void;
		showExport?: boolean;
	} = $props();

	type SortKey = 'date' | 'exam' | 'body' | 'where' | 'status' | 'arrests' | 'convictions' | 'affected';

	let sortKey = $state<SortKey>('date');
	let sortDir = $state<'asc' | 'desc'>('desc');

	const COLUMNS: { key: SortKey; label: string; numeric?: boolean; title?: string }[] = [
		{ key: 'date', label: 'Date' },
		{ key: 'exam', label: 'Examination' },
		{ key: 'where', label: 'Where' },
		{ key: 'status', label: 'Status' },
		{ key: 'arrests', label: 'Arrests', numeric: true, title: 'Arrests recorded in the linked source' },
		{ key: 'convictions', label: 'Convict.', numeric: true, title: 'Convictions recorded in the linked source' },
		{ key: 'affected', label: 'Candidates', numeric: true, title: 'Candidates affected, where the source gives a figure' }
	];

	function toggleSort(key: SortKey): void {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			// Numbers and dates are most useful largest-first.
			sortDir = key === 'exam' || key === 'where' || key === 'body' ? 'asc' : 'desc';
		}
	}

	/** Missing figures always sort last, in both directions. */
	function cmpNullable(a: number | null, b: number | null, dir: number): number {
		if (a === null && b === null) return 0;
		if (a === null) return 1;
		if (b === null) return -1;
		return (a - b) * dir;
	}

	const sorted = $derived.by(() => {
		const dir = sortDir === 'asc' ? 1 : -1;
		const text = (a: string, b: string) => a.localeCompare(b) * dir;

		return [...list].sort((a, b) => {
			switch (sortKey) {
				case 'exam':
					return text(a.examName, b.examName);
				case 'body':
					return text(a.bodyLabel, b.bodyLabel);
				case 'where':
					return text(a.primaryState ?? 'zz', b.primaryState ?? 'zz');
				case 'status':
					return (STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)) * dir;
				case 'arrests':
					return cmpNullable(a.arrests, b.arrests, dir);
				case 'convictions':
					return cmpNullable(a.convictions, b.convictions, dir);
				case 'affected':
					return cmpNullable(a.affected, b.affected, dir);
				default:
					return (a.date < b.date ? -1 : a.date > b.date ? 1 : 0) * dir;
			}
		});
	});

	const ariaSort = (key: SortKey): 'ascending' | 'descending' | undefined =>
		sortKey === key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined;

	/**
	 * Every row links to its own page: crawlable, works without JS, and
	 * middle/⌘-click behaves as expected. A plain left click is intercepted
	 * to open the drawer instead, which is the faster way to read the record.
	 */
	function openInline(event: MouseEvent, incident: Incident): void {
		if (event.defaultPrevented) return;
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
			return;
		}
		event.preventDefault();
		onselect(incident);
	}

	/** Clicking anywhere else on the row does the same, unless it hit a link. */
	function rowClick(event: MouseEvent, incident: Incident): void {
		if ((event.target as HTMLElement | null)?.closest('a')) return;
		onselect(incident);
	}

	function exportView(): void {
		const head = [
			'incident_id',
			'date',
			'exam_name',
			'conducting_body',
			'body_type',
			'area',
			'leak_status',
			'action_taken',
			'arrests',
			'convictions',
			'aspirants_affected',
			'linked_deaths',
			'source_name',
			'source_url',
			'confidence',
			'note'
		];
		const rows = sorted.map((i) => [
			i.id,
			i.date,
			i.examName,
			i.conductingBody,
			i.bodyType,
			i.area,
			i.status,
			i.actionRaw,
			i.arrests,
			i.convictions,
			i.affected,
			i.deaths,
			i.sourceName,
			i.sourceUrl,
			i.confidence,
			i.note
		]);

		const blob = new Blob([toCsv(head, rows)], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `exam-leaks-view-${sorted.length}-rows.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

{#if showExport}
	<div class="spread" style="margin-bottom:.85rem">
		<p class="micro">
			Showing <strong class="tnum" style="color:var(--ink)">{num(sorted.length)}</strong>
			{sorted.length === 1 ? 'incident' : 'incidents'}. Select any row for the full record.
		</p>
		<button class="btn btn-sm" onclick={exportView} disabled={sorted.length === 0}>
			Export this view (CSV)
		</button>
	</div>
{/if}

{#if sorted.length === 0}
	<div class="empty-state">
		<p style="font-family:var(--font-serif);font-size:1.2rem">Nothing matches these filters.</p>
		<p class="micro">Clear a filter above, or widen the search.</p>
	</div>
{:else}
	<!-- Wide screens: a sortable table.
	     Deliberately NOT wrapped in an overflow container — that would make the
	     sticky header stick to the wrapper instead of the viewport, pushing it
	     down over the first row. The card layout takes over below 1024px. -->
	<div class="tbl-desktop">
		<table class="records">
			<caption class="sr-only">
				Documented Indian examination leak incidents, sortable by column.
			</caption>
			<thead>
				<tr>
					{#each COLUMNS as col (col.key)}
						<th
							scope="col"
							class:col-num={col.numeric}
							aria-sort={ariaSort(col.key)}
							title={col.title}
						>
							<button type="button" onclick={() => toggleSort(col.key)}>
								{col.label}
								<span class="sort-caret" aria-hidden="true">
									{sortKey === col.key && sortDir === 'asc' ? '▲' : '▼'}
								</span>
							</button>
						</th>
					{/each}
					<th scope="col">Outcome</th>
				</tr>
			</thead>
			<tbody>
				{#each sorted as incident (incident.id)}
					<!-- The row-level click is a redundant convenience for mouse users;
					     the exam-name link below is the accessible, crawlable path. -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<tr onclick={(e) => rowClick(e, incident)}>
						<td class="cell-date">
							{isApprox(incident.datePrecision) ? '≈' : ''}{fmtDate(
								incident.date,
								incident.datePrecision
							)}
						</td>
						<td class="cell-exam">
							<a href="/incident/{incident.id}" onclick={(e) => openInline(e, incident)}>
								{incident.examName}
							</a>
							<div class="cell-sub">{incident.bodyShort} · {incident.bodyType}</div>
						</td>
						<td>
							{incident.primaryState ?? '—'}
							{#if incident.locality}
								<div class="cell-sub">{incident.locality}</div>
							{/if}
						</td>
						<td><StatusPill status={incident.status} /></td>
						<td class="col-num">{incident.arrests === null ? '—' : num(incident.arrests)}</td>
						<td class="col-num">{incident.convictions === null ? '—' : num(incident.convictions)}</td>
						<td class="col-num" title={incident.affected === null ? '' : num(incident.affected)}>
							{incident.affected === null ? '—' : compactShort(incident.affected)}
						</td>
						<td><ActionTags actions={incident.actions} compact /></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Narrow screens: cards -->
	<div class="tbl-mobile record-cards">
		{#each sorted as incident (incident.id)}
			<a
				class="record-card"
				href="/incident/{incident.id}"
				onclick={(e) => openInline(e, incident)}
			>
				<div class="row" style="gap:.4rem">
					<StatusPill status={incident.status} />
					<span class="micro tnum"
						>{isApprox(incident.datePrecision) ? '≈' : ''}{fmtDate(
							incident.date,
							incident.datePrecision
						)}</span
					>
				</div>
				<div class="rc-title">{incident.examName}</div>
				<div class="rc-meta">
					<span>{incident.bodyShort}</span>
					<span>{incident.primaryState ?? '—'}</span>
					{#if incident.affected !== null}
						<span>{compactShort(incident.affected)} candidates</span>
					{/if}
					{#if incident.arrests !== null}
						<span>{num(incident.arrests)} arrests</span>
					{/if}
				</div>
				<ActionTags actions={incident.actions} compact />
			</a>
		{/each}
	</div>
{/if}

<style>
	.tbl-desktop {
		display: block;
	}
	.tbl-mobile {
		display: none;
	}

	@media (max-width: 1024px) {
		.tbl-desktop {
			display: none;
		}
		.tbl-mobile {
			display: grid;
		}
	}
</style>
