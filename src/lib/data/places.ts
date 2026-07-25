/**
 * Canonical registry of Indian states / union territories, plus the
 * normalisation used to turn the free-text `area` column into stable slugs.
 *
 * The `area` column mixes forms: "Rajasthan", "Rajasthan (Jaipur/Kota/Ajmer)",
 * "Delhi (NCT of Delhi)", "Bihar (Patna) / Jharkhand (arrest)". We take the
 * text before the first parenthesis of each "/"-separated clause and map it
 * through an alias table.
 */

export type Zone = 'North' | 'South' | 'East' | 'West' | 'Central' | 'North-East' | 'National';

export interface Place {
	name: string;
	slug: string;
	zone: Zone;
	/** True for the pseudo-place used by nationwide examinations. */
	national?: boolean;
}

export const NATIONAL_SLUG = 'all-india';

export const PLACES: Place[] = [
	{ name: 'All India', slug: NATIONAL_SLUG, zone: 'National', national: true },

	{ name: 'Andaman & Nicobar Islands', slug: 'andaman-and-nicobar-islands', zone: 'East' },
	{ name: 'Andhra Pradesh', slug: 'andhra-pradesh', zone: 'South' },
	{ name: 'Arunachal Pradesh', slug: 'arunachal-pradesh', zone: 'North-East' },
	{ name: 'Assam', slug: 'assam', zone: 'North-East' },
	{ name: 'Bihar', slug: 'bihar', zone: 'East' },
	{ name: 'Chandigarh', slug: 'chandigarh', zone: 'North' },
	{ name: 'Chhattisgarh', slug: 'chhattisgarh', zone: 'Central' },
	{ name: 'Dadra & Nagar Haveli and Daman & Diu', slug: 'dadra-nagar-haveli-daman-diu', zone: 'West' },
	{ name: 'Delhi', slug: 'delhi', zone: 'North' },
	{ name: 'Goa', slug: 'goa', zone: 'West' },
	{ name: 'Gujarat', slug: 'gujarat', zone: 'West' },
	{ name: 'Haryana', slug: 'haryana', zone: 'North' },
	{ name: 'Himachal Pradesh', slug: 'himachal-pradesh', zone: 'North' },
	{ name: 'Jammu & Kashmir', slug: 'jammu-and-kashmir', zone: 'North' },
	{ name: 'Jharkhand', slug: 'jharkhand', zone: 'East' },
	{ name: 'Karnataka', slug: 'karnataka', zone: 'South' },
	{ name: 'Kerala', slug: 'kerala', zone: 'South' },
	{ name: 'Ladakh', slug: 'ladakh', zone: 'North' },
	{ name: 'Lakshadweep', slug: 'lakshadweep', zone: 'South' },
	{ name: 'Madhya Pradesh', slug: 'madhya-pradesh', zone: 'Central' },
	{ name: 'Maharashtra', slug: 'maharashtra', zone: 'West' },
	{ name: 'Manipur', slug: 'manipur', zone: 'North-East' },
	{ name: 'Meghalaya', slug: 'meghalaya', zone: 'North-East' },
	{ name: 'Mizoram', slug: 'mizoram', zone: 'North-East' },
	{ name: 'Nagaland', slug: 'nagaland', zone: 'North-East' },
	{ name: 'Odisha', slug: 'odisha', zone: 'East' },
	{ name: 'Puducherry', slug: 'puducherry', zone: 'South' },
	{ name: 'Punjab', slug: 'punjab', zone: 'North' },
	{ name: 'Rajasthan', slug: 'rajasthan', zone: 'North' },
	{ name: 'Sikkim', slug: 'sikkim', zone: 'North-East' },
	{ name: 'Tamil Nadu', slug: 'tamil-nadu', zone: 'South' },
	{ name: 'Telangana', slug: 'telangana', zone: 'South' },
	{ name: 'Tripura', slug: 'tripura', zone: 'North-East' },
	{ name: 'Uttar Pradesh', slug: 'uttar-pradesh', zone: 'North' },
	{ name: 'Uttarakhand', slug: 'uttarakhand', zone: 'North' },
	{ name: 'West Bengal', slug: 'west-bengal', zone: 'East' }
];

/** Loose key: lowercase, ampersands spelled out, punctuation dropped. */
const key = (s: string): string =>
	s
		.toLowerCase()
		.replace(/&/g, ' and ')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();

const BY_KEY = new Map<string, Place>();
for (const place of PLACES) {
	BY_KEY.set(key(place.name), place);
	BY_KEY.set(place.slug, place);
}

/** Spellings that appear in sources but are not the canonical name. */
const ALIASES: Record<string, string> = {
	'nct of delhi': 'Delhi',
	'new delhi': 'Delhi',
	'delhi nct': 'Delhi',
	orissa: 'Odisha',
	pondicherry: 'Puducherry',
	uttaranchal: 'Uttarakhand',
	'j and k': 'Jammu & Kashmir',
	'jammu kashmir': 'Jammu & Kashmir',
	'andaman and nicobar': 'Andaman & Nicobar Islands',
	'andaman nicobar islands': 'Andaman & Nicobar Islands',
	nationwide: 'All India',
	'pan india': 'All India',
	india: 'All India'
};

for (const [alias, canonical] of Object.entries(ALIASES)) {
	const target = BY_KEY.get(key(canonical));
	if (target) BY_KEY.set(key(alias), target);
}

export const placeBySlug = (slug: string): Place | undefined => PLACES.find((p) => p.slug === slug);

export interface ParsedArea {
	places: Place[];
	/** Parenthetical detail, joined when the area names more than one clause. */
	locality: string | null;
	national: boolean;
}

export function parseArea(raw: string): ParsedArea {
	const text = (raw ?? '').trim();
	if (!text) return { places: [], locality: null, national: false };

	const places: Place[] = [];
	const localities: string[] = [];

	// Split only on top-level slashes (those outside parentheses).
	const clauses: string[] = [];
	let depth = 0;
	let buf = '';
	for (const ch of text) {
		if (ch === '(') depth += 1;
		if (ch === ')') depth = Math.max(0, depth - 1);
		if (ch === '/' && depth === 0) {
			clauses.push(buf);
			buf = '';
			continue;
		}
		buf += ch;
	}
	clauses.push(buf);

	for (const clause of clauses) {
		const trimmed = clause.trim();
		if (!trimmed) continue;

		const openParen = trimmed.indexOf('(');
		const head = (openParen === -1 ? trimmed : trimmed.slice(0, openParen)).trim();
		const detail =
			openParen === -1 ? '' : trimmed.slice(openParen + 1).replace(/\)\s*$/, '').trim();

		const place = BY_KEY.get(key(head));
		if (place && !places.some((p) => p.slug === place.slug)) places.push(place);
		if (detail) localities.push(detail);
	}

	return {
		places,
		locality: localities.length ? localities.join('; ') : null,
		national: places.some((p) => p.national)
	};
}
