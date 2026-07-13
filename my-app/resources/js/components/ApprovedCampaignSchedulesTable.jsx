import React from 'react';
import {
    AlertTriangle,
    ClipboardList,
    Eye,
    Pencil,
    Plus,
} from 'lucide-react';
import { AdminStatCard } from './admin/AdminLayout';
import {
    AdminCollapsibleFilterBar,
    AdminFilterSelect,
} from './admin/AdminCollapsibleFilterBar';
import { AdminDataTable } from './admin/AdminDataTable';
import { formatDateTime } from './campaign/CampaignRequestUi';
import {
    READINESS_TONES,
    PLAN_BADGE_TONES,
    campaignRowId,
    computeDashboardSummary,
    filterApprovedCampaigns,
    resolveRowAction,
} from '../utils/approvedCampaignDashboard';

function ReadinessBadge({ row }) {
    const key = row.simulation_readiness || 'waiting_qualification';
    const label = row.simulation_readiness_label
        || {
            ready: 'Ready',
            registration_open: 'Registration Open',
            waiting_qualification: 'Waiting Qualification',
            simulation_created: 'Simulation Created',
        }[key]
        || 'Waiting Qualification';

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
                READINESS_TONES[key] || READINESS_TONES.waiting_qualification
            }`}
        >
            <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                    key === 'ready'
                        ? 'bg-emerald-500'
                        : key === 'registration_open'
                            ? 'bg-amber-500'
                            : key === 'simulation_created'
                                ? 'bg-sky-500'
                                : 'bg-orange-500'
                }`}
            />
            {label}
        </span>
    );
}

function PlanBadge({ row }) {
    const key = row.simulation_plan_badge
        || (row.simulation_plan_status === 'Not Yet Created' ? 'not_created' : 'draft');
    const label = row.simulation_plan_badge_label
        || row.simulation_plan_status
        || 'Not Created';

    return (
        <span
            className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
                PLAN_BADGE_TONES[key] || PLAN_BADGE_TONES.not_created
            }`}
        >
            {label}
        </span>
    );
}

function registrationBadgeTone(registered, capacity) {
    const target = Number(capacity);
    if (!target || Number.isNaN(target)) {
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }

    const ratio = registered / target;
    if (ratio >= 1) {
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (ratio >= 0.67) {
        return 'bg-sky-50 text-sky-700 border-sky-200';
    }
    if (ratio >= 0.33) {
        return 'bg-amber-50 text-amber-800 border-amber-200';
    }

    return 'bg-slate-50 text-slate-600 border-slate-200';
}

function qualifiedBadgeTone(qualified, minimum) {
    const target = Number(minimum);
    if (!target || Number.isNaN(target)) {
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }

    if (qualified >= target) {
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (qualified >= Math.max(1, target - 2)) {
        return 'bg-amber-50 text-amber-800 border-amber-200';
    }

    return 'bg-orange-50 text-orange-800 border-orange-200';
}

function CampaignTitleCell({ row }) {
    const registered = row.registered_participants_count ?? 0;
    const capacity = row.maximum_participants ?? row.expected_participants ?? '—';
    const qualified = row.qualified_participants ?? 0;
    const minimum = row.minimum_qualified_participants ?? 0;

    return (
        <div className="min-w-[240px] max-w-[300px]">
            <span className="block truncate font-medium text-slate-900" title={row.campaign_title}>
                {row.campaign_title}
            </span>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${registrationBadgeTone(
                        registered,
                        capacity,
                    )}`}
                    title="Registered participants"
                >
                    {registered} / {capacity} Registered
                </span>
                <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${qualifiedBadgeTone(
                        qualified,
                        minimum,
                    )}`}
                    title={
                        minimum > 0
                            ? `${qualified} of ${minimum} minimum qualified`
                            : 'Qualified participants'
                    }
                >
                    {qualified} Qualified
                    {minimum > 0 ? ` / ${minimum} min` : ''}
                </span>
            </div>
        </div>
    );
}

function TableActionButton({ action }) {
    const icons = {
        plus: Plus,
        edit: Pencil,
        eye: Eye,
        alert: AlertTriangle,
    };
    const Icon = icons[action.icon] || Eye;

    const variantClasses = {
        edit: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
        view: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100',
        danger: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
    };

    const classes = `inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
        action.disabled
            ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
            : variantClasses[action.variant] || variantClasses.view
    }`;

    if (action.disabled) {
        return (
            <span className={classes} title={action.tooltip || 'Requirements not yet met.'}>
                <Plus className="w-3.5 h-3.5" />
                {action.label}
            </span>
        );
    }

    if (action.href) {
        return (
            <a href={action.href} className={classes} title={action.tooltip || action.label}>
                <Icon className="w-3.5 h-3.5" />
                {action.label}
            </a>
        );
    }

    return null;
}

function ApprovedCampaignsEmptyState() {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                <ClipboardList className="h-10 w-10" />
            </div>
            <p className="mt-5 text-base font-semibold text-slate-700">
                No approved campaigns are available for simulation planning.
            </p>
            <p className="mt-2 max-w-md text-sm text-slate-500">
                Simulation planning becomes available after a campaign has been approved.
            </p>
        </div>
    );
}

export function ApprovedCampaignSchedulesTable({ schedules = [] }) {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [filterCommunity, setFilterCommunity] = React.useState('');
    const [filterAudience, setFilterAudience] = React.useState('');
    const [filterReadiness, setFilterReadiness] = React.useState('');
    const [filterPlanStatus, setFilterPlanStatus] = React.useState('');
    const [readyOnly, setReadyOnly] = React.useState(false);
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10;

    const communities = React.useMemo(() => {
        const values = schedules
            .map((row) => row.recommended_community || row.community)
            .filter((value) => value && value !== '—');
        return [...new Set(values)].sort();
    }, [schedules]);

    const audiences = React.useMemo(() => {
        const values = schedules.flatMap((row) => {
            if (Array.isArray(row.target_audience) && row.target_audience.length > 0) {
                return row.target_audience;
            }
            return row.target_audience_label ? [row.target_audience_label] : [];
        });
        return [...new Set(values)].sort();
    }, [schedules]);

    const summary = React.useMemo(() => computeDashboardSummary(schedules), [schedules]);

    const filteredSchedules = React.useMemo(
        () => filterApprovedCampaigns(schedules, {
            searchQuery,
            community: filterCommunity,
            targetAudience: filterAudience,
            readiness: filterReadiness,
            planStatus: filterPlanStatus,
            readyOnly,
        }),
        [schedules, searchQuery, filterCommunity, filterAudience, filterReadiness, filterPlanStatus, readyOnly],
    );

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterCommunity, filterAudience, filterReadiness, filterPlanStatus, readyOnly]);

    const totalPages = Math.max(1, Math.ceil(filteredSchedules.length / itemsPerPage));
    const paginatedSchedules = filteredSchedules.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    const hasActiveFilters = Boolean(
        filterCommunity || filterAudience || filterReadiness || filterPlanStatus || readyOnly,
    );

    const columns = [
        {
            key: 'campaign_id',
            label: 'Campaign ID',
            className: 'min-w-[96px]',
            render: (row) => campaignRowId(row),
        },
        {
            key: 'campaign_title',
            label: 'Campaign Title',
            className: 'align-top whitespace-normal',
            render: (row) => <CampaignTitleCell row={row} />,
        },
        {
            key: 'recommended_community',
            label: 'Community',
            className: 'min-w-[140px]',
            render: (row) => row.recommended_community || row.community || '—',
        },
        {
            key: 'expected_participants',
            label: 'Expected Participants',
            className: 'min-w-[108px]',
            render: (row) => row.expected_participants ?? '—',
        },
        {
            key: 'registration_deadline',
            label: 'Registration Deadline',
            className: 'min-w-[150px]',
            render: (row) => formatDateTime(row.registration_deadline),
        },
        {
            key: 'simulation_readiness',
            label: 'Simulation Readiness',
            className: 'min-w-[160px]',
            render: (row) => <ReadinessBadge row={row} />,
        },
        {
            key: 'simulation_plan_badge',
            label: 'Simulation Plan',
            className: 'min-w-[132px]',
            render: (row) => <PlanBadge row={row} />,
        },
    ];

    const showGlobalEmpty = schedules.length === 0;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <AdminStatCard
                    label="Approved Campaigns"
                    value={summary.approved}
                    hint="Total approved campaigns"
                    accent="slate"
                />
                <AdminStatCard
                    label="Ready for Simulation"
                    value={summary.ready}
                    hint="All readiness requirements met"
                    accent="emerald"
                />
                <AdminStatCard
                    label="Waiting for Registration"
                    value={summary.waitingRegistration}
                    hint="Registration deadline not yet passed"
                    accent="amber"
                />
                <AdminStatCard
                    label="Simulation Plans"
                    value={summary.withPlan}
                    hint="Saved or generated plans"
                    accent="blue"
                />
            </div>

            <AdminCollapsibleFilterBar
                searchValue={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search campaign title, training title, or community..."
                hasActiveFilters={hasActiveFilters}
                onClearFilters={() => {
                    setFilterCommunity('');
                    setFilterAudience('');
                    setFilterReadiness('');
                    setFilterPlanStatus('');
                    setReadyOnly(false);
                }}
                trailing={(
                    <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 whitespace-nowrap">
                        <input
                            type="checkbox"
                            checked={readyOnly}
                            onChange={(e) => setReadyOnly(e.target.checked)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        Ready for Simulation Only
                    </label>
                )}
            >
                <AdminFilterSelect
                    label="Community"
                    value={filterCommunity}
                    onChange={(e) => setFilterCommunity(e.target.value)}
                >
                    <option value="">All Communities</option>
                    {communities.map((community) => (
                        <option key={community} value={community}>{community}</option>
                    ))}
                </AdminFilterSelect>
                <AdminFilterSelect
                    label="Target Audience"
                    value={filterAudience}
                    onChange={(e) => setFilterAudience(e.target.value)}
                >
                    <option value="">All Audiences</option>
                    {audiences.map((audience) => (
                        <option key={audience} value={audience}>{audience}</option>
                    ))}
                </AdminFilterSelect>
                <AdminFilterSelect
                    label="Simulation Readiness"
                    value={filterReadiness}
                    onChange={(e) => setFilterReadiness(e.target.value)}
                >
                    <option value="">All Readiness</option>
                    <option value="ready">Ready</option>
                    <option value="registration_open">Registration Open</option>
                    <option value="waiting_qualification">Waiting Qualification</option>
                    <option value="simulation_created">Simulation Created</option>
                </AdminFilterSelect>
                <AdminFilterSelect
                    label="Simulation Plan Status"
                    value={filterPlanStatus}
                    onChange={(e) => setFilterPlanStatus(e.target.value)}
                >
                    <option value="">All Plan Status</option>
                    <option value="not_created">Not Created</option>
                    <option value="generated">Generated</option>
                    <option value="completed">Completed</option>
                </AdminFilterSelect>
            </AdminCollapsibleFilterBar>

            {showGlobalEmpty ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <ApprovedCampaignsEmptyState />
                </div>
            ) : (
                <AdminDataTable
                    columns={columns}
                    data={paginatedSchedules}
                    rowKey="campaign_request_id"
                    compact
                    emptyTitle="No campaigns match your filters"
                    emptyDescription="Try adjusting your search or filter criteria."
                    minWidth="1180px"
                    pagination={
                        filteredSchedules.length > itemsPerPage
                            ? {
                                current_page: currentPage,
                                last_page: totalPages,
                                per_page: itemsPerPage,
                                total: filteredSchedules.length,
                                from: (currentPage - 1) * itemsPerPage + 1,
                                to: Math.min(currentPage * itemsPerPage, filteredSchedules.length),
                            }
                            : null
                    }
                    onPageChange={setCurrentPage}
                    renderActions={(row) => (
                        <TableActionButton action={resolveRowAction(row)} />
                    )}
                />
            )}
        </div>
    );
}
