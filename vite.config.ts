import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
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
