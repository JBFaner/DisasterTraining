import React from 'react';
import { Award, BookOpen, ClipboardList, GraduationCap } from 'lucide-react';
import Swal from 'sweetalert2';
import { AdminFilterSelect } from '../components/admin/AdminLayout';
import { buildPrintTableDocument, printHtmlDocument } from '../utils/printHtml';
import { EVALUATION_HUB_PRINT_EVENT } from './evaluationHubEvents';

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

function PassedTable({ title, columns, rows, emptyLabel }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-3">
                <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
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
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                                    {emptyLabel}
                                </td>
                            </tr>
                        ) : (
                            rows.map((row, index) => (
                                <tr key={`${title}-${index}`} className="hover:bg-slate-50/80">
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
        </div>
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
    const [moduleFilter, setModuleFilter] = React.useState(filters.training_module_id || '');

    const applyModuleFilter = (value) => {
        setModuleFilter(value);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', 'overall');
        if (value) url.searchParams.set('training_module_id', value);
        else url.searchParams.delete('training_module_id');
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
            row.percentage != null ? `${row.percentage}%` : '—',
            formatDate(row.completed_at),
        ]);
        const scenarioRows = (scenarioPassed || []).map((row, index) => [
            index + 1,
            'Final Scenario',
            row.participant_name || '—',
            row.module_title || '—',
            '—',
            row.score != null ? `${row.score}%` : '—',
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
            subtitle: `Printed ${new Date().toLocaleString()} · Module: ${moduleLabel} · Lesson passed: ${summary.lesson_quiz_passed ?? 0} · Scenario passed: ${summary.final_scenario_passed ?? 0} · Simulation passed: ${summary.simulation_event_passed ?? 0}`,
            headers: ['#', 'Stage', 'Participant', 'Module / Event', 'Lesson', 'Score', 'Date'],
            rows: [...lessonRows, ...scenarioRows, ...simulationRows],
        });

        if (!printHtmlDocument(html, 'Overall Passed Participants')) {
            Swal.fire('Unable to print', 'Could not prepare the print view. Please try again.', 'warning');
        }
    }, [moduleFilter, modules, lessonPassed, scenarioPassed, simulationPassed, summary]);

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

            <div className="max-w-xs w-full">
                <AdminFilterSelect
                    label="Filter by Module"
                    value={moduleFilter}
                    onChange={(e) => applyModuleFilter(e.target.value)}
                >
                    <option value="">All Modules</option>
                    {(modules || []).map((module) => (
                        <option key={module.id} value={module.id}>{module.title}</option>
                    ))}
                </AdminFilterSelect>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    label="Passed Lesson Quizzes"
                    value={summary.lesson_quiz_passed ?? 0}
                    hint={`${summary.lesson_quiz_attempts_passed ?? 0} passed attempts`}
                    icon={BookOpen}
                />
                <StatCard
                    label="Passed Final Scenario"
                    value={summary.final_scenario_passed ?? 0}
                    hint={`${summary.final_scenario_results_passed ?? 0} passed results`}
                    icon={GraduationCap}
                />
                <StatCard
                    label="Passed Simulation Event"
                    value={summary.simulation_event_passed ?? 0}
                    hint={`${summary.simulation_event_results_passed ?? 0} passed event scores`}
                    icon={ClipboardList}
                />
            </div>

            <PassedTable
                title="Passed Lesson Quizzes"
                emptyLabel="No passed lesson quiz attempts yet."
                rows={lessonPassed}
                columns={[
                    { key: 'participant_name', label: 'Participant' },
                    { key: 'participant_email', label: 'Email' },
                    { key: 'module_title', label: 'Module' },
                    { key: 'lesson_title', label: 'Lesson' },
                    {
                        key: 'percentage',
                        label: 'Score',
                        render: (row) => (row.percentage != null ? `${row.percentage}%` : '—'),
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
                columns={[
                    { key: 'participant_name', label: 'Participant' },
                    { key: 'participant_email', label: 'Email' },
                    { key: 'module_title', label: 'Module' },
                    {
                        key: 'score',
                        label: 'Score',
                        render: (row) => (row.score != null ? `${row.score}%` : '—'),
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
                columns={[
                    { key: 'participant_name', label: 'Participant' },
                    { key: 'participant_email', label: 'Email' },
                    { key: 'event_title', label: 'Simulation Event' },
                    {
                        key: 'average_score',
                        label: 'Average Score',
                        render: (row) => (row.average_score != null ? Number(row.average_score).toFixed(1) : '—'),
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
