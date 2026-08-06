import React from 'react';
import { ArrowLeft, BookOpen, Eye, Printer } from 'lucide-react';
import Swal from 'sweetalert2';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminContentCard,
    AdminSecondaryButton,
    AdminPrimaryButton,
} from '../components/admin/AdminLayout';
import { AdminTableActionButton } from '../components/admin/AdminDataTable';
import { buildPrintTableDocument, printHtmlDocument } from '../utils/printHtml';

function StatusPill({ lesson }) {
    if (!lesson?.status) {
        return <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600">Not taken</span>;
    }
    if (lesson.status === 'in_progress') {
        return <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">In Progress</span>;
    }
    if (lesson.status === 'expired') {
        return <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700">Expired</span>;
    }
    if (lesson.passed) {
        return <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Passed</span>;
    }
    return <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">Failed</span>;
}

export function LessonQuizParticipantDetail({ detail }) {
    if (!detail) {
        return (
            <AdminPageShell>
                <AdminContentCard>
                    <p className="p-6 text-slate-500">Participant lesson quiz scores not found.</p>
                </AdminContentCard>
            </AdminPageShell>
        );
    }

    const lessons = detail.lessons || [];

    const lessonStatusLabel = (lesson) => {
        if (!lesson?.status) return 'Not taken';
        if (lesson.status === 'in_progress') return 'In Progress';
        if (lesson.status === 'expired') return 'Expired';
        if (lesson.passed) return 'Passed';
        return 'Failed';
    };

    const handlePrint = React.useCallback(() => {
        const participantName = detail.participant?.name || 'Participant';
        const headers = ['Lesson', 'Title', 'Score', 'Status', 'Completed'];
        const rows = lessons.map((lesson) => [
            lesson.label || '—',
            lesson.title || '—',
            lesson.score != null ? `${lesson.score}/${lesson.total_questions ?? '—'}` : '—',
            lessonStatusLabel(lesson),
            lesson.completed_at ? new Date(lesson.completed_at).toLocaleString() : '—',
        ]);

        const html = buildPrintTableDocument({
            title: `Lesson Quiz Summary — ${participantName}`,
            subtitle: [
                detail.training_module?.title || 'Module',
                detail.batch_label || null,
                detail.participant?.email || null,
                `Printed ${new Date().toLocaleString()}`,
            ].filter(Boolean).join(' · '),
            headers,
            rows,
            emptyMessage: 'No lesson quiz records for this participant.',
        });

        if (!printHtmlDocument(html, `Lesson Quiz — ${participantName}`)) {
            Swal.fire('Unable to print', 'Could not prepare the print view. Please try again.', 'warning');
        }
    }, [detail, lessons]);

    return (
        <AdminPageShell>
            <AdminPageHeader
                icon={BookOpen}
                title={detail.participant?.name || 'Participant'}
                description={`${detail.training_module?.title || 'Module'}${detail.batch_label ? ` · ${detail.batch_label}` : ''} · Lesson quiz scores`}
                actions={(
                    <div className="flex flex-wrap items-center gap-2">
                        <AdminPrimaryButton type="button" onClick={handlePrint}>
                            <Printer className="w-4 h-4" />
                            Print Summary
                        </AdminPrimaryButton>
                        <AdminSecondaryButton href={detail.back_href || '/admin/evaluations?tab=lessons'}>
                            <ArrowLeft className="w-4 h-4" />
                            Back to Lesson Quizzes
                        </AdminSecondaryButton>
                    </div>
                )}
            />

            <AdminContentCard>
                <div className="border-b border-slate-200 px-5 py-3">
                    <h3 className="text-sm font-semibold text-slate-900">Lessons 1–{lessons.length || 5}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                        {detail.participant?.email || '—'} · Open a lesson to review the questions they answered.
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="text-left px-4 py-3">Lesson</th>
                                <th className="text-left px-4 py-3">Score</th>
                                <th className="text-left px-4 py-3">Status</th>
                                <th className="text-left px-4 py-3">Completed</th>
                                <th className="text-right px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {lessons.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                        No enabled lesson quizzes for this module.
                                    </td>
                                </tr>
                            ) : (
                                lessons.map((lesson) => (
                                    <tr key={lesson.lesson_id} className="hover:bg-slate-50/80">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-slate-900">{lesson.label}</p>
                                            <p className="text-xs text-slate-500 max-w-[320px]">{lesson.title}</p>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-slate-900">
                                            {lesson.score != null
                                                ? `${lesson.score}/${lesson.total_questions ?? '—'}`
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-3"><StatusPill lesson={lesson} /></td>
                                        <td className="px-4 py-3 text-xs text-slate-500">
                                            {lesson.completed_at ? new Date(lesson.completed_at).toLocaleString() : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end">
                                                {lesson.detail_href ? (
                                                    <AdminTableActionButton
                                                        href={lesson.detail_href}
                                                        icon={Eye}
                                                        title="View answers"
                                                        variant="view"
                                                    />
                                                ) : (
                                                    <span className="text-xs text-slate-400">No attempt</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </AdminContentCard>
        </AdminPageShell>
    );
}
