import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		// Fully static output - deployable to Cloudflare Pages, GitHub Pages,
		// Netlify, S3, or any plain file server.
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html',
			precompress: false,
			strict: true
		}),

		prerender: {
			// Every route is prerendered. Dynamic routes additionally declare
			// explicit `entries()`, so the build never depends on link crawling.
			crawl: true,
			// Kept forgiving so a single stale link cannot fail a deploy.
			// Tighten to 'fail' once CI is green if you prefer.
			handleHttpError: 'warn',
			handleMissingId: 'warn'
		},

		alias: {
			$data: 'src/lib/data',
			$components: 'src/lib/components'
		}
	}
};

export default config;
