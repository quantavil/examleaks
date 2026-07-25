import { readFileSync } from 'node:fs';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

import { reportOn } from './scripts/validate-csv';

const CSV = new URL('./exam_leaks.csv', import.meta.url);

/**
 * The dataset is checked before anything is built with it. This is the whole
 * review gate: there is no CI workflow, so the Cloudflare Pages build on each
 * push and pull request is what stands between a malformed row and the site.
 *
 * Dev only warns. Stopping the server mid-edit would make the file painful to
 * work on, and nothing is published from dev.
 */
function validateDataset(): Plugin {
	// A production build runs client and server passes in one process; the
	// dataset is the same both times, so report it once.
	let reported = false;

	return {
		name: 'exam-leaks:validate-dataset',
		buildStart() {
			if (reported) return;
			reported = true;
			if (!reportOn(readFileSync(CSV, 'utf8'))) {
				this.error('exam_leaks.csv failed validation, see the errors above');
			}
		},
		configureServer(server) {
			const run = () => reportOn(readFileSync(CSV, 'utf8'));
			run();
			server.watcher.add(CSV.pathname);
			server.watcher.on('change', (path) => {
				if (path === CSV.pathname) run();
			});
		}
	};
}

export default defineConfig({
	plugins: [validateDataset(), sveltekit()],
	build: {
		// The dataset compiles into a single shared chunk; keep the warning sane.
		chunkSizeWarningLimit: 900
	},
	server: {
		fs: {
			// The canonical dataset lives at the repository root and is imported
			// with `?raw`, so Vite needs read access above `src`.
			allow: ['.']
		}
	}
});
