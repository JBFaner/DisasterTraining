import React from 'react';
import {
    Users,
    RefreshCw,
    Eye,
    CalendarPlus,
    BarChart3,
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminPrimaryButton,
    AdminSecondaryButton,
} from './admin/AdminLayout';
import { AdminStatusBadge } from './admin/AdminDataTable';

function formatDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
}

function formatDateTime(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function statusBadgeClass(label) {
    const map = {
        'Not Started': 'bg-slate-100 text-slate-700 border-slate-200',
        'In Progress': 'bg-sky-50 text-sky-700 border-sky-200',
        Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'No Records': 'bg-slate-100 text-slate-600 border-slate-200',
        Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        Partial: 'bg-amber-50 text-amber-800 border-amber-200',
        Absent: 'bg-rose-50 text-rose-700 border-rose-200',
        'Not Evaluated': 'bg-slate-100 text-slate-600 border-slate-200',
        None: 'bg-slate-100 text-slate-600 border-slate-200',
        Issued: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
    return map[label] || 'bg-slate-100 text-slate-700 border-slate-200';
}

function RegistryStatusBadge({ label }) {
    if (!label) return '—';
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(label)}`}>
            {label}
        </span>
    );
}

function SourceBadge({ source }) {
    const normalized = (source || '').toString().toLowerCase();
    const synced = normalized === 'synced';

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${synced ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
            {synced ? 'SYNCED' : 'LOCAL'}
        </span>
    );
}

function getInitialTab() {
    if (typeof window === 'undefined') return 'personal';
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    return ['personal', 'training', 'registrations', 'attendance', 'certificates'].includes(tab) ? tab : 'personal';
}

function DetailItem({ label, value }) {
    return (
        <div>
            <dt className="text-xs font-semibold text-slate-500 uppercase">{label}</dt>
            <dd className="mt-1 text-slate-900">{value}</dd>
        </div>
    );
}

export function ParticipantRegistryProfile({ participant }) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const [record, setRecord] = React.useState(participant);
    const [activeTab, setActiveTab] = React.useState(getInitialTab);
    const [isSyncing, setIsSyncing] = React.useState(false);

    const profile = record.registry_profile || {};
    const statuses = profile.statuses || {};

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        const url = new URL(window.location.href);
        if (tabId === 'personal') {
            url.searchParams.delete('tab');
        } else {
            url.searchParams.set('tab', tabId);
        }
        window.history.replaceState({}, '', url);
    };

    const refreshRecord = async () => {
        const res = await fetch(`/admin/participants/${record.id}`, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin',
        });
        if (!res.ok) throw new Error('Failed to refresh participant');
        const data = await res.json();
        if (data.participant) setRecord(data.participant);
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch('/admin/participants/sync', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
            });
            const data = await res.json();
            if (data.success) {
                await refreshRecord();
                Swal.fire('Registry synced', data.message, 'success');
            } else {
                Swal.fire(
                    'Sync unavailable',
                    data.message || 'The Community Registration & Campaign Management System API is not yet configured.',
                    'info',
                );
            }
        } catch {
            Swal.fire('Error', 'Failed to sync participant registry.', 'error');
        } finally {
            setIsSyncing(false);
        }
    };

    const lessonCompletions = profile.lesson_completions || record.lesson_completions || [];
    const aiAttempts = profile.ai_scenario_attempts || record.ai_scenario_attempts || [];
    const evaluationResults = profile.evaluation_results || record.evaluation_results || [];
    const certificates = profile.certificates || record.certificates || [];
    const attendanceSummary = profile.attendance_summary || {};

    return (
        <AdminPageShell>
            <div className="mb-4">
                <a href="/admin/participants" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-800">
                    ← Back to Participant Registry
                </a>
            </div>

            <AdminPageHeader
                icon={Users}
                title={record.name}
                description={record.participant_id ? `Participant ID: ${record.participant_id}` : 'Synchronized participant record'}
                actions={
                    <div className="flex flex-wrap gap-2">
                        <AdminSecondaryButton href={`/admin/participants?tab=registrations`}>
                            <CalendarPlus className="w-4 h-4" />
                            Register to Simulation Event
                        </AdminSecondaryButton>
                        <AdminSecondaryButton href={`/admin/participants/${record.id}?tab=training`}>
                            <BarChart3 className="w-4 h-4" />
                            View Progress
                        </AdminSecondaryButton>
                        <AdminPrimaryButton onClick={handleSync} disabled={isSyncing}>
                            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            Sync Participants
                        </AdminPrimaryButton>
                    </div>
                }
            />

            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 mb-4">
                This participant profile is part of the unified registry and supports both locally registered and synchronized records from the Community Registration & Campaign Management System.
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <SummaryChip label="Training" value={record.training_status || statuses.training_status} />
                <SummaryChip label="Attendance" value={record.attendance_status || statuses.attendance_status} />
                <SummaryChip label="Evaluation" value={record.evaluation_status || statuses.evaluation_status} />
                <SummaryChip label="Certificate" value={record.certificate_status || statuses.certificate_status} />
                <SummaryChip label="Last Synced" value={formatDate(record.last_synced_at)} plain />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2.5 w-full overflow-x-auto mb-4">
                <div className="flex gap-1 flex-wrap min-w-max">
                    {[
                        { id: 'personal', label: 'Personal Information' },
                        { id: 'training', label: 'Training Information' },
                        { id: 'registrations', label: 'Event Registrations' },
                        { id: 'attendance', label: 'Attendance History' },
                        { id: 'certificates', label: 'Certificates' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => handleTabChange(tab.id)}
                            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'personal' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-slate-900 mb-4">Personal Information</h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <DetailItem label="Full Name" value={record.name} />
                        <DetailItem label="Email" value={record.email || '—'} />
                        <DetailItem label="Contact Number" value={record.phone || '—'} />
                        <DetailItem label="Participant ID" value={record.participant_id || '—'} />
                        <DetailItem label="Barangay" value={record.barangay || '—'} />
                        <DetailItem label="Municipality / City" value={record.city || '—'} />
                        <DetailItem label="Province" value={record.province || '—'} />
                        <DetailItem label="Registry Status" value={<AdminStatusBadge status={record.status} />} />
                        <DetailItem label="Source" value={<SourceBadge source={record.participant_source} />} />
                        <DetailItem label="External ID" value={record.group6_external_id || '—'} />
                        <DetailItem label="Last Synced" value={formatDateTime(record.last_synced_at)} />
                    </dl>
                </div>
            )}

            {activeTab === 'training' && (
                <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="text-sm font-semibold text-slate-900 mb-4">Training Progress</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <DetailItem label="Training Status" value={<RegistryStatusBadge label={record.training_status || statuses.training_status} />} />
                            <DetailItem label="Lessons Completed" value={lessonCompletions.length} />
                            <DetailItem label="AI Scenario Attempts" value={aiAttempts.length} />
                        </div>

                        <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">Lesson Progress</h4>
                        {lessonCompletions.length > 0 ? (
                            <ul className="space-y-2 mb-6">
                                {lessonCompletions.map((item) => (
                                    <li key={item.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                                        <span className="font-medium text-slate-900">{item.module?.title || 'Training Module'}</span>
                                        <span className="text-slate-500"> — {item.lesson?.title || 'Lesson'}</span>
                                        <span className="block text-xs text-slate-400 mt-0.5">{formatDateTime(item.completed_at)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-500 mb-6">No lesson completions recorded.</p>
                        )}

                        <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">AI Scenario Attempts</h4>
                        {aiAttempts.length > 0 ? (
                            <ul className="space-y-2 mb-6">
                                {aiAttempts.map((attempt) => (
                                    <li key={attempt.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm flex justify-between gap-3">
                                        <div>
                                            <span className="font-medium text-slate-900">{attempt.scenario_title || attempt.training_module?.title || 'AI Scenario'}</span>
                                            <span className="block text-xs text-slate-500 mt-0.5">{formatDateTime(attempt.completed_at || attempt.updated_at)}</span>
                                        </div>
                                        <RegistryStatusBadge label={attempt.status === 'completed' ? 'Completed' : 'In Progress'} />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-500 mb-6">No AI scenario attempts recorded.</p>
                        )}

                        <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">Evaluation Results</h4>
                        {evaluationResults.length > 0 ? (
                            <ul className="space-y-2">
                                {evaluationResults.map((result) => (
                                    <li key={result.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm flex justify-between gap-3">
                                        <div>
                                            <span className="font-medium text-slate-900">{result.scenario_title || result.training_module?.title || 'Evaluation'}</span>
                                            <span className="block text-xs text-slate-500 mt-0.5">Score: {result.percentage ?? result.score ?? '—'}%</span>
                                        </div>
                                        <RegistryStatusBadge label={result.status === 'passed' ? 'Passed' : 'Needs Improvement'} />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-500">No evaluation results recorded.</p>
                        )}
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="text-sm font-semibold text-slate-900 mb-4">Attendance & Certificate Summary</h3>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <DetailItem label="Attendance Summary" value={`${attendanceSummary.present ?? 0} present / ${attendanceSummary.total ?? 0} records`} />
                            <DetailItem label="Attendance Status" value={<RegistryStatusBadge label={record.attendance_status || statuses.attendance_status} />} />
                            <DetailItem label="Certificate Status" value={<RegistryStatusBadge label={record.certificate_status || statuses.certificate_status} />} />
                            <DetailItem label="Certificates Issued" value={certificates.length} />
                        </dl>
                    </div>
                </div>
            )}

            {activeTab === 'registrations' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <h3 className="text-sm font-semibold text-slate-900">Event Registrations</h3>
                        <AdminSecondaryButton href="/admin/participants?tab=registrations">
                            <CalendarPlus className="w-4 h-4" />
                            Open Event Registrations
                        </AdminSecondaryButton>
                    </div>
                    {record.event_registrations?.length > 0 ? (
                        <ul className="space-y-2">
                            {record.event_registrations.map((reg) => (
                                <li key={reg.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                                    <span className="font-medium text-slate-900">{reg.simulation_event?.title || 'Simulation Event'}</span>
                                    <span className="block text-xs text-slate-500 mt-0.5">{reg.status} • {formatDateTime(reg.registered_at)}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-slate-500">No simulation event registrations yet.</p>
                    )}
                </div>
            )}

            {activeTab === 'attendance' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-slate-900 mb-4">Attendance History</h3>
                    {record.attendances?.length > 0 ? (
                        <ul className="space-y-2">
                            {record.attendances.map((attendance) => (
                                <li key={attendance.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm flex justify-between gap-3">
                                    <div>
                                        <span className="font-medium text-slate-900">{attendance.simulation_event?.title || 'Simulation Event'}</span>
                                        <span className="block text-xs text-slate-500 mt-0.5">{formatDateTime(attendance.checked_in_at)}</span>
                                    </div>
                                    <RegistryStatusBadge label={attendance.status ? attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1) : '—'} />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-slate-500">No attendance records yet.</p>
                    )}
                </div>
            )}

            {activeTab === 'certificates' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-slate-900 mb-4">Certificate Status</h3>
                    {certificates.length > 0 ? (
                        <ul className="space-y-2">
                            {certificates.map((cert) => (
                                <li key={cert.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                                    <span className="font-medium text-slate-900">{cert.simulation_event?.title || cert.training_module?.title || 'Certificate'}</span>
                                    <span className="block text-xs text-slate-500 mt-0.5">
                                        {cert.certificate_number || '—'} • Issued {formatDate(cert.issued_at)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-slate-500">No certificates issued yet.</p>
                    )}
                </div>
            )}
        </AdminPageShell>
    );
}

function SummaryChip({ label, value, plain = false }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <div className="mt-1 text-sm font-semibold text-slate-900">
                {plain ? value : <RegistryStatusBadge label={value} />}
            </div>
        </div>
    );
}
