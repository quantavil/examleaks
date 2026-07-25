import { error } from '@sveltejs/kit';
import { byId, incidents } from '$lib/data';
import { incidentCard } from '$lib/og';
import type { EntryGenerator, RequestHandler } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => incidents.map((incident) => ({ id: incident.id }));

export const GET: RequestHandler = ({ params }) => {
	const incident = byId.get(params.id);
	if (!incident) error(404, `No incident ${params.id}`);

	return new Response(incidentCard(incident), {
		headers: {
			'content-type': 'image/svg+xml; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
};
