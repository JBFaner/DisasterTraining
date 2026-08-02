import React from 'react';
import { Search } from 'lucide-react';
import Swal from 'sweetalert2';
import {
    AdminCollapsibleFilterBar,
    AdminFilterInput,
    AdminFilterSelect,
    AdminPrimaryButton,
    AdminContentCard,
    AdminStatCard,
} from '../components/admin/AdminLayout';
import { AdminTablePagination } from '../components/admin/AdminDataTable';
import { buildPrintTableDocument, printHtmlDocument } from '../utils/printHtml';
import { EVALUATION_HUB_PRINT_EVENT } from './evaluationHubEvents';

function ProgressStatusPill({ status }) {
    const complete = status === 'completed';
    return (
        <span
            className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                complete
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
        >
            {complete ? 'Complete' : 'In Progress'}
        </span>
    );
}

export function LessonQuizResultsIndex({
    attempts = [],
    pagination = null,
    analytics = null,
    modules = [],
    lessons = [],
    lessonColumns = [],
    batches = [],
    filters = {},
}) {
    const [search, setSearch] = React.useState(filters.search || '');
    const [statusFilter, setStatusFilter] = React.useState(filters.status || '');
    const [moduleFilter, setModuleFilter] = React.useState(filters.training_module_id || '');
    const [batchFilter, setBatchFilter] = React.useState(filters.batch_filter || '');
    const [participantName, setParticipantName] = React.useState(filters.participant_name || '');
    const [dateFrom, setDateFrom] = React.useState(filters.date_from || '');
    const [dateTo, setDateTo] = React.useState(filters.date_to || '');

    const availableBatches = React.useMemo(() => {
        const list = batches || [];
        if (!moduleFilter) return list;
        const moduleId = Number(moduleFilter);
        return list.filter((batch) => Number(batch.training_module_id) === moduleId);
    }, [batches, moduleFilter]);

    const handleModuleChange = (value) => {
        setModuleFilter(value);
        if (!value) return;
        const moduleId = Number(value);
        const stillValid = (batches || []).some(
            (batch) => Number(batch.id) === Number(batchFilter) && Number(batch.training_module_id) === moduleId,
        );
        if (!stillValid) setBatchFilter('');
    };

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
        url.searchParams.delete('training_content_id');
        if (batchFilter) url.searchParams.set('batch_filter', batchFilter);
        else url.searchParams.delete('batch_filter');
        if (participantName.trim()) url.searchParams.set('participant_name', participantName.trim());
        else url.searchParams.delete('participant_name');
        if (dateFrom) url.searchParams.set('date_from', dateFrom);
        else url.searchParams.delete('date_from');
        if (dateTo) url.searchParams.set('date_to', dateTo);
        else url.searchParams.delete('date_to');
        url.searchParams.delete('page');
        window.location.href = url.toString();
    };

    const buildPageUrl = (page) => {
        const params = new URLSearchParams({ ...filters, tab: 'lessons', page: String(page) });
        Object.keys(Object.fromEntries(params.entries())).forEach((key) => {
            if (!params.get(key)) params.delete(key);
        });
        return `?${params.toString()}`;
    };

    const handlePrint = React.useCallback(() => {
        const moduleLabel = moduleFilter
            ? (modules || []).find((m) => String(m.id) === String(moduleFilter))?.title || moduleFilter
            : 'All Modules';

        const headers = ['#', 'Participant', 'Module', 'Batch', 'Status', 'Progress'];
        const rows = (attempts || []).map((row, index) => [
            index + 1,
            row.participant?.name || '—',
            row.training_module?.title || '—',
            row.batch_label || row.batch?.label || '—',
            row.progress_status === 'completed' ? 'Complete' : 'In Progress',
            `${row.completed_lessons ?? row.passed_lessons ?? 0}/${row.total_lessons ?? '—'} lessons`,
        ]);

        const html = buildPrintTableDocument({
            title: 'Lesson Quiz Results by Participant',
            subtitle: `Printed ${new Date().toLocaleString()} · ${(attempts || []).length} participant row(s)${pagination?.total ? ` of ${pagination.total}` : ''} · Module: ${moduleLabel}`,
            headers,
            rows,
        });

        if (!printHtmlDocument(html, 'Lesson Quiz Results')) {
            Swal.fire('Unable to print', 'Could not prepare the print view. Please try again.', 'warning');
        }
    }, [attempts, pagination, modules, moduleFilter]);

    React.useEffect(() => {
        const onPrint = () => handlePrint();
        window.addEventListener(EVALUATION_HUB_PRINT_EVENT, onPrint);
        return () => window.removeEventListener(EVALUATION_HUB_PRINT_EVENT, onPrint);
    }, [handlePrint]);

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

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Each row is one participant. Status shows Complete or In Progress. Click a name to open Lesson 1–5 scores and review answers.
            </div>

            <AdminCollapsibleFilterBar
                searchValue={search}
                onSearchChange={(e) => setSearch(e.target.value)}
                searchPlaceholder="Search participant or module..."
                hasActiveFilters={Boolean(statusFilter || moduleFilter || batchFilter || participantName || dateFrom || dateTo || search)}
                onClearFilters={() => {
                    setSearch('');
                    setStatusFilter('');
                    setModuleFilter('');
                    setBatchFilter('');
                    setParticipantName('');
                    setDateFrom('');
                    setDateTo('');
                }}
                onSearchSubmit={applyFilters}
                trailing={(
                    <AdminPrimaryButton type="submit">
                        <Search className="w-4 h-4" />
                        Apply
                    </AdminPrimaryButton>
                )}
            >
                <AdminFilterSelect label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="completed">Complete</option>
                    <option value="in_progress">In Progress</option>
                </AdminFilterSelect>
                <AdminFilterSelect label="Training Module" value={moduleFilter} onChange={(e) => handleModuleChange(e.target.value)}>
                    <option value="">All Modules</option>
                    {(modules || []).map((m) => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                </AdminFilterSelect>
                <AdminFilterSelect label="Batch" value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
                    <option value="">All Batches</option>
                    {availableBatches.map((batch) => (
                        <option key={batch.id} value={batch.id}>
                            {batch.label}{!moduleFilter && batch.module_title ? ` · ${batch.module_title}` : ''}
                        </option>
                    ))}
                </AdminFilterSelect>
                <AdminFilterInput
                    label="Participant Name"
                    type="text"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    placeholder="Filter by participant name..."
                />
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
                                <th className="text-left px-4 py-3">Batch</th>
                                <th className="text-left px-4 py-3">Status</th>
                                <th className="text-left px-4 py-3">Progress</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(attempts || []).length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                        No lesson quiz participants yet.
                                    </td>
                                </tr>
                            ) : (
                                attempts.map((row) => (
                                    <tr key={`${row.participant?.id}-${row.training_module?.id}`} className="hover:bg-slate-50/80">
                                        <td className="px-4 py-3 font-medium text-slate-900">
                                            {row.detail_href ? (
                                                <a
                                                    href={row.detail_href}
                                                    className="text-emerald-700 hover:text-emerald-800 hover:underline"
                                                    title="View lesson 1–5 scores"
                                                >
                                                    {row.participant?.name || '—'}
                                                </a>
                                            ) : (
                                                row.participant?.name || '—'
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-700">{row.training_module?.title || '—'}</td>
                                        <td className="px-4 py-3 text-slate-700">{row.batch_label || row.batch?.label || '—'}</td>
                                        <td className="px-4 py-3">
                                            <ProgressStatusPill status={row.progress_status} />
                                        </td>
                                        <td className="px-4 py-3 text-slate-700">
                                            {row.completed_lessons ?? 0}/{row.total_lessons ?? (lessonColumns?.length || lessons?.length || 5)} lessons
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {pagination && pagination.total > 0 ? (
                    <AdminTablePagination
                        pagination={pagination}
                        onPageChange={(page) => {
                            window.location.href = buildPageUrl(page);
                        }}
                    />
                ) : null}
            </AdminContentCard>
        </div>
    );
}
