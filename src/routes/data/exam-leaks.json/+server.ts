import { FIRST_DATE, LAST_DATE, incidents } from '$lib/data';
import { REPO_URL, SITE_URL, abs } from '$lib/site';
import type { RequestHandler } from './$types';

export const prerender = true;

/** Normalised JSON: parsed dates, resolved states, structured actions. */
export const GET: RequestHandler = () => {
	const payload = {
		name: 'Indian public examination leak incidents',
		description:
			'Publicly reported paper leaks, impersonation rackets and marks-manipulation scandals in Indian public examinations.',
		license: 'https://creativecommons.org/licenses/by/4.0/',
		source: REPO_URL,
		homepage: SITE_URL,
		temporalCoverage: `${FIRST_DATE}/${LAST_DATE}`,
		generated: new Date().toISOString().slice(0, 10),
		count: incidents.length,
		incidents: incidents.map((incident) => ({
			id: incident.id,
			url: abs(`/incident/${incident.id}`),
			date: incident.date,
			datePrecision: incident.datePrecision,
			year: incident.year,
			era: incident.era,
			examName: incident.examName,
			conductingBody: incident.conductingBody,
			bodyKey: incident.bodyKey,
			bodyType: incident.bodyType,
			area: incident.area,
			states: incident.states,
			stateSlugs: incident.stateSlugs,
			national: incident.national,
			status: incident.status,
			confidence: incident.confidence,
			actions: incident.actions,
			arrests: incident.arrests,
			convictions: incident.convictions,
			candidatesAffected: incident.affected,
			linkedDeaths: incident.deaths,
			deathsNote: incident.deathsNote,
			note: incident.note,
			source: { name: incident.sourceName, url: incident.sourceUrl }
		}))
	};

	return new Response(JSON.stringify(payload, null, '\t'), {
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'access-control-allow-origin': '*'
		}
	});
};
