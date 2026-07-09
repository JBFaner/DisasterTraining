import React from 'react';
import { BookOpen, ClipboardList, GraduationCap } from 'lucide-react';
import { AdminPageHeader, AdminPageShell } from '../components/admin/AdminLayout';
import { EvaluationEventsPanel } from './EvaluationEventsPanel';
import { EvaluationResultsIndex } from './EvaluationResultsIndex';
import { LessonQuizResultsIndex } from './LessonQuizResultsIndex';

const TABS = [
    { id: 'events', label: 'Event Evaluations', icon: ClipboardList, description: 'Post-drill scoring for completed simulation events.' },
    { id: 'modules', label: 'Final Scenario Training Score', icon: GraduationCap, description: 'Final scores from AI scenario training per module.' },
    { id: 'lessons', label: 'Lesson Quizzes', icon: BookOpen, description: 'Per-lesson quiz attempts and pass/fail results.' },
];

export function EvaluationHub({
    activeTab = 'events',
    events = [],
    eventFilters = {},
    evaluationResults = [],
    evaluationResultsPagination = null,
    evaluationAnalytics = null,
    evaluationModules = [],
    evaluationAttemptNumbers = [],
    evaluationFilters = {},
    evaluationPassingScore = 75,
    lessonQuizAttempts = [],
    lessonQuizPagination = null,
    lessonQuizAnalytics = null,
    lessonQuizModules = [],
    lessonQuizFilters = {},
    role = 'LGU_ADMIN',
}) {
    const currentTab = TABS.find((tab) => tab.id === activeTab) || TABS[0];

    const switchTab = (tabId) => {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tabId);
        url.searchParams.delete('search');
        url.searchParams.delete('status');
        url.searchParams.delete('training_module_id');
        url.searchParams.delete('attempt_number');
        url.searchParams.delete('training_content_id');
        url.searchParams.delete('date_from');
        url.searchParams.delete('date_to');
        url.searchParams.delete('page');
        window.location.href = url.toString();
    };

    return (
        <AdminPageShell>
            <AdminPageHeader
                icon={ClipboardList}
                title="Evaluations & Scoring"
                description="Monitor event evaluations, final scenario training scores, and lesson quiz results in one place."
            />

            <div className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => switchTab(tab.id)}
                                className={`rounded-lg px-4 py-3 text-left transition-all ${
                                    isActive
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                <span className="inline-flex items-center gap-2 font-semibold text-sm">
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </span>
                                <span className={`block mt-1 text-xs ${isActive ? 'text-emerald-50' : 'text-slate-500'}`}>
                                    {tab.description}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-600">
                Viewing: <span className="font-semibold text-slate-900">{currentTab.label}</span>
            </div>

            {activeTab === 'events' && (
                <EvaluationEventsPanel events={events} filters={eventFilters} />
            )}

            {activeTab === 'modules' && (
                <EvaluationResultsIndex
                    embedded
                    results={evaluationResults}
                    pagination={evaluationResultsPagination}
                    analytics={evaluationAnalytics}
                    modules={evaluationModules}
                    attemptNumbers={evaluationAttemptNumbers}
                    filters={evaluationFilters}
                    passingScore={evaluationPassingScore}
                    role={role}
                />
            )}

            {activeTab === 'lessons' && (
                <LessonQuizResultsIndex
                    attempts={lessonQuizAttempts}
                    pagination={lessonQuizPagination}
                    analytics={lessonQuizAnalytics}
                    modules={lessonQuizModules}
                    filters={lessonQuizFilters}
                />
            )}
        </AdminPageShell>
    );
}
