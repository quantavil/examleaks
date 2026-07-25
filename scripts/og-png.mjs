/**
 * Optional: rasterise the generated share cards to PNG.
 *
 * X/Twitter, Facebook and LinkedIn do not render SVG `og:image` values.
 * Discord, Slack and in-browser previews do. Run this after `bun run build`
 * if you need coverage on the big platforms:
 *
 *   bun add -d @resvg/resvg-js
 *   bun run scripts/og-png.mjs
 *
 * Then point `image={...}` in src/lib/components/Seo.svelte at `.png`.
 *
 * Deliberately not a build dependency — it pulls a native binary, and the
 * site is perfectly deployable without it.
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BUILD_OG = 'build/og';

let Resvg;
try {
	({ Resvg } = await import('@resvg/resvg-js'));
} catch {
	console.error('\n  @resvg/resvg-js is not installed.\n');
	console.error('  bun add -d @resvg/resvg-js\n');
	process.exit(1);
}

function* svgFiles(dir) {
	let entries;
	try {
		entries = readdirSync(dir);
	} catch {
		console.error(`\n  ${dir} not found — run \`bun run build\` first.\n`);
		process.exit(1);
	}

	for (const entry of entries) {
		const path = join(dir, entry);
		if (statSync(path).isDirectory()) yield* svgFiles(path);
		else if (entry.endsWith('.svg')) yield path;
	}
}

let count = 0;
for (const path of svgFiles(BUILD_OG)) {
	const svg = readFileSync(path, 'utf8');
	const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
		.render()
		.asPng();
	writeFileSync(path.replace(/\.svg$/, '.png'), png);
	count += 1;
}

console.log(`Rasterised ${count} share cards to PNG.`);
