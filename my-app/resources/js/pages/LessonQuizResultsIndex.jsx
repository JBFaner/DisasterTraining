import React from 'react';
import { Search } from 'lucide-react';
import {
    AdminCollapsibleFilterBar,
    AdminFilterInput,
    AdminFilterSelect,
    AdminPrimaryButton,
    AdminContentCard,
    AdminStatCard,
} from '../components/admin/AdminLayout';

function StatusBadge({ attempt }) {
    if (attempt.status === 'in_progress') {
        return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-50 text-amber-800 border-amber-200">In Progress</span>;
    }
    if (attempt.status === 'expired') {
        return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-slate-50 text-slate-700 border-slate-200">Expired</span>;
    }
    if (attempt.passed) {
        return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">Passed</span>;
    }
    return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-rose-50 text-rose-700 border-rose-200">Failed</span>;
}

export function LessonQuizResultsIndex({
    attempts = [],
    pagination = null,
    analytics = null,
    modules = [],
    filters = {},
}) {
    const [search, setSearch] = React.useState(filters.search || '');
    const [statusFilter, setStatusFilter] = React.useState(filters.status || '');
    const [moduleFilter, setModuleFilter] = React.useState(filters.training_module_id || '');
    const [dateFrom, setDateFrom] = React.useState(filters.date_from || '');
    const [dateTo, setDateTo] = React.useState(filters.date_to || '');

    const applyFilters = (e) => {
        e?.preventDefault();
        const url = new URL(window.location.href);
        url.searchParams.set('tab', 'lessons');
        if (search) url.searchParams.set('search', search);
        else url.searchParams.delete('search');
        if (statusFilter) url.searchParams.set('status', statusFilter);
        else url.searchParams.delete('status');
        if (moduleFilter) url.searchParams.set('training_module_id', moduleFilter);
        else url.searchParams.delete('training_module_id');
        if (dateFrom) url.searchParams.set('date_from', dateFrom);
        else url.searchParams.delete('date_from');
        if (dateTo) url.searchParams.set('date_to', dateTo);
        else url.searchParams.delete('date_to');
        url.searchParams.delete('page');
        window.location.href = url.toString();
    };

    const buildPageUrl = (page) => {
        const params = new URLSearchParams({ ...filters, tab: 'lessons', page: String(page) });
        Object.keys(params).forEach((key) => {
            if (!params.get(key)) params.delete(key);
        });
        return `?${params.toString()}`;
    };

    return (
        <div className="space-y-4">
            {analytics && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <AdminStatCard label="Total Attempts" value={analytics.total_attempts} accent="slate" />
                    <AdminStatCard label="Completed" value={analytics.completed_attempts} accent="blue" />
                    <AdminStatCard label="In Progress" value={analytics.in_progress} accent="amber" />
                    <AdminStatCard label="Passed" value={analytics.passed} accent="emerald" />
                    <AdminStatCard label="Failed" value={analytics.failed} accent="rose" />
                    <AdminStatCard label="Pass Rate" value={`${analytics.pass_rate}%`} accent="emerald" />
                </div>
            )}

            <AdminCollapsibleFilterBar
                searchValue={search}
                onSearchChange={(e) => setSearch(e.target.value)}
                searchPlaceholder="Search participant, module, or lesson..."
                hasActiveFilters={Boolean(statusFilter || moduleFilter || dateFrom || dateTo)}
                onClearFilters={() => {
                    setStatusFilter('');
                    setModuleFilter('');
                    setDateFrom('');
                    setDateTo('');
                }}
                onSearchSubmit={applyFilters}
                trailing={<AdminPrimaryButton type="submit"><Search className="w-4 h-4" /> Apply</AdminPrimaryButton>}
            >
                <AdminFilterSelect label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="expired">Expired</option>
                </AdminFilterSelect>
                <AdminFilterSelect label="Training Module" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
                    <option value="">All Modules</option>
                    {(modules || []).map((m) => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                </AdminFilterSelect>
                <AdminFilterInput label="Date from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                <AdminFilterInput label="Date to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </AdminCollapsibleFilterBar>

            <AdminContentCard>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="text-left px-4 py-3">Participant</th>
                                <th className="text-left px-4 py-3">Module</th>
                                <th className="text-left px-4 py-3">Lesson</th>
                                <th className="text-left px-4 py-3">Attempt</th>
                                <th className="text-left px-4 py-3">Score</th>
                                <th className="text-left px-4 py-3">%</th>
                                <th className="text-left px-4 py-3">Status</th>
                                <th className="text-left px-4 py-3">Completed</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(attempts || []).length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                                        No lesson quiz attempts yet.
                                    </td>
                                </tr>
                            ) : (
                                attempts.map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-50/80">
                                        <td className="px-4 py-3 font-medium text-slate-900">{row.participant?.name || '—'}</td>
                                        <td className="px-4 py-3 text-slate-700">{row.training_module?.title || '—'}</td>
                                        <td className="px-4 py-3 text-slate-700 max-w-[220px] truncate">{row.lesson?.title || '—'}</td>
                                        <td className="px-4 py-3 text-slate-600">#{row.attempt_number}</td>
                                        <td className="px-4 py-3">{row.score ?? 0}/{row.total_questions ?? 0}</td>
                                        <td className="px-4 py-3 font-semibold">{row.percentage != null ? `${Number(row.percentage).toFixed(1)}%` : '—'}</td>
                                        <td className="px-4 py-3"><StatusBadge attempt={row} /></td>
                                        <td className="px-4 py-3 text-xs text-slate-500">
                                            {row.completed_at ? new Date(row.completed_at).toLocaleString() : '—'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </AdminContentCard>

            {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Page {pagination.current_page} of {pagination.last_page} ({pagination.total} records)</span>
                    <div className="flex gap-2">
                        {pagination.current_page > 1 && (
                            <a href={buildPageUrl(pagination.current_page - 1)} className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50">Previous</a>
                        )}
                        {pagination.current_page < pagination.last_page && (
                            <a href={buildPageUrl(pagination.current_page + 1)} className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50">Next</a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
