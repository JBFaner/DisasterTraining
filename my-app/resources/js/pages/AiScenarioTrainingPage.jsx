import React from 'react';
import Swal from 'sweetalert2';
import {
    Sparkles,
    ChevronLeft,
    ChevronRight,
    Clock,
    Lock,
    CheckCircle2,
    XCircle,
    Loader2,
} from 'lucide-react';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminPrimaryButton,
    AdminSecondaryButton,
    AdminContentCard,
} from '../components/admin/AdminLayout';
import { AiScenarioLanguageSwitcher } from '../components/AiScenarioLanguageSwitcher';
import {
    loadPersistedLanguage,
    persistLanguage,
    resolveLearningObjectives,
    resolveQuestionForLocale,
    resolveQuestionsForLocale,
    resolveScenarioDescription,
    resolveScenarioTitle,
} from '../utils/aiScenarioLocale';

const PASS_PERCENTAGE = 75;

export function AiScenarioTrainingPage({ attempt, module }) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const rawQuestions = attempt?.generated_questions || [];
    const isCompleted = Boolean(attempt?.completed_at);
    const defaultLanguage = attempt?.display_language || attempt?.generated_language || 'en';

    const [displayLanguage, setDisplayLanguage] = React.useState(() =>
        loadPersistedLanguage(attempt?.id, defaultLanguage),
    );
    const [step, setStep] = React.useState(isCompleted ? 'results' : 'scenario');
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [answers, setAnswers] = React.useState({});
    const [submitting, setSubmitting] = React.useState(false);
    const [elapsedSeconds, setElapsedSeconds] = React.useState(0);

    const questions = React.useMemo(
        () => resolveQuestionsForLocale(rawQuestions, displayLanguage, { includeAnswers: isCompleted }),
        [rawQuestions, displayLanguage, isCompleted],
    );
    const totalQuestions = questions.length;
    const scenarioTitle = resolveScenarioTitle(attempt, displayLanguage);
    const scenarioDescription = resolveScenarioDescription(attempt, displayLanguage);
    const learningObjectives = resolveLearningObjectives(attempt, displayLanguage);

    React.useEffect(() => {
        persistLanguage(attempt?.id, displayLanguage);
    }, [attempt?.id, displayLanguage]);

    React.useEffect(() => {
        if (step !== 'quiz' || isCompleted) return undefined;
        const timer = window.setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
        return () => window.clearInterval(timer);
    }, [step, isCompleted]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
    };

    const answeredCount = Object.keys(answers).filter((k) => answers[k]).length;
    const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
    const currentQuestion = questions[currentIndex];

    const setAnswer = (questionNumber, letter) => {
        setAnswers((prev) => ({ ...prev, [String(questionNumber)]: letter }));
    };

    const handleSubmit = async () => {
        const unanswered = questions.filter((q) => !answers[String(q.number)]);
        if (unanswered.length > 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Incomplete answers',
                text: `Please answer all ${totalQuestions} questions before submitting.`,
            });
            return;
        }

        const confirm = await Swal.fire({
            title: 'Submit assessment?',
            text: 'You cannot change your answers after submitting.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Submit',
            confirmButtonColor: '#059669',
        });

        if (!confirm.isConfirmed) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/ai-scenario-attempts/${attempt.id}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    Accept: 'application/json',
                },
                body: JSON.stringify({ answers, display_language: displayLanguage }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Submit failed');
            window.location.href = data.redirect || `/evaluations/results/${data.evaluation_result_id}`;
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.message });
        } finally {
            setSubmitting(false);
        }
    };

    const moduleTitle = module?.title || 'Training Module';

    return (
        <AdminPageShell>
            <div className="flex items-center justify-between mb-1 gap-3">
                <a
                    href={`/training-modules/${module?.id || ''}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                    <ChevronLeft className="w-4 h-4" /> Back to {moduleTitle}
                </a>
                <AiScenarioLanguageSwitcher
                    value={displayLanguage}
                    onChange={setDisplayLanguage}
                />
            </div>

            <AdminPageHeader
                icon={Sparkles}
                title="AI Scenario-Based Training"
                description={scenarioTitle || 'Disaster scenario assessment'}
                actions={
                    step === 'quiz' && !isCompleted ? (
                        <div className="inline-flex items-center gap-2 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
                            <Clock className="w-4 h-4" />
                            {formatTime(elapsedSeconds)}
                        </div>
                    ) : null
                }
            />

            {!isCompleted && step !== 'scenario' && (
                <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                        <span>Progress: {answeredCount} / {totalQuestions} answered</span>
                        <span>{progressPercent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progressPercent}%` }} />
                    </div>
                </div>
            )}

            {step === 'scenario' && !isCompleted && (
                <AdminContentCard className="p-6 space-y-4">
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                        Read the scenario carefully. When ready, continue to the multiple-choice assessment.
                    </div>
                    <div className="prose prose-sm max-w-none">
                        <h2 className="text-lg font-semibold text-slate-900">{scenarioTitle}</h2>
                        <p className="text-slate-700 whitespace-pre-line leading-relaxed mt-3">
                            {scenarioDescription}
                        </p>
                        {learningObjectives && (
                            <div className="mt-4 not-prose">
                                <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Learning Objectives</p>
                                <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
                                    {learningObjectives.split('\n').filter(Boolean).map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 capitalize">Difficulty: {attempt.difficulty}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">{totalQuestions} questions</span>
                    </div>
                    <AdminPrimaryButton type="button" onClick={() => setStep('quiz')}>
                        Continue to Quiz
                        <ChevronRight className="w-4 h-4" />
                    </AdminPrimaryButton>
                </AdminContentCard>
            )}

            {step === 'quiz' && !isCompleted && currentQuestion && (
                <AdminContentCard className="p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Question {currentIndex + 1} of {totalQuestions}
                        </span>
                        <div className="flex gap-1">
                            {questions.map((_, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`w-7 h-7 rounded-md text-xs font-medium ${
                                        idx === currentIndex
                                            ? 'bg-emerald-600 text-white'
                                            : answers[String(questions[idx].number)]
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                    </div>

                    <h2 className="text-base font-semibold text-slate-900 leading-snug">
                        {currentQuestion.question}
                    </h2>

                    <div className="space-y-2">
                        {['A', 'B', 'C', 'D'].map((letter) => {
                            const selected = answers[String(currentQuestion.number)] === letter;
                            return (
                                <label
                                    key={letter}
                                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                                        selected
                                            ? 'border-emerald-500 bg-emerald-50'
                                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name={`q-${currentQuestion.number}`}
                                        checked={selected}
                                        onChange={() => setAnswer(currentQuestion.number, letter)}
                                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm text-slate-800">
                                        <span className="font-semibold mr-1">{letter}.</span>
                                        {currentQuestion.choices?.[letter]}
                                    </span>
                                </label>
                            );
                        })}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <AdminSecondaryButton
                            type="button"
                            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                            disabled={currentIndex === 0}
                        >
                            <ChevronLeft className="w-4 h-4" /> Previous
                        </AdminSecondaryButton>
                        {currentIndex < totalQuestions - 1 ? (
                            <AdminPrimaryButton
                                type="button"
                                onClick={() => setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1))}
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </AdminPrimaryButton>
                        ) : (
                            <AdminPrimaryButton type="button" onClick={handleSubmit} disabled={submitting}>
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                Submit Assessment
                            </AdminPrimaryButton>
                        )}
                    </div>
                </AdminContentCard>
            )}

            {(step === 'results' || isCompleted) && (
                <div className="space-y-4">
                    <AdminContentCard className="p-6 text-center">
                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
                            attempt.passed ? 'bg-emerald-100' : 'bg-rose-100'
                        }`}>
                            {attempt.passed ? (
                                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
                            ) : (
                                <XCircle className="w-9 h-9 text-rose-600" />
                            )}
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">
                            {attempt.score} / {totalQuestions} correct ({Number(attempt.percentage).toFixed(1)}%)
                        </h2>
                        <p className={`mt-1 text-sm font-medium ${attempt.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {attempt.passed
                                ? `Passed — meets the ${PASS_PERCENTAGE}% requirement`
                                : `Did not pass — ${PASS_PERCENTAGE}% required`}
                        </p>
                    </AdminContentCard>

                    <AdminContentCard className="p-6 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-800">Answer Review</h3>
                        {questions.map((q) => {
                            const num = String(q.number);
                            const given = (attempt.participant_answers || {})[num];
                            const correct = q.correct_answer;
                            const isRight = given === correct;
                            return (
                                <div key={q.number} className="rounded-lg border border-slate-200 p-4 text-sm">
                                    <p className="font-medium text-slate-900">Q{q.number}. {q.question}</p>
                                    <p className={`mt-2 text-xs font-medium ${isRight ? 'text-emerald-700' : 'text-rose-700'}`}>
                                        Your answer: {given || '—'} {isRight ? '✓' : `✗ (Correct: ${correct})`}
                                    </p>
                                    {q.explanation && (
                                        <p className="mt-2 text-xs text-slate-600 bg-slate-50 rounded p-2">{q.explanation}</p>
                                    )}
                                </div>
                            );
                        })}
                    </AdminContentCard>

                    <div className="flex flex-wrap gap-2">
                        <AdminSecondaryButton href={`/training-modules/${module?.id}`}>
                            Back to Module
                        </AdminSecondaryButton>
                    </div>
                </div>
            )}
        </AdminPageShell>
    );
}

/** Locked / unlock CTA shown on participant training module page */
export function AiScenarioTrainingUnlock({ module, aiTraining }) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const [starting, setStarting] = React.useState(false);
    const meta = aiTraining || module?.ai_training || {};

    const handleStart = async () => {
        if (!meta.is_unlocked) return;

        setStarting(true);
        try {
            const res = await fetch(`/training-modules/${module.id}/ai-scenario-training/start`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrf,
                    Accept: 'application/json',
                },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Unable to start');
            window.location.href = data.redirect || `/ai-scenario-attempts/${data.attempt_id}`;
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Cannot start', text: err.message });
            setStarting(false);
        }
    };

    const latest = meta.latest_attempt;

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-semibold text-slate-900">AI Scenario-Based Training</h3>
            </div>
            <p className="text-xs text-slate-600">
                Complete all lessons to unlock a Gemini-generated disaster scenario and assessment quiz.
            </p>

            {!meta.all_lessons_completed && (
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600">
                    <Lock className="w-4 h-4 shrink-0" />
                    Complete all lessons to unlock this training.
                </div>
            )}

            {meta.all_lessons_completed && !meta.is_configured && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                    Your administrator has not enabled AI scenario training for this module yet.
                </div>
            )}

            {meta.is_unlocked && (
                <div className="space-y-2">
                    {latest?.completed_at && (
                        <p className="text-xs text-slate-600">
                            Last attempt: {latest.score} correct ({Number(latest.percentage).toFixed(1)}%)
                            {latest.passed ? ' — Passed' : ' — Not passed'}
                        </p>
                    )}
                    <button
                        type="button"
                        onClick={handleStart}
                        disabled={starting}
                        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm disabled:opacity-50"
                    >
                        {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {latest?.completed_at ? 'Retake Scenario-Based Training' : 'Start Scenario-Based Training'}
                    </button>
                    {latest?.completed_at && (
                        <a
                            href={`/ai-scenario-attempts/${latest.id}`}
                            className="inline-block text-xs text-emerald-700 hover:underline"
                        >
                            View last results
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}
