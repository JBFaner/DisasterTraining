import React from 'react';
import { BookOpen, CalendarDays, MapPin } from 'lucide-react';
import { ParticipantEmptyState, PARTICIPANT_EMPTY_STATES } from './ParticipantEmptyState';

function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusBadgeClass(status) {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'completed') return 'bg-emerald-100 text-emerald-800';
    if (normalized === 'in progress') return 'bg-amber-100 text-amber-800';
    return 'bg-slate-100 text-slate-700';
}

export function MyTrainings({ trainings = [] }) {
    const empty = PARTICIPANT_EMPTY_STATES.myTrainings;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">My Trainings</h1>
                <p className="mt-1 text-sm text-slate-600">
                    All campaigns you have joined using your participant account.
                </p>
            </div>

            {trainings.length === 0 ? (
                <ParticipantEmptyState
                    icon={BookOpen}
                    title={empty.title}
                    description={empty.description}
                    steps={empty.steps}
                    primaryAction={empty.primaryAction}
                    secondaryActions={empty.secondaryActions}
                />
            ) : (
                <div className="grid gap-4">
                    {trainings.map((training) => (
                        <div key={training.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">{training.title}</h2>
                                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600">
                                        <span className="inline-flex items-center gap-1">
                                            <CalendarDays className="h-4 w-4 text-emerald-600" />
                                            Registered {formatDate(training.registered_at)}
                                        </span>
                                        {training.scheduled_date && (
                                            <span className="inline-flex items-center gap-1">
                                                <CalendarDays className="h-4 w-4 text-slate-400" />
                                                Schedule {formatDate(training.scheduled_date)}
                                            </span>
                                        )}
                                        {training.venue && (
                                            <span className="inline-flex items-center gap-1">
                                                <MapPin className="h-4 w-4 text-slate-400" />
                                                {training.venue}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span className={`inline-flex self-start rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(training.training_status)}`}>
                                    {training.training_status}
                                </span>
                            </div>
                            <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                                <div>Attendance: <span className="font-medium text-slate-800">{training.attendance_status}</span></div>
                                <div>Evaluation: <span className="font-medium text-slate-800">{training.evaluation_status}</span></div>
                                <div>Certificate: <span className="font-medium text-slate-800">{training.certificate_status}</span></div>
                            </div>
                            {training.training_module_id && (
                                <div className="mt-4">
                                    <a
                                        href={`/participant/training-modules/${training.training_module_id}`}
                                        className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                                    >
                                        Open Training Module
                                    </a>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
