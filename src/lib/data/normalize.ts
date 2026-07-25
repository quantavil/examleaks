import { canonicalBody } from './bodies';
import { NATIONAL_SLUG, parseArea } from './places';
import { ACTION_LABELS, ERA_LABELS } from './types';
import type {
	ActionKind,
	BodyType,
	Confidence,
	DatePrecision,
	EraKey,
	Incident,
	IncidentAction,
	LeakStatus
} from './types';

/** Empty stays null; a literal "0" stays 0 (UGC-NET 2024 records zero arrests). */
function toNumber(value: string | undefined): number | null {
	const raw = (value ?? '').trim();
	if (raw === '') return null;
	const n = Number(raw.replace(/[,\s]/g, ''));
	return Number.isFinite(n) ? n : null;
}

function toText(value: string | undefined): string {
	return (value ?? '').trim();
}

const ACTION_RULES: { re: RegExp; kind: ActionKind }[] = [
	{ re: /^exam\s*cancel/i, kind: 'cancelled' },
	{ re: /^(re-?test|re-?exam)/i, kind: 'retest' },
	{ re: /^arrest/i, kind: 'arrests' },
	{ re: /^(probe|inquiry|investigation)/i, kind: 'probe' },
	{ re: /^none/i, kind: 'none' }
];

/**
 * Whether one `+`-separated clause of `action_taken` is understood. An
 * unrecognised clause is dropped silently, so the validator uses this to
 * refuse a row whose outcome would go missing from the record.
 */
export function isKnownActionClause(clause: string): boolean {
	return ACTION_RULES.some((r) => r.re.test(clause.trim()));
}

function parseActions(raw: string): IncidentAction[] {
	if (!raw) return [];
	const seen = new Set<ActionKind>();
	const actions: IncidentAction[] = [];

	// Clauses are joined with "+", sometimes without surrounding spaces.
	for (const clause of raw.split('+').map((s) => s.trim()).filter(Boolean)) {
		const rule = ACTION_RULES.find((r) => r.re.test(clause));
		if (!rule) continue;
		const detailMatch = clause.match(/\(([^)]+)\)/);
		const detail = detailMatch ? detailMatch[1].trim() : null;

		const existing = actions.find((a) => a.kind === rule.kind);
		if (existing) {
			// e.g. "Probe (SIT)" then "Probe (CBI)" — keep both agency hints.
			if (detail && existing.detail && !existing.detail.includes(detail)) {
				existing.detail = `${existing.detail}, ${detail}`;
			} else if (detail && !existing.detail) {
				existing.detail = detail;
			}
			continue;
		}

		seen.add(rule.kind);
		actions.push({ kind: rule.kind, label: ACTION_LABELS[rule.kind], detail });
	}

	return actions;
}

/**
 * Roughly a fifth of the rows carry a placeholder day or month, so the site
 * renders "≈ 2012" instead of implying a precision the source never had.
 *
 * This is read from the `date_precision` column, not inferred. It used to be
 * regex-matched out of the note's prose, which quietly failed whenever a
 * contributor phrased the caveat in words the pattern did not anticipate:
 * three rows were rendering an invented exact day. The validator rejects an
 * unrecognised value, so a typo here fails the build rather than silently
 * promoting a placeholder to a real date.
 */
function datePrecisionFrom(raw: string): DatePrecision {
	const v = raw.trim().toLowerCase();
	if (v === 'year') return 'year';
	if (v === 'month') return 'month';
	return 'day';
}

function normalizeStatus(raw: string): LeakStatus {
	const v = raw.toLowerCase();
	if (v.startsWith('confirm')) return 'Confirmed';
	if (v.startsWith('alleg')) return 'Alleged';
	if (v.startsWith('suspect')) return 'Suspected';
	if (v.startsWith('den')) return 'Denied';
	return 'Alleged';
}

function normalizeConfidence(raw: string): Confidence {
	const v = raw.toLowerCase();
	if (v.startsWith('h')) return 'High';
	if (v.startsWith('l')) return 'Low';
	return 'Medium';
}

export function normalizeIncident(row: Record<string, string>): Incident {
	const id = toText(row.incident_id);
	const date = toText(row.date);
	const note = toText(row.note);
	const area = toText(row.area);
	const conductingBody = toText(row.conducting_body);
	const era = toText(row.era);
	const eraKey: EraKey = /^upa/i.test(era) ? 'upa' : 'nda';

	const [yearStr, monthStr] = date.split('-');
	const year = Number(yearStr);
	const month = Number(monthStr);

	const parsedArea = parseArea(area);
	const nonNational = parsedArea.places.filter((p) => !p.national);
	const primary = parsedArea.national && nonNational.length === 0 ? null : (nonNational[0] ?? null);

	const body = canonicalBody(conductingBody);
	const bodyType: BodyType = /^central$/i.test(toText(row.body_type)) ? 'Central' : 'State';

	const actions = parseActions(toText(row.action_taken));
	const status = normalizeStatus(toText(row.leak_status));
	const examName = toText(row.exam_name);

	const acronymMatch = conductingBody.match(/\(([^),]+)/);
	const bodyShort = body.short || (acronymMatch ? acronymMatch[1].trim() : conductingBody);

	const incident: Incident = {
		id,
		date,
		year,
		month: Number.isFinite(month) ? month : 1,
		datePrecision: datePrecisionFrom(toText(row.date_precision)),
		era,
		eraKey,
		eraLabel: ERA_LABELS[eraKey],

		examName,
		conductingBody,
		bodyShort,
		bodyKey: body.key,
		bodyLabel: body.label,
		bodyType,

		area,
		states: parsedArea.places.map((p) => p.name),
		stateSlugs: parsedArea.places.map((p) => p.slug),
		primaryState: primary ? primary.name : parsedArea.national ? 'All India' : null,
		primaryStateSlug: primary ? primary.slug : parsedArea.national ? NATIONAL_SLUG : null,
		locality: parsedArea.locality,
		national: parsedArea.national,

		status,
		confidence: normalizeConfidence(toText(row.confidence)),

		actionRaw: toText(row.action_taken),
		actions,
		actionKinds: actions.map((a) => a.kind),

		note,
		arrests: toNumber(row.arrests),
		convictions: toNumber(row.convictions),
		affected: toNumber(row.aspirants_affected),
		deaths: toNumber(row.linked_deaths),
		deathsNote: toText(row.deaths_note) || null,

		sourceName: toText(row.source_name),
		sourceUrl: toText(row.source_url),

		haystack: ''
	};

	incident.haystack = [
		id,
		examName,
		conductingBody,
		body.label,
		bodyShort,
		area,
		incident.states.join(' '),
		status,
		incident.actionRaw,
		note,
		incident.sourceName,
		String(year)
	]
		.join(' ')
		.toLowerCase();

	return incident;
}

export function normalizeAll(rows: Record<string, string>[]): Incident[] {
	return rows
		.filter((r) => toText(r.incident_id) !== '' && toText(r.date) !== '')
		.map(normalizeIncident)
		.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : 1));
}
