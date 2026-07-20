import React from 'react';
import Swal from 'sweetalert2';
import {
    CalendarClock,
    ClipboardCheck,
    Activity,
    ListChecks,
    Users,
    FileText,
    Play,
    CheckCircle2,
    Clock,
    Pencil,
    BarChart3,
} from 'lucide-react';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminPrimaryButton,
    AdminSecondaryButton,
} from './admin/AdminLayout';
import { deriveSimulationEventStatus, getEventDateTime } from '../utils/simulationEventStatus';
import { isExercisePlanEvent } from '../utils/simulationEventNavigation';

function formatDate(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function formatTime(timeString) {
    if (!timeString) return '';
    if (timeString.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    }
    return timeString;
}

function formatTimelineTime(timeString, recordedAt) {
    if (recordedAt) {
        return new Date(recordedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    if (timeString) {
        const [hours, minutes] = timeString.split(':').map((v) => parseInt(v, 10) || 0);
        const dt = new Date();
        dt.setHours(hours, minutes, 0, 0);
        return dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return '—';
}

function monitoringStatusTone(status) {
    const map = {
        Scheduled: 'bg-sky-50 text-sky-700 border-sky-200',
        Ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        Ongoing: 'bg-blue-50 text-blue-700 border-blue-200',
        Completed: 'bg-slate-50 text-slate-700 border-slate-200',
        Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return map[status] || 'bg-slate-50 text-slate-700 border-slate-200';
}

function getInitialTab(event) {
    if (typeof window === 'undefined') return 'planning';
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const allowed = ['planning', 'readiness', 'monitoring', 'execution', 'attendance', 'evaluation'];
    if (allowed.includes(tab)) {
        return tab;
    }
    if (isExercisePlanEvent(event)) {
        return 'readiness';
    }
    return 'planning';
}

function StatCard({ label, value, hint }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
            {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
    );
}

function PersonnelRosterTable({ roster = [], emptyHint = 'No personnel roles on the linked exercise plan.' }) {
    if (!roster.length) {
        return <p className="text-sm text-slate-500">{emptyHint}</p>;
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                        <th className="px-3 py-2">Role</th>
                        <th className="px-3 py-2">Assigned To</th>
                        <th className="px-3 py-2">Source</th>
                        <th className="px-3 py-2">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {roster.map((row, index) => (
                        <tr key={`${row.role}-${row.person_name || 'open'}-${index}`}>
                            <td className="px-3 py-2 font-medium text-slate-800">{row.role || '—'}</td>
                            <td className="px-3 py-2 text-slate-700">{row.person_name || 'Unassigned'}</td>
                            <td className="px-3 py-2 text-slate-500">{row.source_label || '—'}</td>
                            <td className="px-3 py-2">
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                    row.assigned
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                                >
                                    {row.assigned ? 'Assigned' : 'Open'}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function SimulationEventLifecyclePage({ event, lifecycle: initialLifecycle, role }) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const [lifecycle, setLifecycle] = React.useState(initialLifecycle || null);
    const [activeTab, setActiveTab] = React.useState(() => getInitialTab(event));
    const [isSaving, setIsSaving] = React.useState(false);
    const [evaluationForm, setEvaluationForm] = React.useState(
        initialLifecycle?.post_evaluation || {
            overall_remarks: '',
            success_level: '',
            problems_encountered: '',
            recommendations: '',
            lessons_learned: '',
        }
    );

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        const url = new URL(window.location.href);
        if (tabId === 'planning') {
            url.searchParams.delete('tab');
        } else {
            url.searchParams.set('tab', tabId);
        }
        window.history.replaceState({}, '', url);
    };

    const lifecycleData = lifecycle || initialLifecycle;
    const monitoringStatus = lifecycleData?.monitoring_status || 'Scheduled';
    const readiness = lifecycleData?.readiness;
    const executionProgress = lifecycleData?.execution_progress || [];
    const executionPercent = lifecycleData?.execution_percent ?? 0;
    const timelineEntries = lifecycleData?.timeline_entries || [];
    const attendance = lifecycleData?.attendance_summary || {};
    const resources = lifecycleData?.resource_utilization || {};
    const trainer = lifecycleData?.trainer;
    const participants = lifecycleData?.participants || [];
    const equipment = lifecycleData?.equipment || [];
    const personnelRoster = lifecycleData?.personnel_roster || [];
    const evaluationMode = lifecycleData?.evaluation_mode || 'team';
    const evaluationModeLabel = lifecycleData?.evaluation_mode_label
        || (evaluationMode === 'individual' ? 'Individual (per participant)' : 'Team / overall');
    const isIndividualEvaluation = evaluationMode === 'individual';

    const isCompleted = ['completed', 'ended', 'archived'].includes(event.status);
    const isOngoing = event.status === 'ongoing';
    const isPublished = event.status === 'published';
    const isDraft = event.status === 'draft';
    const fromExercisePlan = isExercisePlanEvent(event);
    const exercisePlan = event.simulation_exercise_template;

    const registeredCount = Number(attendance.registered ?? 0);
    const checkedInCount = Number(attendance.checked_in ?? 0);
    const attendanceCompletionRate = Number(attendance.completion_rate ?? 0);
    const attendanceVerificationStep = executionProgress.find((step) => step.key === 'attendance_verification');
    const attendanceReadyForVerification =
        registeredCount > 0 && (attendanceCompletionRate >= 80 || checkedInCount >= registeredCount);
    const showAttendanceVerificationHint =
        isOngoing &&
        attendanceReadyForVerification &&
        attendanceVerificationStep &&
        !attendanceVerificationStep.completed;
    const drillStarted = Boolean(executionProgress.find((step) => step.key === 'drill_started')?.completed);
    const canScoreParticipants = isIndividualEvaluation
        && (isOngoing || isCompleted)
        && checkedInCount > 0;

    const now = new Date();
    const startDt = getEventDateTime(event.event_date, event.start_time);
    const endDt = getEventDateTime(event.event_date, event.end_time);
    const canStartEvent =
        role !== 'PARTICIPANT' &&
        isPublished &&
        readiness?.all_complete &&
        startDt &&
        now >= startDt &&
        (!endDt || now <= endDt);

    const TABS = [
        { id: 'planning', label: 'Event Planning', icon: CalendarClock },
        { id: 'readiness', label: 'Simulation Readiness', icon: ClipboardCheck },
        { id: 'monitoring', label: 'Simulation Monitoring', icon: Activity },
        { id: 'execution', label: 'Execution Progress', icon: ListChecks },
        { id: 'attendance', label: 'Attendance', icon: Users },
        { id: 'evaluation', label: 'Post Evaluation', icon: FileText },
    ];

    const handleReadinessToggle = async (field, value) => {
        setIsSaving(true);
        try {
            const response = await fetch(`/admin/simulation-events/${event.id}/readiness`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
                body: JSON.stringify({ [field]: value }),
            });
            const data = await response.json();
            if (data.lifecycle) {
                setLifecycle(data.lifecycle);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleCompleteStep = async (stepKey, label) => {
        const result = await Swal.fire({
            title: 'Complete Step',
            text: `Mark "${label}" as completed?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, complete',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#16a34a',
        });
        if (!result.isConfirmed) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/admin/simulation-events/${event.id}/execution-steps/${stepKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
            });
            const data = await response.json();
            if (!response.ok) {
                Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'Failed to update step.' });
                return;
            }
            if (data.lifecycle) {
                setLifecycle(data.lifecycle);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleStartEvent = async (e) => {
        e.preventDefault();
        if (!readiness?.all_complete) {
            Swal.fire({
                icon: 'warning',
                title: 'Not Ready',
                text: 'Complete all readiness checklist items before starting the simulation.',
            });
            return;
        }
        const result = await Swal.fire({
            title: 'Start Simulation',
            text: 'Start this simulation event? Status will change to Ongoing.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, start',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#16a34a',
        });
        if (result.isConfirmed) e.target.submit();
    };

    const handleCompleteEvent = async (e) => {
        e.preventDefault();
        const result = await Swal.fire({
            title: 'Complete Simulation',
            text: 'Mark this simulation as completed? Resources will be returned to inventory.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, complete',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#16a34a',
        });
        if (result.isConfirmed) e.target.submit();
    };

    const handleSaveEvaluation = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const response = await fetch(`/admin/simulation-events/${event.id}/post-evaluation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
                body: JSON.stringify(evaluationForm),
            });
            const data = await response.json();
            if (!response.ok) {
                Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'Failed to save evaluation.' });
                return;
            }
            if (data.lifecycle) {
                setLifecycle(data.lifecycle);
            }
            Swal.fire({ icon: 'success', title: 'Saved', text: 'Post-simulation evaluation saved.', timer: 2000, showConfirmButton: false });
        } finally {
            setIsSaving(false);
        }
    };

    const scenario = event.scenario;
    const trainingModule = scenario?.training_module || event.training_module;

    return (
        <AdminPageShell>
            <AdminPageHeader
                icon={CalendarClock}
                title={event.title}
                description={`${formatDate(event.event_date)} • ${formatTime(event.start_time)} – ${formatTime(event.end_time)} • ${event.location || 'Location TBD'}`}
                actions={
                    <div className="flex flex-wrap gap-2">
                        {isDraft && !fromExercisePlan && (
                            <AdminSecondaryButton href={`/admin/simulation-events/${event.id}/edit`}>
                                <Pencil className="w-4 h-4" /> Edit Planning
                            </AdminSecondaryButton>
                        )}
                        {isDraft && fromExercisePlan && (
                            <form
                                method="POST"
                                action={`/admin/simulation-events/${event.id}/publish`}
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const form = e.currentTarget;
                                    const result = await Swal.fire({
                                        title: 'Publish simulation event?',
                                        text: 'Participants can register once this event is published.',
                                        icon: 'question',
                                        showCancelButton: true,
                                        confirmButtonText: 'Publish',
                                        cancelButtonText: 'Cancel',
                                        confirmButtonColor: '#16a34a',
                                    });
                                    if (!result.isConfirmed) return;
                                    try {
                                        const response = await fetch(form.action, {
                                            method: 'POST',
                                            body: new FormData(form),
                                            headers: { Accept: 'application/json' },
                                        });
                                        if (!response.ok) throw new Error('Publish failed');
                                        window.location.href = `/admin/simulation-events/${event.id}?tab=monitoring`;
                                    } catch {
                                        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to publish event.' });
                                    }
                                }}
                            >
                                <input type="hidden" name="_token" value={csrf} />
                                <AdminPrimaryButton type="submit" disabled={isSaving}>
                                    Publish Event
                                </AdminPrimaryButton>
                            </form>
                        )}
                        {canStartEvent && (
                            <form method="POST" action={`/admin/simulation-events/${event.id}/start`} onSubmit={handleStartEvent}>
                                <input type="hidden" name="_token" value={csrf} />
                                <AdminPrimaryButton type="submit" disabled={isSaving}>
                                    <Play className="w-4 h-4" /> Start Simulation
                                </AdminPrimaryButton>
                            </form>
                        )}
                        {isOngoing && (
                            <form method="POST" action={`/admin/simulation-events/${event.id}/complete`} onSubmit={handleCompleteEvent}>
                                <input type="hidden" name="_token" value={csrf} />
                                <AdminPrimaryButton type="submit" disabled={isSaving}>
                                    <CheckCircle2 className="w-4 h-4" /> Mark Completed
                                </AdminPrimaryButton>
                            </form>
                        )}
                    </div>
                }
            />

            <div className="rounded-2xl bg-white border border-slate-200 shadow-md p-4 md:p-5">
                <div className="flex flex-wrap items-center gap-3">
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${monitoringStatusTone(monitoringStatus)}`}>
                        {monitoringStatus}
                    </span>
                    <span className="text-sm text-slate-600">
                        {event.disaster_type || '—'} • {event.event_category || '—'}
                    </span>
                    {trainingModule?.title && (
                        <span className="text-sm text-slate-500">Module: {trainingModule.title}</span>
                    )}
                    {fromExercisePlan && exercisePlan?.title && (
                        <span className="text-sm text-violet-700">Exercise Plan: {exercisePlan.title}</span>
                    )}
                </div>
            </div>

            {fromExercisePlan ? (
                <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
                    This simulation event was generated from an exercise plan. Review readiness, publish when ready, then continue in <strong>Simulation Monitoring</strong>.
                </div>
            ) : null}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2.5 w-full overflow-x-auto">
                <div className="flex gap-1 flex-wrap min-w-max">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => handleTabChange(tab.id)}
                                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-250 flex items-center gap-2 whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {activeTab === 'planning' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard label="Schedule" value={formatDate(event.event_date)} hint={`${formatTime(event.start_time)} – ${formatTime(event.end_time)}`} />
                        <StatCard label="Trainer" value={trainer?.name || 'Not assigned'} hint={trainer?.specialization || 'Assign in event edit form'} />
                        <StatCard label="Participants" value={participants.length} hint="Approved registrations" />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                        <h3 className="text-sm font-semibold text-slate-900">Planning Actions</h3>
                        <div className="flex flex-wrap gap-2">
                            {!fromExercisePlan ? (
                                <AdminSecondaryButton href={`/admin/simulation-events/${event.id}/edit`}>
                                    <Pencil className="w-4 h-4" /> Edit Event
                                </AdminSecondaryButton>
                            ) : null}
                            <AdminSecondaryButton href={`/admin/simulation-events/${event.id}/registrations`}>
                                <Users className="w-4 h-4" /> Manage Participants
                            </AdminSecondaryButton>
                            <AdminSecondaryButton href={`/admin/simulation-events/${event.id}/attendance`}>
                                <CheckCircle2 className="w-4 h-4" /> Attendance
                            </AdminSecondaryButton>
                            <AdminSecondaryButton href={`/admin/simulation-events/${event.id}/evaluation`}>
                                <ClipboardCheck className="w-4 h-4" /> Evaluation
                            </AdminSecondaryButton>
                            <AdminSecondaryButton href={`/admin/simulation-events/${event.id}/evaluation/summary`}>
                                <BarChart3 className="w-4 h-4" /> Reports
                            </AdminSecondaryButton>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-900 mb-3">Hazard Scenario</h3>
                            <p className="text-sm text-slate-700">{scenario?.title || 'No scenario assigned'}</p>
                            {scenario?.description && (
                                <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{scenario.description}</p>
                            )}
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-900 mb-3">Assigned Equipment</h3>
                            {equipment.length === 0 ? (
                                <p className="text-sm text-slate-500">No equipment assigned yet.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {equipment.map((item) => (
                                        <li key={item.id} className="flex justify-between text-sm text-slate-700">
                                            <span>{item.name}</span>
                                            <span className="text-slate-500">Qty {item.quantity_assigned || item.quantity_needed}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'readiness' && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Readiness Checklist</h3>
                            <p className="text-sm text-slate-600 mt-1">
                                All items must be completed before the simulation can start.
                            </p>
                        </div>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${readiness?.all_complete ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                            {readiness?.all_complete ? 'Ready to Start' : 'Incomplete'}
                        </span>
                    </div>

                    <ul className="space-y-3">
                        {(readiness?.items || []).map((item) => (
                            <li key={item.key} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-4 py-3">
                                <div className="flex items-start gap-3 min-w-0">
                                    {item.completed ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                    ) : (
                                        <span className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0 mt-0.5" />
                                    )}
                                    <div className="min-w-0">
                                        <span className={`text-sm font-medium ${item.completed ? 'text-slate-800' : 'text-slate-600'}`}>
                                            {item.label}
                                            {item.automatic && (
                                                <span className="ml-2 text-xs font-normal text-slate-500">(Automatic)</span>
                                            )}
                                        </span>
                                        {item.detail && (
                                            <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p>
                                        )}
                                    </div>
                                </div>
                                {(item.key === 'venue_confirmed' || item.key === 'schedule_confirmed') && !item.completed && (
                                    <button
                                        type="button"
                                        disabled={isSaving}
                                        onClick={() => handleReadinessToggle(item.key, true)}
                                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                                    >
                                        Confirm
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900">Exercise Plan Personnel</h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Roles and assignments from the exercise plan. Confirm coverage before publishing.
                                </p>
                            </div>
                            <span className="text-xs font-semibold rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600">
                                Eval: {evaluationModeLabel}
                            </span>
                        </div>
                        <PersonnelRosterTable
                            roster={personnelRoster}
                            emptyHint={fromExercisePlan
                                ? 'No personnel roles on this exercise plan yet. Edit the plan to add roles.'
                                : 'Personnel roster is available for events created from an exercise plan.'}
                        />
                    </div>
                </div>
            )}

            {activeTab === 'monitoring' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="Event Status" value={monitoringStatus} />
                        <StatCard label="Current Trainer" value={trainer?.name || '—'} />
                        <StatCard label="Participants" value={participants.length} hint="Assigned & approved" />
                        <StatCard label="Execution Progress" value={`${executionPercent}%`} hint="Manual workflow steps" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-900 mb-3">Assigned Participants</h3>
                            {participants.length === 0 ? (
                                <p className="text-sm text-slate-500">No approved participants yet.</p>
                            ) : (
                                <ul className="space-y-2 max-h-48 overflow-y-auto">
                                    {participants.map((p) => (
                                        <li key={p.id} className="text-sm text-slate-700 flex justify-between gap-2">
                                            <span>{p.name || '—'}</span>
                                            <span className="text-slate-400 text-xs">{p.email}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-900 mb-3">Assigned Equipment</h3>
                            {equipment.length === 0 ? (
                                <p className="text-sm text-slate-500">No equipment assigned.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {equipment.map((item) => (
                                        <li key={item.id} className="text-sm text-slate-700 flex justify-between">
                                            <span>{item.name}</span>
                                            <span className="text-xs font-medium text-slate-500">{item.status || 'Assigned'}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-slate-900">Exercise Plan Personnel</h3>
                            <span className="text-xs font-semibold rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600">
                                {personnelRoster.filter((row) => row.assigned).length}/{personnelRoster.length || 0} assigned
                            </span>
                        </div>
                        <PersonnelRosterTable
                            roster={personnelRoster}
                            emptyHint="No personnel roster linked to this event."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <StatCard label="Registered" value={attendance.registered ?? 0} />
                        <StatCard label="Checked In" value={attendance.checked_in ?? 0} />
                        <StatCard label="Absent" value={attendance.absent ?? 0} />
                        <StatCard label="Late" value={attendance.late ?? 0} />
                        <StatCard label="Completion Rate" value={`${attendance.completion_rate ?? 0}%`} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard label="Equipment Assigned" value={resources.equipment_assigned ?? 0} />
                        <StatCard label="Equipment Used" value={resources.equipment_used ?? 0} />
                        <StatCard label="Equipment Returned" value={resources.equipment_returned ?? 0} />
                        <StatCard label="Equipment Damaged" value={resources.equipment_damaged ?? 0} />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-600" /> Event Timeline
                        </h3>
                        {timelineEntries.length === 0 ? (
                            <p className="text-sm text-slate-500">Timeline entries will appear when the simulation starts.</p>
                        ) : (
                            <ol className="space-y-4 border-l-2 border-emerald-200 ml-2 pl-5">
                                {timelineEntries.map((entry, index) => (
                                    <li key={`${entry.label}-${index}`} className="relative">
                                        <span className="absolute -left-[1.65rem] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                                        <p className="text-xs font-semibold text-emerald-700">
                                            {formatTimelineTime(entry.time, entry.recorded_at)}
                                        </p>
                                        <p className="text-sm text-slate-800">{entry.label}</p>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'execution' && (
                <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <h3 className="text-sm font-semibold text-slate-900">Simulation Execution Progress</h3>
                            <span className="text-sm font-semibold text-emerald-700">{executionPercent}% complete</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden mb-6">
                            <div
                                className="h-full bg-emerald-600 transition-all duration-300"
                                style={{ width: `${executionPercent}%` }}
                            />
                        </div>

                        {!isOngoing && !isCompleted && (
                            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
                                Start the simulation to begin tracking execution steps.
                            </p>
                        )}

                        {showAttendanceVerificationHint && (
                            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                                <p className="text-sm font-medium text-emerald-900">
                                    Attendance looks ready to verify
                                </p>
                                <p className="mt-1 text-xs text-emerald-800">
                                    {checkedInCount} of {registeredCount} participants are marked
                                    ({attendanceCompletionRate}% completion). You can mark{' '}
                                    <span className="font-semibold">Attendance Verification</span> complete when ready.
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        disabled={isSaving}
                                        onClick={() => handleCompleteStep('attendance_verification', 'Attendance Verification')}
                                        className="inline-flex items-center rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                                    >
                                        Mark Attendance Verification Complete
                                    </button>
                                    <AdminSecondaryButton href={`/admin/simulation-events/${event.id}/attendance`}>
                                        Open Attendance Management
                                    </AdminSecondaryButton>
                                </div>
                            </div>
                        )}

                        <ul className="space-y-3">
                            {executionProgress.map((step) => {
                                const isAttendanceStep = step.key === 'attendance_verification';

                                return (
                                <li key={step.key} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-4 py-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {step.completed ? (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                        ) : (
                                            <span className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-800">{step.label}</p>
                                            {isAttendanceStep && !step.completed && isOngoing && (
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {attendanceReadyForVerification
                                                        ? 'Suggested: attendance threshold reached — confirm manually.'
                                                        : `Manual step. Marked so far: ${checkedInCount}/${registeredCount || 0}.`}
                                                </p>
                                            )}
                                            {step.completed_at && (
                                                <p className="text-xs text-slate-500">
                                                    Completed {new Date(step.completed_at).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                                        {isAttendanceStep && (
                                            <a
                                                href={`/admin/simulation-events/${event.id}/attendance`}
                                                className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50"
                                            >
                                                Open Attendance Management
                                            </a>
                                        )}
                                        {isOngoing && !step.completed && (
                                            <button
                                                type="button"
                                                disabled={isSaving}
                                                onClick={() => handleCompleteStep(step.key, step.label)}
                                                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-50"
                                            >
                                                Mark Complete
                                            </button>
                                        )}
                                    </div>
                                </li>
                                );
                            })}
                        </ul>
                    </div>

                    {isIndividualEvaluation ? (
                        <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-5 shadow-sm space-y-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-sm font-semibold text-violet-950">Score Participants</h3>
                                    <p className="mt-1 text-sm text-violet-900/80">
                                        This exercise uses <span className="font-semibold">individual</span> evaluation
                                        (hands-on / skill-based). Score present participants during or right after the drill.
                                    </p>
                                </div>
                                <span className="text-xs font-semibold rounded-full border border-violet-200 bg-white px-2.5 py-1 text-violet-800">
                                    {evaluationModeLabel}
                                </span>
                            </div>
                            {!drillStarted && isOngoing ? (
                                <p className="text-xs text-violet-800">
                                    Tip: mark <span className="font-semibold">Drill Started</span> first, then score as participants complete their turns.
                                </p>
                            ) : null}
                            {Number(attendance.checked_in ?? 0) === 0 ? (
                                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                    Mark at least one participant Present (or Late) in Attendance before scoring.
                                </p>
                            ) : (
                                <p className="text-sm text-violet-900">
                                    {attendance.checked_in} participant{Number(attendance.checked_in) === 1 ? '' : 's'} ready for scoring.
                                </p>
                            )}
                            <div className="flex flex-wrap gap-2">
                                {canScoreParticipants ? (
                                    <AdminPrimaryButton href={`/admin/simulation-events/${event.id}/evaluation`}>
                                        <ClipboardCheck className="w-4 h-4" />
                                        Score Participants
                                    </AdminPrimaryButton>
                                ) : (
                                    <button
                                        type="button"
                                        disabled
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 bg-slate-100 text-slate-400 rounded-lg font-medium text-sm cursor-not-allowed"
                                        title="Start simulation and mark Present participants first"
                                    >
                                        Score Participants
                                    </button>
                                )}
                                <AdminSecondaryButton href={`/admin/simulation-events/${event.id}/attendance`}>
                                    Open Attendance
                                </AdminSecondaryButton>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                            This exercise uses <span className="font-semibold">team / overall</span> evaluation.
                            Complete the execution steps, then use the <span className="font-semibold">Post Evaluation</span> tab
                            for the after-action review (no per-participant scoring required).
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'attendance' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <StatCard label="Registered Participants" value={attendance.registered ?? 0} />
                        <StatCard label="Checked In" value={attendance.checked_in ?? 0} />
                        <StatCard label="Absent" value={attendance.absent ?? 0} />
                        <StatCard label="Late" value={attendance.late ?? 0} />
                        <StatCard label="Completion Rate" value={`${attendance.completion_rate ?? 0}%`} />
                    </div>

                    {Number(attendance.checked_in ?? 0) === 0 ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            Mark at least one participant as <span className="font-semibold">Present</span> (or Late)
                            in Attendance Management before Evaluation & Scoring. Absent participants cannot be scored.
                        </div>
                    ) : (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                            {attendance.checked_in} participant{Number(attendance.checked_in) === 1 ? '' : 's'} ready for scoring.
                            Criteria follow PH drill practice (BFP / NSED-style): alarm response, evacuation discipline,
                            accountability, PPE/safety, instructions, teamwork, and participation.
                        </div>
                    )}

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-wrap gap-2">
                        <AdminPrimaryButton href={`/admin/simulation-events/${event.id}/attendance`}>
                            Open Attendance Management
                        </AdminPrimaryButton>
                        {Number(attendance.checked_in ?? 0) > 0 ? (
                            <AdminSecondaryButton href={`/admin/simulation-events/${event.id}/evaluation`}>
                                Send to Evaluation & Scoring
                            </AdminSecondaryButton>
                        ) : (
                            <button
                                type="button"
                                disabled
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 bg-slate-100 text-slate-400 rounded-lg font-medium text-sm cursor-not-allowed"
                                title="Mark Present participants first"
                            >
                                Send to Evaluation & Scoring
                            </button>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'evaluation' && (
                <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 flex flex-wrap items-center justify-between gap-2">
                        <span>
                            Evaluation mode: <span className="font-semibold">{evaluationModeLabel}</span>
                            {isIndividualEvaluation
                                ? ' — participant skill scores are entered from Execution / Attendance.'
                                : ' — capture the drill after-action review for the whole team here.'}
                        </span>
                        {isIndividualEvaluation ? (
                            <AdminSecondaryButton href={`/admin/simulation-events/${event.id}/evaluation`}>
                                Open Participant Scoring
                            </AdminSecondaryButton>
                        ) : null}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard label="Equipment Assigned" value={resources.equipment_assigned ?? 0} />
                        <StatCard label="Equipment Used" value={resources.equipment_used ?? 0} />
                        <StatCard label="Equipment Returned" value={resources.equipment_returned ?? 0} />
                        <StatCard label="Equipment Damaged" value={resources.equipment_damaged ?? 0} />
                    </div>

                    {!isCompleted ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                            {isIndividualEvaluation
                                ? 'Post-simulation notes become available after the event is marked as completed. You can still score participants from Execution while the drill is ongoing.'
                                : 'Team / overall post-simulation evaluation becomes available after the event is marked as completed.'}
                        </div>
                    ) : (
                        <form onSubmit={handleSaveEvaluation} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                            <h3 className="text-sm font-semibold text-slate-900">
                                {isIndividualEvaluation ? 'After-Action Notes' : 'Team / Overall Post Evaluation'}
                            </h3>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Overall Remarks</label>
                                <textarea
                                    rows={3}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={evaluationForm.overall_remarks}
                                    onChange={(e) => setEvaluationForm((prev) => ({ ...prev, overall_remarks: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Success Level</label>
                                <select
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={evaluationForm.success_level}
                                    onChange={(e) => setEvaluationForm((prev) => ({ ...prev, success_level: e.target.value }))}
                                >
                                    <option value="">Select level</option>
                                    <option value="Excellent">Excellent</option>
                                    <option value="Good">Good</option>
                                    <option value="Fair">Fair</option>
                                    <option value="Poor">Poor</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Problems Encountered</label>
                                <textarea
                                    rows={3}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={evaluationForm.problems_encountered}
                                    onChange={(e) => setEvaluationForm((prev) => ({ ...prev, problems_encountered: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Recommendations</label>
                                <textarea
                                    rows={3}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={evaluationForm.recommendations}
                                    onChange={(e) => setEvaluationForm((prev) => ({ ...prev, recommendations: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Lessons Learned</label>
                                <textarea
                                    rows={3}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={evaluationForm.lessons_learned}
                                    onChange={(e) => setEvaluationForm((prev) => ({ ...prev, lessons_learned: e.target.value }))}
                                />
                            </div>

                            <AdminPrimaryButton type="submit" disabled={isSaving}>
                                Save Evaluation
                            </AdminPrimaryButton>
                        </form>
                    )}
                </div>
            )}
        </AdminPageShell>
    );
}