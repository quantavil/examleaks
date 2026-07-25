import { browser } from '$app/environment';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'examleaks-theme';

// app.html stamps data-theme before first paint; read it back so the toggle
// starts in sync with what the user is actually looking at.
let current = $state<Theme>(
	browser && document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
);

function apply(next: Theme): void {
	current = next;
	if (!browser) return;
	document.documentElement.dataset.theme = next;
	try {
		localStorage.setItem(STORAGE_KEY, next);
	} catch {
		// Private mode / storage disabled — the in-memory value still works.
	}
}

export const theme = {
	get current(): Theme {
		return current;
	},
	set: apply,
	toggle(): void {
		apply(current === 'dark' ? 'light' : 'dark');
	}
};
