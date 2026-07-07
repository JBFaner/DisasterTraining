import React from 'react';
import { LayoutGrid, List, Search } from 'lucide-react';

export {
    AdminCollapsibleFilterBar,
    AdminFilterField,
    AdminFilterSelect,
    AdminFilterInput,
} from './AdminCollapsibleFilterBar';

/** Shared Tailwind classes for admin forms */
export const adminInputClass =
    'w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500';

export const adminSelectClass =
    'px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500';

export const adminCompactInputClass =
    'w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500';

/**
 * Standard page wrapper — compact vertical rhythm used across admin modules.
 */
export function AdminPageShell({ children, className = '' }) {
    return <div className={`space-y-4 w-full overflow-x-hidden ${className}`.trim()}>{children}</div>;
}

/**
 * Compact page header (Training Modules standard).
 */
export function AdminPageHeader({ icon: Icon, title, description, actions }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />}
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
                </div>
                {description && (
                    <p className="text-sm text-slate-600 mt-0.5 sm:ml-7">{description}</p>
                )}
            </div>
            {actions && (
                <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-center">
                    {actions}
                </div>
            )}
        </div>
    );
}

/**
 * White card wrapper for search / filter toolbars.
 */
export function AdminFilterBar({ children, footer, className = '' }) {
    return (
        <div className={`rounded-xl bg-white border border-slate-200 shadow-sm p-3 mb-4 ${className}`}>
            {children}
            {footer}
        </div>
    );
}

export function AdminPrimaryButton({
    href,
    onClick,
    children,
    type = 'button',
    disabled = false,
    className = '',
}) {
    const classes = `inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`;

    if (href) {
        return (
            <a href={href} className={classes}>
                {children}
            </a>
        );
    }

    return (
        <button type={type} onClick={onClick} disabled={disabled} className={classes}>
            {children}
        </button>
    );
}

export function AdminSecondaryButton({
    href,
    onClick,
    children,
    type = 'button',
    disabled = false,
    className = '',
}) {
    const classes = `inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`;

    if (href) {
        return (
            <a href={href} className={classes}>
                {children}
            </a>
        );
    }

    return (
        <button type={type} onClick={onClick} disabled={disabled} className={classes}>
            {children}
        </button>
    );
}

export function AdminNumberInput({
    value,
    onChange,
    min,
    max,
    placeholder,
    className = '',
    error,
    id,
    disabled = false,
}) {
    const handleFocus = (event) => {
        event.target.select();
    };

    const handleChange = (event) => {
        const raw = event.target.value;
        if (raw === '') {
            onChange('');
            return;
        }

        const parsed = Number(raw);
        if (!Number.isFinite(parsed)) {
            return;
        }

        onChange(parsed);
    };

    return (
        <div>
            <input
                id={id}
                type="number"
                min={min}
                max={max}
                value={value === '' || value === null || value === undefined ? '' : value}
                onChange={handleChange}
                onFocus={handleFocus}
                placeholder={placeholder}
                disabled={disabled}
                className={`${adminCompactInputClass} ${
                    error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''
                } ${className}`.trim()}
            />
            {error ? <p className="text-xs text-red-600 mt-1">{error}</p> : null}
        </div>
    );
}

export function AdminSearchInput({
    value,
    onChange,
    placeholder = 'Search...',
    onSubmit,
    className = '',
    inputClassName = '',
}) {
    const input = (
        <div className={`relative flex-1 min-w-0 ${className}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className={`${adminInputClass} ${inputClassName}`}
            />
        </div>
    );

    if (onSubmit) {
        return (
            <form onSubmit={onSubmit} className="flex flex-col md:flex-row gap-3 flex-1 min-w-0">
                {input}
            </form>
        );
    }

    return input;
}

export function AdminViewToggle({ viewMode, onChange, className = '' }) {
    return (
        <div className={`flex rounded-lg border border-slate-200 bg-slate-50/50 overflow-hidden shrink-0 ${className}`}>
            <button
                type="button"
                onClick={() => onChange('grid')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'grid'
                        ? 'bg-white text-slate-900 border border-slate-200 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Grid view"
            >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Grid</span>
            </button>
            <button
                type="button"
                onClick={() => onChange('list')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'list'
                        ? 'bg-white text-slate-900 border border-slate-200 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                }`}
                title="List view"
            >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">List</span>
            </button>
        </div>
    );
}

/** Standard content card (tables, lists) */
export function AdminContentCard({ children, className = '' }) {
    return (
        <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
            {children}
        </div>
    );
}

/** KPI / stat card — slightly compact variant */
export function AdminStatCard({ label, value, hint, accent = 'slate', onClick, active = false }) {
    const accentMap = {
        slate: active ? 'border-slate-300 ring-2 ring-emerald-500/30' : 'border-slate-200',
        emerald: active ? 'border-emerald-300 ring-2 ring-emerald-500/30' : 'border-emerald-200',
        blue: active ? 'border-blue-300 ring-2 ring-emerald-500/30' : 'border-blue-200',
        amber: active ? 'border-amber-300 ring-2 ring-emerald-500/30' : 'border-amber-200',
    };

    const labelMap = {
        slate: 'text-slate-500',
        emerald: 'text-emerald-600',
        blue: 'text-blue-600',
        amber: 'text-amber-600',
    };

    const valueMap = {
        slate: 'text-slate-900',
        emerald: 'text-emerald-800',
        blue: 'text-blue-800',
        amber: 'text-amber-800',
    };

    const Wrapper = onClick ? 'button' : 'div';

    return (
        <Wrapper
            type={onClick ? 'button' : undefined}
            onClick={onClick}
            className={`bg-white rounded-xl border shadow-sm p-4 text-left transition-all hover:shadow-md ${accentMap[accent] || accentMap.slate} ${onClick ? 'cursor-pointer w-full' : ''}`}
        >
            <p className={`text-xs font-semibold uppercase tracking-wide ${labelMap[accent] || labelMap.slate}`}>
                {label}
            </p>
            <p className={`text-2xl font-bold mt-1 ${valueMap[accent] || valueMap.slate}`}>{value}</p>
            {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
        </Wrapper>
    );
}
