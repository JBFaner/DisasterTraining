import React from 'react';
import { ParticipantEmptyState, PARTICIPANT_EMPTY_STATES } from '../components/ParticipantEmptyState';
import {
    Award,
    BookOpen,
    CalendarClock,
    ChevronRight,
    ClipboardList,
    GraduationCap,
    LayoutDashboard,
    MapPin,
    Sparkles,
    Target,
} from 'lucide-react';

function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(timeString) {
    if (!timeString || !/^\d{2}:\d{2}/.test(timeString)) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

function firstName(fullName) {
    if (!fullName) return 'Participant';
    return String(fullName).trim().split(/\s+/)[0] || 'Participant';
}

function SummaryCard({ title, value, hint, href, Icon }) {
    const content = (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 h-full">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
                    <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
                    {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
                </div>
                <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );

    if (href) {
        return <a href={href} className="block">{content}</a>;
    }

    return content;
}

function ProgressBar({ percent }) {
    const value = Math.max(0, Math.min(100, Number(percent) || 0));

    return (
        <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${value}%` }}
            />
        </div>
    );
}

export function ParticipantDashboard({ dashboard = {}, userName = '' }) {
    const summary = dashboard.summary || {};
    const continueLearning = dashboard.continue_learning || null;
    const moduleProgress = dashboard.module_progress || [];
    const upcomingEvents = dashboard.upcoming_events || [];
    const nextSteps = dashboard.next_steps || [];
    const campaignTrainings = dashboard.campaign_trainings || [];
    const displayName = dashboard.user_name || userName;

    const continueHref = continueLearning?.id
        ? `/participant/training-modules/${continueLearning.id}`
        : '/participant/training-modules';

    const continueLabel = (() => {
        if (!continueLearning) return 'Browse modules';
        if (continueLearning.assessment_in_progress) return 'Resume assessment';
        if (continueLearning.progress_percent >= 100 && !continueLearning.assessment_passed) {
            return 'Take assessment';
        }
        if (continueLearning.progress_percent > 0) return 'Continue learning';
        return 'Start module';
    })();

    const continueDescription = (() => {
        if (!continueLearning) {
            return 'Explore published training modules and begin your disaster preparedness journey.';
        }
        if (continueLearning.assessment_in_progress) {
            return 'You have an assessment in progress. Finish it to see your evaluation report.';
        }
        if (continueLearning.progress_percent >= 100 && !continueLearning.assessment_passed) {
            return 'Lessons complete — pass the Final AI Scenario Assessment to finish this module.';
        }
        if (continueLearning.progress_percent > 0) {
            return `${continueLearning.progress_percent}% complete · ${continueLearning.lesson_count || 0} lessons`;
        }
        return 'Start with the first lesson and work through the module at your own pace.';
    })();

    return (
        <div className="space-y-8 pb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 rounded-2xl shadow-sm">
                        <LayoutDashboard className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                            Welcome back, {firstName(displayName)}
                        </h1>
                        <p className="text-slate-600 mt-0.5">
                            Your learning hub — track training, events, evaluations, and certificates.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <SummaryCard
                    title="Training Progress"
                    value={summary.modules_in_progress ?? 0}
                    hint={`${summary.modules_completed ?? 0} completed · ${summary.modules_available ?? 0} available`}
                    href="/participant/training-modules"
                    Icon={BookOpen}
                />
                <SummaryCard
                    title="Evaluations"
                    value={summary.evaluations_count ?? 0}
                    hint="AI scenario assessment reports"
                    href="/participant/evaluations"
                    Icon={ClipboardList}
                />
                <SummaryCard
                    title="Certificates"
                    value={summary.certificates_count ?? 0}
                    hint="Issued by your LGU after events"
                    href="/participant/certification"
                    Icon={Award}
                />
                <SummaryCard
                    title="Event Registrations"
                    value={summary.registered_events ?? 0}
                    hint={
                        (summary.pending_event_registrations ?? 0) > 0
                            ? `${summary.pending_event_registrations} pending approval`
                            : 'Approved simulation events'
                    }
                    href="/participant/simulation-events"
                    Icon={CalendarClock}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 to-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Continue learning</p>
                            <h2 className="mt-1 text-xl font-bold text-slate-900 truncate">
                                {continueLearning?.title || 'Training Modules'}
                            </h2>
                            <p className="mt-2 text-sm text-slate-600">{continueDescription}</p>
                            {continueLearning && (
                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                                        <span>Module progress</span>
                                        <span>{continueLearning.progress_percent ?? 0}%</span>
                                    </div>
                                    <ProgressBar percent={continueLearning.progress_percent} />
                                </div>
                            )}
                        </div>
                        <Sparkles className="w-8 h-8 text-emerald-500 shrink-0 hidden sm:block" />
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                        <a
                            href={continueHref}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 shadow-sm transition-colors"
                        >
                            {continueLabel}
                            <ChevronRight className="w-4 h-4" />
                        </a>
                        <a
                            href="/participant/training-modules"
                            className="inline-flex items-center rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold px-4 py-2.5 transition-colors"
                        >
                            All modules
                        </a>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Target className="w-5 h-5 text-emerald-600" />
                        <h2 className="text-lg font-bold text-slate-900">Next steps</h2>
                    </div>
                    {nextSteps.length === 0 ? (
                        <p className="text-sm text-slate-500">You&apos;re all caught up. Check back for new trainings and events.</p>
                    ) : (
                        <ul className="space-y-3">
                            {nextSteps.map((step) => (
                                <li key={step.id}>
                                    <a
                                        href={step.href}
                                        className="block rounded-xl border border-slate-200 p-3 hover:border-emerald-200 hover:bg-emerald-50/40 transition-colors"
                                    >
                                        <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                                        <p className="mt-0.5 text-xs text-slate-600 line-clamp-2">{step.description}</p>
                                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                            {step.action_label}
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                            <GraduationCap className="w-5 h-5 text-emerald-600" />
                            My module progress
                        </h2>
                        <a href="/participant/training-modules" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
                            View all
                        </a>
                    </div>
                    {moduleProgress.length === 0 ? (
                        <ParticipantEmptyState
                            icon={BookOpen}
                            {...PARTICIPANT_EMPTY_STATES.dashboardModules}
                        />
                    ) : (
                        <ul className="space-y-3">
                            {moduleProgress.slice(0, 5).map((module) => (
                                <li key={module.id}>
                                    <a
                                        href={`/participant/training-modules/${module.id}`}
                                        className="block rounded-xl border border-slate-200 p-3 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 truncate">{module.title}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {module.category || 'Training'}
                                                    {module.assessment_passed ? ' · Assessment passed' : ''}
                                                </p>
                                            </div>
                                            <span className="text-sm font-bold text-emerald-700 shrink-0">
                                                {module.progress_percent ?? 0}%
                                            </span>
                                        </div>
                                        <div className="mt-2">
                                            <ProgressBar percent={module.progress_percent} />
                                        </div>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                            <CalendarClock className="w-5 h-5 text-emerald-600" />
                            Upcoming simulation events
                        </h2>
                        <a href="/participant/simulation-events" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
                            View all
                        </a>
                    </div>
                    {upcomingEvents.length === 0 ? (
                        <ParticipantEmptyState
                            icon={CalendarClock}
                            {...PARTICIPANT_EMPTY_STATES.dashboardEvents}
                        />
                    ) : (
                        <ul className="space-y-3">
                            {upcomingEvents.slice(0, 5).map((event) => (
                                <li key={event.id}>
                                    <a
                                        href={`/participant/simulation-events/${event.id}`}
                                        className="block rounded-xl border border-slate-200 p-3 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 truncate">{event.title}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {formatDate(event.event_date)}
                                                    {event.start_time ? ` · ${formatTime(event.start_time)}` : ''}
                                                </p>
                                                {event.location && (
                                                    <p className="text-xs text-slate-500 mt-1 inline-flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {event.location}
                                                    </p>
                                                )}
                                            </div>
                                            <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${
                                                event.is_registered
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                            }`}>
                                                {event.is_registered
                                                    ? (event.registration_status === 'pending' ? 'Pending' : 'Registered')
                                                    : 'Open'}
                                            </span>
                                        </div>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {campaignTrainings.length > 0 && (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-900">My campaign trainings</h2>
                        <a href="/participant/my-trainings" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
                            View all
                        </a>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                        {campaignTrainings.map((training) => (
                            <div key={training.id} className="rounded-xl border border-slate-200 p-4">
                                <p className="text-sm font-semibold text-slate-900 line-clamp-2">{training.title}</p>
                                <p className="mt-2 text-xs text-slate-500">Status: {training.training_status}</p>
                                {training.training_module_id && (
                                    <a
                                        href={`/participant/training-modules/${training.training_module_id}`}
                                        className="mt-3 inline-flex text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                                    >
                                        Open module →
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Quick links</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                        { href: '/participant/training-modules', label: 'Training Modules', Icon: BookOpen },
                        { href: '/participant/simulation-events', label: 'Simulation Events', Icon: CalendarClock },
                        { href: '/participant/my-trainings', label: 'My Trainings', Icon: GraduationCap },
                        { href: '/participant/my-attendance', label: 'My Attendance', Icon: MapPin },
                        { href: '/participant/evaluations', label: 'Evaluations', Icon: ClipboardList },
                        { href: '/participant/certification', label: 'Certificates', Icon: Award },
                    ].map(({ href, label, Icon }) => (
                        <a
                            key={href}
                            href={href}
                            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 py-5 px-2 text-center hover:border-emerald-200 hover:bg-emerald-50/40 transition-colors"
                        >
                            <Icon className="w-6 h-6 text-emerald-600" />
                            <span className="text-xs font-semibold text-slate-700">{label}</span>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
