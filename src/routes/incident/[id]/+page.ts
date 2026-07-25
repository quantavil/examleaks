import { error } from '@sveltejs/kit';
import { byId, incidents } from '$lib/data';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => incidents.map((incident) => ({ id: incident.id }));

export const load: PageLoad = ({ params }) => {
	const incident = byId.get(params.id);
	if (!incident) error(404, `No incident with id “${params.id}”.`);

	const index = incidents.findIndex((i) => i.id === incident.id);

	return {
		incident,
		previous: incidents[index - 1] ?? null,
		next: incidents[index + 1] ?? null,
		sameBody: incidents.filter((i) => i.bodyKey === incident.bodyKey && i.id !== incident.id),
		samePlace: incidents
			.filter(
				(i) =>
					i.id !== incident.id &&
					i.bodyKey !== incident.bodyKey &&
					i.stateSlugs.some((slug) => incident.stateSlugs.includes(slug))
			)
			.slice(0, 6)
	};
};
