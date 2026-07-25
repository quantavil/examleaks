import type { DatePrecision } from './data/types';

const IN = new Intl.NumberFormat('en-IN');

/** 4800000 → "48,00,000" (Indian grouping). */
export const num = (n: number | null | undefined): string =>
	n === null || n === undefined || !Number.isFinite(n) ? '—' : IN.format(n);

const trim = (n: number): string =>
	(Math.round(n * 10) / 10).toString().replace(/\.0$/, '');

/** Long form for prose: "48 lakh", "2.3 crore". */
export function compact(n: number | null | undefined): string {
	if (n === null || n === undefined || !Number.isFinite(n)) return '—';
	if (Math.abs(n) >= 1e7) return `${trim(n / 1e7)} crore`;
	if (Math.abs(n) >= 1e5) return `${trim(n / 1e5)} lakh`;
	if (Math.abs(n) >= 1e3) return `${trim(n / 1e3)} thousand`;
	return IN.format(n);
}

/**
 * Same as `compact`, split so a stat tile can set the magnitude word at a
 * smaller size — "2.3 crore" as one string overflows a 170px tile.
 */
export function compactParts(n: number | null | undefined): { value: string; unit?: string } {
	if (n === null || n === undefined || !Number.isFinite(n)) return { value: '—' };
	if (Math.abs(n) >= 1e7) return { value: trim(n / 1e7), unit: 'crore' };
	if (Math.abs(n) >= 1e5) return { value: trim(n / 1e5), unit: 'lakh' };
	if (Math.abs(n) >= 1e3) return { value: trim(n / 1e3), unit: 'thousand' };
	return { value: IN.format(n) };
}

/** Short form for axis ticks and dense cells: "48L", "2.3Cr", "8.6k". */
export function compactShort(n: number | null | undefined): string {
	if (n === null || n === undefined || !Number.isFinite(n)) return '—';
	if (n === 0) return '0';
	if (Math.abs(n) >= 1e7) return `${trim(n / 1e7)}Cr`;
	if (Math.abs(n) >= 1e5) return `${trim(n / 1e5)}L`;
	if (Math.abs(n) >= 1e3) return `${trim(n / 1e3)}k`;
	return String(n);
}

const MONTHS = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec'
];

const MONTHS_LONG = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
];

/**
 * Renders only the precision the source actually supports. Rows whose note
 * says "Jan placeholder" or "day approximate" are downgraded to the month or
 * the year rather than implying a date nobody established.
 */
export function fmtDate(iso: string, precision: DatePrecision = 'day'): string {
	const [y, m, d] = (iso ?? '').split('-');
	const year = y ?? '';
	const monthIndex = Number(m) - 1;
	const month = MONTHS[monthIndex] ?? '';
	if (precision === 'year' || !month) return year;
	if (precision === 'month') return `${month} ${year}`;
	return `${Number(d)} ${month} ${year}`;
}

export function fmtDateLong(iso: string, precision: DatePrecision = 'day'): string {
	const [y, m, d] = (iso ?? '').split('-');
	const monthIndex = Number(m) - 1;
	const month = MONTHS_LONG[monthIndex] ?? '';
	if (precision === 'year' || !month) return y ?? '';
	if (precision === 'month') return `${month} ${y}`;
	return `${Number(d)} ${month} ${y}`;
}

export const PRECISION_NOTE: Record<DatePrecision, string> = {
	day: '',
	month: 'The source establishes the month but not the exact day.',
	year: 'The source establishes only the year; the day and month are placeholders.'
};

export const isApprox = (precision: DatePrecision): boolean => precision !== 'day';

export const pctStr = (part: number, whole: number, digits = 0): string =>
	whole === 0 ? '0%' : `${((part / whole) * 100).toFixed(digits)}%`;

