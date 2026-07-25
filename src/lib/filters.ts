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
