import { error } from '@sveltejs/kit';
import { activePlaces, incidentsForPlace, placeBySlug } from '$lib/data';
import { totals } from '$lib/data/stats';
import { compactShort } from '$lib/format';
import { placeCard } from '$lib/og';
import type { EntryGenerator, RequestHandler } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => activePlaces.map((place) => ({ slug: place.slug }));

export const GET: RequestHandler = ({ params }) => {
	const place = placeBySlug(params.slug);
	if (!place) error(404, `No place ${params.slug}`);

	const list = incidentsForPlace(place.slug);
	const t = totals(list);

	return new Response(
		placeCard(place.name, list.length, [
			{ label: 'Confirmed', value: String(t.byStatus.Confirmed) },
			{ label: 'Candidates', value: compactShort(t.affected) },
			{ label: 'Exams voided', value: String(t.voided) }
		]),
		{
			headers: {
				'content-type': 'image/svg+xml; charset=utf-8',
				'cache-control': 'public, max-age=3600'
			}
		}
	);
};
