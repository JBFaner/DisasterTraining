import React from 'react';
import { ClipboardCheck, Eye, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import { formatDate } from '../components/campaign/CampaignRequestUi';
import {
    AdminCollapsibleFilterBar,
    AdminFilterSelect,
    AdminPrimaryButton,
    AdminContentCard,
    AdminStatCard,
} from '../components/admin/AdminLayout';
import { buildPrintTableDocument, printHtmlDocument } from '../utils/printHtml';
import { EVALUATION_HUB_PRINT_EVENT } from './evaluationHubEvents';

function statusLabel(status) {
    switch (status) {
        case 'not_started': return 'Not Started';
        case 'in_progress': return 'In Progress';
        case 'completed': return 'Completed';
        case 'locked': return 'Locked';
        default: return 'Not Started';
    }
}

function statusClass(status) {
    switch (status) {
        case 'not_started': return 'bg-slate-100 text-slate-700 border-slate-200';
        case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'locked': return 'bg-amber-100 text-amber-800 border-amber-200';
        default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
}

export function EvaluationEventsPanel({ events = [], filters = {} }) {
    const [search, setSearch] = React.useState(filters.search || new URLSearchParams(window.location.search).get('search') || '');
    const [statusFilter, setStatusFilter] = React.useState(filters.status || new URLSearchParams(window.location.search).get('status') || '');
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10;

    const applyFilters = (e) => {
        e?.preventDefault();
        const url = new URL(window.location.href);
        url.searchParams.set('tab', 'events');
        if (search) url.searchParams.set('search', search);
        else url.searchParams.delete('search');
        if (statusFilter) url.searchParams.set('status', statusFilter);
        else url.searchParams.delete('status');
        url.searchParams.delete('page');
        window.location.href = url.toString();
    };

    const evList = events || [];
    const totalEvents = evList.length;
    const inProgressCount = evList.filter((e) => e.evaluation_status === 'in_progress').length;
    const completedCount = evList.filter((e) => e.evaluation_status === 'completed').length;
    const notStartedCount = evList.filter((e) => e.evaluation_status === 'not_started' || !e.evaluation_status).length;
    const totalPages = Math.ceil(totalEvents / itemsPerPage) || 1;
    const paginatedEvents = evList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handlePrint = React.useCallback(() => {
        const html = buildPrintTableDocument({
            title: 'Simulation Event Evaluations',
            subtitle: `Printed ${new Date().toLocaleString()} · ${evList.length} event(s)${statusFilter ? ` · Status: ${statusLabel(statusFilter)}` : ''}${search ? ` · Search: ${search}` : ''}`,
            headers: ['#', 'Event', 'Type', 'Scenario', 'Date', 'Venue', 'Status', 'Participants', 'Avg %', 'Pass %'],
            rows: evList.map((event, index) => [
                index + 1,
                event.title || '—',
                event.simulation_type || '—',
                event.scenario_name || '—',
                formatDate(event.event_date),
                event.venue || '—',
                statusLabel(event.evaluation_status),
                event.participant_count ?? 0,
                `${Number(event.average_score || 0).toFixed(1)}%`,
                `${Number(event.passing_rate || 0).toFixed(1)}%`,
            ]),
        });

        if (!printHtmlDocument(html, 'Simulation Event Evaluations')) {
            Swal.fire('Unable to print', 'Could not prepare the print view. Please try again.', 'warning');
        }
    }, [evList, statusFilter, search]);

    React.useEffect(() => {
        const onPrint = () => handlePrint();
        window.addEventListener(EVALUATION_HUB_PRINT_EVENT, onPrint);
        return () => window.removeEventListener(EVALUATION_HUB_PRINT_EVENT, onPrint);
    }, [handlePrint]);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <AdminStatCard label="Total Events" value={totalEvents} accent="slate" />
                <AdminStatCard label="In Progress" value={inProgressCount} accent="blue" />
                <AdminStatCard label="Completed" value={completedCount} accent="emerald" />
                <AdminStatCard label="Not Started" value={notStartedCount} accent="slate" />
            </div>

            <AdminCollapsibleFilterBar
                searchValue={search}
                onSearchChange={(e) => setSearch(e.target.value)}
                searchPlaceholder="Search by event title..."
                hasActiveFilters={Boolean(statusFilter)}
                onClearFilters={() => setStatusFilter('')}
                onSearchSubmit={applyFilters}
                trailing={(
                    <AdminPrimaryButton type="submit">
                        <Search className="w-4 h-4" />
                        Apply
                    </AdminPrimaryButton>
                )}
            >
                <AdminFilterSelect label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="locked">Locked</option>
                </AdminFilterSelect>
            </AdminCollapsibleFilterBar>

            <AdminContentCard>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="text-left px-4 py-3">Event</th>
                                <th className="text-left px-4 py-3">Type</th>
                                <th className="text-left px-4 py-3">Scenario</th>
                                <th className="text-left px-4 py-3">Date</th>
                                <th className="text-left px-4 py-3">Venue</th>
                                <th className="text-left px-4 py-3">Status</th>
                                <th className="text-left px-4 py-3">Participants</th>
                                <th className="text-left px-4 py-3">Avg / Pass</th>
                                <th className="text-left px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedEvents.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                                        No events matching your search or filters.
                                    </td>
                                </tr>
                            ) : (
                                paginatedEvents.map((event) => (
                                    <tr key={event.id} className="hover:bg-slate-50/80">
                                        <td className="px-4 py-3 font-medium text-slate-900 max-w-[260px]">
                                            <span className="line-clamp-2">{event.title}</span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-700">{event.simulation_type || '—'}</td>
                                        <td className="px-4 py-3 text-slate-700">{event.scenario_name || '—'}</td>
                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(event.event_date)}</td>
                                        <td className="px-4 py-3 text-slate-600 max-w-[160px] truncate">{event.venue || '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusClass(event.evaluation_status)}`}>
                                                {statusLabel(event.evaluation_status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-700">{event.participant_count ?? 0}</td>
                                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                                            {Number(event.average_score || 0).toFixed(1)}% / {Number(event.passing_rate || 0).toFixed(1)}%
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={`/admin/simulation-events/${event.id}/evaluation`}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                                                >
                                                    <ClipboardCheck className="h-3.5 w-3.5" />
                                                    Evaluate
                                                </a>
                                                <a
                                                    href={`/admin/simulation-events/${event.id}/evaluation/summary`}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    Summary
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </AdminContentCard>

            {totalEvents > itemsPerPage && (
                <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>
                        Page {currentPage} of {totalPages} ({totalEvents} events)
                    </span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
