import React from 'react';
import { ClipboardCheck, Eye, Filter, Search, Users } from 'lucide-react';
import { formatDate } from '../components/campaign/CampaignRequestUi';

function SimplePagination({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems }) {
    if (totalItems === 0 || totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="text-sm text-slate-600">
                <span className="font-medium text-slate-800">{startItem}</span>
                <span className="mx-1">–</span>
                <span className="font-medium text-slate-800">{endItem}</span>
                <span className="mx-1 text-slate-400">of</span>
                <span className="font-semibold text-slate-800">{totalItems}</span>
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm disabled:opacity-40"
                >
                    Previous
                </button>
                <span className="text-sm text-slate-600">Page {currentPage} of {totalPages}</span>
                <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm disabled:opacity-40"
                >
                    Next
                </button>
            </div>
        </div>
    );
}

export function EvaluationEventsPanel({ events = [], filters = {} }) {
    const [search, setSearch] = React.useState(filters.search || new URLSearchParams(window.location.search).get('search') || '');
    const [statusFilter, setStatusFilter] = React.useState(filters.status || new URLSearchParams(window.location.search).get('status') || '');
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10;

    const getStatusColor = (status) => {
        switch (status) {
            case 'not_started': return 'bg-slate-100 text-slate-700 border border-slate-200';
            case 'in_progress': return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'completed': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
            case 'locked': return 'bg-amber-100 text-amber-800 border border-amber-200';
            default: return 'bg-slate-100 text-slate-700 border border-slate-200';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'not_started': return 'Not Started';
            case 'in_progress': return 'In Progress';
            case 'completed': return 'Completed';
            case 'locked': return 'Locked';
            default: return 'Not Started';
        }
    };

    const getEvalStatusIcon = (status) => {
        switch (status) {
            case 'in_progress': return '🔵';
            case 'completed': return '🟢';
            case 'locked': return '🟡';
            default: return '⚪';
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
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
    const totalPages = Math.ceil(totalEvents / itemsPerPage);
    const paginatedEvents = evList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Events</p>
                    <p className="text-[32px] font-bold text-slate-900 mt-1">{totalEvents}</p>
                </div>
                <div className="bg-white rounded-xl border border-blue-200 shadow-md p-6">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">In Progress</p>
                    <p className="text-[32px] font-bold text-blue-800 mt-1">{inProgressCount}</p>
                </div>
                <div className="bg-white rounded-xl border border-emerald-200 shadow-md p-6">
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Completed</p>
                    <p className="text-[32px] font-bold text-emerald-800 mt-1">{completedCount}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Not Started</p>
                    <p className="text-[32px] font-bold text-slate-900 mt-1">{notStartedCount}</p>
                </div>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 shadow-md p-4">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by event title..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="px-4 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="not_started">Not Started</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="locked">Locked</option>
                        </select>
                        <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>
                    </div>
                </form>
            </div>

            <div className="space-y-4">
                {paginatedEvents.length > 0 ? (
                    <>
                        {paginatedEvents.map((event) => (
                            <div key={event.id} className="bg-white rounded-xl border border-slate-200 shadow-md p-5">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-slate-900 mb-1">{event.title}</h3>
                                        <p className="text-sm text-slate-600">
                                            Type: {event.simulation_type || 'N/A'} | Scenario: {event.scenario_name || 'N/A'} | Date: {formatDate(event.event_date)}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">Venue: {event.venue || 'N/A'}</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(event.evaluation_status)}`}>
                                            {getEvalStatusIcon(event.evaluation_status)} {getStatusLabel(event.evaluation_status)}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                                            <Users className="w-4 h-4 text-slate-400" />
                                            {event.participant_count ?? 0} Participants
                                        </span>
                                        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
                                            Avg: {Number(event.average_score || 0).toFixed(1)}% | Pass: {Number(event.passing_rate || 0).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <a href={`/admin/simulation-events/${event.id}/evaluation`} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">
                                            <ClipboardCheck className="w-4 h-4" />
                                            Evaluate
                                        </a>
                                        <a href={`/admin/simulation-events/${event.id}/evaluation/summary`} className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium">
                                            <Eye className="w-4 h-4" />
                                            View Summary
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <SimplePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            itemsPerPage={itemsPerPage}
                            totalItems={totalEvents}
                        />
                    </>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-md p-12 text-center text-slate-500">
                        No events matching your search or filters.
                    </div>
                )}
            </div>
        </div>
    );
}
