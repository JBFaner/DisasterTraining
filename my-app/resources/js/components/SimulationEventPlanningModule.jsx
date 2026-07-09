import React from 'react';
import {
    CalendarClock,
    History,
    Download,
    Eye,
    ShieldCheck,
} from 'lucide-react';
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

function formatDate(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function monitoringStatusTone(status) {
    const map = {
        Scheduled: 'bg-sky-50 text-sky-700 border-sky-200',
        Ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        Ongoing: 'bg-blue-50 text-blue-700 border-blue-200',
        Completed: 'bg-slate-50 text-slate-700 border-slate-200',
        Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
        completed: 'bg-slate-50 text-slate-700 border-slate-200',
        ended: 'bg-rose-50 text-rose-700 border-rose-200',
        archived: 'bg-amber-50 text-amber-800 border-amber-200',
    };
    return map[status] || 'bg-slate-50 text-slate-700 border-slate-200';
}

function getInitialTab() {
    if (typeof window === 'undefined') return 'schedules';
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'history') return 'history';
    if (tab === 'events') return 'events';
    return 'schedules';
}

const PLANNING_TABS = [
    { id: 'schedules', label: 'Approved Campaign Schedules', icon: ShieldCheck },
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

    const totalPages = Math.max(1, Math.ceil(filteredEvents.length / itemsPerPage));
    const paginatedEvents = filteredEvents.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const hasActiveFilters = Boolean(
        filterModule || filterDateFrom || filterDateTo || filterStatus || filterTrainer || filterParticipant
    );

    const columns = [
        {
            key: 'title',
            label: 'Simulation Title',
            render: (row) => <span className="font-medium text-slate-900">{row.title}</span>,
        },
        {
            key: 'module',
            label: 'Training Module',
            render: (row) => row.scenario?.training_module?.title || '—',
        },
        {
            key: 'trainer',
            label: 'Trainer',
            render: (row) => row.assigned_trainer?.name || '—',
        },
        {
            key: 'participants',
            label: 'Participants',
            render: (row) => row.approved_registrations_count ?? 0,
        },
        {
            key: 'completion_date',
            label: 'Completion Date',
            render: (row) => formatDate(row.completed_at || row.event_date),
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => {
                const status = row.monitoring_status || deriveSimulationEventStatus(row);
                return (
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${monitoringStatusTone(status)}`}>
                        {status}
                    </span>
                );
            },
        },
        {
            key: 'evaluation',
            label: 'Evaluation Summary',
            className: 'max-w-xs',
            render: (row) => {
                const evaluation = row.evaluation_summary || {};
                const summaryParts = [evaluation.success_level, evaluation.overall_remarks].filter(Boolean);
                const summary = summaryParts.length > 0 ? summaryParts.join(' — ') : 'No evaluation recorded';
                return <span className="text-slate-600 truncate block max-w-xs" title={summary}>{summary}</span>;
            },
        },
        {
            key: 'attendance',
            label: 'Attendance Summary',
            render: (row) => {
                const attendance = row.attendance_summary || {};
                if (!attendance.registered) return '—';
                return `${attendance.checked_in ?? 0}/${attendance.registered} checked in (${attendance.completion_rate ?? 0}%)`;
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
                emptyTitle={completedEvents.length === 0 ? 'No completed simulations yet' : 'No records match your filters'}
                emptyDescription={
                    completedEvents.length === 0
                        ? 'Completed simulations will appear here after events are finished.'
                        : 'Try adjusting your search or filter criteria.'
                }
                pagination={
                    filteredEvents.length > itemsPerPage
                        ? {
                            current_page: currentPage,
                            last_page: totalPages,
                            per_page: itemsPerPage,
                            total: filteredEvents.length,
                            from: (currentPage - 1) * itemsPerPage + 1,
                            to: Math.min(currentPage * itemsPerPage, filteredEvents.length),
                        }
                        : null
                }
                onPageChange={setCurrentPage}
                renderActions={(row) => (
                    <AdminTableActionButton
                        href={`/admin/simulation-events/${row.id}?tab=evaluation`}
                        icon={Eye}
                        title="View Details"
                        variant="view"
                    />
                )}
                minWidth="1100px"
            />
        </div>
    );
}

export function SimulationEventPlanningModule({ events, approvedSchedules = [], role, SimulationEventsTable }) {
    const [activeTab, setActiveTab] = React.useState(getInitialTab);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        const url = new URL(window.location.href);
        if (tabId === 'events') {
            url.searchParams.set('tab', 'events');
        } else if (tabId === 'history') {
            url.searchParams.set('tab', 'history');
        } else {
            url.searchParams.delete('tab');
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
                        ? 'Review approved campaign schedules and prepare simulation events based on training readiness.'
                        : activeTab === 'events'
                        ? 'Monitor draft, published, and ongoing simulation events generated from approved schedules.'
                        : 'Browse completed simulations with evaluation and attendance summaries.'
                }
                actions={
                    activeTab === 'history' ? (
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
            {activeTab === 'events' && SimulationEventsTable && (
                <SimulationEventsTable events={events} role={role} embedded activeOnly />
            )}
            {activeTab === 'history' && <CompletedEventHistoryTab events={events} />}
        </AdminPageShell>
    );
}
