/**
 * The dataset.
 *
 * `exam_leaks.csv` at the repository root is the single source of truth. It is
 * imported as raw text and parsed once at module load (~1 ms for 110 rows), so
 * a contributor only ever edits the CSV — there is no generated file to keep
 * in sync, and dev and production read exactly the same bytes.
 */

import rawCsv from '../../../exam_leaks.csv?raw';
import { parseCsvRecords } from './csv';
import { normalizeAll } from './normalize';
import { PLACES, placeBySlug } from './places';
import type { Incident } from './types';

export * from './types';
export * from './places';
export * from './stats';
export { canonicalBody } from './bodies';
export { toCsv } from './csv';

export const incidents: Incident[] = normalizeAll(parseCsvRecords(rawCsv));

export const byId: Map<string, Incident> = new Map(incidents.map((i) => [i.id, i]));

export const MIN_YEAR = incidents.length ? incidents[0].year : new Date().getFullYear();
export const MAX_YEAR = incidents.length ? incidents[incidents.length - 1].year : MIN_YEAR;

/** Every year in range, including years with no recorded incident. */
export const YEARS: number[] = Array.from(
	{ length: MAX_YEAR - MIN_YEAR + 1 },
	(_, i) => MIN_YEAR + i
);

export const FIRST_DATE = incidents.length ? incidents[0].date : '';
export const LAST_DATE = incidents.length ? incidents[incidents.length - 1].date : '';

/** Places that actually occur in the data, ordered by incident count. */
export const activePlaces = (() => {
	const counts = new Map<string, number>();
	for (const incident of incidents) {
		for (const slug of incident.stateSlugs) {
			counts.set(slug, (counts.get(slug) ?? 0) + 1);
		}
	}
	return PLACES.filter((p) => counts.has(p.slug))
		.map((p) => ({ ...p, count: counts.get(p.slug) ?? 0 }))
		.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
})();

/** Years that actually contain a record — empty years get no page. */
export const activeYears: { year: number; count: number }[] = YEARS.map((year) => ({
	year,
	count: incidents.filter((i) => i.year === year).length
})).filter((y) => y.count > 0);

export const incidentsForPlace = (slug: string): Incident[] =>
	incidents.filter((i) => i.stateSlugs.includes(slug));

export const incidentsForYear = (year: number): Incident[] =>
	incidents.filter((i) => i.year === year);

export { placeBySlug };
