<script lang="ts">
	import type { ActionKind, IncidentAction } from '$lib/data/types';

	let { actions, compact = false }: { actions: IncidentAction[]; compact?: boolean } = $props();

	const ICONS: Record<ActionKind, string> = {
		cancelled: '✕',
		retest: '↻',
		arrests: '⚖',
		probe: '⌕',
		none: '–'
	};

	/** Table cells are narrow; full labels force one tag per line. */
	const SHORT: Record<ActionKind, string> = {
		cancelled: 'Cancelled',
		retest: 'Retest',
		arrests: 'FIR',
		probe: 'Probe',
		none: 'None'
	};
</script>

{#if actions.length === 0}
	<span class="tag muted">No action recorded</span>
{:else}
	<span class="row" style="gap:.3rem">
		{#each actions as action (action.kind)}
			<span class="tag" title={action.detail ? `${action.label} — ${action.detail}` : action.label}>
				<span aria-hidden="true" style="opacity:.6">{ICONS[action.kind] ?? '•'}</span>
				{compact ? SHORT[action.kind] : action.label}{#if action.detail && !compact}<span
						class="muted">&nbsp;· {action.detail}</span
					>{/if}
			</span>
		{/each}
	</span>
{/if}
