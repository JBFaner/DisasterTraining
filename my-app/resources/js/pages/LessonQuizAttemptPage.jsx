import React from 'react';
import Swal from 'sweetalert2';
import { ChevronLeft, Loader2, CheckCircle2, Globe } from 'lucide-react';
import { csrfFetch } from '../utils/csrf';
import {
    AI_SCENARIO_LANGUAGES,
    loadPersistedLanguage,
    persistLanguage,
    resolveQuestionsForLocale,
} from '../utils/aiScenarioLocale';
import { AiScenarioLanguageSwitcher } from '../components/AiScenarioLanguageSwitcher';

export function LessonQuizAttemptPage({ attempt, module }) {
    const rawQuestions = attempt?.generated_questions || [];
    const isCompleted = attempt?.status === 'completed' || attempt?.status === 'expired';
    const defaultLanguage = attempt?.display_language || 'en';

    const [displayLanguage, setDisplayLanguage] = React.useState(() =>
        loadPersistedLanguage(attempt?.id, defaultLanguage),
    );
    const [answers, setAnswers] = React.useState(attempt?.participant_answers || {});
    const [submitting, setSubmitting] = React.useState(false);
    const [currentIndex, setCurrentIndex] = React.useState(0);

    const questions = React.useMemo(
        () => resolveQuestionsForLocale(rawQuestions, displayLanguage, { includeAnswers: isCompleted }),
        [rawQuestions, displayLanguage, isCompleted],
    );
    const current = questions[currentIndex];

    React.useEffect(() => {
        persistLanguage(attempt?.id, displayLanguage);
    }, [attempt?.id, displayLanguage]);

    const handleSelect = (letter) => {
        if (isCompleted || !current) return;
        setAnswers((prev) => ({ ...prev, [String(current.number)]: letter }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const res = await csrfFetch(`/participant/lesson-quiz-attempts/${attempt.id}/submit`, {
                method: 'POST',
                body: JSON.stringify({ answers, display_language: displayLanguage }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Submit failed');
            await Swal.fire({
                icon: data.attempt?.passed ? 'success' : 'info',
                title: data.attempt?.passed ? 'Lesson quiz passed!' : 'Lesson quiz submitted',
                text: data.attempt?.passed
                    ? 'The next lesson has been unlocked.'
                    : `Score: ${data.attempt?.percentage ?? 0}%`,
            });
            window.location.href = data.redirect || `/participant/training-modules/${module?.id || attempt.training_module_id}`;
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Submit failed', text: err.message });
            setSubmitting(false);
        }
    };

    if (!current) {
        return <div className="p-6 text-slate-600">No questions available.</div>;
    }

    return (
        <div className="py-4 space-y-6 max-w-3xl mx-auto">
            <a href={`/participant/training-modules/${module?.id || attempt.training_module_id}`} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
                <ChevronLeft className="w-4 h-4" /> Back to module
            </a>

            <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="text-xs uppercase tracking-wide text-slate-500">Lesson Quiz</div>
                        <h2 className="text-xl font-semibold text-slate-800 mt-1">{attempt.lesson_title || 'Lesson Quiz'}</h2>
                        <p className="text-sm text-slate-600 mt-1">
                            Question {currentIndex + 1} of {questions.length}
                        </p>
                    </div>
                    <AiScenarioLanguageSwitcher value={displayLanguage} onChange={setDisplayLanguage} />
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
                            onClick={handleSubmit}
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

    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 space-y-3">
            <div className="text-sm font-medium text-slate-800">Lesson Quiz</div>
            <p className="text-xs text-slate-600">
                {meta.quiz_question_count || 10} random questions from the published question bank.
                Passing score: {meta.passing_score ?? 75}%.
            </p>

            {showLanguagePicker && (
                <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                        <Globe className="w-4 h-4 text-emerald-600" />
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
