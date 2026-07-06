import React from 'react';
import { Download, ChevronDown, ChevronUp, CheckCircle2, XCircle, Shield, User as UserIcon, Clock, ClipboardCheck } from 'lucide-react';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminCollapsibleFilterBar,
    AdminFilterSelect,
    AdminFilterInput,
    AdminSecondaryButton,
    AdminContentCard,
} from '../components/admin/AdminLayout';

const statusConfig = {
    // System-level results
    success: {
        label: 'Success',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        dot: 'bg-emerald-500',
        icon: CheckCircle2,
    },
    failed: {
        label: 'Failed',
        color: 'bg-rose-50 text-rose-700 border-rose-100',
        dot: 'bg-rose-500',
        icon: XCircle,
    },
    // Record / operation states
    draft: {
        label: 'Draft',
        color: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
        icon: CheckCircle2,
    },
    published: {
        label: 'Published',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        icon: CheckCircle2,
    },
    updated: {
        label: 'Updated',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
        icon: CheckCircle2,
    },
    deleted: {
        label: 'Deleted',
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
        icon: XCircle,
    },
    archived: {
        label: 'Archived',
        color: 'bg-slate-800 text-slate-50 border-slate-700',
        dot: 'bg-slate-900',
        icon: CheckCircle2,
    },
};

const MODULE_OPTIONS = [
    { value: '', label: 'All Modules' },
    { value: 'Auth', label: 'Authentication & Security' },
    { value: 'Users & Roles', label: 'Users & Roles' },
    { value: 'Participants', label: 'Participants' },
    { value: 'Training Modules', label: 'Training Modules' },
    { value: 'Scenarios', label: 'Scenarios' },
    { value: 'Simulation Events', label: 'Simulation Events' },
    { value: 'Resources', label: 'Resources & Inventory' },
    { value: 'Settings', label: 'Settings' },
];

export function AuditLogs() {
    const [logs, setLogs] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [page, setPage] = React.useState(1);
    const [meta, setMeta] = React.useState({ current_page: 1, last_page: 1, total: 0 });
    const [search, setSearch] = React.useState('');
    const [filters, setFilters] = React.useState({
        user: '',
        status: '',
        module: '',
        date_from: '',
        date_to: '',
    });
    const [sortBy, setSortBy] = React.useState('performed_at');
    const [sortDir, setSortDir] = React.useState('desc');
    const [expandedId, setExpandedId] = React.useState(null);

    const fetchLogs = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                sort_by: sortBy,
                sort_dir: sortDir,
                per_page: '15',
            });

            if (search) params.append('search', search);
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const response = await fetch(`/admin/api/audit-logs?${params.toString()}`);
            const data = await response.json();
            setLogs(data.data || []);
            setMeta(data.meta || { current_page: 1, last_page: 1, total: 0 });
        } catch (error) {
            console.error('Failed to load audit logs', error);
        } finally {
            setLoading(false);
        }
    }, [page, sortBy, sortDir, search, filters]);

    React.useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setPage(1);
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(field);
            setSortDir('asc');
        }
    };

    const handleExport = (format) => {
        const params = new URLSearchParams({ format });
        window.location.href = `/admin/api/audit-logs/export?${params.toString()}`;
    };

    const getDisplayStatus = (log) => {
        const action = (log.action || '').toLowerCase();
        const recordStatus = (log.new_values?.status || log.old_values?.status || '').toLowerCase();

        // 1) Hard failure always shows as Failed
        if (log.status === 'failed') {
            return 'failed';
        }

        // 2) Deletion operations
        if (action.includes('delete')) {
            return 'deleted';
        }

        // 3) Archive operations
        if (action.includes('archive')) {
            return 'archived';
        }

        // 4) Publish operations
        if (action.includes('publish')) {
            return 'published';
        }

        // 5) Explicit record status field takes precedence for draft/published/archived
        if (['draft', 'published', 'archived'].includes(recordStatus)) {
            return recordStatus;
        }

        // 6) Generic update operations
        if (action.includes('update') || action.includes('updated') || action.includes('edit')) {
            return 'updated';
        }

        // 7) Default: generic success (e.g. login/logout/OTP verified)
        return 'success';
    };

    const renderStatusBadge = (displayStatus) => {
        const cfg = statusConfig[displayStatus] || statusConfig.success;
        const Icon = cfg.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border shadow-sm ${cfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                <Icon className="w-3 h-3 drop-shadow-sm" />
                <span>{cfg.label}</span>
            </span>
        );
    };

    const formatDateTime = (value) => {
        if (!value) return 'N/A';
        const date = new Date(value);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    return (
        <AdminPageShell>
            <AdminPageHeader
                icon={ClipboardCheck}
                title="Audit Logs"
                description="View system activity and user actions."
                actions={
                    <>
                        <AdminSecondaryButton onClick={() => handleExport('csv')}>
                            <Download className="w-4 h-4" />
                            CSV
                        </AdminSecondaryButton>
                        <AdminSecondaryButton onClick={() => handleExport('xlsx')}>
                            <Download className="w-4 h-4" />
                            Excel
                        </AdminSecondaryButton>
                        <AdminSecondaryButton onClick={() => handleExport('pdf')}>
                            <Download className="w-4 h-4" />
                            PDF
                        </AdminSecondaryButton>
                    </>
                }
            />

            <AdminCollapsibleFilterBar
                searchValue={search}
                onSearchChange={handleSearchChange}
                searchPlaceholder="Search by user or action..."
                hasActiveFilters={Boolean(filters.user || filters.status || filters.module || filters.date_from || filters.date_to)}
                onClearFilters={() => {
                    setFilters({ user: '', status: '', module: '', date_from: '', date_to: '' });
                    setPage(1);
                }}
                panelHeader={(
                    <p className="text-xs text-slate-500 mb-3">
                        {meta.total} log{meta.total === 1 ? '' : 's'} matching current criteria
                    </p>
                )}
            >
                <AdminFilterInput
                    label="Filter by user"
                    value={filters.user}
                    onChange={(e) => handleFilterChange('user', e.target.value)}
                    placeholder="Name or email"
                />
                <AdminFilterSelect label="Status" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                    <option value="">All Status</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                    <option value="warning">Warning</option>
                </AdminFilterSelect>
                <AdminFilterSelect label="Module" value={filters.module} onChange={(e) => handleFilterChange('module', e.target.value)}>
                    {MODULE_OPTIONS.map((opt) => (
                        <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
                    ))}
                </AdminFilterSelect>
                <AdminFilterInput
                    label="Date from"
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                />
                <AdminFilterInput
                    label="Date to"
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                />
            </AdminCollapsibleFilterBar>

            <AdminContentCard>
                    <div className="hidden md:grid grid-cols-[1.5fr_1.2fr_1fr_1fr_1fr] gap-4 px-5 py-4 text-xs font-semibold text-slate-600 bg-slate-50 border-b border-slate-200">
                    <button className="flex items-center gap-1 text-left" onClick={() => handleSort('performed_at')}>
                        <Clock className="w-3 h-3" />
                        <span>When</span>
                        {sortBy === 'performed_at' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </button>
                    <button className="flex items-center gap-1 text-left" onClick={() => handleSort('user_name')}>
                        <UserIcon className="w-3 h-3" />
                        <span>Who</span>
                        {sortBy === 'user_name' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </button>
                    <span className="text-left">What</span>
                    <span className="text-left">Where</span>
                    <button className="flex items-center gap-1 text-left" onClick={() => handleSort('status')}>
                        <Shield className="w-3 h-3" />
                        <span>Status</span>
                        {sortBy === 'status' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </button>
                </div>

                {loading && (
                    <div className="py-12 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium">
                            <Clock className="w-4 h-4 animate-pulse" />
                            Loading audit logs...
                        </div>
                    </div>
                )}

                {!loading && logs.length === 0 && (
                    <div className="py-12 text-center">
                        <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm font-medium text-slate-600">No audit logs found</p>
                        <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search terms</p>
                    </div>
                )}

                <ul className="divide-y divide-slate-100">
                    {logs.map((log) => {
                        const displayStatus = getDisplayStatus(log);
                        const cfg = statusConfig[displayStatus] || statusConfig.success;
                        const Icon = cfg.icon;
                        const isExpanded = expandedId === log.id;
                        return (
                            <li key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                <button
                                    type="button"
                                    className="w-full text-left px-5 py-4 flex flex-col md:grid md:grid-cols-[1.5fr_1.2fr_1fr_1fr_1fr] gap-3 md:gap-4 items-start"
                                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center ${cfg.dot} bg-opacity-10`}>
                                            <Icon className="w-4 h-4 text-slate-700 drop-shadow-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <Clock className="w-3 h-3" />
                                                <span>{formatDateTime(log.performed_at || log.created_at)}</span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-900">
                                                {log.action}
                                            </p>
                                            {log.description && (
                                                <p className="text-xs text-slate-600 line-clamp-2 md:hidden">
                                                    {log.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="md:flex md:items-center md:gap-2 text-sm text-slate-700">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600">
                                                {log.user_name ? log.user_name.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <div>
                                                <div className="font-medium text-xs md:text-sm truncate max-w-[10rem]">
                                                    {log.user_name || 'System'}
                                                </div>
                                                <div className="text-[0.7rem] text-slate-500 uppercase tracking-wide">
                                                    {log.user_role || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="hidden md:block text-sm text-slate-700">
                                        {log.description || '—'}
                                    </div>
                                    <div className="text-sm text-slate-700">
                                        {log.module || '—'}
                                    </div>
                                    <div className="flex items-center justify-between md:justify-start md:gap-2">
                                        {renderStatusBadge(displayStatus)}
                                        <span className="inline-flex items-center text-xs text-slate-400 md:hidden">
                                            {isExpanded ? 'Hide details' : 'View details'}
                                            {isExpanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                                        </span>
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="px-5 py-4 text-xs text-slate-600 bg-slate-50/80 border-t border-slate-200">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 py-2">
                                            <div>
                                                <div className="font-semibold text-slate-700 mb-1">Request</div>
                                                <div className="space-y-0.5">
                                                    <div><span className="font-medium">IP:</span> {log.ip_address || 'N/A'}</div>
                                                    <div className="break-all">
                                                        <span className="font-medium">URL:</span> {log.url || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-700 mb-1">User</div>
                                                <div className="space-y-0.5">
                                                    <div><span className="font-medium">Email:</span> {log.metadata?.email || 'N/A'}</div>
                                                    <div><span className="font-medium">Agent:</span> <span className="break-all">{log.user_agent || 'N/A'}</span></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-700 mb-1">Status</div>
                                                <div className="space-y-0.5">
                                                    <div>
                                                        <span className="font-medium">Result:</span>{' '}
                                                        {statusConfig[displayStatus]?.label || displayStatus}
                                                        {(() => {
                                                            const oldStatus = log.old_values?.status;
                                                            const newStatus = log.new_values?.status;
                                                            if (!oldStatus && !newStatus) return null;
                                                            // If we have a change, show it inline, e.g. "(draft → published)"
                                                            if (oldStatus && newStatus && oldStatus !== newStatus) {
                                                                return (
                                                                    <span className="text-[0.7rem] text-slate-500 ml-1 capitalize">
                                                                        ({oldStatus} → {newStatus})
                                                                    </span>
                                                                );
                                                            }
                                                            // If only new status exists, show it once
                                                            if (!oldStatus && newStatus) {
                                                                return (
                                                                    <span className="text-[0.7rem] text-slate-500 ml-1 capitalize">
                                                                        ({newStatus})
                                                                    </span>
                                                                );
                                                            }
                                                            return null;
                                                        })()}
                                                    </div>
                                                    {log.failure_reason && (
                                                        <div><span className="font-medium">Reason:</span> {log.failure_reason}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {(log.old_values || log.new_values) && (
                                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {log.old_values && (
                                                    <div className="bg-white rounded-xl border border-slate-200 p-3">
                                                        <div className="font-semibold text-slate-700 mb-1 text-xs">Old Values</div>
                                                        <pre className="text-[0.7rem] text-slate-600 whitespace-pre-wrap break-all">
                                                            {JSON.stringify(log.old_values, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                                {log.new_values && (
                                                    <div className="bg-white rounded-xl border border-slate-200 p-3">
                                                        <div className="font-semibold text-slate-700 mb-1 text-xs">New Values</div>
                                                        <pre className="text-[0.7rem] text-slate-600 whitespace-pre-wrap break-all">
                                                            {JSON.stringify(log.new_values, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>

                {/* Pagination */}
                {meta.total > 0 && (
                    <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 bg-slate-50 text-sm text-slate-600">
                        <div>
                            Page <span className="font-semibold">{meta.current_page}</span> of{' '}
                            <span className="font-semibold">{meta.last_page}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={meta.current_page <= 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Prev
                            </button>
                            <button
                                type="button"
                                disabled={meta.current_page >= meta.last_page}
                                onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                                className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </AdminContentCard>
        </AdminPageShell>
    );
}

