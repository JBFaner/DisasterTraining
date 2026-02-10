import React from 'react';
import { Search, Filter, Download, ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertTriangle, Shield, User as UserIcon, Clock } from 'lucide-react';

const statusConfig = {
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
    warning: {
        label: 'Warning',
        color: 'bg-amber-50 text-amber-700 border-amber-100',
        dot: 'bg-amber-500',
        icon: AlertTriangle,
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

            const response = await fetch(`/api/audit-logs?${params.toString()}`);
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
        window.location.href = `/api/audit-logs/export?${params.toString()}`;
    };

    const renderStatusBadge = (status) => {
        const cfg = statusConfig[status] || statusConfig.success;
        const Icon = cfg.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                <Icon className="w-3 h-3" />
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
        <div className="space-y-4">
            {/* Sticky filters */}
            <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur border-b border-slate-200 -mx-6 px-6 py-3">
                <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">Filter &amp; Search</span>
                        <span className="text-xs text-slate-400">
                            {meta.total} log{meta.total === 1 ? '' : 's'}
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleExport('csv')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                            <Download className="w-3.5 h-3.5" />
                            CSV
                        </button>
                        <button
                            type="button"
                            onClick={() => handleExport('xlsx')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Excel
                        </button>
                        <button
                            type="button"
                            onClick={() => handleExport('pdf')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                            <Download className="w-3.5 h-3.5" />
                            PDF
                        </button>
                    </div>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                            <input
                                type="text"
                                placeholder="Search by user or action..."
                                className="w-full pl-8 pr-3 py-2.5 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                                value={search}
                                onChange={handleSearchChange}
                            />
                        </div>
                    </div>
                    <div>
                        <input
                            type="text"
                            placeholder="Filter by user"
                            className="w-full px-3 py-2.5 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            value={filters.user}
                            onChange={(e) => handleFilterChange('user', e.target.value)}
                        />
                    </div>
                    <div>
                        <select
                            className="w-full px-3 py-2.5 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="success">Success</option>
                            <option value="failed">Failed</option>
                            <option value="warning">Warning</option>
                        </select>
                    </div>
                    <div>
                        <select
                            className="w-full px-3 py-2.5 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            value={filters.module}
                            onChange={(e) => handleFilterChange('module', e.target.value)}
                        >
                            {MODULE_OPTIONS.map(opt => (
                                <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="date"
                            className="w-full px-2.5 py-2.5 rounded-md border border-slate-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            value={filters.date_from}
                            onChange={(e) => handleFilterChange('date_from', e.target.value)}
                        />
                        <input
                            type="date"
                            className="w-full px-2.5 py-2.5 rounded-md border border-slate-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            value={filters.date_to}
                            onChange={(e) => handleFilterChange('date_to', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Logs table / timeline hybrid */}
            <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden bg-white">
                <div className="hidden md:grid grid-cols-[1.5fr_1.2fr_1fr_1fr_1fr] gap-4 px-4 py-3 text-xs font-semibold text-slate-500 bg-slate-50 border-b border-slate-200">
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
                    <div className="p-6 text-center text-sm text-slate-500">
                        Loading audit logs...
                    </div>
                )}

                {!loading && logs.length === 0 && (
                    <div className="p-6 text-center text-sm text-slate-500">
                        No audit logs found for the selected filters.
                    </div>
                )}

                <ul className="divide-y divide-slate-100">
                    {logs.map((log) => {
                        const cfg = statusConfig[log.status] || statusConfig.success;
                        const Icon = cfg.icon;
                        const isExpanded = expandedId === log.id;
                        return (
                            <li key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                <button
                                    type="button"
                                    className="w-full text-left px-4 py-3 flex flex-col md:grid md:grid-cols-[1.5fr_1.2fr_1fr_1fr_1fr] gap-3 md:gap-4 items-start"
                                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center ${cfg.dot} bg-opacity-10`}>
                                            <Icon className={`w-4 h-4 text-slate-700`} />
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
                                        {renderStatusBadge(log.status)}
                                        <span className="inline-flex items-center text-xs text-slate-400 md:hidden">
                                            {isExpanded ? 'Hide details' : 'View details'}
                                            {isExpanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                                        </span>
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="px-4 pb-4 text-xs text-slate-600 bg-slate-50/60 border-t border-slate-100">
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
                                                    <div><span className="font-medium">Result:</span> {statusConfig[log.status]?.label || log.status}</div>
                                                    {log.failure_reason && (
                                                        <div><span className="font-medium">Reason:</span> {log.failure_reason}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {(log.old_values || log.new_values) && (
                                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {log.old_values && (
                                                    <div className="bg-white rounded-md border border-slate-200 p-2">
                                                        <div className="font-semibold text-slate-700 mb-1 text-xs">Old Values</div>
                                                        <pre className="text-[0.7rem] text-slate-600 whitespace-pre-wrap break-all">
                                                            {JSON.stringify(log.old_values, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                                {log.new_values && (
                                                    <div className="bg-white rounded-md border border-slate-200 p-2">
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
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
                        <div>
                            Page <span className="font-medium">{meta.current_page}</span> of{' '}
                            <span className="font-medium">{meta.last_page}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                disabled={meta.current_page <= 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="px-2 py-1 rounded border border-slate-300 bg-white disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <button
                                type="button"
                                disabled={meta.current_page >= meta.last_page}
                                onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                                className="px-2 py-1 rounded border border-slate-300 bg-white disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

