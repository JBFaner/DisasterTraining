import React from 'react';
import { Globe } from 'lucide-react';
import { AI_SCENARIO_LANGUAGES, resolveAiScenarioLanguage } from '../utils/aiScenarioLocale';

export function AiScenarioLanguageSwitcher({ value, onChange, className = '' }) {
    const current = resolveAiScenarioLanguage(value);

    return (
        <div className={`flex flex-col items-end gap-1.5 ${className}`}>
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Globe className="w-3.5 h-3.5" />
                Display Language
            </div>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
                {Object.entries(AI_SCENARIO_LANGUAGES).map(([code, meta]) => {
                    const active = current === code;
                    return (
                        <button
                            key={code}
                            type="button"
                            onClick={() => onChange?.(code)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                                active
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50'
                            }`}
                            aria-pressed={active}
                        >
                            <span aria-hidden>{meta.flag}</span>
                            {meta.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
