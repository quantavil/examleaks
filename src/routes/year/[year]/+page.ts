import { error } from '@sveltejs/kit';
import { activeYears, incidentsForYear } from '$lib/data';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () =>
	activeYears.map(({ year }) => ({ year: String(year) }));

export const load: PageLoad = ({ params }) => {
	const year = Number(params.year);
	const index = activeYears.findIndex((y) => y.year === year);
	if (index === -1) error(404, `Nothing is recorded for ${params.year}.`);

	return {
		year,
		list: incidentsForYear(year),
		previous: activeYears[index - 1]?.year ?? null,
		next: activeYears[index + 1]?.year ?? null,
		allYears: activeYears
	};
};
