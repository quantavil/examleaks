/**
 * Social share cards, rendered as SVG at build time (one prerendered file per
 * incident and per state).
 *
 * NOTE ON FORMAT: X/Twitter, Facebook and LinkedIn do not rasterise SVG
 * `og:image` values — Discord, Slack and most in-browser previews do. Run
 * `bun run og:png` (see scripts/og-png.mjs) to convert these to PNG if you
 * need full coverage on the big platforms.
 */

import type { Incident } from './data/types';
import { compactShort, fmtDate, num } from './format';
import { SITE_NAME } from './site';

const W = 1200;
const H = 630;

const PAPER = '#f7f5f0';
const INK = '#0b0b0b';
const INK_2 = '#52514e';
const INK_3 = '#8a8880';
const ACCENT = '#a4231c';
const RULE = '#ddd8cc';

const SERIF = "Georgia,'Iowan Old Style','Times New Roman',serif";
const SANS = "'Helvetica Neue',Helvetica,Arial,sans-serif";

const STATUS_COLOR: Record<string, string> = {
	Confirmed: '#184f95',
	Alleged: '#2a78d6',
	Suspected: '#86b6ef',
	Denied: '#898781'
};

const esc = (s: string): string =>
	String(s ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');

/** Greedy wrap using an average glyph-width estimate. */
function wrap(text: string, maxWidth: number, fontSize: number, maxLines: number): string[] {
	const perChar = fontSize * 0.505;
	const limit = Math.max(8, Math.floor(maxWidth / perChar));
	const words = String(text ?? '').split(/\s+/).filter(Boolean);
	const lines: string[] = [];
	let line = '';

	for (const word of words) {
		const next = line ? `${line} ${word}` : word;
		if (next.length <= limit) {
			line = next;
		} else {
			if (line) lines.push(line);
			line = word.length > limit ? `${word.slice(0, limit - 1)}…` : word;
		}
		if (lines.length === maxLines) break;
	}

	if (lines.length < maxLines && line) lines.push(line);
	if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length + 1) {
		lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[.,;: ]+$/, '')}…`;
	}
	return lines;
}

interface Stat {
	label: string;
	value: string;
}

function shell(body: string): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">
<rect width="${W}" height="${H}" fill="${PAPER}"/>
<rect width="${W}" height="10" fill="${ACCENT}"/>
${body}
<line x1="72" y1="${H - 92}" x2="${W - 72}" y2="${H - 92}" stroke="${RULE}" stroke-width="1"/>
<text x="72" y="${H - 52}" font-family="${SERIF}" font-size="26" font-weight="700" fill="${INK}">${esc(SITE_NAME)}</text>
<text x="${W - 72}" y="${H - 52}" text-anchor="end" font-family="${SANS}" font-size="17" fill="${INK_3}">Open, source-linked record of Indian exam leaks</text>
</svg>`;
}

function statRow(stats: Stat[], y: number): string {
	return stats
		.map((stat, i) => {
			const x = 72 + i * 268;
			return `<text x="${x}" y="${y}" font-family="${SANS}" font-size="42" font-weight="700" fill="${INK}">${esc(stat.value)}</text>
<text x="${x}" y="${y + 28}" font-family="${SANS}" font-size="15" letter-spacing="1.4" fill="${INK_3}">${esc(stat.label.toUpperCase())}</text>`;
		})
		.join('\n');
}

export function incidentCard(incident: Incident): string {
	const titleLines = wrap(incident.examName, W - 144, 54, 3);
	const color = STATUS_COLOR[incident.status] ?? INK_3;

	const stats: Stat[] = [];
	if (incident.affected !== null) {
		stats.push({ label: 'Candidates', value: compactShort(incident.affected) });
	}
	if (incident.arrests !== null) stats.push({ label: 'Arrests', value: num(incident.arrests) });
	if (incident.convictions !== null) {
		stats.push({ label: 'Convictions', value: num(incident.convictions) });
	}
	if (stats.length < 3) {
		stats.push({
			label: 'Action',
			value: incident.actions[0]?.label.replace(/ \/ FIR$/, '') ?? 'None reported'
		});
	}

	const body = `
<circle cx="79" cy="${100}" r="7" fill="${color}"/>
<text x="98" y="107" font-family="${SANS}" font-size="17" font-weight="700" letter-spacing="2" fill="${color}">${esc(incident.status.toUpperCase())}</text>
<text x="${W - 72}" y="107" text-anchor="end" font-family="${SANS}" font-size="17" letter-spacing="1.5" fill="${INK_3}">${esc(incident.id)}</text>

${titleLines
	.map(
		(line, i) =>
			`<text x="72" y="${196 + i * 62}" font-family="${SERIF}" font-size="54" font-weight="700" fill="${INK}">${esc(line)}</text>`
	)
	.join('\n')}

<text x="72" y="${196 + titleLines.length * 62 + 18}" font-family="${SANS}" font-size="21" fill="${INK_2}">${esc(
		[
			fmtDate(incident.date, incident.datePrecision),
			incident.primaryState ?? incident.area,
			incident.bodyShort
		]
			.filter(Boolean)
			.join('  ·  ')
	)}</text>

${statRow(stats.slice(0, 3), H - 140)}`;

	return shell(body);
}

export function placeCard(name: string, count: number, extra: Stat[] = []): string {
	const titleLines = wrap(name, W - 144, 68, 2);

	const body = `
<text x="72" y="107" font-family="${SANS}" font-size="17" font-weight="700" letter-spacing="2" fill="${ACCENT}">EXAMINATION LEAK RECORD</text>

${titleLines
	.map(
		(line, i) =>
			`<text x="72" y="${210 + i * 76}" font-family="${SERIF}" font-size="68" font-weight="700" fill="${INK}">${esc(line)}</text>`
	)
	.join('\n')}

<text x="72" y="${210 + titleLines.length * 76 + 14}" font-family="${SANS}" font-size="22" fill="${INK_2}">${count} documented ${count === 1 ? 'incident' : 'incidents'}</text>

${statRow(extra.slice(0, 3), H - 140)}`;

	return shell(body);
}

export function siteCard(stats: Stat[]): string {
	const body = `
<text x="72" y="107" font-family="${SANS}" font-size="17" font-weight="700" letter-spacing="2" fill="${ACCENT}">OPEN RECORD · INDIA</text>

<text x="72" y="230" font-family="${SERIF}" font-size="86" font-weight="700" fill="${INK}">When the paper</text>
<text x="72" y="322" font-family="${SERIF}" font-size="86" font-weight="700" fill="${INK}">gets out.</text>

<text x="72" y="376" font-family="${SANS}" font-size="22" fill="${INK_2}">Every publicly reported exam leak in India, one row at a time.</text>

${statRow(stats.slice(0, 4), H - 140)}`;

	return shell(body);
}
