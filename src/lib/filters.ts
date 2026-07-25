import { STATUS_ORDER } from './data/types';
import type { Incident, LeakStatus } from './data/types';

export interface Filter {
	query: string;
	/** Empty means "no constraint" for every facet. */
	statuses: LeakStatus[];
	bodyType: 'all' | 'Central' | 'State';
	era: 'all' | 'upa' | 'nda';
	years: number[];
	places: string[];
	bodies: string[];
}

export const emptyFilter = (): Filter => ({
	query: '',
	statuses: [],
	bodyType: 'all',
	era: 'all',
	years: [],
	places: [],
	bodies: []
});

/** Toggle membership in place — the array lives inside a $state proxy. */
export function toggle<T>(list: T[], value: T): void {
	const at = list.indexOf(value);
	if (at === -1) list.push(value);
	else list.splice(at, 1);
}

export function resetFilter(filter: Filter): void {
	filter.query = '';
	filter.statuses.length = 0;
	filter.bodyType = 'all';
	filter.era = 'all';
	filter.years.length = 0;
	filter.places.length = 0;
	filter.bodies.length = 0;
}

export function isActive(filter: Filter): boolean {
	return (
		filter.query.trim() !== '' ||
		filter.statuses.length > 0 ||
		filter.bodyType !== 'all' ||
		filter.era !== 'all' ||
		filter.years.length > 0 ||
		filter.places.length > 0 ||
		filter.bodies.length > 0
	);
}

/* ------------------------------------------------------------------- URL */

/**
 * Filters round-trip through the query string, so any view of the record is
 * a shareable link and the dashboard can hand a selection to /record.
 */
export function filterToParams(filter: Filter): URLSearchParams {
	const params = new URLSearchParams();
	if (filter.query.trim()) params.set('q', filter.query.trim());
	if (filter.statuses.length) params.set('status', filter.statuses.join(','));
	if (filter.bodyType !== 'all') params.set('type', filter.bodyType);
	if (filter.era !== 'all') params.set('era', filter.era);
	if (filter.years.length) params.set('year', filter.years.join(','));
	if (filter.places.length) params.set('place', filter.places.join(','));
	if (filter.bodies.length) params.set('org', filter.bodies.join(','));
	return params;
}

export function recordHref(filter: Filter): string {
	const query = filterToParams(filter).toString();
	return query ? `/record?${query}` : '/record';
}

const listParam = (params: URLSearchParams, key: string): string[] =>
	(params.get(key) ?? '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);

/** Mutates in place so the caller's $state proxy keeps its identity. */
export function applyParams(filter: Filter, params: URLSearchParams): void {
	const replace = <T>(target: T[], next: T[]): void => {
		target.splice(0, target.length, ...next);
	};

	filter.query = params.get('q') ?? '';
	replace(
		filter.statuses,
		listParam(params, 'status').filter((s): s is LeakStatus =>
			(STATUS_ORDER as string[]).includes(s)
		)
	);

	const type = params.get('type');
	filter.bodyType = type === 'Central' || type === 'State' ? type : 'all';

	const era = params.get('era');
	filter.era = era === 'upa' || era === 'nda' ? era : 'all';

	replace(
		filter.years,
		listParam(params, 'year')
			.map(Number)
			.filter((n) => Number.isFinite(n))
	);
	replace(filter.places, listParam(params, 'place'));
	replace(filter.bodies, listParam(params, 'org'));
}

/**
 * OR within a facet, AND across facets. Free text must match every term,
 * so "rajasthan police" narrows rather than widens.
 */
export function applyFilter(list: Incident[], filter: Filter): Incident[] {
	const terms = filter.query.trim().toLowerCase().split(/\s+/).filter(Boolean);

	return list.filter((incident) => {
		if (filter.statuses.length > 0 && !filter.statuses.includes(incident.status)) return false;
		if (filter.bodyType !== 'all' && incident.bodyType !== filter.bodyType) return false;
		if (filter.era !== 'all' && incident.eraKey !== filter.era) return false;
		if (filter.years.length > 0 && !filter.years.includes(incident.year)) return false;
		if (filter.bodies.length > 0 && !filter.bodies.includes(incident.bodyKey)) return false;
		if (
			filter.places.length > 0 &&
			!incident.stateSlugs.some((slug) => filter.places.includes(slug))
		) {
			return false;
		}
		if (terms.length > 0 && !terms.every((t) => incident.haystack.includes(t))) return false;
		return true;
	});
}
