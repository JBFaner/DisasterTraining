import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { applyTheme, getStoredTheme, setStoredTheme } from '../utils/theme';

/**
 * Compact light / dark switch for the portal top bar.
 */
export function ThemeToggle({ className = '' }) {
    const [theme, setTheme] = React.useState(() => {
        if (typeof document === 'undefined') return 'light';
        return document.documentElement.classList.contains('dark') ? 'dark' : getStoredTheme();
    });

    React.useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const setMode = (mode) => {
        const next = setStoredTheme(mode);
        setTheme(next);
    };

    return (
        <div
            className={`inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 shadow-sm ${className}`.trim()}
            role="group"
            aria-label="Color theme"
        >
            <button
                type="button"
                onClick={() => setMode('light')}
                aria-pressed={theme === 'light'}
                title="Light mode"
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[0.7rem] font-semibold transition-colors ${
                    theme === 'light'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-white/80'
                }`}
            >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Light</span>
            </button>
            <button
                type="button"
                onClick={() => setMode('dark')}
                aria-pressed={theme === 'dark'}
                title="Dark mode"
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[0.7rem] font-semibold transition-colors ${
                    theme === 'dark'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-white/80'
                }`}
            >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Dark</span>
            </button>
        </div>
    );
}
