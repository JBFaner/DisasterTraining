import React from 'react';
import Swal from 'sweetalert2';
import { ClipboardList, Printer, Star, CheckCircle2, XCircle, ArrowLeft, RotateCcw } from 'lucide-react';
import {
    resolveQuestionsForLocale,
    resolveScenarioTitle,
} from '../utils/aiScenarioLocale';
import { AiScenarioLanguageSwitcher } from '../components/AiScenarioLanguageSwitcher';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminContentCard,
    AdminPrimaryButton,
    AdminSecondaryButton,
    AdminStatCard,
} from '../components/admin/AdminLayout';

const COMPETENCY_LABELS = {
    knowledge: 'Knowledge',
    decision_making: 'Decision Making',
    emergency_response: 'Emergency Response',
    safety_awareness: 'Safety Awareness',
};

function StarRating({ value = 0 }) {
    return (
        <div className="flex gap-0.5" aria-label={`${value} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-4 h-4 ${star <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
                />
            ))}
        </div>
    );
}

function CircularProgress({ percentage, passingScore = 75 }) {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const passed = percentage >= passingScore;

    return (
        <div className="relative w-36 h-36 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
                <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke={passed ? '#10b981' : '#f59e0b'}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900">{percentage.toFixed(1)}%</span>
                <span className="text-[0.65rem] uppercase text-slate-500">Score</span>
            </div>
        </div>
    );
}

export function EvaluationResultDetail({ result, passingScore = 75 }) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';

    React.useEffect(() => {
        if (new URLSearchParams(window.location.search).get('print') === '1') {
            window.print();
        }
    }, []);

    if (!result) {
        return (
            <AdminPageShell>
                <p className="text-slate-600">Evaluation not found.</p>
            </AdminPageShell>
        );
    }

    const passed = result.status === 'passed';
    const canReset = Boolean(result.can_reset);

    const handleReset = async () => {
        const participantName = result.participant?.name || 'Participant';
        const moduleTitle = result.training_module?.title || 'Training Module';

        const confirm = await Swal.fire({
            title: 'Reset Training Attempt',
            html: `
                <div class="text-left text-sm text-slate-700 space-y-3">
                    <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
                        <p><span class="text-slate-500">Participant:</span> <strong>${participantName}</strong></p>
                        <p><span class="text-slate-500">Training Module:</span> <strong>${moduleTitle}</strong></p>
                    </div>
                    <p class="text-xs text-rose-600 font-medium">This action cannot be undone. Evaluation history will be preserved.</p>
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

        const res = await fetch(`/admin/evaluations/results/${result.id}/reset`, {
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
                text: 'Training progress has been reset.',
                timer: 2000,
                showConfirmButton: false,
            });
            window.location.href = '/admin/evaluations/training-results';
        } else {
            const data = await res.json().catch(() => ({}));
            Swal.fire('Error', data.message || 'Could not reset training progress.', 'error');
        }
    };

    const [displayLanguage, setDisplayLanguage] = React.useState(result.display_language || result.generated_language || 'en');
    const rawQuestions = result.generated_questions || [];
    const questions = React.useMemo(
        () => resolveQuestionsForLocale(rawQuestions, displayLanguage, { includeAnswers: true }),
        [rawQuestions, displayLanguage],
    );
    const answers = result.participant_answers || {};
    const competencies = {
        knowledge: result.knowledge_score,
        decision_making: result.decision_making_score,
        emergency_response: result.emergency_response_score,
        safety_awareness: result.safety_awareness_score,
    };

    return (
        <AdminPageShell className="print:space-y-2">
            <div className="flex items-center justify-between print:hidden mb-1">
                <a href="/admin/evaluations/training-results" className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900">
                    <ArrowLeft className="w-4 h-4" /> Back to Evaluations
                </a>
                <div className="flex items-center gap-2">
                    {canReset && (
                        <AdminSecondaryButton type="button" onClick={handleReset} className="text-amber-800 border-amber-200 hover:bg-amber-50">
                            <RotateCcw className="w-4 h-4" /> Reset for Re-attempt
                        </AdminSecondaryButton>
                    )}
                    <AiScenarioLanguageSwitcher value={displayLanguage} onChange={setDisplayLanguage} />
                    <AdminSecondaryButton type="button" onClick={() => window.print()}>
                        <Printer className="w-4 h-4" /> Print Evaluation
                    </AdminSecondaryButton>
                </div>
            </div>

            <AdminPageHeader
                icon={ClipboardList}
                title="Evaluation Report"
                description={resolveScenarioTitle(result, displayLanguage) || result.scenario_title}
            />

            {/* Section 1 — Participant Information */}
            <AdminContentCard className="p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Participant Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div><span className="text-slate-500">Participant</span><p className="font-medium text-slate-900">{result.participant?.name}</p></div>
                    <div><span className="text-slate-500">Email</span><p className="font-medium text-slate-900">{result.participant?.email}</p></div>
                    <div><span className="text-slate-500">Training Module</span><p className="font-medium text-slate-900">{result.training_module?.title}</p></div>
                    <div><span className="text-slate-500">Scenario</span><p className="font-medium text-slate-900">{result.scenario_title}</p></div>
                    <div><span className="text-slate-500">Difficulty</span><p className="font-medium text-slate-900 capitalize">{result.difficulty}</p></div>
                    <div><span className="text-slate-500">Attempt Number</span><p className="font-medium text-slate-900">{(() => {
                        const attemptNum = result.attempt_number ?? result.ai_scenario_attempt?.attempt_number;
                        return attemptNum ? `#${attemptNum}` : '—';
                    })()}</p></div>
                    <div><span className="text-slate-500">Duration</span><p className="font-medium text-slate-900">{(() => {
                        const seconds = result.duration_seconds ?? result.ai_scenario_attempt?.duration_seconds;
                        if (seconds == null) return '—';
                        return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
                    })()}</p></div>
                    <div><span className="text-slate-500">Date Completed</span><p className="font-medium text-slate-900">{result.completed_at ? new Date(result.completed_at).toLocaleString() : '—'}</p></div>
                </div>
            </AdminContentCard>

            {/* Section 2 — Score Summary */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <AdminStatCard label="Total Questions" value={result.total_questions} />
                <AdminStatCard label="Correct" value={result.correct_answers} accent="emerald" />
                <AdminStatCard label="Wrong" value={result.wrong_answers} accent="amber" />
                <AdminStatCard label="Score" value={`${result.correct_answers}/${result.total_questions}`} />
                <AdminStatCard label="Percentage" value={`${Number(result.percentage).toFixed(1)}%`} accent="emerald" />
                <AdminStatCard
                    label="Status"
                    value={passed ? 'Passed' : 'Needs Improvement'}
                    hint={`Passing: ${passingScore}%`}
                    accent={passed ? 'emerald' : 'amber'}
                />
            </div>

            {/* Section 3 & 4 — Performance + Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <AdminContentCard className="p-5">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Performance Breakdown</h2>
                    <div className="space-y-4">
                        {Object.entries(competencies).map(([key, score]) => (
                            <div key={key} className="flex items-center justify-between gap-4">
                                <span className="text-sm font-medium text-slate-800">{COMPETENCY_LABELS[key]}</span>
                                <StarRating value={score} />
                            </div>
                        ))}
                    </div>
                </AdminContentCard>
                <AdminContentCard className="p-5 flex flex-col items-center justify-center gap-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 self-start">Progress</h2>
                    <CircularProgress percentage={Number(result.percentage)} passingScore={passingScore} />
                    <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div
                            className={`h-full rounded-full ${passed ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${Math.min(100, Number(result.percentage))}%` }}
                        />
                    </div>
                    <div className={`inline-flex items-center gap-2 text-sm font-semibold ${passed ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {passed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        {passed ? 'Passed' : 'Needs Improvement'}
                    </div>
                </AdminContentCard>
            </div>

            {/* Section 5 — AI Feedback */}
            <AdminContentCard className="p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">AI Feedback</h2>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{result.feedback || 'No feedback available.'}</p>
            </AdminContentCard>

            {/* Section 6 — Recommendations */}
            <AdminContentCard className="p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Recommendations</h2>
                <ul className="space-y-2">
                    {(result.recommendations || []).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-emerald-600 mt-0.5">•</span>
                            <span className={item.includes('Eligible') ? 'font-semibold text-emerald-700' : ''}>{item}</span>
                        </li>
                    ))}
                </ul>
            </AdminContentCard>

            {/* Section 7 — Question Review */}
            <AdminContentCard className="p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Question Review</h2>
                <div className="space-y-4">
                    {questions.map((q) => {
                        const num = String(q.number);
                        const given = answers[num];
                        const correct = q.correct_answer;
                        const isRight = given === correct;
                        return (
                            <div key={num} className="rounded-lg border border-slate-200 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                    <p className="font-medium text-slate-900">Q{q.number}. {q.question}</p>
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isRight ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                        {isRight ? 'Correct' : 'Incorrect'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 mb-2">
                                    <p><span className="font-semibold">Your answer:</span> {given || '—'}</p>
                                    <p><span className="font-semibold">Correct answer:</span> {correct}</p>
                                </div>
                                {q.explanation && (
                                    <p className="text-xs text-slate-600 bg-slate-50 rounded p-2">{q.explanation}</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </AdminContentCard>
        </AdminPageShell>
    );
}
