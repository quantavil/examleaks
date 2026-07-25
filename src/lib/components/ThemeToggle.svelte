<script lang="ts">
	import { theme } from '$lib/theme.svelte';
</script>

<button
	class="icon-btn"
	type="button"
	onclick={() => theme.toggle()}
	aria-label="Switch to {theme.current === 'dark' ? 'light' : 'dark'} theme"
	title="Switch to {theme.current === 'dark' ? 'light' : 'dark'} theme"
>
	{#if theme.current === 'dark'}
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
			<circle cx="12" cy="12" r="4.2" />
			<path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.1 5.1l1.4 1.4M17.5 17.5l1.4 1.4M18.9 5.1l-1.4 1.4M6.5 17.5l-1.4 1.4" />
		</svg>
	{:else}
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" />
		</svg>
	{/if}
</button>
