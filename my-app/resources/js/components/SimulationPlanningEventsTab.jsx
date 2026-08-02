import React from 'react';
import {
    Eye,
    Layers,
    Pencil,
    Printer,
    Rocket,
    ShieldCheck,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { AdminStatCard, AdminPrimaryButton } from './admin/AdminLayout';
import {
    AdminCollapsibleFilterBar,
    AdminFilterSelect,
} from './admin/AdminCollapsibleFilterBar';
import {
    AdminDataTable,
    AdminTableActionButton,
} from './admin/AdminDataTable';
import { formatDate, formatTime } from './campaign/CampaignRequestUi';
import { deriveSimulationEventStatus } from '../utils/simulationEventStatus';
import { isExercisePlanEvent, simulationEventHref } from '../utils/simulationEventNavigation';
import { buildPrintTableDocument, printHtmlDocument } from '../utils/printHtml';

function eventStatusTone(status) {
    const map = {
        draft: 'bg-slate-50 text-slate-700 border-slate-200',
        published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        ongoing: 'bg-blue-50 text-blue-700 border-blue-200',
        ready: 'bg-sky-50 text-sky-700 border-sky-200',
        cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
        ended: 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return map[status] || 'bg-slate-50 text-slate-700 border-slate-200';
}

function getExercisePlanTitle(event) {
    return event.simulation_exercise_template?.title
        || event.exercise_plan_title
        || null;
}

function getCampaignLabel(event) {
    const campaign = event.campaign_request;
    if (!campaign) return null;

    const moduleTitle = campaign.training_module?.title
        || event.training_module?.title
        || null;

    return moduleTitle
        ? `#${campaign.id} — ${moduleTitle}`
        : `Campaign #${campaign.id}`;
}

function scheduleText(event) {
    const date = formatDate(event.event_date);
    const start = formatTime(event.start_time);
    const end = formatTime(event.end_time);
    const place = event.location || event.venue || '';
    return `${date} · ${start} – ${end}${place ? ` · ${place}` : ''}`;
}

export function SimulationPlanningEventsTab({
    events = [],
    onSwitchTab,
}) {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [filterStatus, setFilterStatus] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);
    const [isLoading, setIsLoading] = React.useState(true);
    const itemsPerPage = 10;

    const activeEvents = React.useMemo(
        () => (events || []).filter((event) => !['completed', 'ended', 'archived'].includes(event.status)),
        [events],
    );

    const summary = React.useMemo(() => ({
        total: activeEvents.length,
        draft: activeEvents.filter((event) => deriveSimulationEventStatus(event) === 'draft').length,
        published: activeEvents.filter((event) => {
            const status = deriveSimulationEventStatus(event);
            return status === 'published' || status === 'ongoing';
        }).length,
        fromExercisePlans: activeEvents.filter((event) => Boolean(
            event.simulation_exercise_template_id || getExercisePlanTitle(event),
        )).length,
        linkedCampaigns: activeEvents.filter((event) => Boolean(event.campaign_request_id)).length,
    }), [activeEvents]);

    const filteredEvents = React.useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return activeEvents.filter((event) => {
            const derivedStatus = deriveSimulationEventStatus(event);
            const exercisePlanTitle = getExercisePlanTitle(event) || '';
            const campaignLabel = getCampaignLabel(event) || '';

            const matchesSearch = !query
                || event.title?.toLowerCase().includes(query)
                || event.location?.toLowerCase().includes(query)
                || exercisePlanTitle.toLowerCase().includes(query)
                || campaignLabel.toLowerCase().includes(query);

            const matchesStatus = !filterStatus || derivedStatus === filterStatus;

            return matchesSearch && matchesStatus;
        });
    }, [activeEvents, filterStatus, searchQuery]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterStatus]);

    React.useEffect(() => {
        setIsLoading(true);
        const timer = window.setTimeout(() => setIsLoading(false), 220);
        return () => window.clearTimeout(timer);
    }, [searchQuery, filterStatus, activeEvents]);

    const totalPages = Math.max(1, Math.ceil(filteredEvents.length / itemsPerPage));
    const paginatedEvents = filteredEvents.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    const handleSwitch = (tabId) => {
        if (typeof onSwitchTab === 'function') {
            onSwitchTab(tabId);
        }
    };

    const handlePrint = React.useCallback(() => {
        const html = buildPrintTableDocument({
            title: 'Simulation Events',
            subtitle: `Printed ${new Date().toLocaleString()} · ${filteredEvents.length} event(s)${filterStatus ? ` · Status: ${filterStatus}` : ''}${searchQuery.trim() ? ` · Search: ${searchQuery.trim()}` : ''}`,
            headers: ['#', 'Event', 'Type', 'Schedule / Location', 'Status', 'Exercise Plan', 'Campaign'],
            rows: filteredEvents.map((event, index) => [
                index + 1,
                event.title || '—',
                `${event.disaster_type || '—'}${event.event_category ? ` · ${event.event_category}` : ''}`,
                scheduleText(event),
                deriveSimulationEventStatus(event),
                getExercisePlanTitle(event) || '—',
                getCampaignLabel(event) || '—',
            ]),
            emptyMessage: 'No simulation events match the current filters.',
        });

        if (!printHtmlDocument(html, 'Simulation Events')) {
            Swal.fire('Unable to print', 'Could not prepare the print view. Please try again.', 'warning');
        }
    }, [filteredEvents, filterStatus, searchQuery]);

    const columns = [
        {
            key: 'title',
            label: 'Event',
            className: 'align-top whitespace-normal min-w-[200px]',
            render: (row) => (
                <div>
                    <a
                        href={simulationEventHref(row)}
                        className="font-medium text-slate-900 hover:text-emerald-700"
                    >
                        {row.title}
                    </a>
                    <p className="mt-1 text-xs text-slate-500">
                        {(row.disaster_type || '—')}
                        {row.event_category ? ` · ${row.event_category}` : ''}
                    </p>
                </div>
            ),
        },
        {
            key: 'schedule',
            label: 'Schedule / Location',
            className: 'align-top whitespace-normal min-w-[180px]',
            render: (row) => (
                <span className="text-sm text-slate-600">{scheduleText(row)}</span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => {
                const status = deriveSimulationEventStatus(row);
                return (
                    <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${eventStatusTone(status)}`}>
                        {status}
                    </span>
                );
            },
        },
        {
            key: 'exercise_plan',
            label: 'Exercise Plan',
            className: 'align-top whitespace-normal min-w-[160px]',
            render: (row) => {
                const title = getExercisePlanTitle(row);
                if (!title) return <span className="text-slate-400">—</span>;
                return (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                        <Layers className="w-3.5 h-3.5 shrink-0" />
                        <span className="line-clamp-2">{title}</span>
                    </span>
                );
            },
        },
        {
            key: 'campaign',
            label: 'Campaign',
            className: 'align-top whitespace-normal min-w-[160px]',
            render: (row) => {
                const label = getCampaignLabel(row);
                if (!label) return <span className="text-slate-400">—</span>;
                return (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                        <Rocket className="w-3.5 h-3.5 shrink-0" />
                        <span className="line-clamp-2">{label}</span>
                    </span>
                );
            },
        },
    ];

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <AdminStatCard label="Active Events" value={summary.total} accent="slate" />
                <AdminStatCard label="Draft" value={summary.draft} accent="amber" />
                <AdminStatCard label="Published / Ongoing" value={summary.published} accent="emerald" />
                <AdminStatCard
                    label="From Exercise Plans"
                    value={summary.fromExercisePlans}
                    hint={`${summary.linkedCampaigns} linked to campaigns`}
                    accent="blue"
                />
            </div>

            <AdminCollapsibleFilterBar
                searchValue={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search events, exercise plans, or campaigns..."
                hasActiveFilters={Boolean(filterStatus)}
                onClearFilters={() => setFilterStatus('')}
                trailing={(
                    <AdminPrimaryButton type="button" onClick={handlePrint}>
                        <Printer className="w-4 h-4" />
                        Print
                    </AdminPrimaryButton>
                )}
            >
                <AdminFilterSelect label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="cancelled">Cancelled</option>
                </AdminFilterSelect>
            </AdminCollapsibleFilterBar>

            {activeEvents.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center">
                    <div className="text-5xl mb-4 opacity-80">📅</div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">No simulation events yet</h3>
                    <p className="text-slate-500 text-sm mb-6 max-w-2xl mx-auto">
                        Simulation events are created when you reuse a published exercise plan for a ready approved campaign.
                        Publish an exercise plan first, then use <strong>Use Template</strong> from Approved Campaigns.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => handleSwitch('templates')}
                            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                        >
                            <Layers className="w-4 h-4" />
                            Go to Exercise Plans
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSwitch('schedules')}
                            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                        >
                            <ShieldCheck className="w-4 h-4" />
                            Go to Approved Campaigns
                        </button>
                    </div>
                </div>
            ) : (
                <AdminDataTable
                    columns={columns}
                    data={paginatedEvents}
                    isLoading={isLoading}
                    skeletonRows={10}
                    emptyTitle="No events match your filters"
                    emptyDescription="Try adjusting your search or filter criteria."
                    minWidth="1000px"
                    onRowClick={(row) => {
                        window.location.href = simulationEventHref(row);
                    }}
                    pagination={filteredEvents.length > 0 ? {
                        current_page: currentPage,
                        last_page: totalPages,
                        per_page: itemsPerPage,
                        total: filteredEvents.length,
                        from: filteredEvents.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1,
                        to: Math.min(currentPage * itemsPerPage, filteredEvents.length),
                    } : null}
                    onPageChange={setCurrentPage}
                    renderActions={(row) => {
                        const derivedStatus = deriveSimulationEventStatus(row);
                        const fromExercisePlan = isExercisePlanEvent(row);
                        const openLabel = fromExercisePlan
                            ? (derivedStatus === 'draft' ? 'Open Readiness' : 'Open Monitoring')
                            : (row.status === 'draft' ? 'Continue Setup' : 'View Event');

                        return (
                            <>
                                <AdminTableActionButton
                                    href={simulationEventHref(row)}
                                    icon={Eye}
                                    title={openLabel}
                                    variant="view"
                                />
                                {row.status === 'draft' && !fromExercisePlan ? (
                                    <AdminTableActionButton
                                        href={`/admin/simulation-events/${row.id}/edit`}
                                        icon={Pencil}
                                        title="Edit"
                                        variant="edit"
                                    />
                                ) : null}
                            </>
                        );
                    }}
                />
            )}
        </div>
    );
}
