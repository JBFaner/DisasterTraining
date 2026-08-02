import React from 'react';
import {
    CalendarClock,
    History,
    Download,
    Eye,
    Layers,
    Printer,
    ShieldCheck,
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminPrimaryButton,
    AdminSecondaryButton,
} from './admin/AdminLayout';
import {
    AdminCollapsibleFilterBar,
    AdminFilterSelect,
    AdminFilterInput,
} from './admin/AdminCollapsibleFilterBar';
import {
    AdminDataTable,
    AdminTableActionButton,
} from './admin/AdminDataTable';
import { deriveSimulationEventStatus } from '../utils/simulationEventStatus';
import { ApprovedCampaignSchedulesTable } from './ApprovedCampaignSchedulesTable';
import { SimulationExerciseTemplateModule } from './SimulationExerciseTemplateModule';
import { SimulationPlanningEventsTab } from './SimulationPlanningEventsTab';
import { buildPrintTableDocument, printHtmlDocument } from '../utils/printHtml';

function formatDate(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function getInitialTab() {
    if (typeof window === 'undefined') return 'schedules';
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'history') return 'history';
    if (tab === 'events') return 'events';
    if (tab === 'templates') return 'templates';
    if (tab === 'schedules') return 'schedules';
    return 'schedules';
}

const PLANNING_TABS = [
    { id: 'schedules', label: 'Approved Campaigns', icon: ShieldCheck },
    { id: 'templates', label: 'Exercise Plans', icon: Layers },
    { id: 'events', label: 'Simulation Events', icon: CalendarClock },
    { id: 'history', label: 'Completed Event History', icon: History },
];

function CompletedEventHistoryTab({ events = [] }) {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [filterModule, setFilterModule] = React.useState('');
    const [filterDateFrom, setFilterDateFrom] = React.useState('');
    const [filterDateTo, setFilterDateTo] = React.useState('');
    const [filterStatus, setFilterStatus] = React.useState('');
    const [filterTrainer, setFilterTrainer] = React.useState('');
    const [filterParticipant, setFilterParticipant] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);
    const [isLoading, setIsLoading] = React.useState(true);
    const itemsPerPage = 10;

    const completedEvents = React.useMemo(
        () => (events || []).filter((event) => ['completed', 'ended', 'archived'].includes(event.status)),
        [events]
    );

    const trainingModules = React.useMemo(() => {
        const titles = completedEvents
            .map((event) => event.scenario?.training_module?.title)
            .filter(Boolean);
        return [...new Set(titles)].sort();
    }, [completedEvents]);

    const trainers = React.useMemo(() => {
        const names = completedEvents
            .map((event) => event.assigned_trainer?.name)
            .filter(Boolean);
        return [...new Set(names)].sort();
    }, [completedEvents]);

    const participants = React.useMemo(() => {
        const names = completedEvents.flatMap((event) => event.participant_names || []);
        return [...new Set(names)].sort();
    }, [completedEvents]);

    const filteredEvents = completedEvents.filter((event) => {
        const moduleTitle = event.scenario?.training_module?.title || '';
        const trainerName = event.assigned_trainer?.name || '';
        const participantNames = (event.participant_names || []).join(' ').toLowerCase();
        const completionDate = event.completed_at || event.event_date;
        const completionDay = completionDate ? new Date(completionDate).toISOString().slice(0, 10) : '';
        const displayStatus = event.monitoring_status || deriveSimulationEventStatus(event);

        const matchesSearch =
            !searchQuery ||
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            moduleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
            trainerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            participantNames.includes(searchQuery.toLowerCase());

        const matchesModule = !filterModule || moduleTitle === filterModule;
        const matchesDateFrom = !filterDateFrom || (completionDay && completionDay >= filterDateFrom);
        const matchesDateTo = !filterDateTo || (completionDay && completionDay <= filterDateTo);
        const matchesStatus =
            !filterStatus ||
            displayStatus === filterStatus ||
            event.status === filterStatus;
        const matchesTrainer = !filterTrainer || trainerName === filterTrainer;
        const matchesParticipant =
            !filterParticipant ||
            (event.participant_names || []).includes(filterParticipant);

        return (
            matchesSearch &&
            matchesModule &&
            matchesDateFrom &&
            matchesDateTo &&
            matchesStatus &&
            matchesTrainer &&
            matchesParticipant
        );
    });

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterModule, filterDateFrom, filterDateTo, filterStatus, filterTrainer, filterParticipant]);

    React.useEffect(() => {
        setIsLoading(true);
        const timer = window.setTimeout(() => setIsLoading(false), 220);
        return () => window.clearTimeout(timer);
    }, [searchQuery, filterModule, filterDateFrom, filterDateTo, filterStatus, filterTrainer, filterParticipant, completedEvents]);

    const totalPages = Math.max(1, Math.ceil(filteredEvents.length / itemsPerPage));
    const paginatedEvents = filteredEvents.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const hasActiveFilters = Boolean(
        filterModule || filterDateFrom || filterDateTo || filterStatus || filterTrainer || filterParticipant
    );

    const handlePrint = React.useCallback(() => {
        const html = buildPrintTableDocument({
            title: 'Completed Event History',
            subtitle: `Printed ${new Date().toLocaleString()} · ${filteredEvents.length} event(s)${filterModule ? ` · Module: ${filterModule}` : ''}${filterStatus ? ` · Status: ${filterStatus}` : ''}${searchQuery.trim() ? ` · Search: ${searchQuery.trim()}` : ''}`,
            headers: ['#', 'Simulation Title', 'Training Module', 'Trainer', 'Participants', 'Completion Date', 'Evaluation'],
            rows: filteredEvents.map((event, index) => {
                const evaluation = event.evaluation_summary || {};
                const evaluationText = evaluation.success_level
                    || [evaluation.overall_remarks].filter(Boolean).join(' — ')
                    || 'No evaluation';
                const attendance = event.attendance_summary || {};
                const participantText = attendance.registered
                    ? `${event.approved_registrations_count ?? 0} (${attendance.checked_in ?? 0} checked in)`
                    : String(event.approved_registrations_count ?? 0);

                return [
                    index + 1,
                    event.title || '—',
                    event.scenario?.training_module?.title || '—',
                    event.assigned_trainer?.name || '—',
                    participantText,
                    formatDate(event.completed_at || event.event_date),
                    evaluationText,
                ];
            }),
            emptyMessage: 'No completed events match the current filters.',
        });

        if (!printHtmlDocument(html, 'Completed Event History')) {
            Swal.fire('Unable to print', 'Could not prepare the print view. Please try again.', 'warning');
        }
    }, [filteredEvents, filterModule, filterStatus, searchQuery]);

    const columns = [
        {
            key: 'title',
            label: 'Simulation Title',
            render: (row) => (
                <a
                    href={`/admin/simulation-events/${row.id}?tab=evaluation`}
                    className="font-medium text-slate-900 line-clamp-2 max-w-[220px] hover:text-emerald-700"
                    title={row.title || ''}
                >
                    {row.title || '—'}
                </a>
            ),
        },
        {
            key: 'module',
            label: 'Module',
            render: (row) => (
                <span className="text-slate-700 truncate max-w-[140px] block" title={row.scenario?.training_module?.title || ''}>
                    {row.scenario?.training_module?.title || '—'}
                </span>
            ),
        },
        {
            key: 'trainer',
            label: 'Trainer',
            render: (row) => (
                <span className="text-slate-700 truncate max-w-[120px] block" title={row.assigned_trainer?.name || ''}>
                    {row.assigned_trainer?.name || '—'}
                </span>
            ),
        },
        {
            key: 'participants',
            label: 'Participants',
            align: 'right',
            render: (row) => {
                const attendance = row.attendance_summary || {};
                const total = row.approved_registrations_count ?? 0;
                if (!attendance.registered) {
                    return <span className="font-medium text-slate-900">{total}</span>;
                }
                return (
                    <span className="text-slate-800" title={`${attendance.checked_in ?? 0}/${attendance.registered} checked in`}>
                        <span className="font-medium">{total}</span>
                        <span className="block text-[11px] text-slate-500">{attendance.checked_in ?? 0} in</span>
                    </span>
                );
            },
        },
        {
            key: 'completion_date',
            label: 'Completed',
            render: (row) => formatDate(row.completed_at || row.event_date),
        },
        {
            key: 'evaluation',
            label: 'Evaluation',
            render: (row) => {
                const evaluation = row.evaluation_summary || {};
                const level = evaluation.success_level || '';
                const remarks = evaluation.overall_remarks || '';
                const summary = [level, remarks].filter(Boolean).join(' — ') || 'No evaluation';
                return (
                    <span className="text-slate-600 truncate block max-w-[160px]" title={summary}>
                        {level || '—'}
                    </span>
                );
            },
        },
    ];

    return (
        <div className="space-y-4">
            <AdminCollapsibleFilterBar
                searchValue={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search completed simulations..."
                hasActiveFilters={hasActiveFilters}
                onClearFilters={() => {
                    setFilterModule('');
                    setFilterDateFrom('');
                    setFilterDateTo('');
                    setFilterStatus('');
                    setFilterTrainer('');
                    setFilterParticipant('');
                }}
                trailing={(
                    <AdminPrimaryButton type="button" onClick={handlePrint}>
                        <Printer className="w-4 h-4" />
                        Print
                    </AdminPrimaryButton>
                )}
            >
                <AdminFilterSelect label="Training Module" value={filterModule} onChange={(e) => setFilterModule(e.target.value)}>
                    <option value="">All Modules</option>
                    {trainingModules.map((title) => (
                        <option key={title} value={title}>{title}</option>
                    ))}
                </AdminFilterSelect>
                <AdminFilterInput
                    label="Date From"
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                />
                <AdminFilterInput
                    label="Date To"
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                />
                <AdminFilterSelect label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="Completed">Completed</option>
                    <option value="ended">Ended</option>
                    <option value="archived">Archived</option>
                </AdminFilterSelect>
                <AdminFilterSelect label="Trainer" value={filterTrainer} onChange={(e) => setFilterTrainer(e.target.value)}>
                    <option value="">All Trainers</option>
                    {trainers.map((name) => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </AdminFilterSelect>
                <AdminFilterSelect label="Participant" value={filterParticipant} onChange={(e) => setFilterParticipant(e.target.value)}>
                    <option value="">All Participants</option>
                    {participants.map((name) => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </AdminFilterSelect>
            </AdminCollapsibleFilterBar>

            <AdminDataTable
                columns={columns}
                data={paginatedEvents}
                isLoading={isLoading}
                skeletonRows={10}
                emptyTitle={completedEvents.length === 0 ? 'No completed simulations yet' : 'No records match your filters'}
                emptyDescription={
                    completedEvents.length === 0
                        ? 'Completed simulations will appear here after events are finished.'
                        : 'Try adjusting your search or filter criteria.'
                }
                pagination={filteredEvents.length > 0 ? {
                    current_page: currentPage,
                    last_page: totalPages,
                    per_page: itemsPerPage,
                    total: filteredEvents.length,
                    from: (currentPage - 1) * itemsPerPage + 1,
                    to: Math.min(currentPage * itemsPerPage, filteredEvents.length),
                } : null}
                onPageChange={setCurrentPage}
                renderActions={(row) => (
                    <AdminTableActionButton
                        href={`/admin/simulation-events/${row.id}?tab=evaluation`}
                        icon={Eye}
                        title="View Details"
                        variant="view"
                    />
                )}
                minWidth="860px"
            />
        </div>
    );
}

export function SimulationEventPlanningModule({
    events,
    approvedSchedules = [],
    exerciseTemplates = [],
    exerciseTemplateSummary = {},
}) {
    const [activeTab, setActiveTab] = React.useState(getInitialTab);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        const url = new URL(window.location.href);
        if (tabId === 'schedules') {
            url.searchParams.delete('tab');
        } else {
            url.searchParams.set('tab', tabId);
        }
        window.history.replaceState({}, '', url);
    };

    return (
        <AdminPageShell>
            <AdminPageHeader
                icon={CalendarClock}
                title="Simulation Event Planning"
                description={
                    activeTab === 'schedules'
                        ? 'Review approved campaigns and prepare simulation events based on training readiness.'
                        : activeTab === 'templates'
                        ? 'Create and reuse standardized disaster training exercise plans for drills and full-scale simulations.'
                        : activeTab === 'events'
                        ? 'Monitor simulation events created from published exercise plans and approved campaigns.'
                        : 'Browse completed simulations with evaluation and attendance summaries.'
                }
                actions={
                    activeTab === 'templates' ? (
                        <AdminPrimaryButton href="/admin/simulation-exercise-templates/create">
                            New Exercise Plan
                        </AdminPrimaryButton>
                    ) : activeTab === 'history' ? (
                        <AdminSecondaryButton disabled title="Export coming soon">
                            <Download className="w-4 h-4" />
                            Export
                        </AdminSecondaryButton>
                    ) : null
                }
            />

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2.5 w-full overflow-x-auto">
                <div className="flex gap-1 flex-wrap min-w-max">
                    {PLANNING_TABS.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => handleTabChange(tab.id)}
                                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-250 flex items-center gap-2 whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {activeTab === 'schedules' && (
                <ApprovedCampaignSchedulesTable schedules={approvedSchedules} />
            )}
            {activeTab === 'templates' && (
                <SimulationExerciseTemplateModule
                    templates={exerciseTemplates}
                    summary={exerciseTemplateSummary}
                    approvedSchedules={approvedSchedules}
                    embedded
                />
            )}
            {activeTab === 'events' && (
                <SimulationPlanningEventsTab
                    events={events}
                    onSwitchTab={handleTabChange}
                />
            )}
            {activeTab === 'history' && <CompletedEventHistoryTab events={events} />}
        </AdminPageShell>
    );
}
