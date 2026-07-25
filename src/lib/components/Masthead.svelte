<script lang="ts">
	import { page } from '$app/state';
	import ThemeToggle from './ThemeToggle.svelte';

	const NAV = [
		{ href: '/', label: 'Dashboard' },
		{ href: '/record', label: 'Record' },
		{ href: '/states', label: 'States' },
		{ href: '/about', label: 'Method' },
		{ href: '/contribute', label: 'Contribute' }
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

		<!-- The toggle sits outside the nav so that on narrow screens the nav can
		     drop to a full-width second row while the toggle stays on the first,
		     beside the wordmark. Nothing is hidden at any width. -->
		<nav aria-label="Primary">
			{#each NAV as item (item.href)}
				<a
					class="navlink"
					href={item.href}
					aria-current={isCurrent(item.href) ? 'page' : undefined}>{item.label}</a
				>
			{/each}
		</nav>

		<ThemeToggle />
	</div>
</header>
