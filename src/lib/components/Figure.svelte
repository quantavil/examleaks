<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Series } from '$lib/charts/types';
	import Legend from './Legend.svelte';

	let {
		title,
		subtitle,
		note,
		series = [],
		table,
		children,
		aside
	}: {
		title: string;
		subtitle?: string;
		note?: string;
		/** A legend is rendered automatically for two or more series. */
		series?: Series[];
		/** Accessible fallback: the same numbers as a table. */
		table?: { head: string[]; rows: (string | number)[][] };
		children: Snippet;
		aside?: Snippet;
	} = $props();
</script>

<figure class="figure">
	<div class="figure-head">
		<h3 class="figure-title">{title}</h3>
		{#if subtitle}<p class="figure-sub">{subtitle}</p>{/if}
		{#if series.length > 1}
			<Legend {series} />
		{/if}
	</div>

	{@render children()}

	<figcaption class="figure-foot">
		{#if aside}{@render aside()}{/if}
		{#if note}<p class="figure-note">{note}</p>{/if}
		{#if table}
			<details>
				<summary>Show the numbers</summary>
				<div class="scroll-x">
					<table class="data-table">
						<thead>
							<tr>
								{#each table.head as h (h)}<th scope="col">{h}</th>{/each}
							</tr>
						</thead>
						<tbody>
							{#each table.rows as row, i (i)}
								<tr>
									{#each row as cell, c (c)}
										{#if c === 0}
											<th scope="row" style="font-weight:600">{cell}</th>
										{:else}
											<td>{cell}</td>
										{/if}
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</details>
		{/if}
	</figcaption>
</figure>
