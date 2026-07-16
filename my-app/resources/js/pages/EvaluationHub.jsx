import React from 'react';
import { BookOpen, ClipboardList, GraduationCap, LayoutDashboard, Printer } from 'lucide-react';
import { AdminPageHeader, AdminPageShell, AdminPrimaryButton } from '../components/admin/AdminLayout';
import { EvaluationEventsPanel } from './EvaluationEventsPanel';
import { EvaluationResultsIndex } from './EvaluationResultsIndex';
import { LessonQuizResultsIndex } from './LessonQuizResultsIndex';
import { EvaluationOverallPanel } from './EvaluationOverallPanel';
import { EVALUATION_HUB_PRINT_EVENT } from './evaluationHubEvents';

const TABS = [
    { id: 'lessons', label: 'Lesson Quizzes', icon: BookOpen, description: 'Per-lesson quiz attempts and pass/fail results.' },
    { id: 'modules', label: 'Evaluation', icon: GraduationCap, description: 'Final AI scenario training scores per module.' },
    { id: 'events', label: 'Simulation Event', icon: ClipboardList, description: 'Post-drill scoring for completed simulation events.' },
    { id: 'overall', label: 'Overall', icon: LayoutDashboard, description: 'Combined list of who passed each stage.' },
];

export function EvaluationHub({
    activeTab = 'lessons',
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
    lessonQuizBatches = [],
    lessonQuizFilters = {},
    overallSummary = null,
    overallLessonPassed = [],
    overallScenarioPassed = [],
    overallSimulationPassed = [],
    overallModules = [],
    overallFilters = {},
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
        url.searchParams.delete('participant_name');
        url.searchParams.delete('batch_filter');
        url.searchParams.delete('date_from');
        url.searchParams.delete('date_to');
        url.searchParams.delete('page');
        window.location.href = url.toString();
    };

    const requestPrint = () => {
        window.dispatchEvent(new CustomEvent(EVALUATION_HUB_PRINT_EVENT, {
            detail: { tab: activeTab },
        }));
    };

    return (
        <AdminPageShell>
            <AdminPageHeader
                icon={ClipboardList}
                title="Evaluations & Scoring"
                description="Follow the training path: Lesson Quizzes → Evaluation → Simulation Event → Overall."
                actions={(
                    <AdminPrimaryButton type="button" onClick={requestPrint}>
                        <Printer className="w-4 h-4" />
                        Print
                    </AdminPrimaryButton>
                )}
            />

            <div className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-1.5">
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

            {activeTab === 'lessons' && (
                <LessonQuizResultsIndex
                    attempts={lessonQuizAttempts}
                    pagination={lessonQuizPagination}
                    analytics={lessonQuizAnalytics}
                    modules={lessonQuizModules}
                    batches={lessonQuizBatches}
                    filters={lessonQuizFilters}
                />
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

            {activeTab === 'events' && (
                <EvaluationEventsPanel events={events} filters={eventFilters} />
            )}

            {activeTab === 'overall' && (
                <EvaluationOverallPanel
                    summary={overallSummary}
                    lessonPassed={overallLessonPassed}
                    scenarioPassed={overallScenarioPassed}
                    simulationPassed={overallSimulationPassed}
                    modules={overallModules}
                    filters={overallFilters}
                />
            )}
        </AdminPageShell>
    );
}
