import { LAST_DATE, activePlaces, activeYears, incidents } from '$lib/data';
import { abs } from '$lib/site';
import type { RequestHandler } from './$types';

export const prerender = true;

interface Entry {
	path: string;
	lastmod: string;
	priority: string;
	changefreq: string;
}

export const GET: RequestHandler = () => {
	const today = LAST_DATE || new Date().toISOString().slice(0, 10);

	const entries: Entry[] = [
		{ path: '/', lastmod: today, priority: '1.0', changefreq: 'weekly' },
		{ path: '/record', lastmod: today, priority: '0.9', changefreq: 'weekly' },
		{ path: '/states', lastmod: today, priority: '0.8', changefreq: 'weekly' },
		{ path: '/years', lastmod: today, priority: '0.8', changefreq: 'weekly' },
		{ path: '/about', lastmod: today, priority: '0.7', changefreq: 'monthly' },
		{ path: '/contribute', lastmod: today, priority: '0.7', changefreq: 'monthly' },

		...incidents.map((incident) => ({
			path: `/incident/${incident.id}`,
			lastmod: incident.date,
			priority: '0.6',
			changefreq: 'yearly'
		})),

		...activePlaces.map((place) => ({
			path: `/state/${place.slug}`,
			lastmod: today,
			priority: '0.6',
			changefreq: 'monthly'
		})),

		...activeYears.map(({ year }) => ({
			path: `/year/${year}`,
			lastmod: today,
			priority: '0.5',
			changefreq: 'monthly'
		}))
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
	.map(
		(e) => `\t<url>
\t\t<loc>${abs(e.path)}</loc>
\t\t<lastmod>${e.lastmod}</lastmod>
\t\t<changefreq>${e.changefreq}</changefreq>
\t\t<priority>${e.priority}</priority>
\t</url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: { 'content-type': 'application/xml; charset=utf-8' }
	});
};
