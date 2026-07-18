import React from 'react';
import {
    BookOpen,
    CalendarClock,
    ChevronRight,
    ClipboardList,
    Eye,
    GraduationCap,
    LayoutGrid,
    Printer,
    Search,
    Sparkles,
} from 'lucide-react';
import { ParticipantEmptyState, PARTICIPANT_EMPTY_STATES } from '../components/ParticipantEmptyState';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminCollapsibleFilterBar,
    AdminFilterSelect,
    AdminFilterInput,
    AdminPrimaryButton,
    AdminContentCard,
    AdminStatCard,
} from '../components/admin/AdminLayout';

const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'modules', label: 'Module Assessments', icon: Sparkles },
    { id: 'events', label: 'Event Drills', icon: CalendarClock },
    { id: 'lessons', label: 'Lesson Quizzes', icon: BookOpen },
];

function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function formatDuration(seconds) {
    if (seconds == null || seconds < 0) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

function StatusBadge({ status }) {
    const passed = status === 'passed';
    const expired = status === 'expired';
    const label = passed ? 'Passed' : expired ? 'Expired' : 'Failed';
    const classes = passed
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : expired
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : 'bg-rose-50 text-rose-700 border-rose-200';

    return (
        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${classes}`}>
            {label}
        </span>
    );
}

function EmptyState({ tab, passingScore }) {
    const configByTab = {
        overview: PARTICIPANT_EMPTY_STATES.evaluationsOverview,
        modules: PARTICIPANT_EMPTY_STATES.evaluationsModules,
        events: PARTICIPANT_EMPTY_STATES.evaluationsEvents,
        lessons: PARTICIPANT_EMPTY_STATES.evaluationsLessons,
    };
    const iconsByTab = {
        overview: GraduationCap,
        modules: Sparkles,
        events: CalendarClock,
        lessons: BookOpen,
    };

    const config = configByTab[tab] || configByTab.overview;
    const footnote = config.footnote?.includes('Passing score')
        ? `Passing score: ${passingScore}%`
        : config.footnote;

    return (
        <ParticipantEmptyState
            icon={iconsByTab[tab] || GraduationCap}
            title={config.title}
            description={config.description}
            steps={config.steps}
            primaryAction={config.primaryAction}
            secondaryActions={config.secondaryActions}
            footnote={footnote}
        />
    );
}

function ResultsTable({ rows, columns, emptyTab, passingScore }) {
    if (!rows?.length) {
        return <EmptyState tab={emptyTab} passingScore={passingScore} />;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {columns.map((col) => (
                            <th key={col.key} className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : ''}`}>
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {rows.map((row) => (
                        <tr key={`${row.type}-${row.id}`} className="hover:bg-slate-50/80">
                            {columns.map((col) => (
                                <td key={col.key} className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : ''}`}>
                                    {col.render(row)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function PaginationBar({ pagination, tab }) {
    if (!pagination || pagination.last_page <= 1) {
        return null;
    }

    const buildUrl = (page) => {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        url.searchParams.set('page', String(page));
        return url.toString();
    };

    return (
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
            <span>
                Page {pagination.current_page} of {pagination.last_page} ({pagination.total} records)
            </span>
            <div className="flex gap-2">
                {pagination.current_page > 1 && (
                    <a href={buildUrl(pagination.current_page - 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50">
                        Previous
                    </a>
                )}
                {pagination.current_page < pagination.last_page && (
                    <a href={buildUrl(pagination.current_page + 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50">
                        Next
                    </a>
                )}
            </div>
        </div>
    );
}

function OverviewSection({ title, icon: Icon, rows, viewAllTab, passingScore, columns }) {
    return (
        <AdminContentCard className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Icon className="w-4 h-4 text-emerald-600" />
                    {title}
                </h3>
                <a
                    href={`/participant/evaluations?tab=${viewAllTab}`}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                    View all
                </a>
            </div>
            {!rows?.length ? (
                <div className="px-4 py-6">
                    <EmptyState tab={viewAllTab} passingScore={passingScore} />
                </div>
            ) : (
                <ResultsTable rows={rows} columns={columns} emptyTab={viewAllTab} passingScore={passingScore} />
            )}
        </AdminContentCard>
    );
}

export function ParticipantEvaluationHub({ hub = {} }) {
    const tab = hub.tab || 'overview';
    const filters = hub.filters || {};
    const summary = hub.summary || {};
    const modules = hub.modules || [];
    const passingScore = hub.passing_score ?? 75;
    const pagination = hub.pagination || {};

    const [search, setSearch] = React.useState(filters.search || '');
    const [statusFilter, setStatusFilter] = React.useState(filters.status || '');
    const [moduleFilter, setModuleFilter] = React.useState(filters.training_module_id || '');
    const [dateFrom, setDateFrom] = React.useState(filters.date_from || '');
    const [dateTo, setDateTo] = React.useState(filters.date_to || '');

    const applyFilters = (e) => {
        e?.preventDefault();
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        if (search) url.searchParams.set('search', search);
        else url.searchParams.delete('search');
        if (statusFilter) url.searchParams.set('status', statusFilter);
        else url.searchParams.delete('status');
        if (moduleFilter) url.searchParams.set('training_module_id', moduleFilter);
        else url.searchParams.delete('training_module_id');
        if (dateFrom) url.searchParams.set('date_from', dateFrom);
        else url.searchParams.delete('date_from');
        if (dateTo) url.searchParams.set('date_to', dateTo);
        else url.searchParams.delete('date_to');
        url.searchParams.delete('page');
        window.location.href = url.toString();
    };

    const handleTabChange = (nextTab) => {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', nextTab);
        url.searchParams.delete('page');
        window.location.href = url.toString();
    };

    const moduleColumns = [
        {
            key: 'module',
            label: 'Training Module',
            render: (row) => (
                <div>
                    <p className="font-medium text-slate-900">{row.training_module?.title || row.subtitle || '—'}</p>
                    <p className="text-xs text-slate-500 truncate max-w-[220px]">{row.title}</p>
                </div>
            ),
        },
        { key: 'difficulty', label: 'Difficulty', render: (row) => <span className="capitalize text-slate-600">{row.difficulty || '—'}</span> },
        { key: 'attempt', label: 'Attempt', render: (row) => (row.attempt_number ? `#${row.attempt_number}` : '—') },
        { key: 'score', label: 'Score', render: (row) => row.score_label || '—' },
        { key: 'percent', label: '%', render: (row) => <span className="font-semibold">{row.percentage != null ? `${Number(row.percentage).toFixed(1)}%` : '—'}</span> },
        { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        { key: 'duration', label: 'Duration', render: (row) => <span className="text-xs text-slate-500">{formatDuration(row.duration_seconds)}</span> },
        { key: 'completed', label: 'Completed', render: (row) => <span className="text-xs text-slate-500">{formatDate(row.completed_at)}</span> },
        {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (row) => row.view_url ? (
                <div className="inline-flex items-center gap-1">
                    <a href={row.view_url} className="inline-flex p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="View report">
                        <Eye className="w-4 h-4" />
                    </a>
                    {row.type === 'module' && (
                        <a
                            href={`${row.view_url}?print=1`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                            title="Print report"
                        >
                            <Printer className="w-4 h-4" />
                        </a>
                    )}
                </div>
            ) : '—',
        },
    ];

    const eventColumns = [
        { key: 'event', label: 'Event', render: (row) => <span className="font-medium text-slate-900">{row.title}</span> },
        { key: 'date', label: 'Event Date', render: (row) => <span className="text-slate-600">{row.event_date ? formatDate(row.event_date) : '—'}</span> },
        { key: 'score', label: 'Average Score', render: (row) => <span className="font-semibold">{row.percentage != null ? `${Number(row.percentage).toFixed(1)}%` : '—'}</span> },
        { key: 'rating', label: 'Rating', render: (row) => <span className="text-slate-600">{row.competency_rating || '—'}</span> },
        { key: 'status', label: 'Result', render: (row) => <StatusBadge status={row.status} /> },
        {
            key: 'cert',
            label: 'Certificate',
            render: (row) => (
                <span className={`text-xs font-medium ${row.eligible_for_certification ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {row.eligible_for_certification ? 'Eligible' : 'Not eligible'}
                </span>
            ),
        },
        { key: 'completed', label: 'Evaluated', render: (row) => <span className="text-xs text-slate-500">{formatDate(row.completed_at)}</span> },
        {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (row) => row.view_url ? (
                <a href={row.view_url} className="inline-flex p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="View event">
                    <Eye className="w-4 h-4" />
                </a>
            ) : '—',
        },
    ];

    const lessonColumns = [
        {
            key: 'lesson',
            label: 'Lesson',
            render: (row) => (
                <div>
                    <p className="font-medium text-slate-900">{row.title}</p>
                    <p className="text-xs text-slate-500">{row.subtitle || '—'}</p>
                </div>
            ),
        },
        { key: 'attempt', label: 'Attempt', render: (row) => (row.attempt_number ? `#${row.attempt_number}` : '—') },
        { key: 'score', label: 'Score', render: (row) => row.score_label || '—' },
        { key: 'percent', label: '%', render: (row) => <span className="font-semibold">{row.percentage != null ? `${Number(row.percentage).toFixed(1)}%` : '—'}</span> },
        { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        { key: 'completed', label: 'Completed', render: (row) => <span className="text-xs text-slate-500">{formatDate(row.completed_at)}</span> },
        {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (row) => row.view_url ? (
                <a href={row.view_url} className="inline-flex p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="Review quiz">
                    <Eye className="w-4 h-4" />
                </a>
            ) : '—',
        },
    ];

    const activeRows = tab === 'modules'
        ? hub.module_results
        : tab === 'events'
            ? hub.event_results
            : tab === 'lessons'
                ? hub.lesson_results
                : [];

    const activeColumns = tab === 'modules'
        ? moduleColumns
        : tab === 'events'
            ? eventColumns
            : lessonColumns;

    const activePagination = tab === 'modules'
        ? pagination.modules
        : tab === 'events'
            ? pagination.events
            : tab === 'lessons'
                ? pagination.lessons
                : null;

    const hasAnyResults = (summary.module_count || 0) + (summary.event_count || 0) + (summary.lesson_count || 0) > 0;

    return (
        <AdminPageShell>
            <AdminPageHeader
                icon={ClipboardList}
                title="Evaluation Results"
                description="Your scores from module assessments, simulation event drills, and lesson quizzes."
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <AdminStatCard label="Module Assessments" value={summary.module_count ?? 0} hint={`${summary.module_passed ?? 0} passed`} />
                <AdminStatCard label="Event Drills" value={summary.event_count ?? 0} hint={`${summary.event_passed ?? 0} passed`} />
                <AdminStatCard label="Lesson Quizzes" value={summary.lesson_count ?? 0} hint={`${summary.lesson_passed ?? 0} passed`} />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2 w-fit">
                <div className="flex gap-1 flex-wrap">
                    {TABS.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleTabChange(item.id)}
                                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                    tab === item.id
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {tab !== 'overview' && (
                <AdminCollapsibleFilterBar onSubmit={applyFilters}>
                    <AdminFilterInput
                        label="Search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search module, event, lesson..."
                        icon={Search}
                    />
                    <AdminFilterSelect label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">All statuses</option>
                        <option value="passed">Passed</option>
                        <option value="failed">Failed</option>
                    </AdminFilterSelect>
                    {(tab === 'modules' || tab === 'lessons') && (
                        <AdminFilterSelect label="Training Module" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
                            <option value="">All modules</option>
                            {modules.map((module) => (
                                <option key={module.id} value={module.id}>{module.title}</option>
                            ))}
                        </AdminFilterSelect>
                    )}
                    <AdminFilterInput label="Date from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    <AdminFilterInput label="Date to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    <AdminPrimaryButton type="submit">Apply</AdminPrimaryButton>
                </AdminCollapsibleFilterBar>
            )}

            {tab === 'overview' ? (
                !hasAnyResults ? (
                    <EmptyState tab="overview" passingScore={passingScore} />
                ) : (
                    <div className="space-y-6">
                        <OverviewSection
                            title="Recent Module Assessments"
                            icon={Sparkles}
                            rows={hub.recent?.modules}
                            viewAllTab="modules"
                            passingScore={passingScore}
                            columns={moduleColumns}
                        />
                        <OverviewSection
                            title="Recent Event Drills"
                            icon={CalendarClock}
                            rows={hub.recent?.events}
                            viewAllTab="events"
                            passingScore={passingScore}
                            columns={eventColumns}
                        />
                        <OverviewSection
                            title="Recent Lesson Quizzes"
                            icon={BookOpen}
                            rows={hub.recent?.lessons}
                            viewAllTab="lessons"
                            passingScore={passingScore}
                            columns={lessonColumns}
                        />
                    </div>
                )
            ) : (
                <AdminContentCard className="overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                        <p className="text-sm text-slate-600">
                            Passing score: <span className="font-semibold text-slate-900">{passingScore}%</span>
                        </p>
                    </div>
                    <ResultsTable
                        rows={activeRows}
                        columns={activeColumns}
                        emptyTab={tab}
                        passingScore={passingScore}
                    />
                    <PaginationBar pagination={activePagination} tab={tab} />
                </AdminContentCard>
            )}
        </AdminPageShell>
    );
}
