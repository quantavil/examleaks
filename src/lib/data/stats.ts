import { PLACES } from './places';
import { STATUS_ORDER } from './types';
import type { ActionKind, EraKey, Incident, LeakStatus } from './types';

export type StatusCounts = Record<LeakStatus, number>;

const emptyStatusCounts = (): StatusCounts => ({
	Confirmed: 0,
	Alleged: 0,
	Suspected: 0,
	Denied: 0
});

export function countByStatus(list: Incident[]): StatusCounts {
	const out = emptyStatusCounts();
	for (const incident of list) out[incident.status] += 1;
	return out;
}

const sumOf = (list: Incident[], pick: (i: Incident) => number | null): number =>
	list.reduce((acc, i) => acc + (pick(i) ?? 0), 0);

const countRecorded = (list: Incident[], pick: (i: Incident) => number | null): number =>
	list.reduce((acc, i) => acc + (pick(i) === null ? 0 : 1), 0);

/**
 * The spread of the death figures, which is the only honest way to describe
 * them collectively. There is deliberately no `sumOf` equivalent.
 */
const deathsRangeOf = (list: Incident[]): { min: number; max: number } | null => {
	const values = list.map((i) => i.deaths ?? 0).filter((n) => n > 0);
	if (values.length === 0) return null;
	return { min: Math.min(...values), max: Math.max(...values) };
};

/* ------------------------------------------------------------------ years */

export interface YearBucket {
	year: number;
	total: number;
	byStatus: StatusCounts;
	affected: number;
	affectedRecorded: number;
	incidents: Incident[];
}

export function byYear(list: Incident[], years: number[]): YearBucket[] {
	const buckets = new Map<number, YearBucket>();
	for (const year of years) {
		buckets.set(year, {
			year,
			total: 0,
			byStatus: emptyStatusCounts(),
			affected: 0,
			affectedRecorded: 0,
			incidents: []
		});
	}
	for (const incident of list) {
		const bucket = buckets.get(incident.year);
		if (!bucket) continue;
		bucket.total += 1;
		bucket.byStatus[incident.status] += 1;
		bucket.incidents.push(incident);
		if (incident.affected !== null) {
			bucket.affected += incident.affected;
			bucket.affectedRecorded += 1;
		}
	}
	return years.map((y) => buckets.get(y)!);
}

/* ----------------------------------------------------------------- places */

export interface PlaceBucket {
	slug: string;
	name: string;
	national: boolean;
	total: number;
	byStatus: StatusCounts;
	affected: number;
	arrests: number;
}

export function byPlace(list: Incident[]): PlaceBucket[] {
	const buckets = new Map<string, PlaceBucket>();

	for (const incident of list) {
		for (let idx = 0; idx < incident.stateSlugs.length; idx += 1) {
			const slug = incident.stateSlugs[idx];
			let bucket = buckets.get(slug);
			if (!bucket) {
				const place = PLACES.find((p) => p.slug === slug);
				bucket = {
					slug,
					name: place?.name ?? incident.states[idx] ?? slug,
					national: Boolean(place?.national),
					total: 0,
					byStatus: emptyStatusCounts(),
					affected: 0,
					arrests: 0
				};
				buckets.set(slug, bucket);
			}
			bucket.total += 1;
			bucket.byStatus[incident.status] += 1;
			bucket.affected += incident.affected ?? 0;
			bucket.arrests += incident.arrests ?? 0;
		}
	}

	return [...buckets.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

/* ----------------------------------------------------------------- bodies */

export interface BodyBucket {
	key: string;
	label: string;
	short: string;
	total: number;
	bodyType: 'Central' | 'State';
	jurisdiction: string;
	byStatus: StatusCounts;
	affected: number;
}

export function byBody(list: Incident[]): BodyBucket[] {
	const buckets = new Map<string, BodyBucket & { places: Map<string, number> }>();

	for (const incident of list) {
		let bucket = buckets.get(incident.bodyKey);
		if (!bucket) {
			bucket = {
				key: incident.bodyKey,
				label: incident.bodyLabel,
				short: incident.bodyShort,
				total: 0,
				bodyType: incident.bodyType,
				jurisdiction: '',
				byStatus: emptyStatusCounts(),
				affected: 0,
				places: new Map()
			};
			buckets.set(incident.bodyKey, bucket);
		}
		bucket.total += 1;
		bucket.byStatus[incident.status] += 1;
		bucket.affected += incident.affected ?? 0;
		if (incident.primaryState) {
			bucket.places.set(incident.primaryState, (bucket.places.get(incident.primaryState) ?? 0) + 1);
		}
	}

	return [...buckets.values()]
		.map(({ places, ...rest }) => {
			// Jurisdiction is inferred from where this body's exams happen, so a
			// new body in the CSV never needs a hard-coded mapping. A central body
			// whose exams are mostly nationwide reads "Nationwide"; a state body
			// tagged All India for one exam still shows the state it belongs to.
			const ranked = [...places.entries()].sort((a, b) => b[1] - a[1]);
			const top = ranked[0]?.[0] ?? '';

			let jurisdiction = top;
			if (top === 'All India') {
				const local = ranked.find(([name]) => name !== 'All India')?.[0];
				jurisdiction = rest.bodyType === 'State' && local ? local : 'Nationwide';
			}

			return { ...rest, jurisdiction };
		})
		.sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
}

/* ------------------------------------------------------------------- eras */

export interface EraBucket {
	key: EraKey;
	label: string;
	total: number;
	years: number;
	perYear: number;
	byStatus: StatusCounts;
}

/**
 * The one genuinely fixed date on the site: the May 2014 change of government
 * that the `era` column encodes. It is a fact about the world rather than
 * about the dataset, so it is a constant. Everything else here is derived, and
 * the validator rejects any row whose `era` disagrees with its own date.
 */
export const ERA_SPLIT = '2014-05-26';
export const ERA_SPLIT_YEAR = Number(ERA_SPLIT.slice(0, 4));

/**
 * Era spans are not equal, so the comparison is reported per year as well as
 * in absolute terms. The window runs from the first record in the dataset to
 * the last, so adding an earlier incident lengthens the first era rather than
 * silently shortening its rate.
 */
export function byEra(list: Incident[], lastDate: string, firstDate = ''): EraBucket[] {
	const split = new Date(ERA_SPLIT).getTime();
	const start = new Date(firstDate || `${ERA_SPLIT_YEAR - 10}-01-01`).getTime();
	const end = new Date(lastDate || ERA_SPLIT).getTime();
	const YEAR_MS = 365.2425 * 24 * 3600 * 1000;

	const spans: Record<EraKey, number> = {
		upa: Math.max(0.5, (split - start) / YEAR_MS),
		nda: Math.max(0.5, (end - split) / YEAR_MS)
	};

	const splitLabel = new Date(ERA_SPLIT).toLocaleDateString('en-GB', {
		month: 'long',
		year: 'numeric'
	});

	return (['upa', 'nda'] as EraKey[]).map((key) => {
		const subset = list.filter((i) => i.eraKey === key);
		return {
			key,
			label:
				key === 'upa'
					? `UPA (to ${splitLabel})`
					: `NDA (${splitLabel} onwards)`,
			total: subset.length,
			years: spans[key],
			perYear: subset.length / spans[key],
			byStatus: countByStatus(subset)
		};
	});
}

/* ----------------------------------------------------------------- totals */

export interface Totals {
	incidents: number;
	byStatus: StatusCounts;
	central: number;
	state: number;

	affected: number;
	affectedRecorded: number;
	arrests: number;
	arrestsRecorded: number;
	convictions: number;
	convictionsRecorded: number;
	/** Incidents where at least one conviction is recorded. */
	withConviction: number;

	/**
	 * Deliberately a count of rows and a range, never a sum.
	 *
	 * `linked_deaths` is the one column that must not be aggregated: the
	 * figures measure different things, so a total of them is arithmetically
	 * correct and substantively false. A summed `deaths` field used to sit
	 * here unused, which is a loaded gun in a shared API. Removing it means
	 * the wrong number cannot be reached for by accident.
	 */
	deathsRecorded: number;
	deathsRange: { min: number; max: number } | null;

	cancelled: number;
	retest: number;
	arrestAction: number;
	probe: number;
	noAction: number;
	/** Cancelled or re-held — the two outcomes that void a candidate's attempt. */
	voided: number;

	distinctBodies: number;
	distinctPlaces: number;
	highConfidence: number;
}

export function totals(list: Incident[]): Totals {
	const has = (i: Incident, kind: ActionKind): boolean => i.actionKinds.includes(kind);

	return {
		incidents: list.length,
		byStatus: countByStatus(list),
		central: list.filter((i) => i.bodyType === 'Central').length,
		state: list.filter((i) => i.bodyType === 'State').length,

		affected: sumOf(list, (i) => i.affected),
		affectedRecorded: countRecorded(list, (i) => i.affected),
		arrests: sumOf(list, (i) => i.arrests),
		arrestsRecorded: countRecorded(list, (i) => i.arrests),
		convictions: sumOf(list, (i) => i.convictions),
		convictionsRecorded: countRecorded(list, (i) => i.convictions),
		withConviction: list.filter((i) => (i.convictions ?? 0) > 0).length,
		deathsRecorded: countRecorded(list, (i) => i.deaths),
		deathsRange: deathsRangeOf(list),

		cancelled: list.filter((i) => has(i, 'cancelled')).length,
		retest: list.filter((i) => has(i, 'retest')).length,
		arrestAction: list.filter((i) => has(i, 'arrests')).length,
		probe: list.filter((i) => has(i, 'probe')).length,
		noAction: list.filter((i) => i.actions.length === 0 || has(i, 'none')).length,
		voided: list.filter((i) => has(i, 'cancelled') || has(i, 'retest')).length,

		distinctBodies: new Set(list.map((i) => i.bodyKey)).size,
		distinctPlaces: new Set(list.flatMap((i) => i.stateSlugs)).size,
		highConfidence: list.filter((i) => i.confidence === 'High').length
	};
}

/* ------------------------------------------------------------------ misc */

export const topBy = (
	list: Incident[],
	pick: (i: Incident) => number | null,
	n = 5
): Incident[] =>
	list
		.filter((i) => (pick(i) ?? 0) > 0)
		.sort((a, b) => (pick(b) ?? 0) - (pick(a) ?? 0))
		.slice(0, n);

