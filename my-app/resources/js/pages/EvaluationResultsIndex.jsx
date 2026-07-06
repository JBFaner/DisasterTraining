import React from 'react';
import Swal from 'sweetalert2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
    ClipboardList,
    Eye,
    Printer,
    Trash2,
    Search,
    RotateCcw,
    LayoutGrid,
    List,
} from 'lucide-react';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminCollapsibleFilterBar,
    AdminFilterSelect,
    AdminFilterInput,
    AdminPrimaryButton,
    AdminSecondaryButton,
    AdminViewToggle,
    AdminContentCard,
    AdminStatCard,
} from '../components/admin/AdminLayout';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

function formatDuration(seconds) {
    if (seconds == null || seconds < 0) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

function StatusBadge({ status }) {
    const passed = status === 'passed';
    const failed = status === 'needs_improvement';
    const label = passed ? 'Passed' : failed ? 'Failed' : 'In Progress';
    const classes = passed
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : failed
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : 'bg-amber-50 text-amber-800 border-amber-200';

    return (
        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${classes}`}>
            {label}
        </span>
    );
}

export function EvaluationResultsIndex({
    results = [],
    pagination = null,
    analytics = null,
    modules = [],
    attemptNumbers = [],
    filters = {},
    passingScore = 75,
    role = 'LGU_ADMIN',
}) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const isParticipant = role === 'PARTICIPANT';
    const isAdmin = role === 'LGU_ADMIN';
    const [viewMode, setViewMode] = React.useState('list');
    const [search, setSearch] = React.useState(filters.search || '');
    const [statusFilter, setStatusFilter] = React.useState(filters.status || '');
    const [moduleFilter, setModuleFilter] = React.useState(filters.training_module_id || '');
    const [attemptFilter, setAttemptFilter] = React.useState(filters.attempt_number || '');
    const [dateFrom, setDateFrom] = React.useState(filters.date_from || '');
    const [dateTo, setDateTo] = React.useState(filters.date_to || '');
    const [selectedIds, setSelectedIds] = React.useState([]);
    const [bulkResetting, setBulkResetting] = React.useState(false);

    const resettableResults = React.useMemo(
        () => (results || []).filter((row) => row.can_reset),
        [results],
    );
    const resettableIds = React.useMemo(
        () => resettableResults.map((row) => row.id),
        [resettableResults],
    );
    const allResettableSelected = resettableIds.length > 0
        && resettableIds.every((id) => selectedIds.includes(id));

    React.useEffect(() => {
        setSelectedIds((prev) => prev.filter((id) => resettableIds.includes(id)));
    }, [resettableIds]);

    const applyFilters = (e) => {
        e?.preventDefault();
        const url = new URL(window.location.href);
        if (search) url.searchParams.set('search', search);
        else url.searchParams.delete('search');
        if (statusFilter) url.searchParams.set('status', statusFilter);
        else url.searchParams.delete('status');
        if (moduleFilter) url.searchParams.set('training_module_id', moduleFilter);
        else url.searchParams.delete('training_module_id');
        if (attemptFilter) url.searchParams.set('attempt_number', attemptFilter);
        else url.searchParams.delete('attempt_number');
        if (dateFrom) url.searchParams.set('date_from', dateFrom);
        else url.searchParams.delete('date_from');
        if (dateTo) url.searchParams.set('date_to', dateTo);
        else url.searchParams.delete('date_to');
        window.location.href = url.toString();
    };

    const toggleSelectAll = () => {
        setSelectedIds(allResettableSelected ? [] : [...resettableIds]);
    };

    const toggleSelect = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const handleDelete = async (id, name) => {
        const confirm = await Swal.fire({
            title: 'Delete evaluation?',
            text: `Remove evaluation record for ${name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
        });
        if (!confirm.isConfirmed) return;

        const res = await fetch(`/admin/evaluations/results/${id}`, {
            method: 'DELETE',
            headers: { 'X-CSRF-TOKEN': csrf, Accept: 'application/json' },
        });
        if (res.ok) window.location.reload();
        else Swal.fire('Error', 'Could not delete record.', 'error');
    };

    const handleReset = async (row) => {
        const participantName = row.participant?.name || 'Participant';
        const moduleTitle = row.training_module?.title || 'Training Module';

        const confirm = await Swal.fire({
            title: 'Reset Training Attempt',
            html: `
                <div class="text-left text-sm text-slate-700 space-y-3">
                    <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
                        <p><span class="text-slate-500">Participant:</span> <strong>${participantName}</strong></p>
                        <p><span class="text-slate-500">Training Module:</span> <strong>${moduleTitle}</strong></p>
                    </div>
                    <div class="text-xs space-y-1">
                        <p class="font-semibold text-slate-800">This action will:</p>
                        <ul class="list-disc pl-4 space-y-0.5 text-slate-600">
                            <li>Reset the participant's lesson progress</li>
                            <li>Lock all lessons except Lesson 1</li>
                            <li>Reset the AI Scenario Training access</li>
                            <li>Allow the participant to start the training again</li>
                            <li>Preserve previous quiz attempts and evaluation history</li>
                        </ul>
                        <p class="text-rose-600 font-medium pt-1">This action cannot be undone.</p>
                    </div>
                </div>
            `,
            input: 'textarea',
            inputLabel: 'Reason (optional)',
            inputPlaceholder: 'e.g. Scheduled re-training',
            showCancelButton: true,
            confirmButtonText: 'Confirm Reset',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#059669',
        });

        if (!confirm.isConfirmed) return;

        const res = await fetch(`/admin/evaluations/results/${row.id}/reset`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': csrf,
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reason: confirm.value?.trim() || null }),
        });

        if (res.ok) {
            await Swal.fire({
                icon: 'success',
                title: 'Reset Complete',
                text: 'Training progress has been reset. The participant may begin re-training.',
                timer: 2500,
                showConfirmButton: false,
            });
            window.location.reload();
        } else {
            const data = await res.json().catch(() => ({}));
            Swal.fire('Error', data.message || 'Could not reset training progress.', 'error');
        }
    };

    const handleBulkReset = async () => {
        if (selectedIds.length === 0) {
            Swal.fire('No selection', 'Select at least one failed participant to reset.', 'info');
            return;
        }

        const confirm = await Swal.fire({
            title: `Reset ${selectedIds.length} failed participant${selectedIds.length === 1 ? '' : 's'}?`,
            text: 'This will restart their training progress while preserving evaluation history.',
            input: 'textarea',
            inputLabel: 'Reason (optional)',
            inputPlaceholder: 'e.g. Scheduled re-training',
            showCancelButton: true,
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#059669',
        });

        if (!confirm.isConfirmed) return;

        setBulkResetting(true);
        try {
            const res = await fetch('/admin/evaluations/reset-bulk', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrf,
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    evaluation_result_ids: selectedIds,
                    reason: confirm.value?.trim() || null,
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Bulk Reset Complete',
                    text: data.message || 'Selected participants have been reset.',
                    timer: 2500,
                    showConfirmButton: false,
                });
                window.location.reload();
            } else {
                Swal.fire('Error', data.message || 'Could not reset selected participants.', 'error');
            }
        } finally {
            setBulkResetting(false);
        }
    };

    const moduleChartData = {
        labels: (analytics?.by_module || []).map((m) => m.module_title),
        datasets: [{
            label: 'Average Score (%)',
            data: (analytics?.by_module || []).map((m) => m.average),
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderRadius: 6,
        }],
    };

    const passChartData = {
        labels: ['Passed', 'Failed'],
        datasets: [{
            data: [analytics?.pass_vs_failed?.passed || 0, analytics?.pass_vs_failed?.failed || 0],
            backgroundColor: ['#10b981', '#f43f5e'],
        }],
    };

    const trendChartData = {
        labels: (analytics?.monthly_trend || []).map((t) => t.month),
        datasets: [{
            label: 'Evaluations',
            data: (analytics?.monthly_trend || []).map((t) => t.count),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            fill: true,
            tension: 0.3,
        }],
    };

    return (
        <AdminPageShell>
            <AdminPageHeader
                icon={ClipboardList}
                title="Evaluation & Scoring System"
                description={
                    isParticipant
                        ? 'View your AI scenario training evaluation reports.'
                        : 'Automatic evaluation reports from AI Scenario Training with analytics and performance breakdown.'
                }
            />

            {!isParticipant && analytics && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <AdminStatCard label="Total Evaluations" value={analytics.total_evaluations} accent="slate" />
                        <AdminStatCard label="Average Score" value={`${analytics.average_score}%`} accent="emerald" />
                        <AdminStatCard label="Highest Score" value={`${analytics.highest_score}%`} accent="blue" />
                        <AdminStatCard label="Lowest Score" value={`${analytics.lowest_score}%`} accent="amber" />
                        <AdminStatCard label="Pass Rate" value={`${analytics.pass_rate}%`} accent="emerald" />
                        <AdminStatCard label="Participants" value={analytics.participant_count} accent="slate" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                        <AdminContentCard className="p-4">
                            <p className="text-xs font-semibold uppercase text-slate-500 mb-3">Average Score by Module</p>
                            <div className="h-48">
                                {(analytics.by_module || []).length > 0 ? (
                                    <Bar data={moduleChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { max: 100 } } }} />
                                ) : (
                                    <p className="text-sm text-slate-500 text-center py-16">No data yet</p>
                                )}
                            </div>
                        </AdminContentCard>
                        <AdminContentCard className="p-4">
                            <p className="text-xs font-semibold uppercase text-slate-500 mb-3">Pass vs Failed</p>
                            <div className="h-48 flex items-center justify-center">
                                {(analytics.total_evaluations || 0) > 0 ? (
                                    <Doughnut data={passChartData} options={{ maintainAspectRatio: false }} />
                                ) : (
                                    <p className="text-sm text-slate-500">No data yet</p>
                                )}
                            </div>
                        </AdminContentCard>
                        <AdminContentCard className="p-4">
                            <p className="text-xs font-semibold uppercase text-slate-500 mb-3">Monthly Trend</p>
                            <div className="h-48">
                                {(analytics?.monthly_trend || []).length > 0 ? (
                                    <Line data={trendChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                                ) : (
                                    <p className="text-sm text-slate-500 text-center py-16">No data yet</p>
                                )}
                            </div>
                        </AdminContentCard>
                        <AdminContentCard className="p-4">
                            <p className="text-xs font-semibold uppercase text-slate-500 mb-3">Top Performing Modules</p>
                            <div className="h-48">
                                {(analytics.top_modules || []).length > 0 ? (
                                    <Bar
                                        data={{
                                            labels: (analytics.top_modules || []).map((m) => m.module_title),
                                            datasets: [{
                                                label: 'Average Score (%)',
                                                data: (analytics.top_modules || []).map((m) => m.average),
                                                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                                                borderRadius: 6,
                                            }],
                                        }}
                                        options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { max: 100 } } }}
                                    />
                                ) : (
                                    <p className="text-sm text-slate-500 text-center py-16">No data yet</p>
                                )}
                            </div>
                        </AdminContentCard>
                    </div>
                </>
            )}

            <AdminCollapsibleFilterBar
                searchValue={search}
                onSearchChange={(e) => setSearch(e.target.value)}
                searchPlaceholder="Search participant, module, scenario..."
                hasActiveFilters={Boolean(statusFilter || moduleFilter || attemptFilter || dateFrom || dateTo)}
                onClearFilters={() => {
                    setStatusFilter('');
                    setModuleFilter('');
                    setAttemptFilter('');
                    setDateFrom('');
                    setDateTo('');
                }}
                onSearchSubmit={applyFilters}
                trailing={(
                    <>
                        <AdminPrimaryButton type="submit"><Search className="w-4 h-4" /> Apply</AdminPrimaryButton>
                        {!isParticipant && <AdminViewToggle viewMode={viewMode} onChange={setViewMode} />}
                        {isAdmin && resettableIds.length > 0 && (
                            <AdminSecondaryButton
                                type="button"
                                onClick={handleBulkReset}
                                disabled={bulkResetting || selectedIds.length === 0}
                                className="text-amber-800 border-amber-200 hover:bg-amber-50"
                            >
                                <RotateCcw className="w-4 h-4" />
                                {bulkResetting ? 'Resetting...' : `Reset Selected (${selectedIds.length})`}
                            </AdminSecondaryButton>
                        )}
                    </>
                )}
            >
                {!isParticipant && (
                    <>
                        <AdminFilterSelect label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="">All Status</option>
                            <option value="passed">Passed</option>
                            <option value="failed">Failed</option>
                            <option value="in_progress">In Progress</option>
                        </AdminFilterSelect>
                        <AdminFilterSelect label="Training Module" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
                            <option value="">All Modules</option>
                            {(modules || []).map((m) => (
                                <option key={m.id} value={m.id}>{m.title}</option>
                            ))}
                        </AdminFilterSelect>
                        <AdminFilterSelect label="Attempt" value={attemptFilter} onChange={(e) => setAttemptFilter(e.target.value)}>
                            <option value="">All Attempts</option>
                            {(attemptNumbers || []).map((num) => (
                                <option key={num} value={num}>Attempt #{num}</option>
                            ))}
                        </AdminFilterSelect>
                    </>
                )}
                <AdminFilterInput label="Date from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                <AdminFilterInput label="Date to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </AdminCollapsibleFilterBar>

            <p className="text-xs text-slate-500 -mt-2 mb-4 text-right">Passing score: {passingScore}%</p>

            <AdminContentCard>
                {viewMode === 'list' || isParticipant ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                                <tr>
                                    {isAdmin && resettableIds.length > 0 && (
                                        <th className="px-4 py-3 w-10">
                                            <input
                                                type="checkbox"
                                                checked={allResettableSelected}
                                                onChange={toggleSelectAll}
                                                title="Select all failed participants"
                                                className="rounded border-slate-300"
                                            />
                                        </th>
                                    )}
                                    {!isParticipant && <th className="text-left px-4 py-3">Participant</th>}
                                    <th className="text-left px-4 py-3">Training Module</th>
                                    <th className="text-left px-4 py-3">Scenario</th>
                                    <th className="text-left px-4 py-3">Difficulty</th>
                                    <th className="text-left px-4 py-3">Attempt</th>
                                    <th className="text-left px-4 py-3">Score</th>
                                    <th className="text-left px-4 py-3">%</th>
                                    <th className="text-left px-4 py-3">Status</th>
                                    <th className="text-left px-4 py-3">Duration</th>
                                    <th className="text-left px-4 py-3">Completed</th>
                                    <th className="text-right px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {(results || []).length === 0 ? (
                                    <tr>
                                        <td colSpan={isParticipant ? 10 : (isAdmin && resettableIds.length > 0 ? 12 : 11)} className="px-4 py-8 text-center text-slate-500">
                                            No evaluation records yet.
                                        </td>
                                    </tr>
                                ) : (
                                    results.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50/80">
                                            {isAdmin && resettableIds.length > 0 && (
                                                <td className="px-4 py-3">
                                                    {row.can_reset ? (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(row.id)}
                                                            onChange={() => toggleSelect(row.id)}
                                                            className="rounded border-slate-300"
                                                        />
                                                    ) : null}
                                                </td>
                                            )}
                                            {!isParticipant && (
                                                <td className="px-4 py-3 font-medium text-slate-900">{row.participant?.name || '—'}</td>
                                            )}
                                            <td className="px-4 py-3 text-slate-700">{row.training_module?.title || '—'}</td>
                                            <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate">{row.scenario_title}</td>
                                            <td className="px-4 py-3 capitalize text-slate-600">{row.difficulty}</td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {(() => {
                                                    const attemptNum = row.attempt_number ?? row.ai_scenario_attempt?.attempt_number;
                                                    return attemptNum ? `#${attemptNum}` : '—';
                                                })()}
                                            </td>
                                            <td className="px-4 py-3">{row.correct_answers}/{row.total_questions}</td>
                                            <td className="px-4 py-3 font-semibold">{Number(row.percentage).toFixed(1)}%</td>
                                            <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                                            <td className="px-4 py-3 text-xs text-slate-500">{formatDuration(row.duration_seconds ?? row.ai_scenario_attempt?.duration_seconds)}</td>
                                            <td className="px-4 py-3 text-xs text-slate-500">{row.completed_at ? new Date(row.completed_at).toLocaleString() : '—'}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-1 flex-wrap">
                                                    <a href={`/admin/evaluations/results/${row.id}`} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="View Result">
                                                        <Eye className="w-4 h-4" />
                                                    </a>
                                                    <button type="button" onClick={() => window.open(`/admin/evaluations/results/${row.id}?print=1`, '_blank')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="Print">
                                                        <Printer className="w-4 h-4" />
                                                    </button>
                                                    {isAdmin && row.can_reset && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleReset(row)}
                                                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-amber-800 hover:bg-amber-50 border border-amber-200"
                                                            title="Reset for Re-attempt"
                                                        >
                                                            <RotateCcw className="w-3.5 h-3.5" />
                                                            Reset
                                                        </button>
                                                    )}
                                                    {isAdmin && (
                                                        <button type="button" onClick={() => handleDelete(row.id, row.participant?.name)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-600" title="Delete">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {(results || []).map((row) => (
                            <div key={row.id} className="rounded-xl border border-slate-200 p-4 space-y-2 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start gap-2">
                                    <div>
                                        <p className="font-semibold text-slate-900">{row.participant?.name}</p>
                                        <p className="text-xs text-slate-500">{row.training_module?.title}</p>
                                    </div>
                                    <StatusBadge status={row.status} />
                                </div>
                                <p className="text-sm text-slate-700 line-clamp-2">{row.scenario_title}</p>
                                <p className="text-2xl font-bold text-emerald-700">{Number(row.percentage).toFixed(1)}%</p>
                                <div className="flex gap-2 pt-2 flex-wrap">
                                    <AdminPrimaryButton href={`/admin/evaluations/results/${row.id}`} className="text-xs py-1.5">View Result</AdminPrimaryButton>
                                    {row.can_reset && (
                                        <AdminSecondaryButton type="button" onClick={() => handleReset(row)} className="text-xs py-1.5 text-amber-800 border-amber-200">
                                            <RotateCcw className="w-3.5 h-3.5" /> Reset
                                        </AdminSecondaryButton>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </AdminContentCard>

            {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>
                        Page {pagination.current_page} of {pagination.last_page} ({pagination.total} records)
                    </span>
                    <div className="flex gap-2">
                        {pagination.current_page > 1 && (
                            <a
                                href={`?${new URLSearchParams({ ...filters, page: pagination.current_page - 1 }).toString()}`}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
                            >
                                Previous
                            </a>
                        )}
                        {pagination.current_page < pagination.last_page && (
                            <a
                                href={`?${new URLSearchParams({ ...filters, page: pagination.current_page + 1 }).toString()}`}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
                            >
                                Next
                            </a>
                        )}
                    </div>
                </div>
            )}
        </AdminPageShell>
    );
}
