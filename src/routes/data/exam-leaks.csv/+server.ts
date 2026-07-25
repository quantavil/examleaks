import { CSV_TEXT } from '$lib/data';
import type { RequestHandler } from './$types';

export const prerender = true;

/** The canonical CSV, served verbatim from the repository root. */
export const GET: RequestHandler = () =>
	new Response(CSV_TEXT, {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': 'inline; filename="exam_leaks.csv"',
			'access-control-allow-origin': '*'
		}
	});
