import { MAX_YEAR, MIN_YEAR, incidents } from '$lib/data';
import { totals } from '$lib/data/stats';
import { compactShort } from '$lib/format';
import { siteCard } from '$lib/og';
import type { RequestHandler } from './$types';

export const prerender = true;

export const GET: RequestHandler = () => {
	const t = totals(incidents);

	const svg = siteCard([
		{ label: 'Incidents', value: String(t.incidents) },
		{ label: `${MIN_YEAR}–${MAX_YEAR}`, value: `${MAX_YEAR - MIN_YEAR + 1} yrs` },
		{ label: 'States', value: String(t.distinctPlaces) },
		{ label: 'Candidates', value: compactShort(t.affected) }
	]);

	return new Response(svg, {
		headers: {
			'content-type': 'image/svg+xml; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
};
