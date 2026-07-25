/**
 * Single place for every deployment-specific string.
 * Change these and nothing else when you fork the project.
 */

export const SITE_URL = (
	(import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://examleaks.pages.dev'
).replace(/\/+$/, '');

export const REPO_URL = 'https://github.com/quantavil/examleaks';
export const REPO_SLUG = 'quantavil/examleaks';

export const SITE_NAME = 'Exam Leaks';
export const SITE_TITLE = 'Exam Leaks — India’s public-examination leak record';
export const SITE_DESCRIPTION =
	'An open, source-linked record of documented paper leaks, impersonation rackets and marks-manipulation scandals in Indian public examinations, 2004 to the present.';

/** Convenience deep links into the repository. */
export const LINKS = {
	repo: REPO_URL,
	issues: `${REPO_URL}/issues`,
	newIncident: `${REPO_URL}/issues/new?template=new-incident.yml`,
	correction: `${REPO_URL}/issues/new?template=correction.yml`,
	editCsv: `${REPO_URL}/edit/main/exam_leaks.csv`,
	csvRaw: `https://raw.githubusercontent.com/${REPO_SLUG}/main/exam_leaks.csv`,
	contributing: `${REPO_URL}/blob/main/CONTRIBUTING.md`,
	discussions: `${REPO_URL}/discussions`
};

export const abs = (path: string): string => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
