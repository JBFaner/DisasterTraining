import React from 'react';
import Swal from 'sweetalert2';
import { ArrowLeft, Bot, ChevronDown, ChevronUp, ClipboardList, FileText, Plus, Rocket, Save, ShieldAlert, Target, Trash2, Waves } from 'lucide-react';
import { AdminPageShell, AdminPageHeader, AdminContentCard, AdminPrimaryButton, AdminSecondaryButton } from '../components/admin/AdminLayout';
import { formatDate, formatDateTime } from '../components/campaign/CampaignRequestUi';
import { getCsrfHeaders } from '../utils/csrf';

const TYPE_BADGES = {
    Drill: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    'Functional Exercise': 'border-amber-200 bg-amber-50 text-amber-700',
    'Full-Scale Exercise': 'border-rose-200 bg-rose-50 text-rose-700',
};

const EMPTY_PLAN = {
    simulation_title: '',
    exercise_type: '',
    simulation_scenario: '',
    simulation_objectives: '',
    lead_coordinator: '',
    event_date: '',
    start_time: '',
    end_time: '',
    venue: '',
    required_equipment: '',
};

function resolveDisasterTypeFromSchedule(schedule, scenarioTemplates = {}, scenarioLibrary = []) {
    const raw = String(schedule?.disaster_type || '').trim();
    if (!raw || raw === '—') return { value: '', mode: 'library' };

    const firstType = raw.split(',')[0].trim();
    const templateKeys = Object.keys(scenarioTemplates);
    const templateMatch = templateKeys.find((key) => key.toLowerCase() === firstType.toLowerCase());
    if (templateMatch) return { value: templateMatch, mode: 'library' };

    const libraryMatch = scenarioLibrary.find((name) => name.toLowerCase() === firstType.toLowerCase());
    if (libraryMatch) return { value: libraryMatch, mode: 'library' };

    return { value: firstType, mode: 'custom' };
}

function fieldInputClass(hasError, extra = '') {
    return [
        'w-full rounded-xl border px-3 py-2 text-sm transition-colors',
        hasError ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-200' : 'border-slate-300',
        extra,
    ].join(' ');
}

function StatCard({ label, value }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        </div>
    );
}

function InfoField({ label, value }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-sm text-slate-800">{value || '—'}</p>
        </div>
    );
}

export function SimulationEventPlanningDetail({ planning: initialPlanning }) {
    const [planning, setPlanning] = React.useState(initialPlanning);
    const scheduleDisasterType = resolveDisasterTypeFromSchedule(
        initialPlanning?.schedule,
        initialPlanning?.scenario_templates,
        initialPlanning?.scenario_library,
    );
    const [form, setForm] = React.useState(() => ({
        ...EMPTY_PLAN,
        ...(initialPlanning?.simulation_plan || {}),
        simulation_scenario: initialPlanning?.simulation_plan?.simulation_scenario || scheduleDisasterType.value,
        team_assignments: Array.isArray(initialPlanning?.simulation_plan?.team_assignments)
            ? initialPlanning.simulation_plan.team_assignments.join('\n')
            : (initialPlanning?.simulation_plan?.team_assignments || ''),
    }));
    const [isSaving, setIsSaving] = React.useState(false);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [isAiGenerating, setIsAiGenerating] = React.useState(false);
    const [isTitleManual, setIsTitleManual] = React.useState(() => Boolean(initialPlanning?.simulation_plan?.simulation_title));
    const [scenarioMode, setScenarioMode] = React.useState(() => {
        const savedScenario = initialPlanning?.simulation_plan?.simulation_scenario;
        if (savedScenario) {
            return Object.prototype.hasOwnProperty.call(initialPlanning?.scenario_templates || {}, savedScenario)
                ? 'library'
                : 'custom';
        }
        return scheduleDisasterType.mode;
    });
    const [showValidation, setShowValidation] = React.useState(false);
    const [objectiveItems, setObjectiveItems] = React.useState(() => {
        const raw = String(initialPlanning?.simulation_plan?.simulation_objectives || '').trim();
        if (!raw) return [''];
        const parsed = raw
            .split('\n')
            .map((line) => line.replace(/^[+•\-\d\.\)\s]+/, '').trim())
            .filter(Boolean);
        return parsed.length > 0 ? parsed : [''];
    });
    React.useEffect(() => {
        setForm((current) => ({
            ...current,
            simulation_objectives: objectiveItems
                .map((item) => item.trim())
                .filter(Boolean)
                .map((item) => `++ ${item}`)
                .join('\n'),
        }));
    }, [objectiveItems]);

    const schedule = planning?.schedule;
    const summary = planning?.training_summary;
    const readiness = planning?.readiness;
    const exerciseTypeOptions = planning?.exercise_type_options || [];
    const exerciseTypeMetadata = planning?.exercise_type_metadata || {};
    const scenarioTemplates = planning?.scenario_templates || {};
    const scenarioLibrary = planning?.scenario_library || [];

    React.useEffect(() => {
        const requestId = schedule?.campaign_request_id || schedule?.campaign_id || schedule?.id;
        if (!requestId) return undefined;

        const refreshTrainingSummary = async () => {
            try {
                const response = await fetch(`/admin/simulation-planning/${requestId}/training-summary`, {
                    credentials: 'same-origin',
                    headers: { Accept: 'application/json' },
                });
                if (!response.ok) return;
                const data = await response.json();
                if (data?.planning) {
                    setPlanning(data.planning);
                }
            } catch {
                // Ignore background refresh errors.
            }
        };

        const intervalId = window.setInterval(refreshTrainingSummary, 30000);
        return () => window.clearInterval(intervalId);
    }, [schedule?.campaign_request_id, schedule?.campaign_id, schedule?.id]);

    React.useEffect(() => {
        if (!schedule || String(form.simulation_scenario || '').trim()) return;
        const resolved = resolveDisasterTypeFromSchedule(schedule, scenarioTemplates, scenarioLibrary);
        if (!resolved.value) return;
        setForm((current) => ({ ...current, simulation_scenario: resolved.value }));
        if (resolved.mode === 'custom') {
            setScenarioMode('custom');
        }
    }, [schedule, scenarioTemplates, scenarioLibrary, form.simulation_scenario]);

    if (!schedule) {
        return (
            <AdminPageShell>
                <p className="text-slate-600">Approved campaign schedule not found.</p>
            </AdminPageShell>
        );
    }

    const campaignRequestId = schedule.campaign_request_id || schedule.campaign_id || schedule.id;
    const isReady = Boolean(readiness?.is_ready);
    const canGenerate = Boolean(readiness?.can_generate) && isReady;
    const hasGeneratedEvent = Boolean(schedule.simulation_event_id);
    const backHref = '/admin/simulation-events';
    const selectedExerciseType = form.exercise_type || readiness?.exercise_type || '';
    const minimumQualified = Number(schedule.minimum_qualified_participants ?? 0);
    const qualifiedCount = Number(summary?.qualified_for_simulation ?? 0);
    const registrationDeadlinePassed = Boolean(readiness?.registration_deadline_passed);
    const validationMessages = readiness?.validation_messages || [];
    const hasObjectives = objectiveItems.some((item) => item.trim());
    const fieldErrors = showValidation ? {
        ...(!String(form.exercise_type || '').trim() ? { exercise_type: true } : {}),
        ...(!String(form.simulation_scenario || '').trim() ? { simulation_scenario: true } : {}),
        ...(!hasObjectives ? { simulation_objectives: true } : {}),
        ...(minimumQualified > 0 && qualifiedCount < minimumQualified ? { minimum_qualified: true } : {}),
    } : {};
    const selectedExerciseMeta = selectedExerciseType ? exerciseTypeMetadata[selectedExerciseType] : null;
    const selectedScenarioDescription = scenarioMode === 'custom'
        ? ''
        : (form.simulation_scenario ? scenarioTemplates[form.simulation_scenario] : '');
    const generatedTitle = [form.exercise_type, form.simulation_scenario].filter(Boolean).join(' - ');

    const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
    const addObjective = () => setObjectiveItems((current) => [...current, '']);
    const updateObjective = (index, value) => setObjectiveItems((current) => current.map((item, idx) => (idx === index ? value : item)));
    const removeObjective = (index) => setObjectiveItems((current) => {
        const next = current.filter((_, idx) => idx !== index);
        return next.length > 0 ? next : [''];
    });
    const moveObjective = (index, direction) => setObjectiveItems((current) => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= current.length) return current;
        const next = [...current];
        [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
        return next;
    });

    React.useEffect(() => {
        if (isTitleManual) return;
        updateField('simulation_title', generatedTitle);
    }, [generatedTitle, isTitleManual]);

    const handleGenerateAiDraft = async () => {
        if (!String(form.exercise_type || '').trim() || !String(form.simulation_scenario || '').trim()) {
            await Swal.fire({
                icon: 'warning',
                title: 'Missing details',
                text: 'Select Simulation Type and Disaster Type first before using AI Generate.',
            });
            return;
        }

        setIsAiGenerating(true);
        try {
            const response = await fetch(`/admin/simulation-planning/${campaignRequestId}/ai-draft`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    ...getCsrfHeaders(),
                },
                body: JSON.stringify({
                    exercise_type: form.exercise_type,
                    simulation_scenario: form.simulation_scenario,
                    objective_count: Math.max(3, objectiveItems.length),
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Could not generate AI draft.');
            }

            const aiTitle = String(data?.draft?.simulation_title || '').trim();
            const aiObjectives = Array.isArray(data?.draft?.objectives)
                ? data.draft.objectives.map((item) => String(item || '').trim()).filter(Boolean)
                : [];

            if (aiTitle) {
                setIsTitleManual(true);
                updateField('simulation_title', aiTitle);
            }
            if (aiObjectives.length > 0) {
                setObjectiveItems(aiObjectives);
            }

            await Swal.fire({
                icon: 'success',
                title: 'AI draft ready',
                text: data.message || 'Title and objectives generated.',
                timer: 1800,
                showConfirmButton: false,
            });
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: 'AI generation failed',
                text: error?.message || 'Could not generate AI draft.',
            });
        } finally {
            setIsAiGenerating(false);
        }
    };

    const handleSavePlan = async () => {
        setIsSaving(true);
        try {
            const cleanedObjectives = objectiveItems.map((item) => item.trim()).filter(Boolean);
            const response = await fetch(`/admin/simulation-planning/${campaignRequestId}/plan`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    ...getCsrfHeaders(),
                },
                body: JSON.stringify({
                    ...form,
                    simulation_objectives: cleanedObjectives.map((item) => `++ ${item}`).join('\n'),
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Could not save simulation plan.');
            }
            setPlanning(data.planning);
            await Swal.fire({ icon: 'success', title: 'Saved', text: data.message, timer: 1800, showConfirmButton: false });
        } catch (error) {
            await Swal.fire({ icon: 'error', title: 'Save failed', text: error?.message || 'Could not save simulation plan.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateEvent = async () => {
        const missingExerciseType = !String(form.exercise_type || '').trim();
        const missingDisasterType = !String(form.simulation_scenario || '').trim();
        const missingObjectives = !hasObjectives;
        const insufficientQualified = minimumQualified > 0 && qualifiedCount < minimumQualified;

        if (!registrationDeadlinePassed || missingExerciseType || missingDisasterType || missingObjectives || insufficientQualified) {
            setShowValidation(true);
            return;
        }

        if (!canGenerate) {
            setShowValidation(true);
            return;
        }

        const confirm = await Swal.fire({
            icon: 'question',
            title: 'Generate Simulation Event?',
            text: 'This will create a draft simulation event from the approved schedule and saved plan.',
            showCancelButton: true,
            confirmButtonText: 'Generate Event',
            confirmButtonColor: '#059669',
        });
        if (!confirm.isConfirmed) return;

        setIsGenerating(true);
        try {
            const response = await fetch(`/admin/simulation-planning/${campaignRequestId}/generate`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    ...getCsrfHeaders(),
                },
                body: JSON.stringify({}),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Could not generate simulation event.');
            }
            setPlanning(data.planning);
            await Swal.fire({ icon: 'success', title: 'Generated', text: data.message });
            if (data.redirect) {
                window.location.href = data.redirect;
            }
        } catch (error) {
            await Swal.fire({ icon: 'error', title: 'Generation failed', text: error?.message || 'Could not generate simulation event.' });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <AdminPageShell>
            <div className="mb-1">
                <a href={backHref} className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Simulation Event Planning
                </a>
            </div>

            <AdminPageHeader
                icon={ClipboardList}
                title="Simulation Event Planning"
                description={[schedule.campaign_title, schedule.training_title, schedule.recommended_community || schedule.community].filter(Boolean).join(' · ')}
            />

            {selectedExerciseType ? (
                <div className="mb-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${TYPE_BADGES[selectedExerciseType] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                        {selectedExerciseType}
                    </span>
                </div>
            ) : null}

            <AdminContentCard className="p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <FileText className="h-4 w-4" />
                    Approved Campaign Information
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <InfoField label="Campaign ID" value={`#${schedule.campaign_id || schedule.campaign_request_id || schedule.id}`} />
                    <InfoField label="Campaign Title" value={schedule.campaign_title} />
                    <InfoField label="Training Module ID" value={String(schedule.training_module_id ?? '—')} />
                    <InfoField label="Training Title" value={schedule.training_title || schedule.campaign_title} />
                    <InfoField label="Recommended Community" value={schedule.recommended_community || schedule.community} />
                    <InfoField label="Target Audience" value={schedule.target_audience_label || '—'} />
                    <InfoField label="Expected Participants" value={String(schedule.expected_participants ?? '—')} />
                    <InfoField label="Registration Deadline" value={formatDateTime(schedule.registration_deadline)} />
                    <InfoField label="Campaign Status" value={schedule.campaign_status || schedule.approval_status || 'Approved'} />
                    <InfoField label="Minimum Qualified Participants" value={String(schedule.minimum_qualified_participants ?? 0)} />
                </div>
            </AdminContentCard>

            <AdminContentCard className="p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <ShieldAlert className="h-4 w-4" />
                    Training Summary
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                    <StatCard label="Total Registered" value={summary?.total_registered ?? 0} />
                    <StatCard label="Completed" value={summary?.completed ?? 0} />
                    <StatCard label="In Progress" value={summary?.in_progress ?? 0} />
                    <StatCard label="Not Started" value={summary?.not_started ?? 0} />
                    <div className={fieldErrors.minimum_qualified ? 'rounded-xl ring-2 ring-rose-300' : ''}>
                        <StatCard label="Qualified" value={summary?.qualified_for_simulation ?? 0} />
                    </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">Training summary refreshes automatically every 30 seconds.</p>
            </AdminContentCard>

            {(validationMessages.length > 0 || !registrationDeadlinePassed || (minimumQualified > 0 && qualifiedCount < minimumQualified)) ? (
                <AdminContentCard className="p-5">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
                        <ShieldAlert className="h-4 w-4" />
                        Validation Messages
                    </div>
                    <div className="mt-4 space-y-2">
                        {(validationMessages.length > 0 ? validationMessages : [
                            readiness?.registration_validation_message,
                            readiness?.qualified_validation_message,
                        ].filter(Boolean)).map((message) => (
                            <p key={message} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                {message}
                            </p>
                        ))}
                    </div>
                </AdminContentCard>
            ) : null}

            <AdminContentCard className="p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Target className="h-4 w-4" />
                    Simulation Details
                </div>
                <div className="mt-4 space-y-4">
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Simulation Title</label>
                        <input
                            type="text"
                            value={form.simulation_title}
                            onChange={(e) => {
                                setIsTitleManual(true);
                                updateField('simulation_title', e.target.value);
                            }}
                            disabled={hasGeneratedEvent}
                            className={fieldInputClass(false)}
                        />
                        {!isTitleManual ? (
                            <p className="mt-1 text-xs text-slate-500">Auto-generated from Simulation Type and Scenario.</p>
                        ) : null}
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Lead Coordinator</label>
                        <input
                            type="text"
                            value={form.lead_coordinator || ''}
                            onChange={(e) => updateField('lead_coordinator', e.target.value)}
                            disabled={hasGeneratedEvent}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Event Date</label>
                            <input
                                type="date"
                                value={form.event_date || ''}
                                onChange={(e) => updateField('event_date', e.target.value)}
                                disabled={hasGeneratedEvent}
                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Start Time</label>
                            <input
                                type="time"
                                value={form.start_time || ''}
                                onChange={(e) => updateField('start_time', e.target.value)}
                                disabled={hasGeneratedEvent}
                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">End Time</label>
                            <input
                                type="time"
                                value={form.end_time || ''}
                                onChange={(e) => updateField('end_time', e.target.value)}
                                disabled={hasGeneratedEvent}
                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Venue</label>
                        <input
                            type="text"
                            value={form.venue || ''}
                            onChange={(e) => updateField('venue', e.target.value)}
                            disabled={hasGeneratedEvent}
                            placeholder="Simulation venue or assembly area"
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Equipment Recommendations</label>
                        <textarea
                            value={form.required_equipment || ''}
                            onChange={(e) => updateField('required_equipment', e.target.value)}
                            disabled={hasGeneratedEvent}
                            rows={3}
                            placeholder="List recommended equipment for this simulation"
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Simulation Type (Required)</label>
                        <select
                            value={form.exercise_type}
                            onChange={(e) => updateField('exercise_type', e.target.value)}
                            disabled={hasGeneratedEvent}
                            className={fieldInputClass(fieldErrors.exercise_type, 'bg-white')}
                        >
                            <option value="">Select Simulation Type</option>
                            {exerciseTypeOptions.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Disaster Type</label>
                        {scenarioMode === 'library' ? (
                            <select
                                value={form.simulation_scenario}
                                onChange={(e) => {
                                    if (e.target.value === '__custom__') {
                                        setScenarioMode('custom');
                                        updateField('simulation_scenario', '');
                                        return;
                                    }
                                    updateField('simulation_scenario', e.target.value);
                                }}
                                disabled={hasGeneratedEvent}
                                className={fieldInputClass(fieldErrors.simulation_scenario, 'bg-white')}
                            >
                                <option value="">Select Disaster Type</option>
                                {Object.keys(scenarioTemplates).map((name) => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                                {scenarioLibrary
                                    .filter((name) => !Object.prototype.hasOwnProperty.call(scenarioTemplates, name))
                                    .map((name) => (
                                        <option key={name} value={name}>{name} (Library)</option>
                                    ))}
                                <option value="__custom__">Custom Scenario</option>
                            </select>
                        ) : (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={form.simulation_scenario}
                                    onChange={(e) => updateField('simulation_scenario', e.target.value)}
                                    disabled={hasGeneratedEvent}
                                    placeholder="Enter custom disaster type"
                                    className={fieldInputClass(fieldErrors.simulation_scenario)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setScenarioMode('library')}
                                    disabled={hasGeneratedEvent}
                                    className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
                                >
                                    Use Disaster Type Library Instead
                                </button>
                            </div>
                        )}
                    </div>
                    <div className={fieldErrors.simulation_objectives ? 'rounded-xl p-3 ring-2 ring-rose-200 bg-rose-50/20' : ''}>
                        <label className="block text-xs text-slate-500 mb-1">Objectives</label>
                        <div className="space-y-2">
                            {objectiveItems.map((objective, index) => (
                                <div key={`${index}-${objective}`} className="flex items-center gap-2">
                                    <button type="button" onClick={() => moveObjective(index, 'up')} disabled={hasGeneratedEvent} className="rounded-lg border border-slate-300 p-2 disabled:opacity-50"><ChevronUp className="h-3.5 w-3.5" /></button>
                                    <button type="button" onClick={() => moveObjective(index, 'down')} disabled={hasGeneratedEvent} className="rounded-lg border border-slate-300 p-2 disabled:opacity-50"><ChevronDown className="h-3.5 w-3.5" /></button>
                                    <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">++</span>
                                    <input
                                        value={objective}
                                        onChange={(e) => updateObjective(index, e.target.value)}
                                        disabled={hasGeneratedEvent}
                                        placeholder="Enter objective"
                                        className={fieldInputClass(fieldErrors.simulation_objectives)}
                                    />
                                    <button type="button" onClick={() => removeObjective(index)} disabled={hasGeneratedEvent} className="rounded-lg border border-rose-200 p-2 text-rose-700 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /></button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addObjective} disabled={hasGeneratedEvent} className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 disabled:opacity-50">
                            <Plus className="h-3.5 w-3.5" /> Add Objective
                        </button>
                        <button
                            type="button"
                            onClick={handleGenerateAiDraft}
                            disabled={hasGeneratedEvent || isAiGenerating}
                            className="ml-2 mt-2 inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 disabled:opacity-50"
                        >
                            <Bot className="h-3.5 w-3.5" /> {isAiGenerating ? 'Generating…' : 'Generate Objectives with AI'}
                        </button>
                    </div>
                </div>
            </AdminContentCard>

            <AdminContentCard className="p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Waves className="h-4 w-4" />
                    Scenario Preview
                </div>
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    {selectedScenarioDescription
                        ? selectedScenarioDescription
                        : form.simulation_scenario
                            ? 'Custom scenario selected. Save this plan to include it in your reusable scenario library.'
                            : 'Select a scenario to preview its description.'}
                </div>
            </AdminContentCard>

            <AdminContentCard className="p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Rocket className="h-4 w-4" />
                    Generate Simulation Event
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                    <AdminSecondaryButton href={backHref}>Back</AdminSecondaryButton>
                    <AdminSecondaryButton type="button" onClick={handleSavePlan} disabled={hasGeneratedEvent || isSaving}>
                        <Save className="h-4 w-4" />
                        {isSaving ? 'Saving…' : 'Save Details'}
                    </AdminSecondaryButton>
                    <AdminPrimaryButton
                        type="button"
                        onClick={handleGenerateEvent}
                        disabled={hasGeneratedEvent || isGenerating || !canGenerate}
                    >
                        <Rocket className="h-4 w-4" />
                        {isGenerating ? 'Generating…' : 'Generate Simulation Event'}
                    </AdminPrimaryButton>
                </div>
                {!canGenerate && !hasGeneratedEvent ? (
                    <p className="mt-3 text-sm text-amber-700">
                        Generate Simulation Event becomes available after registration closes and minimum qualified participants are met.
                    </p>
                ) : null}
            </AdminContentCard>
        </AdminPageShell>
    );
}
