import React from 'react';
import { Filter } from 'lucide-react';
import { AdminSearchInput, adminSelectClass, adminCompactInputClass } from './AdminLayout';

export function AdminFilterField({ label, children, className = '' }) {
    return (
        <div className={className}>
            {label && (
                <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
            )}
            {children}
        </div>
    );
}

export function AdminFilterSelect({ label, value, onChange, children, className = '' }) {
    return (
        <AdminFilterField label={label} className={className}>
            <select value={value} onChange={onChange} className={`w-full ${adminSelectClass}`}>
                {children}
            </select>
        </AdminFilterField>
    );
}

export function AdminFilterInput({
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    className = '',
}) {
    return (
        <AdminFilterField label={label} className={className}>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={adminCompactInputClass}
            />
        </AdminFilterField>
    );
}

/**
 * Standard admin search + collapsible advanced filters (Stronghold design language).
 */
export function AdminCollapsibleFilterBar({
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Search...',
    searchSlot,
    onSearchSubmit,
    children,
    onClearFilters,
    hasActiveFilters = false,
    trailing,
    className = '',
    searchClassName = '',
    panelHeader,
    showFilterToggle = true,
    defaultOpen = false,
}) {
    const [open, setOpen] = React.useState(defaultOpen);
    const panelId = React.useId();
    const hasPanel = Boolean(children);

    const filterToggle = showFilterToggle && hasPanel ? (
        <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls={panelId}
            title={open ? 'Hide filters' : 'Show filters'}
            className={`relative inline-flex items-center justify-center w-10 h-10 shrink-0 rounded-lg border transition-colors duration-200 ${
                open || hasActiveFilters
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
            }`}
        >
            <Filter className="w-4 h-4" />
            {hasActiveFilters && !open && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
            )}
        </button>
    ) : null;

    const searchField = searchSlot ?? (
        <AdminSearchInput
            value={searchValue}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            className={`flex-1 min-w-0 ${searchClassName}`}
        />
    );

    return (
        <div className={`rounded-xl bg-white border border-slate-200 shadow-sm p-3 mb-4 ${className}`.trim()}>
            {onSearchSubmit ? (
                <form onSubmit={onSearchSubmit} className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {searchField}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        {filterToggle}
                        {trailing}
                    </div>
                </form>
            ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {searchField}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        {filterToggle}
                        {trailing}
                    </div>
                </div>
            )}

            {hasPanel && (
                <div
                    id={panelId}
                    className={`grid transition-[grid-template-rows,opacity] duration-[250ms] ease-in-out ${
                        open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                    aria-hidden={!open}
                >
                    <div className="overflow-hidden">
                        <div className="pt-3 mt-3 border-t border-slate-200">
                            {panelHeader}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {children}
                            </div>
                            {onClearFilters && (
                                <div className="mt-3 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={onClearFilters}
                                        className="text-xs font-medium text-slate-600 hover:text-slate-900 underline-offset-2 hover:underline transition-colors"
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
