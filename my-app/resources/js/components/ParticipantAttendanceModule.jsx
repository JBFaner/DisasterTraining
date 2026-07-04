import React from 'react';
import {
    Users,
    GraduationCap,
    Eye,
    Pencil,
    Lock,
    Unlock,
    Filter,
    Download,
    RefreshCw,
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminFilterBar,
    AdminPrimaryButton,
    AdminSecondaryButton,
    AdminSearchInput,
    adminSelectClass,
} from './admin/AdminLayout';
import {
    AdminDataTable,
    AdminStatusBadge,
    AdminTableActionButton,
} from './admin/AdminDataTable';

function formatDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
}

function formatDateTime(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function getInitialTab() {
    if (typeof window === 'undefined') return 'participants';
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    return ['participants', 'trainers', 'registrations', 'attendance'].includes(tab) ? tab : 'participants';
}

export function ParticipantRegistrationAttendanceModule({
    events = [],
    participants = [],
    participantsPagination = null,
    participantsSummary = null,
    qualifiedTrainers = [],
    qualifiedTrainersPagination = null,
    qualifiedTrainersSummary = null,
    RegistrationEventsTable,
    AttendanceEventsTable,
}) {
    const [activeTab, setActiveTab] = React.useState(getInitialTab);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        const url = new URL(window.location.href);
        if (tabId === 'participants') {
            url.searchParams.delete('tab');
        } else {
            url.searchParams.set('tab', tabId);
        }
        window.history.replaceState({}, '', url);
    };

    const PARTICIPANT_TABS = [
        { id: 'participants', label: 'Participant List', icon: Users },
        { id: 'trainers', label: 'Trainer List', icon: GraduationCap },
        { id: 'registrations', label: 'Event Registrations', icon: '📋' },
        { id: 'attendance', label: 'Event Attendance', icon: '✓' },
    ];

    let totalParticipants = participantsSummary?.total ?? participants.length;
    let activeParticipants = participantsSummary?.active ?? participants.filter((p) => p.status === 'active').length;
    let inactiveParticipants = participantsSummary?.inactive ?? participants.filter((p) => p.status === 'inactive').length;
    let registeredThisMonth = participantsSummary?.registered_this_month ?? 0;

    let totalTrainers = qualifiedTrainersSummary?.total ?? qualifiedTrainers.length;
    let activeTrainers = qualifiedTrainersSummary?.active ?? qualifiedTrainers.filter((t) => t.status === 'active').length;
    let inactiveTrainers = qualifiedTrainersSummary?.inactive ?? qualifiedTrainers.filter((t) => t.status === 'inactive').length;
    let syncedThisMonth = qualifiedTrainersSummary?.synced_this_month ?? 0;

    return (
        <AdminPageShell>
            <AdminPageHeader
                icon={Users}
                title="Participant Registration & Attendance"
                description="Manage participants, qualified trainers, event registrations, and attendance."
            />

            {activeTab === 'participants' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard label="Total Participants" value={totalParticipants} hint="All registered" />
                    <StatCard label="Active" value={activeParticipants} hint="Currently active" accent="emerald" />
                    <StatCard label="Inactive" value={inactiveParticipants} hint="Deactivated" />
                    <StatCard label="Registered This Month" value={registeredThisMonth} hint="New this month" />
                </div>
            )}

            {activeTab === 'trainers' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard label="Total Trainers" value={totalTrainers} hint="Community Engagement System" />
                    <StatCard label="Active" value={activeTrainers} hint="Available for assignment" accent="emerald" />
                    <StatCard label="Inactive" value={inactiveTrainers} hint="Unavailable in directory" />
                    <StatCard label="Synced This Month" value={syncedThisMonth} hint="Last directory sync" />
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2.5 w-fit">
                <div className="flex gap-1 flex-wrap">
                    {PARTICIPANT_TABS.map((tab) => {
                        const Icon = typeof tab.icon === 'string' ? null : tab.icon;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => handleTabChange(tab.id)}
                                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-250 flex items-center gap-2 ${
                                    activeTab === tab.id
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                {Icon ? <Icon className="w-4 h-4" /> : <span>{tab.icon}</span>}
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {activeTab === 'participants' && (
                <ParticipantsListTab
                    participants={participants}
                    participantsPagination={participantsPagination}
                />
            )}
            {activeTab === 'trainers' && (
                <TrainersListTab
                    trainers={qualifiedTrainers}
                    trainersPagination={qualifiedTrainersPagination}
                />
            )}
            {activeTab === 'registrations' && RegistrationEventsTable && <RegistrationEventsTable events={events} />}
            {activeTab === 'attendance' && AttendanceEventsTable && <AttendanceEventsTable events={events} />}
        </AdminPageShell>
    );
}

function StatCard({ label, value, hint, accent = 'slate' }) {
    const border = accent === 'emerald' ? 'border-emerald-200' : 'border-slate-200';
    const labelColor = accent === 'emerald' ? 'text-emerald-600' : 'text-slate-500';
    const valueColor = accent === 'emerald' ? 'text-emerald-800' : 'text-slate-900';

    return (
        <div className={`bg-white rounded-xl border ${border} shadow-sm p-5`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${labelColor}`}>{label}</p>
            <p className={`text-3xl font-bold mt-1 ${valueColor}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-1">{hint}</p>
        </div>
    );
}

function ParticipantsListTab({ participants = [], participantsPagination = null }) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [sortKey, setSortKey] = React.useState('created_at');
    const [sortDir, setSortDir] = React.useState('desc');
    const [participantsData, setParticipantsData] = React.useState(participants || []);
    const [pagination, setPagination] = React.useState(participantsPagination);
    const [isLoading, setIsLoading] = React.useState(false);
    const [actionLoadingId, setActionLoadingId] = React.useState(null);

    const fetchParticipants = React.useCallback(async (page = 1) => {
        setIsLoading(true);
        try {
            const url = new URL('/admin/participants', window.location.origin);
            url.searchParams.set('page', page);
            if (searchTerm.trim()) url.searchParams.set('search', searchTerm.trim());
            if (statusFilter !== 'all') url.searchParams.set('status_filter', statusFilter);
            url.searchParams.set('sort_by', sortKey);
            url.searchParams.set('sort_dir', sortDir);

            const res = await fetch(url.toString(), {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error('Failed to load participants');
            const data = await res.json();
            setParticipantsData(data.participants || []);
            setPagination(data.pagination || null);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, statusFilter, sortKey, sortDir]);

    React.useEffect(() => {
        const timer = setTimeout(() => fetchParticipants(1), 300);
        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, sortKey, sortDir, fetchParticipants]);

    const handleSort = (key, dir) => {
        setSortKey(key);
        setSortDir(dir);
    };

    const handleToggleStatus = async (participant) => {
        const isActive = participant.status === 'active';
        const action = isActive ? 'deactivate' : 'reactivate';
        const result = await Swal.fire({
            title: isActive ? 'Deactivate Participant?' : 'Reactivate Participant?',
            text: isActive
                ? 'This will prevent them from accessing the system.'
                : 'This will restore their access to the system.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: isActive ? 'Yes, deactivate' : 'Yes, reactivate',
            cancelButtonText: 'Cancel',
            confirmButtonColor: isActive ? '#dc2626' : '#16a34a',
        });
        if (!result.isConfirmed) return;

        setActionLoadingId(participant.id);
        try {
            const formData = new FormData();
            formData.append('_token', csrf);
            const res = await fetch(`/admin/participants/${participant.id}/${action}`, {
                method: 'POST',
                headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrf },
                body: formData,
            });
            if (res.ok) {
                await fetchParticipants(pagination?.current_page || 1);
            }
        } finally {
            setActionLoadingId(null);
        }
    };

    const columns = [
        {
            key: 'participant_id',
            label: 'Participant ID',
            sortable: true,
            render: (row) => (
                <span className="text-xs font-mono text-slate-600">{row.participant_id || '—'}</span>
            ),
        },
        {
            key: 'name',
            label: 'Full Name',
            sortable: true,
            render: (row) => <span className="text-sm font-medium text-slate-900">{row.name}</span>,
        },
        {
            key: 'email',
            label: 'Email',
            sortable: true,
            render: (row) => <span className="text-sm text-slate-700">{row.email || '—'}</span>,
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (row) => <AdminStatusBadge status={row.status} />,
        },
        {
            key: 'event_registrations_count',
            label: 'Events',
            sortable: false,
            render: (row) => (
                <span className="inline-flex items-center rounded-lg bg-blue-50 text-blue-700 px-2.5 py-0.5 text-xs font-medium">
                    {row.event_registrations_count ?? 0}
                </span>
            ),
        },
        {
            key: 'created_at',
            label: 'Registered',
            sortable: true,
            render: (row) => <span className="text-sm text-slate-600">{formatDate(row.created_at)}</span>,
        },
    ];

    return (
        <div className="space-y-4">
            <AdminFilterBar>
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <AdminSearchInput
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name, email, or ID..."
                    />
                    <div className="flex items-center gap-2 shrink-0">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className={adminSelectClass}
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <AdminSecondaryButton href="/admin/participants/export/csv">
                            <Download className="w-4 h-4" />
                            Export
                        </AdminSecondaryButton>
                    </div>
                </div>
            </AdminFilterBar>

            <AdminDataTable
                columns={columns}
                data={participantsData}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                isLoading={isLoading}
                pagination={pagination}
                onPageChange={(page) => fetchParticipants(page)}
                emptyTitle="No participants found"
                emptyDescription="Participants will appear here after self-registration."
                renderActions={(row) => (
                    <>
                        <AdminTableActionButton
                            href={`/admin/participants/${row.id}`}
                            icon={Eye}
                            title="View"
                            variant="view"
                        />
                        <AdminTableActionButton
                            href={`/admin/participants/${row.id}`}
                            icon={Pencil}
                            title="Edit"
                            variant="edit"
                        />
                        <AdminTableActionButton
                            onClick={() => handleToggleStatus(row)}
                            icon={row.status === 'active' ? Lock : Unlock}
                            title={row.status === 'active' ? 'Deactivate' : 'Reactivate'}
                            variant={row.status === 'active' ? 'warning' : 'edit'}
                            disabled={actionLoadingId === row.id}
                        />
                    </>
                )}
            />
        </div>
    );
}

function TrainersListTab({ trainers = [], trainersPagination = null }) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [sortKey, setSortKey] = React.useState('name');
    const [sortDir, setSortDir] = React.useState('asc');
    const [trainersData, setTrainersData] = React.useState(trainers || []);
    const [pagination, setPagination] = React.useState(trainersPagination);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSyncing, setIsSyncing] = React.useState(false);
    const [refreshingId, setRefreshingId] = React.useState(null);

    const fetchTrainers = React.useCallback(async (page = 1) => {
        setIsLoading(true);
        try {
            const url = new URL('/admin/api/qualified-trainers', window.location.origin);
            url.searchParams.set('page', page);
            if (searchTerm.trim()) url.searchParams.set('search', searchTerm.trim());
            if (statusFilter !== 'all') url.searchParams.set('status_filter', statusFilter);
            url.searchParams.set('sort_by', sortKey);
            url.searchParams.set('sort_dir', sortDir);

            const res = await fetch(url.toString(), {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error('Failed to load trainers');
            const data = await res.json();
            setTrainersData(data.trainers || []);
            setPagination(data.pagination || null);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, statusFilter, sortKey, sortDir]);

    React.useEffect(() => {
        const timer = setTimeout(() => fetchTrainers(1), 300);
        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, sortKey, sortDir, fetchTrainers]);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch('/admin/qualified-trainers/sync', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
            });
            const data = await res.json();
            if (data.success) {
                Swal.fire('Directory synced', data.message, 'success');
                await fetchTrainers(1);
            } else {
                Swal.fire(
                    'Sync unavailable',
                    data.message || 'The Community Engagement System API is not yet configured.',
                    'info',
                );
            }
        } catch (error) {
            Swal.fire('Error', 'Failed to sync the trainer directory.', 'error');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleRefreshTrainer = async (trainer) => {
        setRefreshingId(trainer.id);
        try {
            const res = await fetch(`/admin/qualified-trainers/${trainer.id}`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error('Failed to refresh trainer');
            const data = await res.json();
            if (data.trainer) {
                setTrainersData((prev) =>
                    prev.map((row) => (row.id === trainer.id ? { ...row, ...data.trainer } : row)),
                );
            }
        } catch (error) {
            Swal.fire('Error', 'Failed to refresh trainer record.', 'error');
        } finally {
            setRefreshingId(null);
        }
    };

    const columns = [
        {
            key: 'group6_external_id',
            label: 'Directory ID',
            sortable: false,
            render: (row) => (
                <span className="text-xs font-mono text-slate-600">{row.group6_external_id || `#${row.id}`}</span>
            ),
        },
        {
            key: 'name',
            label: 'Full Name',
            sortable: true,
            render: (row) => <span className="text-sm font-medium text-slate-900">{row.name}</span>,
        },
        {
            key: 'email',
            label: 'Email',
            sortable: true,
            render: (row) => <span className="text-sm text-slate-700">{row.email || '—'}</span>,
        },
        {
            key: 'specialization',
            label: 'Specialization',
            sortable: true,
            render: (row) => <span className="text-sm text-slate-700">{row.specialization || '—'}</span>,
        },
        {
            key: 'barangay',
            label: 'Barangay',
            sortable: false,
            render: (row) => <span className="text-sm text-slate-600">{row.barangay || '—'}</span>,
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (row) => <AdminStatusBadge status={row.status} />,
        },
        {
            key: 'last_synced_at',
            label: 'Last Synced',
            sortable: true,
            render: (row) => <span className="text-sm text-slate-600">{formatDate(row.last_synced_at)}</span>,
        },
    ];

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                Trainer records are read-only in this system. Profile updates are managed in the{' '}
                <span className="font-semibold">Community Engagement System</span> and synchronized here via API.
            </div>

            <AdminFilterBar>
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <AdminSearchInput
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name, email, ID, or specialization..."
                    />
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className={adminSelectClass}
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <AdminPrimaryButton onClick={handleSync} disabled={isSyncing}>
                            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            Sync Trainer Directory
                        </AdminPrimaryButton>
                    </div>
                </div>
            </AdminFilterBar>

            <AdminDataTable
                columns={columns}
                data={trainersData}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={(key, dir) => { setSortKey(key); setSortDir(dir); }}
                isLoading={isLoading}
                pagination={pagination}
                onPageChange={(page) => fetchTrainers(page)}
                minWidth="1100px"
                emptyTitle="No qualified trainers found"
                emptyDescription="Sync Trainer Directory to load records from the Community Engagement System."
                renderActions={(row) => (
                    <>
                        <AdminTableActionButton
                            href={`/admin/qualified-trainers/${row.id}`}
                            icon={Eye}
                            title="View"
                            variant="view"
                        />
                        <AdminTableActionButton
                            onClick={() => handleRefreshTrainer(row)}
                            icon={RefreshCw}
                            title="Refresh"
                            variant="edit"
                            disabled={refreshingId === row.id}
                        />
                    </>
                )}
            />
        </div>
    );
}

export function QualifiedTrainerDetail({ trainer }) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const [record, setRecord] = React.useState(trainer);
    const [isSyncing, setIsSyncing] = React.useState(false);
    const [isRefreshing, setIsRefreshing] = React.useState(false);

    const isAvailable = record.status === 'active';
    const upcomingEvents = record.simulation_events || [];
    const availabilityNotes = record.metadata?.availability_notes || record.metadata?.availability || null;
    const certifications = record.certifications || [];

    const refreshRecord = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch(`/admin/qualified-trainers/${record.id}`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error('Failed to refresh trainer');
            const data = await res.json();
            if (data.trainer) setRecord(data.trainer);
        } catch (error) {
            Swal.fire('Error', 'Failed to refresh trainer record.', 'error');
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleSyncDirectory = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch('/admin/qualified-trainers/sync', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
            });
            const data = await res.json();
            if (data.success) {
                await refreshRecord();
                Swal.fire('Directory synced', data.message, 'success');
            } else {
                Swal.fire(
                    'Sync unavailable',
                    data.message || 'The Community Engagement System API is not yet configured.',
                    'info',
                );
            }
        } catch (error) {
            Swal.fire('Error', 'Failed to sync the trainer directory.', 'error');
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <AdminPageShell>
            <div className="mb-4">
                <a href="/admin/participants?tab=trainers" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-800">
                    ← Back to Trainer List
                </a>
            </div>

            <AdminPageHeader
                icon={GraduationCap}
                title={record.name}
                description={
                    record.group6_external_id
                        ? `Directory ID: ${record.group6_external_id}`
                        : 'Qualified Trainer'
                }
                actions={
                    <div className="flex flex-wrap gap-2">
                        <AdminSecondaryButton onClick={refreshRecord} disabled={isRefreshing}>
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </AdminSecondaryButton>
                        <AdminPrimaryButton onClick={handleSyncDirectory} disabled={isSyncing}>
                            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            Sync Trainer Directory
                        </AdminPrimaryButton>
                    </div>
                }
            />

            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 mb-4">
                This record is synchronized from the <span className="font-semibold">Community Engagement System</span>.
                Name, contact details, specialization, certifications, and status cannot be edited here.
                Assign this trainer to simulation events from the Simulation Event Planning module.
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">Trainer Profile</h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <DetailItem label="Email" value={record.email || '—'} />
                        <DetailItem label="Phone" value={record.phone || '—'} />
                        <DetailItem label="Specialization" value={record.specialization || '—'} />
                        <DetailItem label="Barangay" value={record.barangay || '—'} />
                        <DetailItem label="Directory Status" value={<AdminStatusBadge status={record.status} />} />
                        <DetailItem label="Qualified At" value={formatDate(record.qualified_at)} />
                        <DetailItem label="Last Synced" value={formatDateTime(record.last_synced_at)} />
                        <DetailItem label="Assigned Events" value={record.simulation_events_count ?? 0} />
                    </dl>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">Availability</h3>
                    <div className="space-y-3 text-sm">
                        <div className={`rounded-lg px-3 py-2 border ${isAvailable ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                            <p className="font-semibold">
                                {isAvailable ? 'Available for assignment' : 'Not available for assignment'}
                            </p>
                            <p className="text-xs mt-1 opacity-90">
                                {isAvailable
                                    ? 'This trainer can be assigned to upcoming simulation events.'
                                    : 'Inactive trainers are hidden from simulation event assignment.'}
                            </p>
                        </div>
                        {availabilityNotes && (
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Schedule Notes</p>
                                <p className="text-slate-700">{availabilityNotes}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Upcoming Assignments</p>
                            {upcomingEvents.length > 0 ? (
                                <ul className="space-y-2">
                                    {upcomingEvents.map((event) => (
                                        <li key={event.id} className="rounded-lg border border-slate-200 px-3 py-2">
                                            <p className="font-medium text-slate-900">{event.title}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {formatDate(event.event_date)}
                                                {event.start_time ? ` · ${event.start_time}` : ''}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-slate-500 text-sm">No upcoming simulation events assigned.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">Certifications</h3>
                {certifications.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {certifications.map((cert) => (
                            <span
                                key={cert}
                                className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                            >
                                {cert}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500">No certifications on file. Sync Trainer Directory to refresh.</p>
                )}
            </div>
        </AdminPageShell>
    );
}

function DetailItem({ label, value }) {
    return (
        <div>
            <dt className="text-xs font-semibold text-slate-500 uppercase">{label}</dt>
            <dd className="mt-1 text-slate-900">{value}</dd>
        </div>
    );
}

// Re-export event table components used by tabs — passed from app.jsx to avoid duplication.
