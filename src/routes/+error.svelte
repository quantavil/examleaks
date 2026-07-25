<script lang="ts">
	import { page } from '$app/state';
	import { incidents } from '$lib/data';
</script>

<svelte:head>
	<title>{page.status} — Exam Leaks</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main" class="wrap" style="padding-block:clamp(4rem,12vw,8rem);max-width:60ch">
	<p class="kicker">Error {page.status}</p>
	<h1 class="display" style="margin-top:1rem;font-size:clamp(2.2rem,6vw,3.6rem)">
		{page.status === 404 ? 'No such record.' : 'Something broke.'}
	</h1>
	<p class="standfirst" style="margin-top:1.25rem">
		{#if page.status === 404}
			That page is not part of the record. There are {incidents.length} documented incidents — the dashboard
			is the fastest way to find the one you want.
		{:else}
			{page.error?.message ?? 'An unexpected error occurred.'}
		{/if}
	</p>
	<div class="row" style="margin-top:2rem;gap:.6rem">
		<a class="btn btn-primary" href="/">Back to the dashboard</a>
		<a class="btn" href="/states">Browse by state</a>
		<a class="btn" href="/years">Browse by year</a>
	</div>
</main>
