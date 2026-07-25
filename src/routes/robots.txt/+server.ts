import { abs } from '$lib/site';
import type { RequestHandler } from './$types';

export const prerender = true;

export const GET: RequestHandler = () =>
	new Response(
		`User-agent: *
Allow: /

Sitemap: ${abs('/sitemap.xml')}
`,
		{ headers: { 'content-type': 'text/plain; charset=utf-8' } }
	);
