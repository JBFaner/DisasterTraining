import React from 'react';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { evaluationsIndex } from '../utils/portalRoutes';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminContentCard,
    AdminSecondaryButton,
} from '../components/admin/AdminLayout';

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

function TrendText({ trend }) {
    if (!trend?.label) return null;
    const color = trend.direction === 'improved'
        ? 'text-emerald-700'
        : trend.direction === 'declined'
            ? 'text-rose-700'
            : 'text-slate-600';

    return <span className={`text-xs font-medium ${color}`}>{trend.label}</span>;
}

export function ParticipantEvaluationPortfolio({ portfolio = {}, passingScore = 75 }) {
    React.useEffect(() => {
        if (new URLSearchParams(window.location.search).get('print') === '1') {
            window.print();
        }
    }, []);

    const participant = portfolio.participant || {};
    const summary = portfolio.summary || {};
    const exportUrls = {
        download: '/participant/evaluations/portfolio/download',
    };

    const handlePrint = () => {
        const url = new URL(window.location.href);
        url.searchParams.set('print', '1');
        window.open(url.toString(), '_blank');
    };

    return (
        <AdminPageShell className="eval-portfolio-print">
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .eval-portfolio-print { padding: 0 !important; }
                }
            `}</style>

            <AdminPageHeader
                title="Evaluation Portfolio"
                description="Complete summary of your module assessments, event drills, and lesson quizzes."
                actions={
                    <div className="flex flex-wrap gap-2 no-print">
                        <AdminSecondaryButton href={evaluationsIndex('PARTICIPANT')}>
                            <ArrowLeft className="w-4 h-4" />
                            Back to Hub
                        </AdminSecondaryButton>
                        <AdminSecondaryButton href={exportUrls.download}>
                            <Download className="w-4 h-4" />
                            Download Summary
                        </AdminSecondaryButton>
                        <AdminSecondaryButton onClick={handlePrint}>
                            <Printer className="w-4 h-4" />
                            Print / Save PDF
                        </AdminSecondaryButton>
                    </div>
                }
            />

            <AdminContentCard className="p-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                    <div>
                        <p className="text-slate-500">Participant</p>
                        <p className="font-semibold text-slate-900">{participant.name || '—'}</p>
                    </div>
                    <div>
                        <p className="text-slate-500">Email</p>
                        <p className="font-semibold text-slate-900">{participant.email || '—'}</p>
                    </div>
                    <div>
                        <p className="text-slate-500">Generated</p>
                        <p className="font-semibold text-slate-900">{formatDate(portfolio.generated_at)}</p>
                    </div>
                    <div>
                        <p className="text-slate-500">Passing score</p>
                        <p className="font-semibold text-slate-900">{passingScore}%</p>
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-700">
                    <span><strong>{summary.module_count ?? 0}</strong> module assessments</span>
                    <span><strong>{summary.event_count ?? 0}</strong> event drills</span>
                    <span><strong>{summary.lesson_count ?? 0}</strong> lesson quizzes</span>
                </div>
            </AdminContentCard>

            {(portfolio.attempt_trends || []).length > 0 && (
                <AdminContentCard className="p-5">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Attempt Trends</h2>
                    <ul className="space-y-2 text-sm">
                        {portfolio.attempt_trends.map((trend, index) => (
                            <li key={`${trend.module_title}-${index}`} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 last:border-0">
                                <span className="font-medium text-slate-900">{trend.module_title || 'Module'}</span>
                                <TrendText trend={trend} />
                            </li>
                        ))}
                    </ul>
                </AdminContentCard>
            )}

            <PortfolioSection
                title="Module Assessments (AI Scenario)"
                rows={portfolio.module_assessments || []}
                renderRow={(row) => (
                    <>
                        <td className="px-3 py-2 font-medium">{row.module_title}</td>
                        <td className="px-3 py-2">#{row.attempt_number ?? '—'}</td>
                        <td className="px-3 py-2">{Number(row.percentage ?? 0).toFixed(1)}%</td>
                        <td className="px-3 py-2 capitalize">{row.status}</td>
                        <td className="px-3 py-2"><TrendText trend={row.trend} /></td>
                        <td className="px-3 py-2 text-slate-500">{formatDate(row.completed_at)}</td>
                    </>
                )}
                columns={['Module', 'Attempt', 'Score', 'Result', 'Trend', 'Completed']}
            />

            <PortfolioSection
                title="Event Drill Evaluations"
                rows={portfolio.event_drills || []}
                renderRow={(row) => (
                    <>
                        <td className="px-3 py-2 font-medium">{row.title}</td>
                        <td className="px-3 py-2">{row.percentage != null ? `${Number(row.percentage).toFixed(1)}%` : '—'}</td>
                        <td className="px-3 py-2 capitalize">{row.result || '—'}</td>
                        <td className="px-3 py-2">{row.competency_rating || '—'}</td>
                        <td className="px-3 py-2 text-slate-500">{formatDate(row.submitted_at)}</td>
                    </>
                )}
                columns={['Event', 'Score', 'Result', 'Competency', 'Evaluated']}
            />

            <PortfolioSection
                title="Lesson Quizzes"
                rows={portfolio.lesson_quizzes || []}
                renderRow={(row) => (
                    <>
                        <td className="px-3 py-2 font-medium">{row.lesson_title}</td>
                        <td className="px-3 py-2">{row.module_title || '—'}</td>
                        <td className="px-3 py-2">#{row.attempt_number ?? '—'}</td>
                        <td className="px-3 py-2">{row.percentage != null ? `${Number(row.percentage).toFixed(1)}%` : '—'}</td>
                        <td className="px-3 py-2">{row.passed ? 'Passed' : 'Failed'}</td>
                        <td className="px-3 py-2 text-slate-500">{formatDate(row.completed_at)}</td>
                    </>
                )}
                columns={['Lesson', 'Module', 'Attempt', 'Score', 'Result', 'Completed']}
            />
        </AdminPageShell>
    );
}

function PortfolioSection({ title, rows, columns, renderRow }) {
    return (
        <AdminContentCard className="overflow-hidden">
            <div className="border-b border-slate-200 px-4 py-3">
                <h2 className="text-sm font-bold text-slate-900">{title}</h2>
            </div>
            {rows.length === 0 ? (
                <p className="px-4 py-6 text-sm text-slate-500">No records in this section.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                                {columns.map((col) => (
                                    <th key={col} className="px-3 py-2 font-semibold">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.map((row, index) => (
                                <tr key={index}>{renderRow(row)}</tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </AdminContentCard>
    );
}
