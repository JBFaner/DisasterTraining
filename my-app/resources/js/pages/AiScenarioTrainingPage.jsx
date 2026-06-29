import React from 'react';
import Swal from 'sweetalert2';
import * as Dialog from '@radix-ui/react-dialog';
import {
    Sparkles,
    ChevronLeft,
    ChevronRight,
    Clock,
    Lock,
    CheckCircle2,
    XCircle,
    AlertCircle,
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
    resolveQuestionsForLocale,
    resolveScenarioDescription,
    resolveScenarioTitle,
} from '../utils/aiScenarioLocale';
import { csrfFetch, getCsrfToken, pingSessionActivity } from '../utils/csrf';

function formatTime(seconds) {
    const safe = Math.max(0, seconds);
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function normalizeAnswers(map) {
    const out = {};
    for (const [key, value] of Object.entries(map || {})) {
        if (value) {
            out[String(key)] = String(value).toUpperCase();
        }
    }
    return out;
}

function findQuestionIndex(questions, questionNumber) {
    const idx = questions.findIndex((q) => String(q.number) === String(questionNumber));
    return idx >= 0 ? idx : 0;
}

function computeRemainingSeconds(attempt) {
    if (attempt?.expires_at) {
        const expiresMs = new Date(attempt.expires_at).getTime();
        const diff = Math.floor((expiresMs - Date.now()) / 1000);
        return Math.max(0, diff);
    }

    if (attempt?.time_remaining_seconds != null) {
        return Math.max(0, attempt.time_remaining_seconds);
    }

    if (attempt?.time_limit_minutes) {
        return attempt.time_limit_minutes * 60;
    }

    return null;
}

function shouldResumeQuiz(attempt) {
    return Boolean(attempt?.has_saved_progress);
}

function getInitialQuestionIndex(attempt, rawQuestions) {
    if (!attempt?.has_saved_progress) {
        return 0;
    }

    if (typeof attempt.initial_question_index === 'number') {
        return attempt.initial_question_index;
    }

    return findQuestionIndex(rawQuestions, attempt?.current_question);
}

function buildQuestionStatuses(questions, answers) {
    return questions.map((question, index) => {
        const isAnswered = Boolean(answers[String(question.number)]);

        return {
            index,
            displayNumber: index + 1,
            isAnswered,
        };
    });
}

function getQuestionNavigatorClass(index, currentIndex, isAnswered) {
    if (index === currentIndex) {
        return 'bg-emerald-600 text-white ring-2 ring-emerald-300';
    }

    if (isAnswered) {
        return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
    }

    return 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100';
}

function IncompleteAssessmentModal({
    open,
    onOpenChange,
    questions,
    answers,
    onGoToFirstUnanswered,
}) {
    const statuses = React.useMemo(
        () => buildQuestionStatuses(questions, answers),
        [questions, answers],
    );
    const totalQuestions = statuses.length;
    const completedCount = statuses.filter((status) => status.isAnswered).length;
    const unansweredCount = totalQuestions - completedCount;
    const firstUnansweredIndex = statuses.find((status) => !status.isAnswered)?.index;

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-lg max-h-[90vh] bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-200 shrink-0">
                        <Dialog.Title className="text-lg font-semibold text-slate-900">
                            Incomplete Assessment
                        </Dialog.Title>
                        <Dialog.Description className="text-sm text-slate-600 mt-1">
                            Please review your answers before submitting.
                        </Dialog.Description>
                    </div>

                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                                Question Status
                            </p>
                            <ul className="space-y-1.5">
                                {statuses.map((status) => (
                                    <li
                                        key={status.displayNumber}
                                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                                            status.isAnswered
                                                ? 'bg-emerald-50 text-emerald-900'
                                                : 'bg-rose-50 text-rose-900'
                                        }`}
                                    >
                                        {status.isAnswered ? (
                                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" aria-hidden="true" />
                                        ) : (
                                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" aria-hidden="true" />
                                        )}
                                        <span className="font-medium">
                                            Question {status.displayNumber}
                                        </span>
                                        <span className="text-slate-500">—</span>
                                        <span className={status.isAnswered ? 'text-emerald-700' : 'text-rose-700'}>
                                            {status.isAnswered ? 'Completed' : 'No Answer'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 space-y-1.5 text-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</p>
                            <div className="flex justify-between text-slate-700">
                                <span>Total Questions</span>
                                <span className="font-semibold text-slate-900">{totalQuestions}</span>
                            </div>
                            <div className="flex justify-between text-emerald-700">
                                <span>Completed</span>
                                <span className="font-semibold">{completedCount}</span>
                            </div>
                            <div className="flex justify-between text-rose-700">
                                <span>No Answer</span>
                                <span className="font-semibold">{unansweredCount}</span>
                            </div>
                        </div>
                    </div>

                    <div className="px-5 py-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 shrink-0">
                        <AdminSecondaryButton type="button" onClick={() => onOpenChange(false)}>
                            Cancel
                        </AdminSecondaryButton>
                        <AdminPrimaryButton
                            type="button"
                            disabled={firstUnansweredIndex == null}
                            onClick={() => {
                                if (firstUnansweredIndex != null) {
                                    onGoToFirstUnanswered(firstUnansweredIndex);
                                }
                                onOpenChange(false);
                            }}
                        >
                            Go to First Unanswered Question
                        </AdminPrimaryButton>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

export function AiScenarioTrainingPage({ attempt, module }) {
    const rawQuestions = attempt?.generated_questions || [];
    const isCompleted = Boolean(attempt?.completed_at) || attempt?.status === 'completed' || attempt?.status === 'expired';
    const defaultLanguage = attempt?.display_language || attempt?.generated_language || 'en';
    const passingScore = attempt?.passing_score ?? 75;
    const savedAnswers = normalizeAnswers(attempt?.participant_answers || {});
    const isInProgress = attempt?.status === 'in_progress' && !isCompleted;
    const initialRemaining = computeRemainingSeconds(attempt);

    const [displayLanguage, setDisplayLanguage] = React.useState(() =>
        loadPersistedLanguage(attempt?.id, defaultLanguage),
    );
    const [step, setStep] = React.useState(() => {
        if (isCompleted) return 'results';
        if (shouldResumeQuiz(attempt)) return 'quiz';
        return 'scenario';
    });
    const [currentIndex, setCurrentIndex] = React.useState(() =>
        getInitialQuestionIndex(attempt, rawQuestions),
    );
    const [answers, setAnswers] = React.useState(savedAnswers);
    const [submitting, setSubmitting] = React.useState(false);
    const [savingAnswer, setSavingAnswer] = React.useState(false);
    const [remainingSeconds, setRemainingSeconds] = React.useState(initialRemaining);
    const [showIncompleteModal, setShowIncompleteModal] = React.useState(false);
    const autoSubmittedRef = React.useRef(false);

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

    const submitQuiz = React.useCallback(async (autoSubmit = false) => {
        if (submitting || autoSubmittedRef.current) return;

        if (!autoSubmit) {
            const unanswered = questions.filter((q) => !answers[String(q.number)]);
            if (unanswered.length > 0) {
                setShowIncompleteModal(true);
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
        } else {
            autoSubmittedRef.current = true;
        }

        if (!getCsrfToken()) {
            Swal.fire({
                icon: 'error',
                title: 'Session error',
                text: 'Your session token is missing. Please refresh the page and try again.',
            });
            return;
        }

        setSubmitting(true);
        try {
            const res = await csrfFetch(
                `/participant/ai-scenario-attempts/${attempt.id}/submit`,
                {
                    method: 'POST',
                    body: { answers, display_language: displayLanguage },
                },
                { keepAlive: true },
            );
            const data = await res.json().catch(() => ({}));

            if (res.status === 419) {
                throw new Error('Your session expired. Please refresh the page, then submit your assessment again.');
            }

            if (res.status === 401) {
                throw new Error('Your session expired due to inactivity. Please log in again.');
            }

            if (!res.ok) throw new Error(data.message || 'Submit failed');
            window.location.href = data.redirect || `/participant/evaluations/results/${data.evaluation_result_id}`;
        } catch (err) {
            if (autoSubmit) autoSubmittedRef.current = false;
            Swal.fire({ icon: 'error', title: 'Error', text: err.message });
        } finally {
            setSubmitting(false);
        }
    }, [answers, attempt.id, displayLanguage, questions, submitting, totalQuestions]);

    React.useEffect(() => {
        if (step !== 'quiz' || isCompleted || remainingSeconds == null) return undefined;

        const timer = window.setInterval(() => {
            setRemainingSeconds((prev) => {
                if (prev == null) return prev;
                const next = prev - 1;
                if (next <= 0) {
                    window.clearInterval(timer);
                    submitQuiz(true);
                    return 0;
                }
                return next;
            });
        }, 1000);

        const keepAlive = window.setInterval(() => {
            pingSessionActivity().catch(() => {});
        }, 60000);

        pingSessionActivity().catch(() => {});

        return () => {
            window.clearInterval(timer);
            window.clearInterval(keepAlive);
        };
    }, [step, isCompleted, remainingSeconds, submitQuiz]);

    const answeredCount = Object.keys(answers).filter((k) => answers[k]).length;
    const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
    const currentQuestion = questions[currentIndex];

    const setAnswer = async (questionNumber, letter) => {
        const key = String(questionNumber);
        const normalizedLetter = String(letter).toUpperCase();
        setAnswers((prev) => ({ ...prev, [key]: normalizedLetter }));
        setSavingAnswer(true);

        try {
            const res = await csrfFetch(
                `/participant/ai-scenario-attempts/${attempt.id}/answers`,
                {
                    method: 'POST',
                    body: {
                        question_id: Number(questionNumber),
                        selected_answer: normalizedLetter,
                        current_question: Number(questionNumber),
                    },
                },
                { keepAlive: true },
            );

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data.message || 'Failed to save answer');
            }

            if (data.answers) {
                setAnswers(normalizeAnswers(data.answers));
            }

            pingSessionActivity().catch(() => {});
        } catch (err) {
            console.error('Answer save failed:', err);
        } finally {
            setSavingAnswer(false);
        }
    };

    const saveProgress = React.useCallback(async (questionNumber) => {
        if (!questionNumber || isCompleted) return;

        try {
            await csrfFetch(
                `/participant/ai-scenario-attempts/${attempt.id}/progress`,
                {
                    method: 'POST',
                    body: { current_question: Number(questionNumber) },
                },
                { keepAlive: true },
            );
        } catch (err) {
            console.error('Progress save failed:', err);
        }
    }, [attempt.id, isCompleted]);

    const goToQuestion = React.useCallback((index) => {
        setCurrentIndex(index);
        const questionNumber = questions[index]?.number;
        if (questionNumber) {
            saveProgress(questionNumber);
        }
    }, [questions, saveProgress]);

    const moduleTitle = module?.title || 'Training Module';

    return (
        <AdminPageShell>
            <div className="flex items-center justify-between mb-1 gap-3">
                <a
                    href={`/participant/training-modules/${module?.id || ''}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                    <ChevronLeft className="w-4 h-4" /> Back to {moduleTitle}
                </a>
                <AiScenarioLanguageSwitcher value={displayLanguage} onChange={setDisplayLanguage} />
            </div>

            <AdminPageHeader
                icon={Sparkles}
                title="AI Scenario-Based Training"
                description={scenarioTitle || 'Disaster scenario assessment'}
                actions={
                    step === 'quiz' && !isCompleted ? (
                        <div className="inline-flex items-center gap-2 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
                            <Clock className="w-4 h-4" />
                            {remainingSeconds != null ? formatTime(remainingSeconds) : '—'}
                            {savingAnswer && <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />}
                        </div>
                    ) : null
                }
            />

            {!isCompleted && step !== 'scenario' && (
                <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                        <span>Progress: {answeredCount} / {totalQuestions} answered</span>
                        <span>{progressPercent}% · Attempt {attempt.attempt_number || 1}</span>
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
                        <p className="text-slate-700 whitespace-pre-line leading-relaxed mt-3">{scenarioDescription}</p>
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
                        {attempt.time_limit_minutes && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1">{attempt.time_limit_minutes} min limit</span>
                        )}
                    </div>
                    <AdminPrimaryButton
                        type="button"
                        onClick={() => {
                            setCurrentIndex(0);
                            setStep('quiz');
                        }}
                    >
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
                        <div className="flex gap-1 flex-wrap justify-end">
                            {questions.map((q, idx) => {
                                const isAnswered = Boolean(answers[String(q.number)]);

                                return (
                                    <button
                                        key={q.number}
                                        type="button"
                                        onClick={() => goToQuestion(idx)}
                                        title={
                                            isAnswered
                                                ? `Question ${idx + 1} — Completed`
                                                : `Question ${idx + 1} — No Answer`
                                        }
                                        className={`w-7 h-7 rounded-md text-xs font-medium transition-colors ${getQuestionNavigatorClass(
                                            idx,
                                            currentIndex,
                                            isAnswered,
                                        )}`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <h2 className="text-base font-semibold text-slate-900 leading-snug">{currentQuestion.question}</h2>

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
                            onClick={() => goToQuestion(Math.max(0, currentIndex - 1))}
                            disabled={currentIndex === 0}
                        >
                            <ChevronLeft className="w-4 h-4" /> Previous
                        </AdminSecondaryButton>
                        {currentIndex < totalQuestions - 1 ? (
                            <AdminPrimaryButton
                                type="button"
                                onClick={() => goToQuestion(Math.min(totalQuestions - 1, currentIndex + 1))}
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </AdminPrimaryButton>
                        ) : (
                            <AdminPrimaryButton type="button" onClick={() => submitQuiz(false)} disabled={submitting}>
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
                                ? `Passed — meets the ${passingScore}% requirement`
                                : `Did not pass — ${passingScore}% required`}
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
                        <AdminSecondaryButton href={`/participant/training-modules/${module?.id}`}>
                            Back to Module
                        </AdminSecondaryButton>
                    </div>
                </div>
            )}

            <IncompleteAssessmentModal
                open={showIncompleteModal}
                onOpenChange={setShowIncompleteModal}
                questions={questions}
                answers={answers}
                onGoToFirstUnanswered={goToQuestion}
            />
        </AdminPageShell>
    );
}

/** Locked / unlock CTA shown on participant training module page */
export function AiScenarioTrainingUnlock({ module, aiTraining }) {
    const [starting, setStarting] = React.useState(false);
    const meta = aiTraining || module?.ai_training || {};
    const quizStatus = meta.quiz_status || 'not_started';
    const trainingStatus = meta.training_status || quizStatus;
    const inProgress = meta.in_progress_attempt;
    const latest = meta.latest_completed_attempt || meta.latest_attempt;
    const maxAttempts = meta.max_attempts ?? meta.quiz_settings?.max_attempts ?? 3;
    const passingScore = meta.passing_score ?? meta.quiz_settings?.passing_score ?? 75;
    const attemptsUsed = meta.attempts_used ?? 0;
    const attemptsRemaining = meta.attempts_remaining ?? maxAttempts;
    const isLocked = meta.is_locked ?? false;
    const lessonReviewRequired = Boolean(meta.lesson_review_required);
    const adminRetrainingApproved = Boolean(meta.admin_retraining_approved);
    const lessonProgress = meta.lesson_progress || [];
    const canStartQuiz = meta.is_unlocked && !isLocked && !inProgress && !lessonReviewRequired && !adminRetrainingApproved;

    const handleStart = async () => {
        if (!canStartQuiz) return;

        setStarting(true);
        try {
            const res = await csrfFetch(
                `/participant/training-modules/${module.id}/ai-scenario-training/start`,
                { method: 'POST' },
                { keepAlive: true },
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Unable to start');
            window.location.href = data.redirect || `/participant/ai-scenario-attempts/${data.attempt_id}`;
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Cannot start', text: err.message });
            setStarting(false);
        }
    };

    const statusLabel = {
        not_started: 'Not Started',
        in_progress: 'In Progress',
        passed: 'Passed',
        failed: 'Failed',
        locked: 'Quiz Locked',
        lesson_review_required: 'Lesson Review Required',
        retraining_required: 'Re-training Required',
    }[quizStatus] || {
        not_started: 'Not Started',
        in_progress: 'In Progress',
        passed: 'Passed',
        failed: 'Failed',
        locked: 'Locked',
        lesson_review_required: 'Lesson Review Required',
        retraining_required: 'Re-training Required',
    }[trainingStatus] || 'Not Started';

    const statusColor = {
        not_started: 'text-slate-600',
        in_progress: 'text-amber-700',
        passed: 'text-emerald-700',
        failed: 'text-rose-700',
        locked: 'text-slate-500',
        lesson_review_required: 'text-amber-800',
        retraining_required: 'text-sky-800',
    }[quizStatus] || {
        not_started: 'text-slate-600',
        in_progress: 'text-amber-700',
        passed: 'text-emerald-700',
        failed: 'text-rose-700',
        locked: 'text-slate-500',
        lesson_review_required: 'text-amber-800',
        retraining_required: 'text-sky-800',
    }[trainingStatus] || 'text-slate-600';

    const lessonStatusBadge = (status) => {
        if (status === 'completed') {
            return 'bg-emerald-100 text-emerald-800';
        }
        if (status === 'available') {
            return 'bg-sky-100 text-sky-800';
        }
        return 'bg-slate-200 text-slate-600';
    };

    const lessonStatusLabel = (status) => {
        if (status === 'completed') return 'Completed';
        if (status === 'available') return 'Available';
        return 'Locked';
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-semibold text-slate-900">AI Scenario-Based Training</h3>
            </div>
            <p className="text-xs text-slate-600">
                Complete all lessons to unlock a Gemini-generated disaster scenario and assessment quiz.
            </p>

            {(adminRetrainingApproved || trainingStatus === 'retraining_required') && (
                <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-sky-700 shrink-0" />
                        <p className="text-sm font-semibold text-sky-900">Re-training Required</p>
                    </div>
                    <p className="text-xs text-sky-900">
                        Your administrator has approved a new training attempt.
                        Please complete all lessons again before taking the AI Scenario Assessment.
                    </p>
                    {lessonProgress.length > 0 && (
                        <div className="pt-2 border-t border-sky-200 space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">Progress</p>
                            {lessonProgress.map((lesson) => (
                                <div key={lesson.id} className="flex items-center justify-between gap-2 text-xs">
                                    <span className="text-sky-900 truncate">Lesson {lesson.sequence_number}: {lesson.title}</span>
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold shrink-0 ${lessonStatusBadge(lesson.status)}`}>
                                        {lessonStatusLabel(lesson.status)}
                                    </span>
                                </div>
                            ))}
                            <div className="flex items-center justify-between gap-2 text-xs pt-1">
                                <span className="text-sky-900 font-medium">AI Scenario</span>
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 font-semibold bg-slate-200 text-slate-600">
                                    Locked
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {(lessonReviewRequired || trainingStatus === 'lesson_review_required') && !adminRetrainingApproved && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                        <p className="text-sm font-semibold text-amber-900">Lesson Review Required</p>
                    </div>
                    <p className="text-xs text-amber-900">
                        You did not achieve the required passing score of {passingScore}%.
                        Please complete all lessons again before attempting the AI Scenario Assessment.
                    </p>
                    <div className="flex justify-between text-xs text-amber-900">
                        <span>Attempts Remaining</span>
                        <span className="font-semibold">{attemptsRemaining}</span>
                    </div>
                    {lessonProgress.length > 0 && (
                        <div className="pt-2 border-t border-amber-200 space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Progress</p>
                            {lessonProgress.map((lesson) => (
                                <div key={lesson.id} className="flex items-center justify-between gap-2 text-xs">
                                    <span className="text-amber-900 truncate">Lesson {lesson.sequence_number}: {lesson.title}</span>
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold shrink-0 ${lessonStatusBadge(lesson.status)}`}>
                                        {lessonStatusLabel(lesson.status)}
                                    </span>
                                </div>
                            ))}
                            <div className="flex items-center justify-between gap-2 text-xs pt-1">
                                <span className="text-amber-900 font-medium">AI Scenario</span>
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 font-semibold bg-slate-200 text-slate-600">
                                    Locked
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!meta.all_lessons_completed && !lessonReviewRequired && !adminRetrainingApproved && (
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

            {(meta.is_unlocked || lessonReviewRequired || adminRetrainingApproved || meta.attempts_used > 0 || meta.passed) && (
                <div className="space-y-3">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs space-y-1.5">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Training Status</span>
                            <span className={`font-semibold ${statusColor}`}>{statusLabel}</span>
                        </div>
                        {quizStatus === 'passed' && latest && (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Score</span>
                                    <span className="font-medium text-slate-800">{Number(latest.percentage).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Attempts Used</span>
                                    <span className="font-medium text-slate-800">{attemptsUsed} of {maxAttempts}</span>
                                </div>
                                <p className="text-emerald-700 font-medium pt-1">Quiz Locked</p>
                                <a href="/participant/certification" className="inline-block text-xs text-emerald-700 hover:underline pt-1">
                                    View your certificate
                                </a>
                            </>
                        )}
                        {quizStatus === 'locked' && !meta.passed && (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Attempts Used</span>
                                    <span className="font-medium text-slate-800">{attemptsUsed} of {maxAttempts}</span>
                                </div>
                                <p className="text-slate-600 font-medium pt-1">No Attempts Remaining</p>
                            </>
                        )}
                        {quizStatus === 'failed' && !lessonReviewRequired && (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Score</span>
                                    <span className="font-medium text-slate-800">{Number(latest?.percentage || 0).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Attempts Remaining</span>
                                    <span className="font-medium text-slate-800">{attemptsRemaining}</span>
                                </div>
                            </>
                        )}
                        {quizStatus === 'in_progress' && (
                            <div className="flex justify-between">
                                <span className="text-slate-500">Attempts Remaining</span>
                                <span className="font-medium text-slate-800">{attemptsRemaining}</span>
                            </div>
                        )}
                        {(trainingStatus === 'retraining_required' || adminRetrainingApproved) && (
                            <div className="flex justify-between">
                                <span className="text-slate-500">Attempts Remaining</span>
                                <span className="font-medium text-slate-800">{attemptsRemaining}</span>
                            </div>
                        )}
                        {quizStatus === 'lesson_review_required' && (
                            <div className="flex justify-between">
                                <span className="text-slate-500">Attempts Remaining</span>
                                <span className="font-medium text-slate-800">{attemptsRemaining}</span>
                            </div>
                        )}
                        {quizStatus === 'not_started' && (
                            <div className="flex justify-between">
                                <span className="text-slate-500">Attempts Remaining</span>
                                <span className="font-medium text-slate-800">{attemptsRemaining}</span>
                            </div>
                        )}
                    </div>

                    {inProgress && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 space-y-3">
                            <p className="text-sm font-semibold text-amber-900">You have an unfinished quiz attempt.</p>
                            <div className="text-xs text-amber-900 space-y-1">
                                <p>Progress: {inProgress.questions_answered} / {inProgress.total_questions} Questions</p>
                                <p>Time Remaining: {formatTime(inProgress.time_remaining_seconds ?? 0)}</p>
                                <p>Attempt: {inProgress.attempt_number} of {maxAttempts}</p>
                            </div>
                            <a
                                href={`/participant/ai-scenario-attempts/${inProgress.id}`}
                                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-sm"
                            >
                                Continue Attempt
                            </a>
                        </div>
                    )}

                    {!isLocked && !inProgress && canStartQuiz && (
                        <button
                            type="button"
                            onClick={handleStart}
                            disabled={starting}
                            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm disabled:opacity-50"
                        >
                            {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            {quizStatus === 'failed' ? 'Start New Attempt' : 'Start Quiz'}
                        </button>
                    )}

                    {isLocked && latest?.id && (
                        <a
                            href={`/participant/ai-scenario-attempts/${latest.id}`}
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
