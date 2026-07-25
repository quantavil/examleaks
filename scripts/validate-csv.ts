/**
 * Schema and contract validation for `exam_leaks.csv`.
 *
 * This runs inside `vite build`, so a malformed row fails the Cloudflare Pages
 * build before anyone reviews the pull request — which is what CONTRIBUTING.md
 * promises contributors.
 *
 * It exists because the parser is deliberately forgiving: `normalize.ts`
 * coerces anything it does not recognise to a sensible default so that one odd
 * row can never blank the site. That is the right behaviour at render time and
 * the wrong behaviour at review time. Without a check in front of it, a row
 * reading `leak_status: "Definitely Leaked"` was silently filed as **Alleged**,
 * an evidentiary claim nobody made, and shipped into every chart.
 *
 * Errors fail the build. Warnings are printed and do not.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseCsv, parseCsvRecords } from '../src/lib/data/csv';
import { isKnownActionClause } from '../src/lib/data/normalize';
import { parseArea } from '../src/lib/data/places';
import { ERA_SPLIT } from '../src/lib/data/stats';

/** The column contract. Order is part of it: the docs table mirrors this. */
export const COLUMNS = [
	'incident_id',
	'date',
	'date_precision',
	'era',
	'exam_name',
	'conducting_body',
	'body_type',
	'area',
	'leak_status',
	'action_taken',
	'note',
	'arrests',
	'convictions',
	'aspirants_affected',
	'linked_deaths',
	'deaths_note',
	'source_name',
	'source_url',
	'confidence'
] as const;

const ENUMS: Record<string, string[]> = {
	date_precision: ['day', 'month', 'year'],
	body_type: ['Central', 'State'],
	leak_status: ['Confirmed', 'Alleged', 'Suspected', 'Denied'],
	confidence: ['High', 'Medium', 'Low']
};

/** Columns that must carry something on every row. */
const REQUIRED = [
	'incident_id',
	'date',
	'date_precision',
	'era',
	'exam_name',
	'conducting_body',
	'body_type',
	'area',
	'leak_status',
	'note',
	'source_name',
	'source_url',
	'confidence'
];

const COUNT_COLUMNS = ['arrests', 'convictions', 'aspirants_affected', 'linked_deaths'];

export interface Report {
	errors: string[];
	warnings: string[];
	rows: number;
}

export function validateCsv(text: string): Report {
	const errors: string[] = [];
	const warnings: string[] = [];

	const grid = parseCsv(text).filter((r) => r.length > 1 || r[0]?.trim() !== '');
	if (grid.length === 0) return { errors: ['the file is empty'], warnings, rows: 0 };

	const header = grid[0].map((h) => h.trim());
	if (header.join(',') !== COLUMNS.join(',')) {
		errors.push(
			`header does not match the schema.\n    expected: ${COLUMNS.join(',')}\n    found:    ${header.join(',')}`
		);
		// Every later check reads by column name, so stop here.
		return { errors, warnings, rows: grid.length - 1 };
	}

	// A short row means a missing comma; a long one means an unquoted comma.
	for (let i = 1; i < grid.length; i += 1) {
		if (grid[i].length !== COLUMNS.length) {
			errors.push(
				`row ${i + 1} has ${grid[i].length} fields, expected ${COLUMNS.length} — check for an unquoted comma`
			);
		}
	}

	const rows = parseCsvRecords(text);
	const seenIds = new Set<string>();
	const seenUrls = new Map<string, string[]>();

	for (const row of rows) {
		const id = row.incident_id || '(no id)';
		const bad = (msg: string) => errors.push(`${id}: ${msg}`);
		const warn = (msg: string) => warnings.push(`${id}: ${msg}`);

		for (const column of REQUIRED) {
			if (!row[column]) bad(`${column} is empty`);
		}

		if (!/^PL-\d{4}$/.test(row.incident_id)) bad(`id "${row.incident_id}" is not PL-NNNN`);
		if (seenIds.has(row.incident_id)) bad('duplicate incident_id');
		seenIds.add(row.incident_id);

		for (const [column, allowed] of Object.entries(ENUMS)) {
			if (row[column] && !allowed.includes(row[column])) {
				bad(`${column} "${row[column]}" is not one of ${allowed.join(' | ')}`);
			}
		}

		// A date has to be well-formed AND real: "2025-13-45" matches the shape
		// but Date rolls it forward into the following year without complaint.
		if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
			bad(`date "${row.date}" is not YYYY-MM-DD`);
		} else {
			const parsed = new Date(`${row.date}T00:00:00Z`);
			if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== row.date) {
				bad(`date "${row.date}" is not a real calendar date`);
			} else {
				const claimed = /^upa/i.test(row.era) ? 'upa' : 'nda';
				const actual = parsed.getTime() < Date.parse(ERA_SPLIT) ? 'upa' : 'nda';
				if (claimed !== actual) bad(`era "${row.era}" disagrees with the date ${row.date}`);
			}

			// The rule this column exists to enforce: a placeholder date must
			// declare itself rather than render as a day nobody reported.
			if (row.date.endsWith('-01-01') && row.date_precision !== 'year') {
				bad(
					`date ${row.date} looks like a year placeholder but date_precision is "${row.date_precision}"`
				);
			} else if (row.date.endsWith('-01') && row.date_precision === 'day') {
				warn(`date ${row.date} is the 1st — confirm the source really gives that day`);
			}
		}

		for (const column of COUNT_COLUMNS) {
			const raw = row[column];
			if (raw === '') continue;
			if (!/^\d+$/.test(raw.replace(/[,\s]/g, ''))) {
				bad(`${column} "${raw}" is not a whole number (leave it blank if the source is silent)`);
			}
		}

		// The editorial rule: a death figure never travels without its caveat.
		const hasDeaths = row.linked_deaths !== '' && row.linked_deaths !== '0';
		if (hasDeaths && !row.deaths_note) bad('linked_deaths is set but deaths_note is empty');
		if (row.deaths_note && row.linked_deaths === '') bad('deaths_note is set but linked_deaths is empty');

		if (row.source_url) {
			try {
				const url = new URL(row.source_url);
				if (url.protocol !== 'https:') bad(`source_url is not https: ${row.source_url}`);
			} catch {
				bad(`source_url does not parse as a URL: ${row.source_url}`);
			}
			const shared = seenUrls.get(row.source_url) ?? [];
			shared.push(row.incident_id);
			seenUrls.set(row.source_url, shared);
		}

		// An area that resolves to nothing removes the row from every map and
		// state page while leaving it in the totals.
		if (row.area) {
			const area = parseArea(row.area);
			if (area.places.length === 0 && !area.national) {
				bad(`area "${row.area}" matches no known state or territory`);
			}
		}

		// An unrecognised action clause is dropped, so the outcome disappears.
		for (const clause of row.action_taken.split('+').map((c) => c.trim()).filter(Boolean)) {
			if (!isKnownActionClause(clause)) {
				bad(`action_taken clause "${clause}" is not recognised and would be dropped`);
			}
		}
	}

	for (const [url, ids] of seenUrls) {
		if (ids.length > 1) {
			warnings.push(`${ids.join(', ')} share one source: ${url}`);
		}
	}

	// Ids are never renumbered, so a gap means a row was deleted.
	const numbers = [...seenIds]
		.filter((i) => /^PL-\d{4}$/.test(i))
		.map((i) => Number(i.slice(3)))
		.sort((a, b) => a - b);
	for (let i = 1; i < numbers.length; i += 1) {
		if (numbers[i] !== numbers[i - 1] + 1) {
			warnings.push(`id gap between PL-${numbers[i - 1]} and PL-${numbers[i]}`);
		}
	}

	return { errors, warnings, rows: rows.length };
}

/** Read the dataset, print the report, and return whether the build may go on. */
export function reportOn(text: string, label = 'exam_leaks.csv'): boolean {
	const { errors, warnings, rows } = validateCsv(text);

	for (const w of warnings) console.warn(`  warning  ${w}`);
	for (const e of errors) console.error(`  error    ${e}`);

	if (errors.length > 0) {
		console.error(
			`\n${label}: ${errors.length} error${errors.length === 1 ? '' : 's'} in ${rows} rows.\n`
		);
		return false;
	}
	console.log(
		`${label}: ${rows} rows valid${warnings.length ? `, ${warnings.length} warning${warnings.length === 1 ? '' : 's'}` : ''}.`
	);
	return true;
}

const UA =
	'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';

interface Fetched {
	status: number;
	length: number;
	isArticle: boolean;
}

async function grab(url: string): Promise<Fetched | null> {
	try {
		const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(25000) });
		const html = await res.text();
		return {
			status: res.status,
			length: html.length,
			isArticle: /<article[\s>]|og:type"?\s*content="?article|"articleBody"/i.test(html)
		};
	} catch {
		return null;
	}
}

/**
 * Some publishers answer an unknown article with HTTP 200 and a shell page
 * instead of a 404. Fetching a deliberately invented URL under the same path
 * gives that shell's fingerprint, so a real row returning the same thing can be
 * recognised as pointing at nothing.
 *
 * This is not paranoia. A row entered this dataset citing a Wire article that
 * does not exist; the URL returned 200 and the naive check passed it.
 */
async function softNotFoundProbe(origin: string, segment: string): Promise<Fetched | null> {
	return grab(`${origin}/${segment}/definitely-not-a-real-article-${Date.now().toString(36)}`);
}

const CHALLENGE = (f: Fetched): boolean => f.length < 4000 && !f.isArticle;

/**
 * Fetch every source and report the ones that do not resolve to an article.
 *
 * Deliberately not part of the build: builds must work offline and must not
 * depend on a publisher's uptime. This is the pre-merge check, and it is the
 * only one that catches the worst row this project can accept — a well-formed,
 * plausible URL pointing at an article nobody ever published.
 *
 * Three outcomes, because a status code alone cannot tell them apart:
 *   dead        a real failure, or a shell page matching the soft-404 probe
 *   unverified  the host blocks automated requests; a human must look
 *   ok          fetched, and distinguishable from that host's not-found page
 */
export async function checkLinks(text: string): Promise<number> {
	const rows = parseCsvRecords(text).filter((r) => r.source_url);

	// One probe per origin+section, reused across every row that shares it.
	const probes = new Map<string, Fetched | null>();
	for (const row of rows) {
		const url = new URL(row.source_url);
		const segment = url.pathname.split('/').filter(Boolean)[0] ?? 'x';
		const key = `${url.origin}/${segment}`;
		if (!probes.has(key)) probes.set(key, await softNotFoundProbe(url.origin, segment));
	}

	const dead: string[] = [];
	const unverified: string[] = [];
	const queue = [...rows];

	const worker = async (): Promise<void> => {
		while (queue.length) {
			const row = queue.shift();
			if (!row) continue;
			const url = new URL(row.source_url);
			const segment = url.pathname.split('/').filter(Boolean)[0] ?? 'x';
			const probe = probes.get(`${url.origin}/${segment}`) ?? null;

			// One retry: a dropped socket is not a dead link.
			const got = (await grab(row.source_url)) ?? (await grab(row.source_url));

			if (!got) {
				unverified.push(`${row.incident_id}: could not be fetched twice — ${row.source_url}`);
			} else if (got.status >= 400) {
				dead.push(`${row.incident_id}: HTTP ${got.status} — ${row.source_url}`);
			} else if (probe && probe.status < 400 && Math.abs(got.length - probe.length) < 64) {
				// Identical to this host's not-found shell.
				if (CHALLENGE(probe)) {
					unverified.push(`${row.incident_id}: host blocks automated checks — ${row.source_url}`);
				} else {
					dead.push(
						`${row.incident_id}: soft 404, page is identical to this site's not-found shell — ${row.source_url}`
					);
				}
			}
			await new Promise((r) => setTimeout(r, 120));
		}
	};

	await Promise.all(Array.from({ length: 6 }, worker));

	for (const u of unverified) console.warn(`  unverified  ${u}`);
	for (const d of dead) console.error(`  dead        ${d}`);
	console.log(
		dead.length === 0
			? `\n${rows.length - unverified.length} of ${rows.length} sources resolve to an article` +
					`${unverified.length ? `, ${unverified.length} need checking by hand` : ''}.`
			: `\n${dead.length} of ${rows.length} sources do not resolve to an article.`
	);
	return dead.length;
}

// `bun run validate` for a standalone check, `--links` to also fetch every
// source. Plain Node APIs, so this file type-checks with only @types/node.
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
	const csv = new URL('../exam_leaks.csv', import.meta.url);
	const text = readFileSync(csv, 'utf8');
	let ok = reportOn(text);
	if (ok && process.argv.includes('--links')) ok = (await checkLinks(text)) === 0;
	process.exit(ok ? 0 : 1);
}
