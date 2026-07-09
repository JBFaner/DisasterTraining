import React from 'react';
import { Eye } from 'lucide-react';
import { AdminDataTable, AdminTableActionButton } from './admin/AdminDataTable';
import {
    formatDate,
    formatScheduleTimeRange,
} from './campaign/CampaignRequestUi';

export function ApprovedCampaignSchedulesTable({ schedules = [] }) {
    const columns = [
        {
            key: 'campaign_title',
            label: 'Campaign Title',
            className: 'min-w-[220px] max-w-[260px] truncate',
            render: (row) => (
                <span className="block truncate font-medium text-slate-900" title={row.campaign_title}>
                    {row.campaign_title}
                </span>
            ),
        },
        {
            key: 'disaster_type',
            label: 'Disaster Type',
            className: 'min-w-[120px]',
        },
        {
            key: 'community',
            label: 'Community',
            className: 'min-w-[130px]',
        },
        {
            key: 'start_date',
            label: 'Start Date',
            className: 'min-w-[112px]',
            render: (row) => formatDate(row.start_date),
        },
        {
            key: 'end_date',
            label: 'End Date',
            className: 'min-w-[112px]',
            render: (row) => formatDate(row.end_date),
        },
        {
            key: 'time',
            label: 'Time',
            className: 'min-w-[168px]',
            render: (row) => formatScheduleTimeRange(row.time),
        },
        {
            key: 'venue',
            label: 'Venue',
            className: 'min-w-[140px]',
        },
        {
            key: 'expected_participants',
            label: 'Expected Participants',
            className: 'min-w-[108px]',
        },
        {
            key: 'minimum_qualified_participants',
            label: 'Minimum Qualified',
            className: 'min-w-[108px]',
        },
        {
            key: 'approval_status',
            label: 'Approval Status',
            className: 'min-w-[120px]',
            render: () => (
                <span className="inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    Approved
                </span>
            ),
        },
        {
            key: 'simulation_plan_status',
            label: 'Simulation Plan',
            className: 'min-w-[132px]',
            render: (row) => row.simulation_plan_status || 'Not Yet Created',
        },
    ];

    return (
        <AdminDataTable
            columns={columns}
            data={schedules}
            compact
            emptyTitle="No approved campaign schedules"
            emptyDescription="Approved schedules from Campaign Planning & Scheduling will appear here automatically."
            minWidth="1600px"
            renderActions={(row) => (
                <AdminTableActionButton
                    href={`/admin/simulation-planning/${row.campaign_request_id || row.id}`}
                    icon={Eye}
                    title="Open Planning Dashboard"
                    variant="view"
                />
            )}
        />
    );
}
