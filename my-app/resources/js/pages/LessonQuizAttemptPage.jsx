import React from 'react';
import Swal from 'sweetalert2';
import { ChevronLeft, Loader2, CheckCircle2, XCircle, ShieldAlert, Clock } from 'lucide-react';
import { csrfFetch } from '../utils/csrf';
import {
    AI_SCENARIO_LANGUAGES,
    loadPersistedLanguage,
    persistLanguage,
    resolveQuestionsForLocale,
} from '../utils/aiScenarioLocale';
import { AiScenarioLanguageSwitcher } from '../components/AiScenarioLanguageSwitcher';
import { useQuizIntegrityGuards } from '../hooks/useQuizIntegrityGuards';

function formatTime(seconds) {
    const safe = Math.max(0, seconds);
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
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

export function LessonQuizAttemptPage({ attempt: initialAttempt, module }) {
    const [attempt, setAttempt] = React.useState(initialAttempt);
    const [step, setStep] = React.useState(
        initialAttempt?.status === 'completed' || initialAttempt?.status === 'expired' ? 'results' : 'quiz',
    );

    const rawQuestions = attempt?.generated_questions || [];
    const isCompleted = attempt?.status === 'completed' || attempt?.status === 'expired';
    const showAnswerReview = Boolean(attempt?.show_answer_review || (isCompleted && attempt?.passed));
    const defaultLanguage = attempt?.display_language || 'en';
    const passingScore = attempt?.passing_score ?? 75;

    const [displayLanguage, setDisplayLanguage] = React.useState(() =>
        loadPersistedLanguage(attempt?.id, defaultLanguage),
    );
    const [answers, setAnswers] = React.useState(attempt?.participant_answers || {});
    const [submitting, setSubmitting] = React.useState(false);
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [remainingSeconds, setRemainingSeconds] = React.useState(() => computeRemainingSeconds(initialAttempt));
    const autoSubmittedRef = React.useRef(false);
    const submittingRef = React.useRef(false);
    const answersRef = React.useRef(answers);

    React.useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    const questions = React.useMemo(
        () => resolveQuestionsForLocale(rawQuestions, displayLanguage, { includeAnswers: showAnswerReview }),
        [rawQuestions, displayLanguage, showAnswerReview],
    );
    const current = questions[currentIndex];
    const totalQuestions = questions.length;
    const moduleUrl = `/participant/training-modules/${module?.id || attempt.training_module_id}`;

    React.useEffect(() => {
        persistLanguage(attempt?.id, displayLanguage);
    }, [attempt?.id, displayLanguage]);

    const submitQuiz = React.useCallback(async (autoSubmit = false) => {
        if (submittingRef.current || isCompleted) {
            return;
        }

        if (!autoSubmit) {
            const currentAnswers = answersRef.current || {};
            const unanswered = questions.filter((q) => !currentAnswers[String(q.number)]);
            if (unanswered.length > 0) {
                const confirm = await Swal.fire({
                    icon: 'question',
                    title: 'Incomplete quiz',
                    text: `You have ${unanswered.length} unanswered question(s). Submit anyway?`,
                    showCancelButton: true,
                    confirmButtonText: 'Submit anyway',
                    confirmButtonColor: '#059669',
                });
                if (!confirm.isConfirmed) {
                    return;
                }
            } else {
                const confirm = await Swal.fire({
                    icon: 'question',
                    title: 'Submit quiz?',
                    text: 'You cannot change your answers after submitting.',
                    showCancelButton: true,
                    confirmButtonText: 'Submit',
                    confirmButtonColor: '#059669',
                });
                if (!confirm.isConfirmed) {
                    return;
                }
            }
        }

        submittingRef.current = true;
        setSubmitting(true);
        try {
            const res = await csrfFetch(`/participant/lesson-quiz-attempts/${attempt.id}/submit`, {
                method: 'POST',
                body: {
                    answers: answersRef.current || {},
                    display_language: displayLanguage,
                },
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const validationMessage = data.errors
                    ? Object.values(data.errors).flat().join(' ')
                    : null;
                throw new Error(validationMessage || data.message || 'Submit failed');
            }

            setAttempt(data.attempt);
            setStep('results');
        } catch (err) {
            if (autoSubmit) {
                autoSubmittedRef.current = false;
            }
            if (!autoSubmit) {
                Swal.fire({ icon: 'error', title: 'Submit failed', text: err.message });
            }
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    }, [attempt.id, displayLanguage, isCompleted, questions]);

    React.useEffect(() => {
        if (step !== 'quiz' || isCompleted || remainingSeconds == null) {
            return undefined;
        }

        if (remainingSeconds <= 0) {
            if (!autoSubmittedRef.current) {
                autoSubmittedRef.current = true;
                submitQuiz(true);
            }
            return undefined;
        }

        const timer = window.setInterval(() => {
            setRemainingSeconds((prev) => {
                if (prev == null) {
                    return prev;
                }

                const next = prev - 1;
                if (next <= 0) {
                    window.clearInterval(timer);
                    if (!autoSubmittedRef.current) {
                        autoSubmittedRef.current = true;
                        submitQuiz(true);
                    }
                    return 0;
                }

                return next;
            });
        }, 1000);

        return () => window.clearInterval(timer);
        // Only restart when quiz session changes — not every second.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, isCompleted, attempt?.id, submitQuiz]);

    useQuizIntegrityGuards({
        enabled: step === 'quiz' && !isCompleted,
        onAutoSubmit: () => submitQuiz(true),
    });

    const handleSelect = (letter) => {
        if (isCompleted || step !== 'quiz' || !current) {
            return;
        }
        setAnswers((prev) => ({ ...prev, [String(current.number)]: letter }));
    };

    if (step === 'results' || isCompleted) {
        return (
            <div className="py-4 space-y-6 max-w-3xl mx-auto">
                <a href={moduleUrl} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
                    <ChevronLeft className="w-4 h-4" /> Back to module
                </a>

                <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm text-center">
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
                        {attempt.score ?? 0} / {totalQuestions} correct ({Number(attempt.percentage ?? 0).toFixed(1)}%)
                    </h2>
                    <p className={`mt-1 text-sm font-medium ${attempt.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {attempt.passed
                            ? `Passed — meets the ${passingScore}% requirement`
                            : `Did not pass — ${passingScore}% required`}
                    </p>
                    {!attempt.passed && (
                        <p className="mt-3 text-xs text-slate-500">
                            Correct answers are hidden until you pass the quiz.
                        </p>
                    )}
                </div>

                {showAnswerReview && (
                    <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm space-y-4">
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
                    </div>
                )}

                <div className="flex flex-wrap gap-2">
                    <a
                        href={moduleUrl}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                        Back to Module
                    </a>
                </div>
            </div>
        );
    }

    if (!current) {
        return <div className="p-6 text-slate-600">No questions available.</div>;
    }

    return (
        <div className="py-4 space-y-6 max-w-3xl mx-auto quiz-integrity-guard select-none">
            <a href={moduleUrl} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
                <ChevronLeft className="w-4 h-4" /> Back to module
            </a>

            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                    Quiz mode is active. Copy, paste, and switching tabs are restricted until you submit.
                </span>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="text-xs uppercase tracking-wide text-slate-500">Lesson Quiz</div>
                        <h2 className="text-xl font-semibold text-slate-800 mt-1">{attempt.lesson_title || 'Lesson Quiz'}</h2>
                        <p className="text-sm text-slate-600 mt-1">
                            Question {currentIndex + 1} of {questions.length}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {remainingSeconds != null && (
                            <div className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${
                                remainingSeconds <= 60
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-slate-100 text-slate-800'
                            }`}>
                                <Clock className="w-4 h-4" />
                                {formatTime(remainingSeconds)}
                            </div>
                        )}
                        <AiScenarioLanguageSwitcher value={displayLanguage} onChange={setDisplayLanguage} />
                    </div>
                </div>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm space-y-4">
                <p className="font-medium text-slate-800">{current.question}</p>
                <div className="space-y-2">
                    {Object.entries(current.choices || {}).map(([letter, text]) => {
                        const selected = answers[String(current.number)] === letter;
                        return (
                            <button
                                key={letter}
                                type="button"
                                disabled={isCompleted}
                                onClick={() => handleSelect(letter)}
                                className={`w-full text-left rounded-lg border px-4 py-3 text-sm transition-colors ${
                                    selected ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <span className="font-semibold mr-2">{letter}.</span>{text}
                            </button>
                        );
                    })}
                </div>
                <div className="flex justify-between pt-2">
                    <button
                        type="button"
                        disabled={currentIndex === 0}
                        onClick={() => setCurrentIndex((i) => i - 1)}
                        className="text-sm text-slate-600 disabled:opacity-40"
                    >
                        Previous
                    </button>
                    {currentIndex < questions.length - 1 ? (
                        <button type="button" onClick={() => setCurrentIndex((i) => i + 1)} className="text-sm font-medium text-emerald-700">
                            Next
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => submitQuiz(false)}
                            disabled={submitting || isCompleted}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Submit Quiz
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export function LessonQuizUnlock({ module, lesson, lessonQuiz }) {
    const [starting, setStarting] = React.useState(false);
    const [showLanguagePicker, setShowLanguagePicker] = React.useState(false);
    const [rememberLanguage, setRememberLanguage] = React.useState(false);
    const meta = lessonQuiz || lesson?.lesson_quiz || {};
    const availableLanguages = meta.available_languages?.length
        ? meta.available_languages
        : ['en'];

    const [selectedLanguage, setSelectedLanguage] = React.useState(() => {
        try {
            const stored = localStorage.getItem('lesson_quiz_preferred_language');
            if (stored && availableLanguages.includes(stored)) return stored;
        } catch {
            // ignore
        }
        return availableLanguages[0] || 'en';
    });

    if (!meta.has_published_quiz) {
        return null;
    }

    const startQuiz = async () => {
        if (!meta.can_start && !meta.in_progress_attempt) return;
        setStarting(true);
        try {
            if (rememberLanguage) {
                try {
                    localStorage.setItem('lesson_quiz_preferred_language', selectedLanguage);
                } catch {
                    // ignore
                }
            }

            const res = await csrfFetch(
                `/participant/training-modules/${module.id}/contents/${lesson.id}/lesson-quiz/start`,
                {
                    method: 'POST',
                    body: JSON.stringify({ display_language: selectedLanguage }),
                },
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Unable to start');
            window.location.href = data.redirect;
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Cannot start quiz', text: err.message });
            setStarting(false);
        }
    };

    const handleStart = () => {
        if (meta.in_progress_attempt) {
            startQuiz();
            return;
        }
        if (availableLanguages.length > 1) {
            setShowLanguagePicker(true);
            return;
        }
        startQuiz();
    };

    if (meta.passed) {
        return (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Lesson quiz passed. This lesson is complete.
            </div>
        );
    }

    if (meta.content_locked || meta.quiz_status === 'in_progress') {
        return (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 space-y-3">
                <div className="text-sm font-medium text-amber-900">Lesson quiz in progress</div>
                <p className="text-xs text-amber-800">
                    Lesson content and PDF downloads are locked until you finish the quiz.
                </p>
                <button
                    type="button"
                    onClick={handleStart}
                    disabled={starting}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                    {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Resume Lesson Quiz
                </button>
            </div>
        );
    }

    const latest = meta.latest_attempt;

    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 space-y-3">
            <div className="text-sm font-medium text-slate-800">Lesson Quiz</div>
            <p className="text-xs text-slate-600">
                {meta.quiz_question_count || 10} random questions from the published question bank.
                Passing score: {meta.passing_score ?? 75}%.
                {meta.time_limit_minutes ? ` Time limit: ${meta.time_limit_minutes} minutes.` : ''}
            </p>

            {latest && !latest.passed && (
                <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                    Last attempt: {latest.percentage ?? 0}% — did not pass.
                    {meta.attempts_remaining > 0
                        ? ` ${meta.attempts_remaining} attempt(s) remaining.`
                        : ' No attempts remaining.'}
                </div>
            )}

            {showLanguagePicker && (
                <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                        Choose Quiz Language
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {availableLanguages.map((code) => {
                            const lang = AI_SCENARIO_LANGUAGES[code];
                            const active = selectedLanguage === code;
                            return (
                                <button
                                    key={code}
                                    type="button"
                                    onClick={() => setSelectedLanguage(code)}
                                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                        active
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <span aria-hidden>{lang?.flag}</span>
                                    {lang?.label || code}
                                </button>
                            );
                        })}
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                        <input
                            type="checkbox"
                            checked={rememberLanguage}
                            onChange={(e) => setRememberLanguage(e.target.checked)}
                            className="rounded border-slate-300 text-emerald-600"
                        />
                        Remember my preferred language
                    </label>
                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => setShowLanguagePicker(false)}
                            className="text-sm text-slate-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={startQuiz}
                            disabled={starting}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                            {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Start Quiz
                        </button>
                    </div>
                </div>
            )}

            {!showLanguagePicker && (
                <button
                    type="button"
                    onClick={handleStart}
                    disabled={starting || (!meta.can_start && !meta.in_progress_attempt)}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                    {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {meta.in_progress_attempt ? 'Resume Lesson Quiz' : 'Take Lesson Quiz'}
                </button>
            )}
        </div>
    );
}
