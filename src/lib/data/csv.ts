/**
 * A small, dependency-free RFC 4180 CSV reader.
 *
 * Handles quoted fields, embedded commas, embedded newlines and escaped
 * doubled quotes — all of which occur in `exam_leaks.csv`.
 */

export function parseCsv(input: string): string[][] {
	let text = input;
	// Strip a UTF-8 BOM if the file was saved from a spreadsheet.
	if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let inQuotes = false;
	let i = 0;

	while (i < text.length) {
		const ch = text[i];

		if (inQuotes) {
			if (ch === '"') {
				if (text[i + 1] === '"') {
					field += '"';
					i += 2;
					continue;
				}
				inQuotes = false;
				i += 1;
				continue;
			}
			field += ch;
			i += 1;
			continue;
		}

		if (ch === '"') {
			inQuotes = true;
			i += 1;
			continue;
		}

		if (ch === ',') {
			row.push(field);
			field = '';
			i += 1;
			continue;
		}

		if (ch === '\r') {
			i += 1;
			continue;
		}

		if (ch === '\n') {
			row.push(field);
			rows.push(row);
			row = [];
			field = '';
			i += 1;
			continue;
		}

		field += ch;
		i += 1;
	}

	if (field.length > 0 || row.length > 0) {
		row.push(field);
		rows.push(row);
	}

	return rows;
}

/** Parse into header-keyed records, dropping blank trailing lines. */
export function parseCsvRecords(input: string): Record<string, string>[] {
	const rows = parseCsv(input).filter(
		(r) => r.length > 1 || (r.length === 1 && r[0].trim() !== '')
	);
	if (rows.length === 0) return [];

	const header = rows[0].map((h) => h.trim());

	return rows.slice(1).map((cells) => {
		const record: Record<string, string> = {};
		for (let c = 0; c < header.length; c += 1) {
			record[header[c]] = (cells[c] ?? '').trim();
		}
		return record;
	});
}

/** Serialise records back to CSV — used by the in-browser "export view" button. */
export function toCsv(header: string[], rows: (string | number | null)[][]): string {
	const cell = (v: string | number | null): string => {
		if (v === null || v === undefined) return '';
		const s = String(v);
		return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
	};
	return [header.map(cell).join(','), ...rows.map((r) => r.map(cell).join(','))].join('\n');
}
