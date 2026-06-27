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
    Filter,
    LayoutGrid,
    List,
} from 'lucide-react';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminFilterBar,
    AdminPrimaryButton,
    AdminSecondaryButton,
    AdminSearchInput,
    AdminViewToggle,
    AdminContentCard,
    AdminStatCard,
    adminSelectClass,
    adminCompactInputClass,
} from '../components/admin/AdminLayout';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

function StatusBadge({ status }) {
    const passed = status === 'passed';
    return (
        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
            passed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
        }`}>
            {passed ? 'Passed' : 'Needs Improvement'}
        </span>
    );
}

export function EvaluationResultsIndex({
    results = [],
    pagination = null,
    analytics = null,
    modules = [],
    filters = {},
    passingScore = 75,
    role = 'LGU_ADMIN',
}) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const isParticipant = role === 'PARTICIPANT';
    const [viewMode, setViewMode] = React.useState('list');
    const [search, setSearch] = React.useState(filters.search || '');
    const [statusFilter, setStatusFilter] = React.useState(filters.status || '');
    const [moduleFilter, setModuleFilter] = React.useState(filters.training_module_id || '');
    const [dateFrom, setDateFrom] = React.useState(filters.date_from || '');
    const [dateTo, setDateTo] = React.useState(filters.date_to || '');

    const applyFilters = (e) => {
        e?.preventDefault();
        const url = new URL(window.location.href);
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
        window.location.href = url.toString();
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

        const res = await fetch(`/evaluations/results/${id}`, {
            method: 'DELETE',
            headers: { 'X-CSRF-TOKEN': csrf, Accept: 'application/json' },
        });
        if (res.ok) window.location.reload();
        else Swal.fire('Error', 'Could not delete record.', 'error');
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
        labels: ['Passed', 'Needs Improvement'],
        datasets: [{
            data: [analytics?.pass_vs_failed?.passed || 0, analytics?.pass_vs_failed?.failed || 0],
            backgroundColor: ['#10b981', '#f59e0b'],
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
                            <p className="text-xs font-semibold uppercase text-slate-500 mb-3">Pass vs Needs Improvement</p>
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
                                {(analytics.monthly_trend || []).length > 0 ? (
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

            <AdminFilterBar>
                <form onSubmit={applyFilters} className="flex flex-col gap-3">
                    <div className="flex flex-col lg:flex-row gap-3">
                        <AdminSearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search participant, module, scenario..." />
                        {!isParticipant && (
                            <>
                                <select className={adminSelectClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                    <option value="">All Status</option>
                                    <option value="passed">Passed</option>
                                    <option value="needs_improvement">Needs Improvement</option>
                                </select>
                                <select className={adminSelectClass} value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
                                    <option value="">All Modules</option>
                                    {(modules || []).map((m) => (
                                        <option key={m.id} value={m.id}>{m.title}</option>
                                    ))}
                                </select>
                            </>
                        )}
                        <input type="date" className={adminCompactInputClass} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                        <input type="date" className={adminCompactInputClass} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                        <AdminPrimaryButton type="submit"><Search className="w-4 h-4" /> Apply Filters</AdminPrimaryButton>
                        {!isParticipant && <AdminViewToggle viewMode={viewMode} onChange={setViewMode} />}
                        <span className="text-xs text-slate-500 ml-auto">Passing score: {passingScore}%</span>
                    </div>
                </form>
            </AdminFilterBar>

            <AdminContentCard>
                {viewMode === 'list' || isParticipant ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                                <tr>
                                    {!isParticipant && <th className="text-left px-4 py-3">Participant</th>}
                                    <th className="text-left px-4 py-3">Training Module</th>
                                    <th className="text-left px-4 py-3">Scenario</th>
                                    <th className="text-left px-4 py-3">Difficulty</th>
                                    <th className="text-left px-4 py-3">Score</th>
                                    <th className="text-left px-4 py-3">%</th>
                                    <th className="text-left px-4 py-3">Status</th>
                                    <th className="text-left px-4 py-3">Completed</th>
                                    <th className="text-right px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {(results || []).length === 0 ? (
                                    <tr><td colSpan={isParticipant ? 8 : 9} className="px-4 py-8 text-center text-slate-500">No evaluation records yet.</td></tr>
                                ) : (
                                    results.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50/80">
                                            {!isParticipant && (
                                                <td className="px-4 py-3 font-medium text-slate-900">{row.participant?.name || '—'}</td>
                                            )}
                                            <td className="px-4 py-3 text-slate-700">{row.training_module?.title || '—'}</td>
                                            <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate">{row.scenario_title}</td>
                                            <td className="px-4 py-3 capitalize text-slate-600">{row.difficulty}</td>
                                            <td className="px-4 py-3">{row.correct_answers}/{row.total_questions}</td>
                                            <td className="px-4 py-3 font-semibold">{Number(row.percentage).toFixed(1)}%</td>
                                            <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                                            <td className="px-4 py-3 text-xs text-slate-500">{row.completed_at ? new Date(row.completed_at).toLocaleString() : '—'}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-1">
                                                    <a href={`/evaluations/results/${row.id}`} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="View"><Eye className="w-4 h-4" /></a>
                                                    <button type="button" onClick={() => window.open(`/evaluations/results/${row.id}?print=1`, '_blank')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="Print"><Printer className="w-4 h-4" /></button>
                                                    {!isParticipant && role === 'LGU_ADMIN' && (
                                                        <button type="button" onClick={() => handleDelete(row.id, row.participant?.name)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
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
                                <div className="flex gap-2 pt-2">
                                    <AdminPrimaryButton href={`/evaluations/results/${row.id}`} className="text-xs py-1.5">View</AdminPrimaryButton>
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
