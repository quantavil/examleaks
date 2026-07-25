<script lang="ts">
	import { page } from '$app/state';
	import { LINKS } from '$lib/site';
	import ThemeToggle from './ThemeToggle.svelte';

	const NAV = [
		{ href: '/', label: 'Dashboard', optional: false },
		{ href: '/states', label: 'States', optional: true },
		{ href: '/about', label: 'Method', optional: true },
		{ href: '/contribute', label: 'Contribute', optional: false }
	];

	const isCurrent = (href: string): boolean =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
</script>

<header class="masthead">
	<div class="wrap masthead-inner">
		<a class="wordmark" href="/">
			<span><span class="mark">Exam</span>&nbsp;Leaks</span>
			<span class="tagline">India · open record</span>
		</a>

		<nav aria-label="Primary">
			{#each NAV as item (item.href)}
				<a
					class="navlink"
					class:is-optional={item.optional}
					href={item.href}
					aria-current={isCurrent(item.href) ? 'page' : undefined}>{item.label}</a
				>
			{/each}
			<a
				class="navlink is-optional"
				href={LINKS.repo}
				rel="noopener noreferrer"
				target="_blank"
				title="Source code and dataset on GitHub">GitHub ↗</a
			>
			<ThemeToggle />
		</nav>
	</div>
</header>
