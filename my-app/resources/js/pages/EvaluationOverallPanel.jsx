import React from 'react';
import { Award, BookOpen, ClipboardList, GraduationCap, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import {
    AdminCollapsibleFilterBar,
    AdminFilterInput,
    AdminFilterSelect,
    AdminPrimaryButton,
} from '../components/admin/AdminLayout';
import { AdminTablePagination } from '../components/admin/AdminDataTable';
import { buildPrintTableDocument, printHtmlDocument } from '../utils/printHtml';
import { EVALUATION_HUB_PRINT_EVENT } from './evaluationHubEvents';

function formatScoreFraction(score, total) {
    if (score == null) return '—';
    if (total == null || total === 0) return String(score);
    return `${score}/${total}`;
}

function formatDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
}

function StatCard({ label, value, hint, icon: Icon }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                    <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
                    {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
                </div>
                {Icon ? (
                    <span className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
                        <Icon className="h-5 w-5" />
                    </span>
                ) : null}
            </div>
        </div>
    );
}

function PassedTable({ title, columns, rows, emptyLabel, totalCount = null }) {
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.max(1, Math.ceil((rows || []).length / itemsPerPage));

    React.useEffect(() => {
        setCurrentPage(1);
    }, [rows]);

    const pageRows = (rows || []).slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );
    const listTotal = (rows || []).length;

    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                {totalCount != null ? (
                    <p className="text-xs text-slate-500">
                        {totalCount > listTotal
                            ? `Loaded ${listTotal} of ${totalCount}`
                            : `${totalCount} record${totalCount === 1 ? '' : 's'}`}
                    </p>
                ) : null}
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                            {columns.map((column) => (
                                <th key={column.key} className="px-4 py-3 font-semibold">{column.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {pageRows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                                    {emptyLabel}
                                </td>
                            </tr>
                        ) : (
                            pageRows.map((row, index) => (
                                <tr key={`${title}-${row.id ?? index}`} className="hover:bg-slate-50/80">
                                    {columns.map((column) => (
                                        <td key={column.key} className="px-4 py-3 text-slate-700">
                                            {column.render ? column.render(row) : (row[column.key] ?? '—')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {listTotal > 0 ? (
                <AdminTablePagination
                    pagination={{
                        current_page: currentPage,
                        last_page: totalPages,
                        per_page: itemsPerPage,
                        total: listTotal,
                        from: (currentPage - 1) * itemsPerPage + 1,
                        to: Math.min(currentPage * itemsPerPage, listTotal),
                    }}
                    onPageChange={setCurrentPage}
                />
            ) : null}
        </div>
    );
}

function participantLink(row) {
    if (!row.detail_href) return row.participant_name || '—';
    return (
        <a href={row.detail_href} className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline">
            {row.participant_name || '—'}
        </a>
    );
}

export function EvaluationOverallPanel({
    summary = {},
    lessonPassed = [],
    scenarioPassed = [],
    simulationPassed = [],
    modules = [],
    filters = {},
}) {
    const [search, setSearch] = React.useState(filters.search || '');
    const [participantName, setParticipantName] = React.useState(filters.participant_name || '');
    const [moduleFilter, setModuleFilter] = React.useState(filters.training_module_id || '');

    const applyFilters = (e) => {
        e?.preventDefault();
        const url = new URL(window.location.href);
        url.searchParams.set('tab', 'overall');
        if (search.trim()) url.searchParams.set('search', search.trim());
        else url.searchParams.delete('search');
        if (participantName.trim()) url.searchParams.set('participant_name', participantName.trim());
        else url.searchParams.delete('participant_name');
        if (moduleFilter) url.searchParams.set('training_module_id', moduleFilter);
        else url.searchParams.delete('training_module_id');
        url.searchParams.delete('page');
        window.location.href = url.toString();
    };

    const handlePrint = React.useCallback(() => {
        const moduleLabel = moduleFilter
            ? (modules || []).find((m) => String(m.id) === String(moduleFilter))?.title || moduleFilter
            : 'All Modules';

        const lessonRows = (lessonPassed || []).map((row, index) => [
            index + 1,
            'Lesson Quiz',
            row.participant_name || '—',
            row.module_title || '—',
            row.lesson_title || '—',
            formatScoreFraction(row.score, row.total_questions),
            formatDate(row.completed_at),
        ]);
        const scenarioRows = (scenarioPassed || []).map((row, index) => [
            index + 1,
            'Final Scenario',
            row.participant_name || '—',
            row.module_title || '—',
            '—',
            formatScoreFraction(row.score, row.total_questions),
            formatDate(row.completed_at),
        ]);
        const simulationRows = (simulationPassed || []).map((row, index) => [
            index + 1,
            'Simulation Event',
            row.participant_name || '—',
            row.event_title || '—',
            '—',
            row.average_score != null ? Number(row.average_score).toFixed(1) : '—',
            formatDate(row.submitted_at),
        ]);

        const html = buildPrintTableDocument({
            title: 'Overall Passed Participants',
            subtitle: `Printed ${new Date().toLocaleString()} · Module: ${moduleLabel}${participantName.trim() ? ` · Name: ${participantName.trim()}` : ''}${search.trim() ? ` · Search: ${search.trim()}` : ''} · Lesson passed: ${summary.lesson_quiz_passed ?? 0} (avg ${summary.lesson_quiz_average_percentage ?? '—'}%) · Scenario passed: ${summary.final_scenario_passed ?? 0} (avg ${summary.final_scenario_average_percentage ?? '—'}%) · Simulation passed: ${summary.simulation_event_passed ?? 0} (avg ${summary.simulation_event_average_score ?? '—'})`,
            headers: ['#', 'Stage', 'Participant', 'Module / Event', 'Lesson Title', 'Score', 'Date'],
            rows: [...lessonRows, ...scenarioRows, ...simulationRows],
        });

        if (!printHtmlDocument(html, 'Overall Passed Participants')) {
            Swal.fire('Unable to print', 'Could not prepare the print view. Please try again.', 'warning');
        }
    }, [moduleFilter, modules, lessonPassed, scenarioPassed, simulationPassed, summary, participantName, search]);

    React.useEffect(() => {
        const onPrint = () => handlePrint();
        window.addEventListener(EVALUATION_HUB_PRINT_EVENT, onPrint);
        return () => window.removeEventListener(EVALUATION_HUB_PRINT_EVENT, onPrint);
    }, [handlePrint]);

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                Overall shows who passed each stage in order: Lesson Quizzes → Final Scenario Evaluation → Simulation Event.
            </div>

            <AdminCollapsibleFilterBar
                searchValue={search}
                onSearchChange={(e) => setSearch(e.target.value)}
                searchPlaceholder="Search participant, email, module, lesson, or event..."
                hasActiveFilters={Boolean(moduleFilter || participantName.trim())}
                onClearFilters={() => {
                    setModuleFilter('');
                    setParticipantName('');
                }}
                onSearchSubmit={applyFilters}
                trailing={(
                    <AdminPrimaryButton type="submit">
                        <Search className="w-4 h-4" />
                        Apply
                    </AdminPrimaryButton>
                )}
            >
                <AdminFilterInput
                    label="Participant Name"
                    type="text"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    placeholder="Filter by participant name..."
                />
                <AdminFilterSelect label="Training Module" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
                    <option value="">All Modules</option>
                    {(modules || []).map((module) => (
                        <option key={module.id} value={module.id}>{module.title}</option>
                    ))}
                </AdminFilterSelect>
            </AdminCollapsibleFilterBar>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    label="Passed Lesson Quizzes"
                    value={summary.lesson_quiz_passed ?? 0}
                    hint={`${summary.lesson_quiz_attempts_passed ?? 0} passed attempts${summary.lesson_quiz_average_percentage != null ? ` · avg ${summary.lesson_quiz_average_percentage}%` : ''}`}
                    icon={BookOpen}
                />
                <StatCard
                    label="Passed Final Scenario"
                    value={summary.final_scenario_passed ?? 0}
                    hint={`${summary.final_scenario_results_passed ?? 0} passed results${summary.final_scenario_average_percentage != null ? ` · avg ${summary.final_scenario_average_percentage}%` : ''}`}
                    icon={GraduationCap}
                />
                <StatCard
                    label="Passed Simulation Event"
                    value={summary.simulation_event_passed ?? 0}
                    hint={`${summary.simulation_event_results_passed ?? 0} passed event scores${summary.simulation_event_average_score != null ? ` · avg ${summary.simulation_event_average_score}` : ''}`}
                    icon={ClipboardList}
                />
            </div>

            <PassedTable
                title="Passed Lesson Quizzes"
                emptyLabel="No passed lesson quiz attempts yet."
                rows={lessonPassed}
                totalCount={summary.lesson_quiz_attempts_passed ?? lessonPassed.length}
                columns={[
                    {
                        key: 'participant_name',
                        label: 'Participant',
                        render: (row) => participantLink(row),
                    },
                    { key: 'participant_email', label: 'Email' },
                    { key: 'module_title', label: 'Module' },
                    { key: 'lesson_title', label: 'Lesson Title' },
                    {
                        key: 'score',
                        label: 'Score',
                        render: (row) => formatScoreFraction(row.score, row.total_questions),
                    },
                    {
                        key: 'completed_at',
                        label: 'Completed',
                        render: (row) => formatDate(row.completed_at),
                    },
                ]}
            />

            <PassedTable
                title="Passed Final Scenario Evaluation"
                emptyLabel="No passed final scenario evaluations yet."
                rows={scenarioPassed}
                totalCount={summary.final_scenario_results_passed ?? scenarioPassed.length}
                columns={[
                    {
                        key: 'participant_name',
                        label: 'Participant',
                        render: (row) => participantLink(row),
                    },
                    { key: 'participant_email', label: 'Email' },
                    { key: 'module_title', label: 'Module' },
                    {
                        key: 'score',
                        label: 'Score',
                        render: (row) => formatScoreFraction(row.score, row.total_questions),
                    },
                    {
                        key: 'completed_at',
                        label: 'Completed',
                        render: (row) => formatDate(row.completed_at),
                    },
                ]}
            />

            <PassedTable
                title="Passed Simulation Event Evaluations"
                emptyLabel="No passed simulation event evaluations yet."
                rows={simulationPassed}
                totalCount={summary.simulation_event_results_passed ?? simulationPassed.length}
                columns={[
                    {
                        key: 'participant_name',
                        label: 'Participant',
                        render: (row) => participantLink(row),
                    },
                    { key: 'participant_email', label: 'Email' },
                    { key: 'event_title', label: 'Simulation Event' },
                    {
                        key: 'average_score',
                        label: 'Avg Score',
                        render: (row) => (
                            row.average_score != null
                                ? Number(row.average_score).toFixed(1)
                                : '—'
                        ),
                    },
                    {
                        key: 'eligible_for_certification',
                        label: 'Certification',
                        render: (row) => (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                row.eligible_for_certification
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-slate-100 text-slate-600'
                            }`}
                            >
                                <Award className="h-3.5 w-3.5" />
                                {row.eligible_for_certification ? 'Eligible' : 'Not Eligible'}
                            </span>
                        ),
                    },
                    {
                        key: 'submitted_at',
                        label: 'Submitted',
                        render: (row) => formatDate(row.submitted_at),
                    },
                ]}
            />
        </div>
    );
}
