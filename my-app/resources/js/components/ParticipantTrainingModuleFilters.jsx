import React from 'react';
import { Search, X } from 'lucide-react';

export function ParticipantTrainingModuleFilters({
    searchQuery,
    onSearchChange,
    category,
    onCategoryChange,
    categories = [],
    onClear,
    isLoading = false,
}) {
    const hasActiveFilters = Boolean(searchQuery.trim() || category);

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <label className="flex-1 min-w-0">
                    <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                        Search modules
                    </span>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Search by title, description, or category…"
                            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                    </div>
                </label>

                {categories.length > 0 && (
                    <label className="w-full md:w-56 shrink-0">
                        <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                            Category
                        </span>
                        <select
                            value={category}
                            onChange={(e) => onCategoryChange(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                            <option value="">All categories</option>
                            {categories.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </label>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-500">
                    {isLoading ? 'Updating results…' : 'Filter by keyword or hazard category'}
                </span>
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-semibold text-slate-600 hover:bg-slate-100"
                    >
                        <X className="w-3.5 h-3.5" />
                        Clear filters
                    </button>
                )}
            </div>
        </div>
    );
}

export function participantModuleHref(module) {
    const base = `/participant/training-modules/${module.id}`;
    if (module.is_accessible === false) {
        return base;
    }
    if (module.resume_content_id) {
        return `${base}?lesson=${module.resume_content_id}`;
    }
    return base;
}
