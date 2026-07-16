import React from 'react';
import {
    Users,
    GraduationCap,
    Eye,
    Download,
    RefreshCw,
    UserPlus,
    Mail,
    CalendarPlus,
    BarChart3,
    Printer,
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminCollapsibleFilterBar,
    AdminFilterSelect,
    AdminFilterInput,
    AdminPrimaryButton,
    AdminSecondaryButton,
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
    participantFilterOptions = null,
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
        { id: 'participants', label: 'Participant Registry', icon: Users },
        { id: 'trainers', label: 'Trainer List', icon: GraduationCap },
        { id: 'registrations', label: 'Event Registrations', icon: '📋' },
        { id: 'attendance', label: 'Event Attendance', icon: '✓' },
    ];

    let totalParticipants = participantsSummary?.total ?? participants.length;
    let activeParticipants = participantsSummary?.active ?? participants.filter((p) => p.status === 'active').length;
    let inactiveParticipants = participantsSummary?.inactive ?? participants.filter((p) => p.status === 'inactive').length;
    let participantsSyncedThisMonth = participantsSummary?.synced_this_month ?? 0;

    let totalTrainers = qualifiedTrainersSummary?.total ?? qualifiedTrainers.length;
    let activeTrainers = qualifiedTrainersSummary?.active ?? qualifiedTrainers.filter((t) => t.status === 'active').length;
    let inactiveTrainers = qualifiedTrainersSummary?.inactive ?? qualifiedTrainers.filter((t) => t.status === 'inactive').length;
    let trainersSyncedThisMonth = qualifiedTrainersSummary?.synced_this_month ?? 0;

    return (
        <AdminPageShell>
            <AdminPageHeader
                icon={Users}
                title="Participant Registration & Attendance"
                description="Manage participants, qualified trainers, event registrations, and attendance."
                actions={activeTab === 'participants' ? (
                    <div className="flex flex-wrap items-center gap-2">
                        <AdminSecondaryButton
                            onClick={() => {
                                if (typeof window !== 'undefined') {
                                    window.dispatchEvent(new CustomEvent('participant-registry-print'));
                                }
                            }}
                        >
                            <Printer className="w-4 h-4" />
                            Print
                        </AdminSecondaryButton>
                        <AdminPrimaryButton href="/participant/register">
                            <UserPlus className="w-4 h-4" />
                            Register New Participant
                        </AdminPrimaryButton>
                    </div>
                ) : null}
            />

            {activeTab === 'participants' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard label="Total Participants" value={totalParticipants} hint="Local and campaign registry" />
                    <StatCard label="Active" value={activeParticipants} hint="Active participant accounts" accent="emerald" />
                    <StatCard label="Inactive" value={inactiveParticipants} hint="Inactive participant accounts" />
                    <StatCard label="Synced This Month" value={participantsSyncedThisMonth} hint="Last registry sync" />
                </div>
            )}

            {activeTab === 'trainers' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard label="Total Trainers" value={totalTrainers} hint="Community Engagement System" />
                    <StatCard label="Active" value={activeTrainers} hint="Available for assignment" accent="emerald" />
                    <StatCard label="Inactive" value={inactiveTrainers} hint="Unavailable in directory" />
                    <StatCard label="Synced This Month" value={trainersSyncedThisMonth} hint="Last directory sync" />
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
                <ParticipantRegistryTab
                    participants={participants}
                    participantsPagination={participantsPagination}
                    filterOptions={participantFilterOptions}
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

function registryStatusBadge(label) {
    const map = {
        'Not Started': 'bg-slate-100 text-slate-700',
        'In Progress': 'bg-sky-50 text-sky-700',
        Completed: 'bg-emerald-50 text-emerald-700',
        'No Records': 'bg-slate-100 text-slate-600',
        Active: 'bg-emerald-50 text-emerald-700',
        Partial: 'bg-amber-50 text-amber-800',
        Absent: 'bg-rose-50 text-rose-700',
        'Not Evaluated': 'bg-slate-100 text-slate-600',
        None: 'bg-slate-100 text-slate-600',
        Issued: 'bg-indigo-50 text-indigo-700',
    };
    return map[label] || 'bg-slate-100 text-slate-700';
}

function RegistryLabelBadge({ label }) {
    if (!label) return '—';
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${registryStatusBadge(label)}`}>
            {label}
        </span>
    );
}

function SourceBadge({ source }) {
    const normalized = (source || '').toString().toLowerCase();
    const isCampaign = normalized === 'campaign' || normalized === 'synced';
    const label = isCampaign ? 'CAMPAIGN' : 'LOCAL';
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${isCampaign ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {label}
        </span>
    );
}

function EmailStatusBadge({ verifiedAt }) {
    const isVerified = Boolean(verifiedAt);
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${isVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
            {isVerified ? 'Verified' : 'Pending Verification'}
        </span>
    );
}

function ParticipantRegistryTab({ participants = [], participantsPagination = null, filterOptions = null }) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [sourceFilter, setSourceFilter] = React.useState('all');
    const [moduleFilter, setModuleFilter] = React.useState('');
    const [batchFilter, setBatchFilter] = React.useState('');
    const [trainingStatusFilter, setTrainingStatusFilter] = React.useState('');
    const [dateFrom, setDateFrom] = React.useState('');
    const [dateTo, setDateTo] = React.useState('');
    const [sortKey, setSortKey] = React.useState('name');
    const [sortDir, setSortDir] = React.useState('asc');
    const [participantsData, setParticipantsData] = React.useState(participants || []);
    const [pagination, setPagination] = React.useState(participantsPagination);
    const [options, setOptions] = React.useState(filterOptions || { modules: [], batches: [] });
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSyncing, setIsSyncing] = React.useState(false);
    const [isPrinting, setIsPrinting] = React.useState(false);

    const buildParticipantsQuery = React.useCallback((page = 1, { exportAll = false } = {}) => {
        const url = new URL('/admin/participants', window.location.origin);
        if (exportAll) {
            url.searchParams.set('export_all', '1');
        } else {
            url.searchParams.set('page', page);
        }
        if (searchTerm.trim()) url.searchParams.set('search', searchTerm.trim());
        if (statusFilter !== 'all') url.searchParams.set('status_filter', statusFilter);
        if (sourceFilter !== 'all') url.searchParams.set('source_filter', sourceFilter);
        if (moduleFilter) url.searchParams.set('module_filter', moduleFilter);
        if (batchFilter) url.searchParams.set('batch_filter', batchFilter);
        if (trainingStatusFilter) url.searchParams.set('training_status_filter', trainingStatusFilter);
        if (dateFrom) url.searchParams.set('date_from', dateFrom);
        if (dateTo) url.searchParams.set('date_to', dateTo);
        url.searchParams.set('sort_by', sortKey);
        url.searchParams.set('sort_dir', sortDir);
        return url;
    }, [searchTerm, statusFilter, sourceFilter, moduleFilter, batchFilter, trainingStatusFilter, dateFrom, dateTo, sortKey, sortDir]);

    const availableBatches = React.useMemo(() => {
        const batches = options.batches || [];
        if (!moduleFilter) return batches;
        const moduleId = Number(moduleFilter);
        return batches.filter((batch) => Number(batch.training_module_id) === moduleId);
    }, [options.batches, moduleFilter]);

    const handleModuleFilterChange = (value) => {
        setModuleFilter(value);
        if (!value) {
            setBatchFilter('');
            return;
        }
        const moduleId = Number(value);
        const stillValid = (options.batches || []).some(
            (batch) => Number(batch.id) === Number(batchFilter) && Number(batch.training_module_id) === moduleId,
        );
        if (!stillValid) setBatchFilter('');
    };

    const fetchParticipants = React.useCallback(async (page = 1) => {
        setIsLoading(true);
        try {
            const url = buildParticipantsQuery(page);
            const res = await fetch(url.toString(), {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error('Failed to load participants');
            const data = await res.json();
            setParticipantsData(data.participants || []);
            setPagination(data.pagination || null);
            if (data.filter_options) setOptions(data.filter_options);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [buildParticipantsQuery]);

    React.useEffect(() => {
        const timer = setTimeout(() => fetchParticipants(1), 300);
        return () => clearTimeout(timer);
    }, [fetchParticipants]);

    const printParticipants = React.useCallback(async () => {
        if (isPrinting) return;
        setIsPrinting(true);

        const escapeHtml = (value) => String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

        try {
            const url = buildParticipantsQuery(1, { exportAll: true });
            const res = await fetch(url.toString(), {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error('Failed to load filtered participants for print');
            const data = await res.json();
            const rows = data.participants || [];

            const moduleLabel = moduleFilter
                ? (options.modules || []).find((m) => String(m.id) === String(moduleFilter))?.title || moduleFilter
                : 'All Modules';
            const batchLabel = batchFilter
                ? (options.batches || []).find((b) => String(b.id) === String(batchFilter))?.label || batchFilter
                : 'All Batches';
            const sourceLabel = sourceFilter === 'all'
                ? 'All Sources'
                : (sourceFilter === 'campaign' ? 'Campaign' : 'Local');
            const statusLabel = statusFilter === 'all' ? 'All Status' : statusFilter;
            const trainingLabel = trainingStatusFilter || 'All Training Status';
            const dateLabel = dateFrom || dateTo
                ? `${dateFrom || '…'} to ${dateTo || '…'}`
                : 'All Dates';

            const bodyRows = rows.length
                ? rows.map((row, index) => {
                    const source = (row.participant_source || '').toLowerCase();
                    const rowSource = source === 'campaign' || source === 'synced' ? 'Campaign' : 'Local';
                    return `<tr>
                        <td>${index + 1}</td>
                        <td>${escapeHtml(row.name || '—')}</td>
                        <td>${escapeHtml(row.email || '—')}</td>
                        <td>${escapeHtml(rowSource)}</td>
                        <td>${escapeHtml(row.email_verified_at ? 'Verified' : 'Pending Verification')}</td>
                        <td>${escapeHtml(row.phone || '—')}</td>
                        <td>${escapeHtml(row.training_status || '—')}</td>
                        <td>${escapeHtml(row.attendance_status || '—')}</td>
                    </tr>`;
                }).join('')
                : '<tr><td colspan="8" style="text-align:center;padding:24px;">No participants match the current filters.</td></tr>';

            const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Participant Registry</title>
  <style>
    body { font-family: Arial, sans-serif; color: #0f172a; margin: 24px; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    p { margin: 0 0 16px; color: #475569; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; }
    @media print { body { margin: 12px; } }
  </style>
</head>
<body>
  <h1>Participant Registry</h1>
  <p>Printed ${new Date().toLocaleString()} · ${rows.length} participant(s) matching filters</p>
  <p>Status: ${escapeHtml(statusLabel)} · Source: ${escapeHtml(sourceLabel)} · Module: ${escapeHtml(moduleLabel)} · Batch: ${escapeHtml(batchLabel)} · Training: ${escapeHtml(trainingLabel)} · Registered: ${escapeHtml(dateLabel)}${searchTerm.trim() ? ` · Search: ${escapeHtml(searchTerm.trim())}` : ''}</p>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Full Name</th>
        <th>Email</th>
        <th>Source</th>
        <th>Email Status</th>
        <th>Contact</th>
        <th>Training</th>
        <th>Attendance</th>
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>
</body>
</html>`;

            const iframe = document.createElement('iframe');
            iframe.setAttribute('title', 'Participant Registry Print');
            iframe.setAttribute('aria-hidden', 'true');
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            iframe.style.opacity = '0';
            iframe.style.pointerEvents = 'none';
            document.body.appendChild(iframe);

            const frameWindow = iframe.contentWindow;
            const frameDocument = frameWindow?.document;
            if (!frameWindow || !frameDocument) {
                iframe.remove();
                Swal.fire('Unable to print', 'Could not prepare the print view. Please try again.', 'warning');
                return;
            }

            frameDocument.open();
            frameDocument.write(html);
            frameDocument.close();

            try {
                frameWindow.focus();
                frameWindow.print();
            } finally {
                window.setTimeout(() => {
                    try {
                        iframe.remove();
                    } catch {
                        // ignore
                    }
                }, 1000);
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Unable to print', 'Failed to load the filtered participant list for printing.', 'error');
        } finally {
            setIsPrinting(false);
        }
    }, [
        isPrinting,
        buildParticipantsQuery,
        moduleFilter,
        batchFilter,
        sourceFilter,
        statusFilter,
        trainingStatusFilter,
        dateFrom,
        dateTo,
        searchTerm,
        options.modules,
        options.batches,
    ]);

    React.useEffect(() => {
        const onPrint = () => {
            void printParticipants();
        };
        window.addEventListener('participant-registry-print', onPrint);
        return () => window.removeEventListener('participant-registry-print', onPrint);
    }, [printParticipants]);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch('/admin/participants/sync', {
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
                Swal.fire('Registry synced', data.message, 'success');
                await fetchParticipants(1);
            } else {
                Swal.fire(
                    'Sync unavailable',
                    data.message || 'The Community Registration & Campaign Management System API is not yet configured.',
                    'info',
                );
            }
        } catch {
            Swal.fire('Error', 'Failed to sync participant registry.', 'error');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleResendVerification = async (participant) => {
        try {
            const res = await fetch(`/admin/participants/${participant.id}/resend-verification`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                Swal.fire('Unable to resend', data.message || 'Could not resend verification code.', 'warning');
                return;
            }
            Swal.fire('Verification email sent', data.message || 'Verification code resent successfully.', 'success');
        } catch {
            Swal.fire('Error', 'Failed to resend verification code.', 'error');
        }
    };

    const hasActiveFilters = statusFilter !== 'all'
        || sourceFilter !== 'all'
        || moduleFilter
        || batchFilter
        || trainingStatusFilter
        || dateFrom
        || dateTo;

    const columns = [
        {
            key: 'name',
            label: 'Full Name',
            sortable: true,
            render: (row) => <span className="text-sm font-medium text-slate-900">{row.name}</span>,
        },
        {
            key: 'email',
            label: 'Email Address',
            sortable: true,
            render: (row) => <span className="text-sm text-slate-700">{row.email || '—'}</span>,
        },
        {
            key: 'participant_source',
            label: 'Source',
            render: (row) => <SourceBadge source={row.participant_source} />,
        },
        {
            key: 'email_verified_at',
            label: 'Email Status',
            render: (row) => <EmailStatusBadge verifiedAt={row.email_verified_at} />,
        },
        {
            key: 'phone',
            label: 'Contact Number',
            render: (row) => <span className="text-sm text-slate-700">{row.phone || '—'}</span>,
        },
        {
            key: 'training_status',
            label: 'Training Status',
            render: (row) => <RegistryLabelBadge label={row.training_status} />,
        },
        {
            key: 'attendance_status',
            label: 'Attendance Status',
            render: (row) => <RegistryLabelBadge label={row.attendance_status} />,
        },
    ];

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                This registry includes locally registered participants and campaign participants from the Community Registration & Campaign Management System.
            </div>

            <AdminCollapsibleFilterBar
                searchValue={searchTerm}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                searchPlaceholder="Search by name, email, ID, or contact number..."
                hasActiveFilters={hasActiveFilters}
                onClearFilters={() => {
                    setStatusFilter('all');
                    setSourceFilter('all');
                    setModuleFilter('');
                    setBatchFilter('');
                    setTrainingStatusFilter('');
                    setDateFrom('');
                    setDateTo('');
                }}
                trailing={(
                    <>
                        <AdminPrimaryButton onClick={handleSync} disabled={isSyncing}>
                            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            Sync Participants
                        </AdminPrimaryButton>
                    </>
                )}
            >
                <AdminFilterSelect label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </AdminFilterSelect>
                <AdminFilterSelect label="Source" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
                    <option value="all">All Participants</option>
                    <option value="local">Local</option>
                    <option value="campaign">Campaign</option>
                </AdminFilterSelect>
                <AdminFilterSelect label="Module" value={moduleFilter} onChange={(e) => handleModuleFilterChange(e.target.value)}>
                    <option value="">All Modules</option>
                    {(options.modules || []).map((module) => (
                        <option key={module.id} value={module.id}>{module.title}</option>
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
                <AdminFilterSelect label="Training Status" value={trainingStatusFilter} onChange={(e) => setTrainingStatusFilter(e.target.value)}>
                    <option value="">All Training Status</option>
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                </AdminFilterSelect>
                <AdminFilterInput
                    label="Registered From"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                />
                <AdminFilterInput
                    label="Registered To"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                />
            </AdminCollapsibleFilterBar>

            <AdminDataTable
                columns={columns}
                data={participantsData}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={(key, dir) => { setSortKey(key); setSortDir(dir); }}
                isLoading={isLoading}
                pagination={pagination}
                onPageChange={(page) => fetchParticipants(page)}
                minWidth="980px"
                emptyTitle="No participants found"
                emptyDescription="Use Register New Participant or Sync Participants to build your unified registry."
                renderActions={(row) => (
                    <>
                        <AdminTableActionButton
                            href={`/admin/participants/${row.id}`}
                            icon={Eye}
                            title="View Profile"
                            variant="view"
                        />
                        <AdminTableActionButton
                            href="/admin/participants?tab=registrations"
                            icon={CalendarPlus}
                            title="Register to Simulation Event"
                            variant="edit"
                        />
                        <AdminTableActionButton
                            href={`/admin/participants/${row.id}?tab=training`}
                            icon={BarChart3}
                            title="View Progress"
                            variant="default"
                        />
                        {!row.email_verified_at && row.email ? (
                            <AdminTableActionButton
                                onClick={() => handleResendVerification(row)}
                                icon={Mail}
                                title="Resend Verification"
                                variant="default"
                            />
                        ) : null}
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

            <AdminCollapsibleFilterBar
                searchValue={searchTerm}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                searchPlaceholder="Search by name, email, ID, or specialization..."
                hasActiveFilters={statusFilter !== 'all'}
                onClearFilters={() => setStatusFilter('all')}
                trailing={(
                    <AdminPrimaryButton onClick={handleSync} disabled={isSyncing}>
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        Sync Trainer Directory
                    </AdminPrimaryButton>
                )}
            >
                <AdminFilterSelect label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </AdminFilterSelect>
            </AdminCollapsibleFilterBar>

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
