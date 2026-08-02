import React from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, XCircle } from 'lucide-react';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminContentCard,
    AdminSecondaryButton,
    AdminStatCard,
} from '../components/admin/AdminLayout';

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
    if (!attempt) {
        return (
            <AdminPageShell>
                <AdminContentCard>
                    <p className="p-6 text-slate-500">Lesson quiz attempt not found.</p>
                </AdminContentCard>
            </AdminPageShell>
        );
    }

    const questions = attempt.generated_questions || [];
    const answers = attempt.participant_answers || {};
    const percentage = attempt.percentage != null ? Number(attempt.percentage) : null;
    const total = attempt.total_questions ?? questions.length;
    const showReview = Boolean(attempt.show_answer_review);

    return (
        <AdminPageShell>
            <AdminPageHeader
                icon={BookOpen}
                title="Lesson Quiz Result"
                description={`${attempt.participant?.name || 'Participant'} · ${attempt.lesson?.title || attempt.lesson_title || 'Lesson'}`}
                actions={(
                    <AdminSecondaryButton href="/admin/evaluations?tab=lessons">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Lesson Quizzes
                    </AdminSecondaryButton>
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
                    <p className="text-sm text-slate-500">
                        Completed: {attempt.completed_at ? new Date(attempt.completed_at).toLocaleString() : '—'}
                    </p>
                </div>
            </AdminContentCard>

            {showReview && questions.length > 0 ? (
                <AdminContentCard>
                    <div className="border-b border-slate-200 px-5 py-3">
                        <h3 className="text-sm font-semibold text-slate-900">Answer Review</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {questions.map((question, index) => {
                            const qid = question.id ?? String(index);
                            const selected = answers[qid] ?? answers[String(index)] ?? null;
                            const correctIndex = question.correct_index ?? question.correct_answer ?? 0;
                            const choices = question.choices || [];
                            const isCorrect = selected != null && Number(selected) === Number(correctIndex);

                            return (
                                <div key={qid} className="px-5 py-4 space-y-2">
                                    <div className="flex items-start gap-2">
                                        {isCorrect ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                                        )}
                                        <p className="text-sm font-medium text-slate-900">
                                            {index + 1}. {question.question || 'Question'}
                                        </p>
                                    </div>
                                    <ul className="ml-6 space-y-1">
                                        {choices.map((choice, choiceIndex) => {
                                            const isSelected = Number(selected) === choiceIndex;
                                            const isAnswer = Number(correctIndex) === choiceIndex;
                                            return (
                                                <li
                                                    key={`${qid}-${choiceIndex}`}
                                                    className={`text-sm rounded-lg px-2.5 py-1.5 ${
                                                        isAnswer
                                                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                            : isSelected
                                                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                                                : 'text-slate-600'
                                                    }`}
                                                >
                                                    {choice}
                                                    {isAnswer ? ' · Correct' : ''}
                                                    {isSelected && !isAnswer ? ' · Selected' : ''}
                                                </li>
                                            );
                                        })}
                                    </ul>
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
