export type LeakStatus = 'Confirmed' | 'Alleged' | 'Suspected' | 'Denied';
export type BodyType = 'Central' | 'State';
export type Confidence = 'High' | 'Medium' | 'Low';
export type EraKey = 'upa' | 'nda';
export type ActionKind = 'cancelled' | 'retest' | 'arrests' | 'probe' | 'none';
export type DatePrecision = 'day' | 'month' | 'year';

export interface IncidentAction {
	kind: ActionKind;
	label: string;
	/** Text inside the parentheses, e.g. "CBI/SIT" for "Probe (CBI/SIT)". */
	detail: string | null;
}

export interface Incident {
	id: string;
	date: string;
	year: number;
	month: number;
	/** Many rows carry placeholder days/months; the source note says which. */
	datePrecision: DatePrecision;
	era: string;
	eraKey: EraKey;
	eraLabel: string;

	examName: string;
	conductingBody: string;
	/** Acronym pulled from the body name where one exists, else a short form. */
	bodyShort: string;
	/** Stable key that merges renamed/aliased bodies (Vyapam ≡ MPPEB ≡ MP ESB). */
	bodyKey: string;
	bodyLabel: string;
	bodyType: BodyType;

	area: string;
	states: string[];
	stateSlugs: string[];
	primaryState: string | null;
	primaryStateSlug: string | null;
	/** Parenthetical locality, e.g. "Jaipur/Kota/Ajmer". */
	locality: string | null;
	national: boolean;

	status: LeakStatus;
	confidence: Confidence;

	actionRaw: string;
	actions: IncidentAction[];
	actionKinds: ActionKind[];

	note: string;
	arrests: number | null;
	convictions: number | null;
	affected: number | null;
	deaths: number | null;
	deathsNote: string | null;

	sourceName: string;
	sourceUrl: string;

	/** Lowercased haystack for the search box. */
	haystack: string;
}

export interface StatusMeta {
	key: LeakStatus;
	label: string;
	color: string;
	blurb: string;
}

/**
 * Evidentiary strength, ordered. Rendered as a single-hue ordinal ramp
 * (dark → light) with a neutral grey for "officially denied", which sits
 * outside the scale rather than at the bottom of it.
 */
export const STATUSES: StatusMeta[] = [
	{
		key: 'Confirmed',
		label: 'Confirmed',
		color: 'var(--st-confirmed)',
		blurb: 'A leak or organised manipulation was established by an official body, a court, or a police investigation.'
	},
	{
		key: 'Alleged',
		label: 'Alleged',
		color: 'var(--st-alleged)',
		blurb: 'A credible public allegation with arrests, an FIR or a probe, but no established finding of a leak.'
	},
	{
		key: 'Suspected',
		label: 'Suspected',
		color: 'var(--st-suspected)',
		blurb: 'Authorities acted pre-emptively — postponement, withheld results — on suspicion of compromise.'
	},
	{
		key: 'Denied',
		label: 'Denied',
		color: 'var(--st-denied)',
		blurb: 'The claim was investigated and officially rejected, or the “leaked” paper turned out to be fake.'
	}
];

export const STATUS_ORDER: LeakStatus[] = STATUSES.map((s) => s.key);

export const statusMeta = (key: LeakStatus): StatusMeta =>
	STATUSES.find((s) => s.key === key) ?? STATUSES[0];

export const ACTION_LABELS: Record<ActionKind, string> = {
	cancelled: 'Exam cancelled',
	retest: 'Retest held',
	arrests: 'Arrests / FIR',
	probe: 'Official probe',
	none: 'No action reported'
};

export const ERA_LABELS: Record<EraKey, string> = {
	upa: 'UPA (2004 – May 2014)',
	nda: 'NDA (May 2014 – present)'
};
