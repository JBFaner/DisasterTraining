const THEME_STORAGE_KEY = 'alertara-theme';

export function getStoredTheme() {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'dark' || stored === 'light') {
            return stored;
        }
    } catch {
        // ignore
    }
    return 'light';
}

export function applyTheme(theme) {
    const next = theme === 'dark' ? 'dark' : 'light';
    const root = document.documentElement;
    root.classList.toggle('dark', next === 'dark');
    root.dataset.theme = next;
    document.body?.classList.toggle('theme-dark', next === 'dark');
    document.body?.classList.toggle('theme-light', next === 'light');
    return next;
}

export function setStoredTheme(theme) {
    const next = applyTheme(theme);
    try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
        // ignore
    }
    return next;
}

export function initTheme() {
    return applyTheme(getStoredTheme());
}
