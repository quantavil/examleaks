import { error } from '@sveltejs/kit';
import { activePlaces, incidentsForPlace, placeBySlug } from '$lib/data';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => activePlaces.map((place) => ({ slug: place.slug }));

export const load: PageLoad = ({ params }) => {
	const place = placeBySlug(params.slug);
	if (!place || !activePlaces.some((p) => p.slug === place.slug)) {
		error(404, `No recorded incidents for “${params.slug}”.`);
	}

	const index = activePlaces.findIndex((p) => p.slug === place.slug);

	return {
		place,
		list: incidentsForPlace(place.slug),
		rank: index + 1,
		totalPlaces: activePlaces.length,
		neighbours: activePlaces.filter((p) => p.slug !== place.slug).slice(0, 12)
	};
};
