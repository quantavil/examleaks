/**
 * Conducting bodies appear under several spellings across sources —
 * "Vyapam (MPPEB)", "Madhya Pradesh Professional Examination Board
 * (Vyapam/MPESB)" and "Madhya Pradesh Employees Selection Board (ESB,
 * formerly PEB)" are the same institution across three renames.
 *
 * `canonicalBody()` collapses those into one stable key so "which bodies
 * fail repeatedly" is answerable. Rules are ordered; first match wins.
 * Anything unmatched falls back to its own acronym, then to its full name,
 * so a new row in the CSV never needs code changes to appear correctly.
 */

export interface CanonicalBody {
	key: string;
	label: string;
	/** Compact form for dense table cells. */
	short: string;
}

interface Rule {
	re: RegExp;
	key: string;
	label: string;
	short: string;
}

const RULES: Rule[] = [
	// --- Central ---------------------------------------------------------
	{ re: /central board of secondary education|^cbse$/i, key: 'cbse', label: 'CBSE', short: 'CBSE' },
	{ re: /national testing agency|^nta$/i, key: 'nta', label: 'NTA', short: 'NTA' },
	{ re: /^nbems$|national board of examinations/i, key: 'nbems', label: 'NBEMS', short: 'NBEMS' },
	{
		re: /all india institute of medical sciences|\baiims\b/i,
		key: 'aiims',
		label: 'AIIMS',
		short: 'AIIMS'
	},
	{
		re: /railway recruitment board|railway recruitment cell|railway board|east central railway|\brrb\b/i,
		key: 'railways',
		label: 'Indian Railways (RRB / RRC)',
		short: 'Railways'
	},
	{
		re: /^staff selection commission \(ssc\)$|^ssc$/i,
		key: 'ssc',
		label: 'SSC (central)',
		short: 'SSC'
	},
	{ re: /^indian army$/i, key: 'indian-army', label: 'Indian Army', short: 'Army' },

	// --- State boards that need disambiguating ----------------------------
	{
		re: /cg\s*vyapam|cgpeb|chhattisgarh professional examination board/i,
		key: 'cg-vyapam',
		label: 'CG Vyapam (CGPEB)',
		short: 'CGPEB'
	},
	{
		re: /vyapam|mppeb|mpesb|madhya pradesh professional examination board|madhya pradesh employees selection board/i,
		key: 'vyapam',
		label: 'Vyapam / MP ESB',
		short: 'Vyapam'
	},
	{
		re: /board of secondary education rajasthan|bser|rbse/i,
		key: 'bser',
		label: 'BSER / RBSE',
		short: 'BSER'
	},
	{
		re: /central selection board of constable|csbc/i,
		key: 'csbc',
		label: 'CSBC (Bihar Police)',
		short: 'CSBC'
	},
	{
		re: /state level police recruitment board|slprb/i,
		key: 'slprb',
		label: 'SLPRB (Assam Police)',
		short: 'SLPRB'
	},
	{
		re: /state health society|nhm bihar/i,
		key: 'nhm-bihar',
		label: 'NHM Bihar (SHS)',
		short: 'NHM Bihar'
	},
	{
		re: /maharashtra revenue dept|tcs-ion|tcs ion/i,
		key: 'mh-revenue',
		label: 'Maharashtra Revenue Dept / TCS-iON',
		short: 'MH Revenue'
	},
	{
		re: /maharashtra state board of secondary/i,
		key: 'msbshse',
		label: 'Maharashtra State Board (MSBSHSE)',
		short: 'MSBSHSE'
	},
	{
		re: /andhra pradesh board of secondary education/i,
		key: 'ap-bse',
		label: 'AP Board of Secondary Education',
		short: 'AP BSE'
	},
	{
		re: /dept\.? of pre-university education/i,
		key: 'ka-pue',
		label: 'Karnataka Pre-University Board',
		short: 'KA PUE'
	},
	{
		re: /karnataka state police/i,
		key: 'ka-police',
		label: 'Karnataka State Police',
		short: 'KA Police'
	},
	{
		re: /rajasthan police recruitment/i,
		key: 'rpr-board',
		label: 'Rajasthan Police Recruitment Board',
		short: 'RJ Police'
	},
	{
		re: /himachal pradesh police/i,
		key: 'hp-police',
		label: 'Himachal Pradesh Police',
		short: 'HP Police'
	},
	{
		re: /up secondary education board|uttar pradesh secondary education board/i,
		key: 'upsteb',
		label: 'UP Secondary Education Board',
		short: 'UP SEB'
	},
	{
		re: /gujarat university|state forest department/i,
		key: 'gu-forest',
		label: 'Gujarat University / Forest Dept',
		short: 'GU / Forest'
	},
	{
		re: /punjab (&|and) haryana high court/i,
		key: 'phhc',
		label: 'Punjab & Haryana High Court',
		short: 'P&H HC'
	},
	{
		re: /rajasthan high court/i,
		key: 'rj-hc',
		label: 'Rajasthan High Court',
		short: 'RJ HC'
	},
	{
		re: /tamil nadu school education/i,
		key: 'tn-sed',
		label: 'Tamil Nadu School Education Dept',
		short: 'TN SED'
	},
	{
		re: /himachal pradesh university/i,
		key: 'hpu',
		label: 'Himachal Pradesh University',
		short: 'HPU'
	}
];

/** Looks like an institutional acronym rather than a descriptive phrase. */
const ACRONYM = /^[A-Z][A-Za-z0-9]*(?:[\s/&.-][A-Za-z0-9]+)*$/;

function extractAcronym(name: string): string | null {
	const matches = [...name.matchAll(/\(([^)]+)\)/g)].map((m) => m[1].trim());
	for (const raw of matches) {
		// "ESB, formerly PEB" → "ESB"; "Vyapam/MPESB" stays whole.
		const candidate = raw.split(',')[0].trim();
		if (candidate.length < 2 || candidate.length > 22) continue;
		if (!ACRONYM.test(candidate)) continue;
		// Require at least two consecutive capitals, else it is a nickname.
		if (!/[A-Z]{2}/.test(candidate)) continue;
		return candidate;
	}
	return null;
}

const slugify = (s: string): string =>
	s
		.toLowerCase()
		.replace(/&/g, ' and ')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60);

export function canonicalBody(rawName: string): CanonicalBody {
	const name = (rawName ?? '').trim();

	const rule = RULES.find((r) => r.re.test(name));
	if (rule) return { key: rule.key, label: rule.label, short: rule.short };

	const acronym = extractAcronym(name);
	if (acronym) return { key: slugify(acronym), label: acronym, short: acronym };

	// Drop any trailing parenthetical and any ", City" suffix.
	const clean = name.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
	return {
		key: slugify(clean) || 'unknown',
		label: clean || 'Unknown body',
		short: clean.length > 26 ? `${clean.slice(0, 24)}…` : clean
	};
}
