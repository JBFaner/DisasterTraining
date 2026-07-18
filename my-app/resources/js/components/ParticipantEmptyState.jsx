import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * Reusable empty state for participant portal pages.
 *
 * @param {Object} props
 * @param {React.ComponentType} props.icon - Lucide icon component
 * @param {string} props.title
 * @param {string} props.description
 * @param {{ href: string, label: string }} [props.primaryAction]
 * @param {{ href: string, label: string }[]} [props.secondaryActions]
 * @param {string[]} [props.steps] - Numbered path hints
 * @param {string} [props.footnote]
 * @param {'default'|'compact'} [props.variant]
 */
export function ParticipantEmptyState({
    icon: Icon,
    title,
    description,
    primaryAction = null,
    secondaryActions = [],
    steps = [],
    footnote = null,
    variant = 'default',
}) {
    const isCompact = variant === 'compact';
    const padding = isCompact ? 'px-4 py-6' : 'px-6 py-10';
    const iconSize = isCompact ? 'h-8 w-8' : 'h-10 w-10';

    return (
        <div className={`rounded-xl border border-dashed border-slate-300 bg-slate-50/50 text-center ${padding}`}>
            {Icon && <Icon className={`mx-auto ${iconSize} text-slate-400`} />}
            <p className={`${Icon ? 'mt-3' : ''} font-semibold text-slate-800 ${isCompact ? 'text-sm' : ''}`}>
                {title}
            </p>
            {description && (
                <p className={`mt-1 text-slate-600 max-w-lg mx-auto ${isCompact ? 'text-xs' : 'text-sm'}`}>
                    {description}
                </p>
            )}
            {steps.length > 0 && (
                <ol className={`mt-4 text-left max-w-md mx-auto space-y-2 ${isCompact ? 'text-xs' : 'text-sm'} text-slate-600`}>
                    {steps.map((step, index) => (
                        <li key={step} className="flex gap-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[0.65rem] font-bold text-emerald-800">
                                {index + 1}
                            </span>
                            <span>{step}</span>
                        </li>
                    ))}
                </ol>
            )}
            {footnote && (
                <p className="mt-3 text-xs text-slate-500">{footnote}</p>
            )}
            {(primaryAction || secondaryActions.length > 0) && (
                <div className={`flex flex-wrap items-center justify-center gap-2 ${isCompact ? 'mt-4' : 'mt-5'}`}>
                    {primaryAction?.href && (
                        <a
                            href={primaryAction.href}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                        >
                            {primaryAction.label}
                            <ChevronRight className="w-4 h-4" />
                        </a>
                    )}
                    {secondaryActions.map((action) => (
                        <a
                            key={action.href}
                            href={action.href}
                            className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            {action.label}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}

export const PARTICIPANT_EMPTY_STATES = {
    evaluationsOverview: {
        title: 'No evaluation records yet',
        description: 'Your scores appear here after you complete lesson quizzes, pass a Final AI Scenario Assessment, or receive a simulation event evaluation.',
        primaryAction: { href: '/participant/training-modules', label: 'Start Training' },
        secondaryActions: [
            { href: '/participant/simulation-events', label: 'Browse Events' },
            { href: '/participant/evaluations?tab=lessons', label: 'Lesson Quizzes' },
        ],
        footnote: 'Passing score: 75%',
    },
    evaluationsModules: {
        title: 'No module assessment results',
        description: 'Complete all lessons in a module, then pass the Final AI Scenario Assessment.',
        steps: [
            'Open a training module and finish every lesson',
            'Take any required lesson quizzes',
            'Start and pass the Final AI Scenario Assessment',
        ],
        primaryAction: { href: '/participant/training-modules', label: 'Browse Training Modules' },
        footnote: 'Passing score: 75%',
    },
    evaluationsEvents: {
        title: 'No event drill evaluations',
        description: 'Live drill scores are submitted by your trainer after you attend a simulation event.',
        steps: [
            'Register for a published simulation event',
            'Attend on the scheduled date',
            'Wait for your trainer to submit the evaluation',
        ],
        primaryAction: { href: '/participant/simulation-events', label: 'View Simulation Events' },
        secondaryActions: [{ href: '/participant/my-attendance', label: 'My Attendance' }],
    },
    evaluationsLessons: {
        title: 'No lesson quiz results',
        description: 'Lesson quizzes unlock after you work through lesson materials in a training module.',
        primaryAction: { href: '/participant/training-modules', label: 'Open Training Modules' },
        secondaryActions: [{ href: '/participant/dashboard', label: 'Dashboard' }],
    },
    myTrainings: {
        title: 'No campaign registrations yet',
        description: 'Campaign trainings are joined through a registration link shared by your barangay or LGU.',
        steps: [
            'Open the campaign link sent by your organizer',
            'Sign in or create a participant account',
            'Complete registration, then open your assigned module',
        ],
        primaryAction: { href: '/participant/training-modules', label: 'Browse Self-Paced Modules' },
        secondaryActions: [{ href: '/participant/dashboard', label: 'Go to Dashboard' }],
    },
    myAttendance: {
        title: 'No attendance records yet',
        description: 'Attendance is recorded when you participate in a scheduled simulation event.',
        steps: [
            'Register for an upcoming simulation event',
            'Attend on the event date',
            'Your trainer marks attendance after the drill',
        ],
        primaryAction: { href: '/participant/simulation-events', label: 'Find Simulation Events' },
        secondaryActions: [{ href: '/participant/my-trainings', label: 'My Trainings' }],
    },
    myCertificates: {
        title: 'No certificates yet',
        description: 'You can earn certificates through two paths: self-paced module completion or live simulation event drills.',
        steps: [
            'Self-paced: complete lessons → pass Final AI Assessment (75%+) → certificate issued automatically',
            'Event-based: register → attend drill → pass trainer evaluation → LGU issues certificate',
        ],
        primaryAction: { href: '/participant/training-modules', label: 'Start Self-Paced Training' },
        secondaryActions: [
            { href: '/participant/simulation-events', label: 'Simulation Events' },
            { href: '/participant/evaluations', label: 'Evaluation Results' },
        ],
    },
    trainingModules: {
        title: 'No training modules available',
        description: 'Published modules appear here for self-paced learning. If you joined via a campaign, your assigned modules may be limited to that enrollment.',
        primaryAction: { href: '/participant/my-trainings', label: 'Check My Trainings' },
        secondaryActions: [{ href: '/participant/dashboard', label: 'Dashboard' }],
    },
    trainingModulesFiltered: {
        title: 'No modules match your search',
        description: 'Try a different search term or clear filters to see all available modules.',
        primaryAction: { href: '/participant/training-modules', label: 'View All Modules' },
    },
    simulationEvents: {
        title: 'No simulation events available',
        description: 'Published drills and exercises will appear here when your LGU schedules them.',
        primaryAction: { href: '/participant/training-modules', label: 'Continue Self-Paced Training' },
        secondaryActions: [{ href: '/participant/dashboard', label: 'Dashboard' }],
    },
    simulationEventsFiltered: {
        title: 'No events match your filters',
        description: 'Try changing the search or registration filter to see more events.',
        primaryAction: { href: '/participant/simulation-events', label: 'Clear Filters' },
    },
    moduleLessons: {
        title: 'No lessons in this module yet',
        description: 'Learning content has not been added. Check back later or contact your training coordinator.',
        primaryAction: { href: '/participant/training-modules', label: 'Back to Modules' },
    },
    dashboardModules: {
        title: 'No module progress yet',
        description: 'Start a published training module to track your completion here.',
        primaryAction: { href: '/participant/training-modules', label: 'Browse Modules' },
        secondaryActions: [{ href: '/participant/my-trainings', label: 'My Trainings' }],
        variant: 'compact',
    },
    dashboardEvents: {
        title: 'No upcoming events',
        description: 'Register for simulation drills when your LGU publishes them.',
        primaryAction: { href: '/participant/simulation-events', label: 'View Events' },
        variant: 'compact',
    },
};
