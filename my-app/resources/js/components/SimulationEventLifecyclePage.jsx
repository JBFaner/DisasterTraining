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
    Loader2,
    RefreshCw,
    Shield,
    ChevronLeft,
    ChevronDown,
} from 'lucide-react';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminPrimaryButton,
    AdminSecondaryButton,
} from './admin/AdminLayout';
import { deriveSimulationEventStatus, getEventDateTime } from '../utils/simulationEventStatus';
import { isExercisePlanEvent } from '../utils/simulationEventNavigation';
import { EventEquipmentRequestPanel } from './EventEquipmentRequestPanel';

const EMPTY_ASSIGNMENT_POOLS = [];

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
        Draft: 'bg-slate-50 text-slate-700 border-slate-200',
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

function memberOptionKey(member) {
    if (!member) return '';
    if (member.source_group === 'group6_trainers' || member.qualified_trainer_id) {
        return `trainer:${member.qualified_trainer_id || member.id}`;
    }
    return `staff:${member.id}`;
}

function assignedOptionKey(row) {
    if (!row) return '';
    if (row.qualified_trainer_id || row.source_group === 'group6_trainers') {
        return `trainer:${row.qualified_trainer_id || row.person_external_id || ''}`;
    }
    if (row.person_external_id) {
        return `staff:${row.person_external_id}`;
    }
    return '';
}

function memberOptionLabel(member) {
    const detail = member.position || member.specialization || '';
    return detail ? `${member.name} — ${detail}` : (member.name || '—');
}

function buildInitialRoleSelections(pools = []) {
    const next = {};
    pools.forEach((pool) => {
        if (!pool?.role || pool.role === 'Marshal') return;
        const count = Math.max(1, Number(pool.recommended_count) || 1);
        const membersByKey = new Map((pool.members || []).map((m) => [memberOptionKey(m), m]));
        const slots = Array.from({ length: count }, () => '');
        (pool.assigned || []).forEach((row, index) => {
            if (index >= count) return;
            const key = assignedOptionKey(row);
            if (key && membersByKey.has(key)) {
                slots[index] = key;
            }
        });
        next[pool.role] = slots;
    });
    return next;
}

function RoleAssignmentPanel({ eventId, pools = [], csrf, onLifecycleUpdate, disabled = false }) {
    const rolePools = React.useMemo(
        () => (pools || []).filter((pool) => pool?.role && pool.role !== 'Marshal'),
        [pools],
    );
    const [busy, setBusy] = React.useState(false);
    const [selections, setSelections] = React.useState(() => buildInitialRoleSelections(rolePools));

    React.useEffect(() => {
        setSelections(buildInitialRoleSelections(rolePools));
    }, [rolePools]);

    const setSlot = (role, slotIndex, value) => {
        setSelections((prev) => {
            const current = [...(prev[role] || [])];
            current[slotIndex] = value;
            return { ...prev, [role]: current };
        });
    };

    const saveAssignments = async () => {
        const assignments = [];
        const replaceRoles = rolePools.map((pool) => pool.role);

        rolePools.forEach((pool) => {
            const membersByKey = new Map((pool.members || []).map((m) => [memberOptionKey(m), m]));
            const slots = selections[pool.role] || [];
            slots.forEach((key) => {
                if (!key) return;
                const member = membersByKey.get(key);
                if (!member) return;

                if (member.source_group === 'group6_trainers' || member.qualified_trainer_id) {
                    assignments.push({
                        role: pool.role,
                        source_group: 'group6_trainers',
                        qualified_trainer_id: Number(member.qualified_trainer_id || member.id),
                        person_name: member.name,
                    });
                } else {
                    assignments.push({
                        role: pool.role,
                        source_group: 'lgu_staff',
                        person_external_id: String(member.id),
                        person_name: member.name,
                    });
                }
            });
        });

        setBusy(true);
        try {
            const response = await fetch(`/admin/simulation-events/${eventId}/personnel-assignments`, {
                method: 'PUT',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
                body: JSON.stringify({ assignments, replace_roles: replaceRoles }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Save failed',
                    text: data.message || 'Unable to save personnel assignments.',
                });
                return;
            }
            if (data.lifecycle) onLifecycleUpdate?.(data.lifecycle);
            await Swal.fire({
                icon: 'success',
                title: 'Personnel saved',
                text: `${assignments.length} assignment(s) saved for this event.`,
            });
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: 'Save failed',
                text: error.message || 'Unable to save personnel assignments.',
            });
        } finally {
            setBusy(false);
        }
    };

    if (!rolePools.length) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-600" />
                    Assign Personnel Roles
                </h4>
                <p className="text-sm text-slate-500 mt-2">
                    No LGU or trainer roles on the linked exercise plan. Marshals are assigned via CPSQC below.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-700" />
                        Assign Personnel Roles
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                        Assign LGU staff and qualified trainers here. Marshals are assigned via the CPSQC panel below.
                    </p>
                </div>
                <AdminPrimaryButton onClick={saveAssignments} disabled={busy || disabled}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                    Save Personnel Assignments
                </AdminPrimaryButton>
            </div>

            <div className="space-y-4">
                {rolePools.map((pool) => {
                    const count = Math.max(1, Number(pool.recommended_count) || 1);
                    const slots = selections[pool.role] || Array.from({ length: count }, () => '');
                    const members = pool.members || [];

                    return (
                        <div key={pool.role} className="rounded-lg border border-white bg-white p-3 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-800">{pool.role}</p>
                                <span className="text-xs font-medium text-slate-500">
                                    Recommended: {count}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                {slots.map((selectedKey, slotIndex) => {
                                    const takenElsewhere = new Set(
                                        slots
                                            .filter((_, i) => i !== slotIndex)
                                            .filter(Boolean),
                                    );
                                    return (
                                        <label key={`${pool.role}-${slotIndex}`} className="text-sm">
                                            <span className="mb-1 block text-xs font-semibold text-slate-600">
                                                Slot {slotIndex + 1}
                                            </span>
                                            <select
                                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                                                value={selectedKey}
                                                disabled={busy || disabled}
                                                onChange={(e) => setSlot(pool.role, slotIndex, e.target.value)}
                                            >
                                                <option value="">Unassigned</option>
                                                {members.map((member) => {
                                                    const key = memberOptionKey(member);
                                                    if (!key) return null;
                                                    const blocked = takenElsewhere.has(key) && key !== selectedKey;
                                                    return (
                                                        <option key={key} value={key} disabled={blocked}>
                                                            {memberOptionLabel(member)}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </label>
                                    );
                                })}
                            </div>
                            {members.length === 0 && (
                                <p className="text-xs text-amber-800">
                                    No available people for this role right now.
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function CpsqcMarshalPanel({ eventId, cpsqc, csrf, onLifecycleUpdate, disabled = false }) {
    const defaults = cpsqc?.request_defaults || {};
    const [busy, setBusy] = React.useState(false);
    const [selectedIds, setSelectedIds] = React.useState(() => new Set(
        (cpsqc?.assigned_marshals || [])
            .map((row) => String(row.person_external_id || ''))
            .filter(Boolean),
    ));
    const [form, setForm] = React.useState(() => ({
        event_name: defaults.event_name || '',
        event_date: defaults.event_date || '',
        event_start_time: defaults.event_start_time || '08:00',
        event_end_time: defaults.event_end_time || '',
        event_location: defaults.event_location || '',
        patrols_needed: '',
        special_instructions: defaults.special_instructions || '',
    }));
    const [patrolsMenuOpen, setPatrolsMenuOpen] = React.useState(false);
    const patrolsFieldRef = React.useRef(null);

    React.useEffect(() => {
        setForm((prev) => ({
            event_name: defaults.event_name || '',
            event_date: defaults.event_date || '',
            event_start_time: defaults.event_start_time || '08:00',
            event_end_time: defaults.event_end_time || '',
            event_location: defaults.event_location || '',
            // Keep user-typed value; never auto-fill from plan recommended count
            patrols_needed: prev.patrols_needed,
            special_instructions: defaults.special_instructions || '',
        }));
        setSelectedIds(new Set(
            (cpsqc?.assigned_marshals || [])
                .map((row) => String(row.person_external_id || ''))
                .filter(Boolean),
        ));
    }, [cpsqc, defaults.event_name, defaults.event_date, defaults.event_location]);

    React.useEffect(() => {
        if (!patrolsMenuOpen) return undefined;
        const onDocClick = (event) => {
            if (patrolsFieldRef.current && !patrolsFieldRef.current.contains(event.target)) {
                setPatrolsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [patrolsMenuOpen]);

    const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
    const available = cpsqc?.available_marshals || [];
    const requests = cpsqc?.requests || [];
    const configured = !!cpsqc?.configured;
    const patrolsSuggestions = React.useMemo(() => {
        const recommended = Number(defaults.patrols_needed) || 0;
        const base = [1, 2, 3, 4, 5, 6, 8, 10];
        if (recommended > 0 && !base.includes(recommended)) {
            return [...base, recommended].sort((a, b) => a - b);
        }
        return base;
    }, [defaults.patrols_needed]);

    const toggleMarshal = (memberId) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            const key = String(memberId);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const requestPatrol = async () => {
        const patrolsNeeded = Number(form.patrols_needed);
        if (!Number.isFinite(patrolsNeeded) || patrolsNeeded < 1) {
            await Swal.fire({
                icon: 'warning',
                title: 'Patrols needed required',
                text: 'Type or select how many patrols you need (at least 1).',
            });
            return;
        }
        if (!form.event_date || !form.event_start_time || !form.event_location.trim()) {
            await Swal.fire({
                icon: 'warning',
                title: 'Missing schedule details',
                text: 'Event date, start time, and location are required to request CPSQC patrols.',
            });
            return;
        }
        setBusy(true);
        try {
            const response = await fetch(`/admin/simulation-events/${eventId}/cpsqc-patrol/request`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
                body: JSON.stringify({
                    ...form,
                    patrols_needed: Math.max(1, Math.min(50, Math.floor(patrolsNeeded))),
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) {
                await Swal.fire({ icon: 'error', title: 'Request failed', text: data.message || 'Unable to request CPSQC patrol.' });
                return;
            }
            if (data.lifecycle) onLifecycleUpdate?.(data.lifecycle);
            await Swal.fire({
                icon: 'success',
                title: 'Patrol requested',
                text: data.request_id
                    ? `Request ${data.request_id} sent. Approve and assign in CPSQC, then refresh marshals.`
                    : 'Request sent. Approve and assign in CPSQC, then refresh marshals.',
            });
        } catch (error) {
            await Swal.fire({ icon: 'error', title: 'Request failed', text: error.message || 'Unable to request CPSQC patrol.' });
        } finally {
            setBusy(false);
        }
    };

    const refreshMarshals = async () => {
        setBusy(true);
        try {
            const response = await fetch(`/admin/simulation-events/${eventId}/cpsqc-patrol/marshals`, {
                headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrf },
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) {
                await Swal.fire({ icon: 'error', title: 'Refresh failed', text: data.message || 'Unable to refresh marshals.' });
                return;
            }
            if (data.lifecycle) onLifecycleUpdate?.(data.lifecycle);
        } catch (error) {
            await Swal.fire({ icon: 'error', title: 'Refresh failed', text: error.message || 'Unable to refresh marshals.' });
        } finally {
            setBusy(false);
        }
    };

    const saveAssignments = async () => {
        const assignments = available
            .filter((member) => selectedIds.has(String(member.id)))
            .map((member) => ({
                role: 'Marshal',
                source_group: 'cpsqc_patrol',
                person_name: member.name,
                person_external_id: String(member.id),
                bpso_personnel_id: member.bpso_personnel_id || member.specialization || null,
                patrol_request_id: member.patrol_request_id || null,
                notes: null,
            }));

        setBusy(true);
        try {
            const response = await fetch(`/admin/simulation-events/${eventId}/personnel-assignments`, {
                method: 'PUT',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
                body: JSON.stringify({ assignments }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) {
                await Swal.fire({ icon: 'error', title: 'Save failed', text: data.message || 'Unable to save marshal assignments.' });
                return;
            }
            if (data.lifecycle) onLifecycleUpdate?.(data.lifecycle);
            await Swal.fire({ icon: 'success', title: 'Marshals saved', text: `${assignments.length} marshal(s) assigned to this event.` });
        } catch (error) {
            await Swal.fire({ icon: 'error', title: 'Save failed', text: error.message || 'Unable to save marshal assignments.' });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-sky-700" />
                        CPSQC Patrol Marshals
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                        Request patrols for this scheduled event. After CPSQC approves and assigns personnel, refresh and select marshals here.
                    </p>
                </div>
                <AdminSecondaryButton onClick={refreshMarshals} disabled={!configured || busy || disabled}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Refresh
                </AdminSecondaryButton>
            </div>

            {!configured && (
                <p className="text-sm text-amber-800">CPSQC integration is not configured. Set CPSQC_INTEGRATION_ENABLED and CPSQC_API_KEY.</p>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="text-sm md:col-span-2">
                    <span className="mb-1 block text-xs font-semibold text-slate-600">Event Name</span>
                    <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.event_name} onChange={(e) => setField('event_name', e.target.value)} disabled={!configured || busy || disabled} />
                </label>
                <label className="text-sm">
                    <span className="mb-1 block text-xs font-semibold text-slate-600">Patrols Needed</span>
                    <div className="relative" ref={patrolsFieldRef}>
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Type or pick…"
                            autoComplete="off"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-9 text-sm placeholder:text-slate-400"
                            value={form.patrols_needed}
                            onChange={(e) => {
                                const raw = e.target.value.replace(/[^\d]/g, '');
                                setField('patrols_needed', raw === '' ? '' : raw);
                            }}
                            onFocus={() => setPatrolsMenuOpen(true)}
                            disabled={!configured || busy || disabled}
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-slate-400 hover:text-slate-600 disabled:opacity-50"
                            onClick={() => setPatrolsMenuOpen((open) => !open)}
                            disabled={!configured || busy || disabled}
                            aria-label="Show patrol count suggestions"
                            tabIndex={-1}
                        >
                            <ChevronDown className={`h-4 w-4 transition-transform ${patrolsMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {patrolsMenuOpen && !disabled && configured ? (
                            <ul className="absolute z-20 mt-1 max-h-40 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                                {patrolsSuggestions.map((n) => (
                                    <li key={n}>
                                        <button
                                            type="button"
                                            className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-sky-50 ${
                                                String(form.patrols_needed) === String(n) ? 'bg-sky-50 font-medium text-sky-800' : 'text-slate-700'
                                            }`}
                                            onClick={() => {
                                                setField('patrols_needed', String(n));
                                                setPatrolsMenuOpen(false);
                                            }}
                                        >
                                            <span>{n}</span>
                                            {Number(defaults.patrols_needed) === n ? (
                                                <span className="text-[10px] uppercase tracking-wide text-slate-400">plan</span>
                                            ) : null}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                    </div>
                </label>
                <label className="text-sm">
                    <span className="mb-1 block text-xs font-semibold text-slate-600">Event Date</span>
                    <input
                        type="date"
                        disabled
                        title="Set in Exercise Plan — not editable here"
                        className="w-full cursor-default rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 disabled:opacity-100"
                        value={form.event_date}
                    />
                </label>
                <label className="text-sm">
                    <span className="mb-1 block text-xs font-semibold text-slate-600">Start Time</span>
                    <input
                        type="time"
                        disabled
                        title="Set in Exercise Plan — not editable here"
                        className="w-full cursor-default rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 disabled:opacity-100"
                        value={form.event_start_time}
                    />
                </label>
                <label className="text-sm">
                    <span className="mb-1 block text-xs font-semibold text-slate-600">End Time</span>
                    <input
                        type="time"
                        disabled
                        title="Set in Exercise Plan — not editable here"
                        className="w-full cursor-default rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 disabled:opacity-100"
                        value={form.event_end_time}
                    />
                </label>
                <label className="text-sm md:col-span-3">
                    <span className="mb-1 block text-xs font-semibold text-slate-600">Location</span>
                    <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.event_location} onChange={(e) => setField('event_location', e.target.value)} disabled={!configured || busy || disabled} />
                </label>
            </div>

            <div className="flex flex-wrap gap-2">
                <AdminPrimaryButton onClick={requestPatrol} disabled={!configured || busy || disabled}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                    Request Patrol from CPSQC
                </AdminPrimaryButton>
            </div>

            {requests.length > 0 && (
                <div className="space-y-2 border-t border-sky-200 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Requests for this event</p>
                    {requests.slice(0, 5).map((req) => (
                        <div key={req.request_id || req.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white bg-white px-3 py-2 text-xs text-slate-700">
                            <span>
                                <span className="font-medium">{req.request_id || '—'}</span>
                                {' · '}
                                {req.status || '—'}
                            </span>
                            <span className="text-slate-500">{(req.assigned_personnel?.length || req.patrols_assigned || 0)} assigned</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="space-y-2 border-t border-sky-200 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    CPSQC marshals ({available.length})
                </p>
                {available.length === 0 ? (
                    <p className="text-sm text-slate-500">No CPSQC personnel assigned to this event yet (Approved / Scheduled).</p>
                ) : (
                    <ul className="space-y-2">
                        {available.map((member) => {
                            const id = String(member.id);
                            const checked = selectedIds.has(id);
                            return (
                                <li key={id}>
                                    <label className="flex items-center gap-3 rounded-lg border border-white bg-white px-3 py-2 text-sm text-slate-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            disabled={busy || disabled}
                                            onChange={() => toggleMarshal(id)}
                                        />
                                        <span>
                                            <span className="font-medium">{member.name}</span>
                                            {member.specialization ? ` — ${member.specialization}` : ''}
                                        </span>
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                )}
                <AdminSecondaryButton onClick={saveAssignments} disabled={!configured || busy || disabled || available.length === 0}>
                    Save Marshal Assignments
                </AdminSecondaryButton>
            </div>
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
    const assignmentPools = lifecycleData?.assignment_pools || EMPTY_ASSIGNMENT_POOLS;
    const cpsqc = lifecycleData?.cpsqc || null;
    const equipmentRequests = lifecycleData?.equipment_requests || [];
    const equipmentRequestInventory = lifecycleData?.equipment_request_inventory || [];
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
    const scoreParticipantsBlockedReason = !isIndividualEvaluation
        ? null
        : isDraft
            ? 'Complete readiness and publish the event first.'
            : !(isOngoing || isCompleted)
                ? 'Start the simulation first, then mark participants Present (or Late) in Attendance.'
                : checkedInCount === 0
                    ? 'Mark at least one participant Present (or Late) in Attendance before scoring.'
                    : null;

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
                        <AdminSecondaryButton href="/admin/simulation-events?tab=events">
                            <ChevronLeft className="w-4 h-4" /> Back
                        </AdminSecondaryButton>
                        {isDraft && !fromExercisePlan && (
                            <AdminSecondaryButton href={`/admin/simulation-events/${event.id}/edit`}>
                                <Pencil className="w-4 h-4" /> Edit Planning
                            </AdminSecondaryButton>
                        )}
                        {isDraft && fromExercisePlan && readiness?.all_complete && (
                            <form
                                method="POST"
                                action={`/admin/simulation-events/${event.id}/publish`}
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const form = e.currentTarget;
                                    const result = await Swal.fire({
                                        title: 'Publish simulation event?',
                                        text: 'Event will move to Simulation Monitoring. Start the simulation when the schedule begins.',
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
                                        const data = await response.json().catch(() => ({}));
                                        if (!response.ok) {
                                            throw new Error(data.message || 'Publish failed');
                                        }
                                        window.location.href = data.redirect
                                            || `/admin/simulation-events/${event.id}?tab=monitoring`;
                                    } catch (err) {
                                        Swal.fire({
                                            icon: 'error',
                                            title: 'Cannot publish',
                                            text: err?.message || 'Failed to publish event.',
                                        });
                                    }
                                }}
                            >
                                <input type="hidden" name="_token" value={csrf} />
                                <AdminPrimaryButton type="submit" disabled={isSaving}>
                                    Publish Event
                                </AdminPrimaryButton>
                            </form>
                        )}
                        {isDraft && fromExercisePlan && !readiness?.all_complete && (
                            <button
                                type="button"
                                disabled
                                title="Complete all readiness checklist items before publishing"
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 bg-slate-100 text-slate-400 rounded-lg font-medium text-sm cursor-not-allowed"
                            >
                                Publish Event
                            </button>
                        )}
                        {canStartEvent && (
                            <form method="POST" action={`/admin/simulation-events/${event.id}/start`} onSubmit={handleStartEvent}>
                                <input type="hidden" name="_token" value={csrf} />
                                <AdminPrimaryButton type="submit" disabled={isSaving}>
                                    <Play className="w-4 h-4" /> Start Simulation
                                </AdminPrimaryButton>
                            </form>
                        )}
                        {!isOngoing && ['LGU_ADMIN', 'LGU_TRAINER'].includes(role) && event.status !== 'archived' && event.status !== 'cancelled' && (
                            <form
                                method="POST"
                                action={`/admin/simulation-events/${event.id}/test-start`}
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const form = e.currentTarget;
                                    const result = await Swal.fire({
                                        title: 'Test Start (Demo)?',
                                        text: 'Forces this event to Ongoing now (ignores schedule time) so you can demo Execution, Attendance, and Scoring. Use Mark Completed when finished.',
                                        icon: 'question',
                                        showCancelButton: true,
                                        confirmButtonText: 'Start for demo',
                                        cancelButtonText: 'Cancel',
                                        confirmButtonColor: '#16a34a',
                                    });
                                    if (!result.isConfirmed) return;
                                    setIsSaving(true);
                                    try {
                                        const response = await fetch(form.action, {
                                            method: 'POST',
                                            body: new FormData(form),
                                            headers: { Accept: 'application/json' },
                                        });
                                        const data = await response.json().catch(() => ({}));
                                        if (!response.ok) {
                                            throw new Error(data.message || 'Test start failed');
                                        }
                                        window.location.href = data.redirect
                                            || `/admin/simulation-events/${event.id}?tab=execution`;
                                    } catch (err) {
                                        Swal.fire({
                                            icon: 'error',
                                            title: 'Test start failed',
                                            text: err?.message || 'Could not force-start the event.',
                                        });
                                    } finally {
                                        setIsSaving(false);
                                    }
                                }}
                            >
                                <input type="hidden" name="_token" value={csrf} />
                                <AdminSecondaryButton type="submit" disabled={isSaving}>
                                    <Play className="w-4 h-4" /> Test Start (Demo)
                                </AdminSecondaryButton>
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
                                Required items must be completed before publish/start. Marshals and other personnel roles are recommended but optional when no assignees are available.
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
                                            {item.required === false && (
                                                <span className="ml-2 text-xs font-normal text-slate-500">(Optional)</span>
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

                    {fromExercisePlan && (
                        <RoleAssignmentPanel
                            eventId={event.id}
                            pools={assignmentPools}
                            csrf={csrf}
                            disabled={isSaving}
                            onLifecycleUpdate={setLifecycle}
                        />
                    )}

                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900">Personnel Roster</h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Read-only summary of assigned roles. Assign LGU/trainer roles above; marshals via CPSQC below.
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

                    {(fromExercisePlan || cpsqc?.needed) && (
                        <CpsqcMarshalPanel
                            eventId={event.id}
                            cpsqc={cpsqc}
                            csrf={csrf}
                            disabled={isSaving}
                            onLifecycleUpdate={setLifecycle}
                        />
                    )}

                    <EventEquipmentRequestPanel
                        eventId={event.id}
                        role={role}
                        csrf={csrf}
                        requests={equipmentRequests}
                        inventory={equipmentRequestInventory}
                        disabled={isSaving || isCompleted}
                        onLifecycleUpdate={setLifecycle}
                    />
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
                            <h3 className="mb-3 text-sm font-semibold text-slate-900">Assigned Participants</h3>
                            {participants.length === 0 ? (
                                <p className="text-sm text-slate-500">No approved participants yet.</p>
                            ) : (
                                <ul className="space-y-2 max-h-48 overflow-y-auto">
                                    {participants.map((p) => (
                                        <li key={p.id}>
                                            <a
                                                href={`/admin/participants/${p.id}?from=simulation-monitoring&event_id=${event?.id || ''}`}
                                                className="block w-full rounded-lg border border-transparent px-2 py-1.5 text-left text-sm text-slate-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50"
                                            >
                                                <span className="font-medium text-emerald-800 underline-offset-2 hover:underline">{p.name || '—'}</span>
                                                <span className="mt-0.5 block text-xs text-slate-400">{p.email}</span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h3 className="mb-3 text-sm font-semibold text-slate-900">Assigned Equipment</h3>
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
                        <h3 className="mb-4 text-sm font-semibold text-slate-900 flex items-center gap-2">
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
                            {scoreParticipantsBlockedReason ? (
                                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                    {scoreParticipantsBlockedReason}
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
                                        title={scoreParticipantsBlockedReason || 'Scoring not available yet'}
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
                    ) : isIndividualEvaluation && !(isOngoing || isCompleted) ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            Attendance is recorded, but scoring unlocks after you <span className="font-semibold">Start Simulation</span>.
                            Individual skill scores (e.g. fire extinguisher use) are entered during or right after the drill.
                        </div>
                    ) : (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                            {attendance.checked_in} participant{Number(attendance.checked_in) === 1 ? '' : 's'} ready for scoring.
                            {isIndividualEvaluation
                                ? ' Score each present participant on hands-on / skill criteria after attendance.'
                                : ' Criteria follow PH drill practice (BFP / NSED-style): alarm response, evacuation discipline, accountability, PPE/safety, instructions, teamwork, and participation.'}
                        </div>
                    )}

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-wrap gap-2">
                        <AdminPrimaryButton href={`/admin/simulation-events/${event.id}/attendance`}>
                            Open Attendance Management
                        </AdminPrimaryButton>
                        {isIndividualEvaluation ? (
                            canScoreParticipants ? (
                                <AdminPrimaryButton href={`/admin/simulation-events/${event.id}/evaluation`}>
                                    <ClipboardCheck className="w-4 h-4" />
                                    Score Participants
                                </AdminPrimaryButton>
                            ) : (
                                <button
                                    type="button"
                                    disabled
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 bg-slate-100 text-slate-400 rounded-lg font-medium text-sm cursor-not-allowed"
                                    title={scoreParticipantsBlockedReason || 'Scoring not available yet'}
                                >
                                    Score Participants
                                </button>
                            )
                        ) : Number(attendance.checked_in ?? 0) > 0 ? (
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
                            canScoreParticipants ? (
                                <AdminPrimaryButton href={`/admin/simulation-events/${event.id}/evaluation`}>
                                    <ClipboardCheck className="w-4 h-4" />
                                    Score Participants
                                </AdminPrimaryButton>
                            ) : (
                                <button
                                    type="button"
                                    disabled
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 bg-slate-100 text-slate-400 rounded-lg font-medium text-sm cursor-not-allowed"
                                    title={scoreParticipantsBlockedReason || 'Scoring not available yet'}
                                >
                                    Score Participants
                                </button>
                            )
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