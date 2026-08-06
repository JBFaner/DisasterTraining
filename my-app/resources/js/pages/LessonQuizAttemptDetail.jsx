import React from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, Printer, XCircle } from 'lucide-react';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminContentCard,
    AdminSecondaryButton,
    AdminPrimaryButton,
    AdminStatCard,
} from '../components/admin/AdminLayout';
import {
    prepareLessonQuizReviewQuestions,
    formatDisplayLanguageLabel,
    formatAnswerLabel,
    resolveParticipantAnswer,
} from '../utils/lessonQuizReview';

function StatusPill({ attempt }) {
    if (attempt.status === 'in_progress') {
        return <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">In Progress</span>;
    }
    if (attempt.status === 'expired') {
        return <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700">Expired</span>;
    }
    if (attempt.passed) {
        return <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Passed</span>;
    }
    return <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">Failed</span>;
}

export function LessonQuizAttemptDetail({ attempt }) {
    React.useEffect(() => {
        if (new URLSearchParams(window.location.search).get('print') === '1') {
            window.print();
        }
    }, []);

    if (!attempt) {
        return (
            <AdminPageShell>
                <AdminContentCard>
                    <p className="p-6 text-slate-500">Lesson quiz attempt not found.</p>
                </AdminContentCard>
            </AdminPageShell>
        );
    }

    const displayLanguage = attempt.display_language || 'en';
    const rawQuestions = attempt.generated_questions || [];
    const questions = prepareLessonQuizReviewQuestions(rawQuestions, displayLanguage, { includeAnswers: true });
    const answers = attempt.participant_answers || {};
    const percentage = attempt.percentage != null ? Number(attempt.percentage) : null;
    const total = attempt.total_questions ?? rawQuestions.length;
    const showReview = Boolean(attempt.show_answer_review);

    return (
        <AdminPageShell className="print:space-y-2">
            <AdminPageHeader
                icon={BookOpen}
                title="Lesson Quiz Result"
                description={`${attempt.participant?.name || 'Participant'} · ${attempt.lesson?.title || attempt.lesson_title || 'Lesson'}`}
                actions={(
                    <div className="flex flex-wrap items-center gap-2 print:hidden">
                        {showReview && questions.length > 0 ? (
                            <AdminPrimaryButton type="button" onClick={() => window.print()}>
                                <Printer className="w-4 h-4" />
                                Print Result
                            </AdminPrimaryButton>
                        ) : null}
                        <AdminSecondaryButton href="/admin/evaluations?tab=lessons">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Lesson Quizzes
                        </AdminSecondaryButton>
                    </div>
                )}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <AdminStatCard label="Score" value={`${attempt.score ?? 0}/${total}`} accent="slate" />
                <AdminStatCard
                    label="Percentage"
                    value={percentage != null ? `${percentage.toFixed(1)}%` : '—'}
                    accent="emerald"
                />
                <AdminStatCard label="Attempt" value={`#${attempt.attempt_number ?? 1}`} accent="blue" />
                <AdminStatCard label="Passing Score" value={`${attempt.passing_score ?? 75}%`} accent="amber" />
            </div>

            <AdminContentCard>
                <div className="p-5 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <StatusPill attempt={attempt} />
                        <p className="text-sm text-slate-600">
                            <span className="font-medium text-slate-800">{attempt.participant?.name || '—'}</span>
                            {attempt.participant?.email ? ` · ${attempt.participant.email}` : ''}
                        </p>
                    </div>
                    <p className="text-sm text-slate-700">
                        <span className="text-slate-500">Module:</span> {attempt.training_module?.title || '—'}
                    </p>
                    <p className="text-sm text-slate-700">
                        <span className="text-slate-500">Lesson Title:</span> {attempt.lesson?.title || attempt.lesson_title || '—'}
                    </p>
                    <p className="text-sm text-slate-700">
                        <span className="text-slate-500">Quiz language:</span> {formatDisplayLanguageLabel(displayLanguage)}
                    </p>
                    <p className="text-sm text-slate-500">
                        Completed: {attempt.completed_at ? new Date(attempt.completed_at).toLocaleString() : '—'}
                    </p>
                </div>
            </AdminContentCard>

            {showReview && questions.length > 0 ? (
                <AdminContentCard>
                    <div className="border-b border-slate-200 px-5 py-3">
                        <h3 className="text-sm font-semibold text-slate-900">Answer Review</h3>
                        <p className="mt-1 text-xs text-slate-500">
                            Shown in {formatDisplayLanguageLabel(displayLanguage)} — the language used during the quiz.
                        </p>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {questions.map((question) => {
                            const num = String(question.number);
                            const given = resolveParticipantAnswer(answers, question.number);
                            const correct = question.correct_answer;
                            const isCorrect = given != null && String(given).toUpperCase() === String(correct).toUpperCase();
                            const choiceLetters = ['A', 'B', 'C', 'D'].filter((letter) => question.choices?.[letter]);

                            return (
                                <div key={num} className="px-5 py-4 space-y-3">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div className="flex items-start gap-2 min-w-0">
                                            {isCorrect ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                                            )}
                                            <p className="text-sm font-medium text-slate-900">
                                                Q{question.number}. {question.question}
                                            </p>
                                        </div>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                            {isCorrect ? 'Correct' : 'Incorrect'}
                                        </span>
                                    </div>

                                    {choiceLetters.length > 0 ? (
                                        <ul className="ml-6 space-y-1">
                                            {choiceLetters.map((letter) => {
                                                const isSelected = String(given || '').toUpperCase() === letter;
                                                const isAnswer = String(correct || '').toUpperCase() === letter;

                                                return (
                                                    <li
                                                        key={`${num}-${letter}`}
                                                        className={`text-sm rounded-lg px-2.5 py-1.5 ${
                                                            isAnswer
                                                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                                : isSelected
                                                                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                                                    : 'text-slate-600'
                                                        }`}
                                                    >
                                                        {letter}. {question.choices[letter]}
                                                        {isAnswer ? ' · Correct' : ''}
                                                        {isSelected && !isAnswer ? ' · Selected' : ''}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <div className="ml-6 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                                            <p><span className="font-semibold">Participant answer:</span> {formatAnswerLabel(question.choices, given)}</p>
                                            <p><span className="font-semibold">Correct answer:</span> {formatAnswerLabel(question.choices, correct)}</p>
                                        </div>
                                    )}

                                    {question.explanation ? (
                                        <p className="ml-6 text-xs text-slate-600 bg-slate-50 rounded p-2">{question.explanation}</p>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                </AdminContentCard>
            ) : (
                <AdminContentCard>
                    <p className="p-5 text-sm text-slate-500">
                        {attempt.status === 'in_progress'
                            ? 'This attempt is still in progress — full answer review is available after submission.'
                            : 'No question review is available for this attempt.'}
                    </p>
                </AdminContentCard>
            )}
        </AdminPageShell>
    );
}
