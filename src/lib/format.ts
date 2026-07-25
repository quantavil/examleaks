import type { DatePrecision } from './data/types';

const IN = new Intl.NumberFormat('en-IN');

/** 4800000 → "48,00,000" (Indian grouping). */
export const num = (n: number | null | undefined): string =>
	n === null || n === undefined || !Number.isFinite(n) ? '—' : IN.format(n);

const trim = (n: number): string =>
	(Math.round(n * 10) / 10).toString().replace(/\.0$/, '');

const blank = (n: number | null | undefined): n is null | undefined =>
	n === null || n === undefined || !Number.isFinite(n);

/** Indian magnitudes, largest first: threshold, prose word, tick suffix. */
const UNITS: [number, string, string][] = [
	[1e7, 'crore', 'Cr'],
	[1e5, 'lakh', 'L'],
	[1e3, 'thousand', 'k']
];

const unitFor = (n: number): [number, string, string] | undefined =>
	UNITS.find(([min]) => Math.abs(n) >= min);

/**
 * Split so a stat tile can set the magnitude word at a smaller size —
 * "2.3 crore" as one string overflows a 170px tile.
 */
export function compactParts(n: number | null | undefined): { value: string; unit?: string } {
	if (blank(n)) return { value: '—' };
	const unit = unitFor(n);
	return unit ? { value: trim(n / unit[0]), unit: unit[1] } : { value: IN.format(n) };
}

/** Long form for prose: "48 lakh", "2.3 crore". */
export function compact(n: number | null | undefined): string {
	const { value, unit } = compactParts(n);
	return unit ? `${value} ${unit}` : value;
}

/** Short form for axis ticks and dense cells: "48L", "2.3Cr", "8.6k". */
export function compactShort(n: number | null | undefined): string {
	if (blank(n)) return '—';
	if (n === 0) return '0';
	const unit = unitFor(n);
	return unit ? `${trim(n / unit[0])}${unit[2]}` : String(n);
}

const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');

const MONTHS_LONG =
	'January February March April May June July August September October November December'.split(
		' '
	);

/**
 * Renders only the precision the source actually supports. Rows whose note
 * says "Jan placeholder" or "day approximate" are downgraded to the month or
 * the year rather than implying a date nobody established.
 */
function fmt(iso: string, precision: DatePrecision, months: string[]): string {
	const [y, m, d] = (iso ?? '').split('-');
	const year = y ?? '';
	const month = months[Number(m) - 1] ?? '';
	if (precision === 'year' || !month) return year;
	if (precision === 'month') return `${month} ${year}`;
	return `${Number(d)} ${month} ${year}`;
}

export const fmtDate = (iso: string, precision: DatePrecision = 'day'): string =>
	fmt(iso, precision, MONTHS);

export const fmtDateLong = (iso: string, precision: DatePrecision = 'day'): string =>
	fmt(iso, precision, MONTHS_LONG);

export const PRECISION_NOTE: Record<DatePrecision, string> = {
	day: '',
	month: 'The source establishes the month but not the exact day.',
	year: 'The source establishes only the year; the day and month are placeholders.'
};

export const isApprox = (precision: DatePrecision): boolean => precision !== 'day';

export const pctStr = (part: number, whole: number, digits = 0): string =>
	whole === 0 ? '0%' : `${((part / whole) * 100).toFixed(digits)}%`;

