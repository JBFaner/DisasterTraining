import React from 'react';
import {
    ArrowLeft,
    CalendarClock,
    ClipboardList,
    MapPin,
    Printer,
} from 'lucide-react';
import { evaluationsIndexWithTab } from '../utils/portalRoutes';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminContentCard,
    AdminSecondaryButton,
    AdminStatCard,
} from '../components/admin/AdminLayout';

function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function competencyBadgeClass(rating) {
    switch (rating) {
        case 'Excellent':
            return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'Good':
            return 'bg-sky-100 text-sky-800 border-sky-200';
        case 'Satisfactory':
            return 'bg-amber-100 text-amber-800 border-amber-200';
        default:
            return 'bg-rose-100 text-rose-800 border-rose-200';
    }
}

function ScoreBar({ score, maxScore = 10 }) {
    const pct = maxScore > 0 ? Math.min(100, ((score ?? 0) / maxScore) * 100) : 0;
    return (
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
                className={`h-full rounded-full transition-all ${pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

export function ParticipantEventEvaluationDetail({ report = {} }) {
    React.useEffect(() => {
        if (new URLSearchParams(window.location.search).get('print') === '1') {
            window.print();
        }
    }, []);

    const backHref = evaluationsIndexWithTab('PARTICIPANT', 'events');
    const event = report.event ?? {};
    const passed = report.result === 'passed';
    const passThreshold = report.pass_threshold ?? 75;
    const averageScore = report.average_score ?? 0;
    const scores = report.scores ?? [];
    const criteria = report.criteria ?? [];
    const maxTotal = scores.reduce((sum, item) => sum + (item.max_score ?? 10), 0)
        || (criteria.length > 0 ? criteria.length * 10 : 0);

    const handlePrint = () => {
        const url = new URL(window.location.href);
        url.searchParams.set('print', '1');
        window.open(url.toString(), '_blank');
    };

    if (!report.id) {
        return (
            <AdminPageShell>
                <p className="text-slate-600">Evaluation report not found.</p>
            </AdminPageShell>
        );
    }

    return (
        <AdminPageShell className="event-eval-print">
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .event-eval-print { padding: 0 !important; }
                }
            `}</style>

            <AdminPageHeader
                title="Event Drill Evaluation"
                description="Your performance breakdown from the simulation event evaluation."
                icon={ClipboardList}
                actions={
                    <div className="flex flex-wrap gap-2 no-print">
                        <AdminSecondaryButton href={backHref}>
                            <ArrowLeft className="w-4 h-4" />
                            Back to Evaluations
                        </AdminSecondaryButton>
                        <AdminSecondaryButton onClick={handlePrint}>
                            <Printer className="w-4 h-4" />
                            Print Report
                        </AdminSecondaryButton>
                    </div>
                }
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <AdminStatCard
                    label="Overall Score"
                    value={`${Number(averageScore).toFixed(1)}%`}
                    hint={`Pass threshold: ${passThreshold}%`}
                    accent={passed ? 'emerald' : 'amber'}
                />
                <AdminStatCard
                    label="Result"
                    value={passed ? 'Passed' : 'Failed'}
                    accent={passed ? 'emerald' : 'amber'}
                />
                <AdminStatCard
                    label="Competency"
                    value={report.competency_rating || '—'}
                    accent="blue"
                />
                <AdminStatCard
                    label="Certification"
                    value={report.is_eligible_for_certification ? 'Eligible' : 'Not eligible'}
                    accent={report.is_eligible_for_certification ? 'emerald' : 'slate'}
                />
            </div>

            <AdminContentCard className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <CalendarClock className="w-3.5 h-3.5" />
                            Simulation Event
                        </div>
                        <h2 className="mt-1 text-xl font-semibold text-slate-900">{event.title || 'Simulation Event'}</h2>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                            {event.disaster_type && <span>Type: {event.disaster_type}</span>}
                            {event.event_date && <span>Date: {formatDate(event.event_date)}</span>}
                            {event.scenario?.title && <span>Scenario: {event.scenario.title}</span>}
                            {event.venue && (
                                <span className="inline-flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {event.venue}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        <p>
                            <span className="font-medium text-slate-800">Evaluated:</span>{' '}
                            {formatDateTime(report.submitted_at)}
                        </p>
                        {report.evaluator?.name && (
                            <p className="mt-1">
                                <span className="font-medium text-slate-800">Evaluator:</span> {report.evaluator.name}
                            </p>
                        )}
                        {report.attendance_status && (
                            <p className="mt-1">
                                <span className="font-medium text-slate-800">Attendance:</span>{' '}
                                <span className="capitalize">{report.attendance_status}</span>
                            </p>
                        )}
                        {report.total_score != null && maxTotal > 0 && (
                            <p className="mt-1">
                                <span className="font-medium text-slate-800">Raw score:</span>{' '}
                                {Number(report.total_score).toFixed(1)} / {maxTotal}
                            </p>
                        )}
                    </div>
                </div>

                {report.competency_rating && (
                    <div className="mt-4">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${competencyBadgeClass(report.competency_rating)}`}>
                            Competency: {report.competency_rating}
                        </span>
                    </div>
                )}
            </AdminContentCard>

            <AdminContentCard className="p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Criteria Breakdown</h2>
                {scores.length === 0 ? (
                    <p className="text-sm text-slate-500">No criterion scores recorded for this evaluation.</p>
                ) : (
                    <div className="space-y-4">
                        {scores.map((item, index) => (
                            <div key={`${item.criterion_name}-${index}`} className="rounded-xl border border-slate-200 p-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">{item.criterion_name}</h3>
                                        {item.criterion_description && (
                                            <p className="mt-1 text-xs text-slate-500">{item.criterion_description}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-slate-900">
                                            {item.score != null ? Number(item.score).toFixed(1) : '—'}
                                            <span className="text-sm font-medium text-slate-500">
                                                {' '}
                                                / {item.max_score ?? 10}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <ScoreBar score={item.score} maxScore={item.max_score ?? 10} />
                                </div>
                                {item.comment && (
                                    <p className="mt-3 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-700">
                                        <span className="font-medium text-slate-800">Evaluator note:</span> {item.comment}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </AdminContentCard>

            {report.overall_feedback && (
                <AdminContentCard className="p-5">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Overall Feedback</h2>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{report.overall_feedback}</p>
                </AdminContentCard>
            )}
        </AdminPageShell>
    );
}
