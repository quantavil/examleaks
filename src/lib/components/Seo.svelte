<script lang="ts">
	import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, abs } from '$lib/site';

	let {
		title,
		description = SITE_DESCRIPTION,
		path,
		image,
		imageAlt,
		type = 'website',
		jsonLd,
		publishedTime,
		keywords
	}: {
		/** Page title without the site suffix; omit on the home page. */
		title?: string;
		description?: string;
		/** Absolute path of this page, e.g. "/incident/PL-0093". */
		path: string;
		image?: string;
		imageAlt?: string;
		type?: 'website' | 'article';
		jsonLd?: Record<string, unknown> | Record<string, unknown>[];
		publishedTime?: string;
		keywords?: string[];
	} = $props();

	const fullTitle = $derived(title ? `${title} — ${SITE_NAME}` : SITE_TITLE);
	const canonical = $derived(abs(path));
	const ogImage = $derived(image ? abs(image) : abs('/og/site.svg'));
	const blocks = $derived(jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	{#if keywords?.length}
		<meta name="keywords" content={keywords.join(', ')} />
	{/if}

	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:type" content={type} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:type" content="image/svg+xml" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	{#if imageAlt}<meta property="og:image:alt" content={imageAlt} />{/if}
	<meta property="og:locale" content="en_IN" />
	{#if publishedTime}<meta property="article:published_time" content={publishedTime} />{/if}

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />

	{#each blocks as block, i (i)}
		{@html `<script type="application/ld+json">${JSON.stringify(block).replace(/</g, '\\u003c')}</` + `script>`}
	{/each}
</svelte:head>
