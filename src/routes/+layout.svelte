<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import ContributeCTA from '$lib/components/ContributeCTA.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Masthead from '$lib/components/Masthead.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	// The contribute page is itself the call to action.
	const showCta = $derived(page.url.pathname !== '/contribute');
</script>

<a class="skip-link" href="#main">Skip to content</a>

<Masthead />

{@render children()}

{#if showCta}
	<ContributeCTA />
{/if}

<Footer />
