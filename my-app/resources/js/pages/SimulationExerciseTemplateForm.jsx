import React from 'react';
import {
    ArrowDown,
    ArrowUp,
    BookOpen,
    ChevronDown,
    ChevronUp,
    ClipboardList,
    Clock3,
    Layers,
    Loader2,
    Plus,
    RefreshCw,
    Shield,
    Sparkles,
    Target,
    Trash2,
    Users,
    Wrench,
} from 'lucide-react';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminContentCard,
    AdminPrimaryButton,
    AdminSecondaryButton,
} from '../components/admin/AdminLayout';
import { getCsrfHeaders } from '../utils/csrf';
import { showAppAlert } from '../utils/appAlert';
import { useLessonClosePrompt } from '../components/LessonFormFields';

function encodePersonRef(sourceGroup, memberId) {
    return `${sourceGroup}:${memberId}`;
}

function decodePersonRef(value) {
    if (!value) return null;
    const [source_group, ...rest] = String(value).split(':');
    return { source_group, id: Number(rest.join(':')) };
}

function findPoolMember(personnelPool, sourceGroup, memberId) {
    const pool = (personnelPool || []).find((group) => group.group_key === sourceGroup);
    return pool?.members?.find((member) => String(member.id) === String(memberId)) || null;
}

function availablePoolOptions(personnelPool, assignments, rowIndex) {
    const currentRef = assignments[rowIndex]?.person_ref || (
        assignments[rowIndex]?.source_group && assignments[rowIndex]?.qualified_trainer_id
            ? encodePersonRef(assignments[rowIndex].source_group, assignments[rowIndex].qualified_trainer_id)
            : ''
    );
    const assignedElsewhere = new Set(
        (assignments || [])
            .map((row, index) => {
                if (index === rowIndex) return null;
                if (row.person_ref) return row.person_ref;
                if (row.source_group && row.qualified_trainer_id) {
                    return encodePersonRef(row.source_group, row.qualified_trainer_id);
                }
                return null;
            })
            .filter(Boolean),
    );

    const options = [];
    (personnelPool || []).forEach((pool) => {
        (pool.members || []).forEach((member) => {
            const ref = encodePersonRef(pool.group_key, member.id);
            if (!assignedElsewhere.has(ref) || currentRef === ref) {
                options.push({
                    ...member,
                    group_key: pool.group_key,
                    group_label: pool.group_label,
                    person_ref: ref,
                });
            }
        });
    });

    return options;
}

function CollapsibleSection({
    title,
    icon: Icon,
    children,
    defaultOpen = true,
    actions = null,
}) {
    const [open, setOpen] = React.useState(defaultOpen);

    return (
        <AdminContentCard className="mb-4">
            <div className="flex items-center justify-between gap-3 px-5 py-4">
                <button
                    type="button"
                    onClick={() => setOpen((value) => !value)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                    <Icon className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="text-sm font-semibold text-slate-900">{title}</span>
                    {open ? (
                        <ChevronUp className="ml-auto h-4 w-4 shrink-0 text-slate-500" />
                    ) : (
                        <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-slate-500" />
                    )}
                </button>
                {actions ? <div className="shrink-0">{actions}</div> : null}
            </div>
            {open ? <div className="border-t border-slate-200 px-5 py-4">{children}</div> : null}
        </AdminContentCard>
    );
}

function RegenerateButton({ onClick, loading, label = 'Regenerate' }) {
    return (
        <AdminSecondaryButton
            type="button"
            onClick={onClick}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
        >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {label}
        </AdminSecondaryButton>
    );
}

function inputClass(extra = '') {
    return `w-full rounded-xl border border-slate-300 px-3 py-2 text-sm ${extra}`;
}

function moveItem(list, index, direction) {
    const next = [...list];
    const target = index + direction;
    if (target < 0 || target >= next.length) return list;
    [next[index], next[target]] = [next[target], next[index]];
    return next.map((item, sortIndex) => ({ ...item, sort_order: sortIndex + 1 }));
}

function hasGeneratedContent(formData) {
    const template = formData?.template || {};
    return Boolean(
        template.objectives
        || (formData?.activities || []).length > 0
        || (formData?.personnel || []).length > 0
        || (formData?.timeline_items || []).length > 0
        || template.scenario_summary
        || (formData?.evaluation_objectives || []).length > 0,
    );
}

function flattenEquipment(activities) {
    const rows = [];
    activities.forEach((activity, activityIndex) => {
        (activity.equipment || []).forEach((item, equipmentIndex) => {
            rows.push({
                key: `${activityIndex}-${equipmentIndex}-${item.resource_id || item.resource_name}`,
                activityIndex,
                equipmentIndex,
                activityTitle: activity.title,
                ...item,
            });
        });
    });
    return rows;
}

function buildAiContext(form, activities, personnel, personnelAssignments, timelineItems, evaluationObjectives) {
    return {
        title: form.title,
        category: form.category,
        exercise_type: form.exercise_type,
        estimated_duration_minutes: form.estimated_duration_minutes || null,
        objectives: form.objectives,
        scenario_summary: form.scenario_summary,
        expected_hazards: form.expected_hazards,
        learning_objectives: form.learning_objectives,
        safety_reminders: form.safety_reminders,
        activities: activities.map(({ title, description, duration_minutes, equipment }) => ({
            title,
            description,
            duration_minutes,
            equipment: (equipment || []).map(({ resource_id, resource_name, required_quantity }) => ({
                name: resource_name,
                resource_id,
                required_quantity,
            })),
        })),
        personnel,
        personnel_assignments: personnelAssignments,
        timeline_items: timelineItems,
        evaluation_objectives: evaluationObjectives,
    };
}

function normalizePersonnelAssignments(assignments = []) {
    return assignments.map((row) => ({
        id: row.id || null,
        role: row.role || '',
        source_group: row.source_group || '',
        qualified_trainer_id: row.qualified_trainer_id || null,
        person_name: row.person_name || '',
        person_external_id: row.person_external_id || null,
        notes: row.notes || '',
    }));
}

function buildExerciseFormSnapshot({
    form,
    activities,
    personnel,
    personnelAssignments,
    timelineItems,
    evaluationObjectives,
}) {
    return {
        form: {
            title: form.title?.trim() || '',
            category: form.category || '',
            exercise_type: form.exercise_type || '',
            difficulty_level: form.difficulty_level || '',
            estimated_duration_minutes: form.estimated_duration_minutes === '' || form.estimated_duration_minutes == null
                ? null
                : Number(form.estimated_duration_minutes),
            objectives: form.objectives || '',
            scenario_summary: form.scenario_summary || '',
            expected_hazards: form.expected_hazards || '',
            learning_objectives: form.learning_objectives || '',
            safety_reminders: form.safety_reminders || '',
            status: form.status || 'draft',
        },
        activities,
        personnel,
        personnel_assignments: normalizePersonnelAssignments(personnelAssignments),
        timeline_items: timelineItems,
        evaluation_objectives: evaluationObjectives,
    };
}

function applyPlanToState(plan, setters) {
    const {
        setForm,
        setActivities,
        setPersonnel,
        setPersonnelAssignments,
        setTimelineItems,
        setEvaluationObjectives,
    } = setters;

    setForm((prev) => ({
        ...prev,
        objectives: plan.objectives || '',
        scenario_summary: plan.scenario_summary || '',
        expected_hazards: plan.expected_hazards || '',
        learning_objectives: plan.learning_objectives || '',
        safety_reminders: plan.safety_reminders || '',
        estimated_duration_minutes: plan.estimated_duration_minutes ?? prev.estimated_duration_minutes ?? '',
    }));
    setActivities(plan.activities || []);
    setPersonnel(plan.personnel || []);
    setTimelineItems(plan.timeline_items || []);
    setEvaluationObjectives(plan.evaluation_objectives || []);
}

export function SimulationExerciseTemplateForm({ formData, mode = 'create' }) {
    const templateId = formData?.template?.id;
    const options = formData?.options || {};
    const resources = formData?.resources || [];
    const personnelPool = formData?.personnel_pool || [];
    const availablePersonCount = personnelPool.reduce((sum, pool) => sum + (pool.members?.length || 0), 0);

    const [form, setForm] = React.useState(() => ({
        title: formData?.template?.title || '',
        category: formData?.template?.category || 'Fire Safety',
        exercise_type: formData?.template?.exercise_type || 'Drill',
        difficulty_level: formData?.template?.difficulty_level || 'Intermediate',
        estimated_duration_minutes: formData?.template?.estimated_duration_minutes ?? '',
        objectives: formData?.template?.objectives || '',
        scenario_summary: formData?.template?.scenario_summary || '',
        expected_hazards: formData?.template?.expected_hazards || '',
        learning_objectives: formData?.template?.learning_objectives || '',
        safety_reminders: formData?.template?.safety_reminders || '',
        status: formData?.template?.status || 'draft',
    }));

    const [activities, setActivities] = React.useState(formData?.activities || []);
    const [personnel, setPersonnel] = React.useState(formData?.personnel || []);
    const [personnelAssignments, setPersonnelAssignments] = React.useState(() => (
        (formData?.personnel_assignments || []).map((row) => ({
            ...row,
            person_ref: row.source_group && row.qualified_trainer_id
                ? encodePersonRef(row.source_group, row.qualified_trainer_id)
                : '',
        }))
    ));
    const [timelineItems, setTimelineItems] = React.useState(formData?.timeline_items || []);
    const [evaluationObjectives, setEvaluationObjectives] = React.useState(formData?.evaluation_objectives || []);
    const [planGenerated, setPlanGenerated] = React.useState(() => mode !== 'create' || hasGeneratedContent(formData));
    const [isSaving, setIsSaving] = React.useState(false);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [regeneratingSection, setRegeneratingSection] = React.useState(null);

    const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const setters = React.useMemo(() => ({
        setForm,
        setActivities,
        setPersonnel,
        setPersonnelAssignments,
        setTimelineItems,
        setEvaluationObjectives,
    }), []);

    const aiInput = () => ({
        title: form.title.trim(),
        category: form.category,
        exercise_type: form.exercise_type,
        estimated_duration_minutes: form.estimated_duration_minutes === '' || form.estimated_duration_minutes == null
            ? null
            : Number(form.estimated_duration_minutes),
    });

    const aiContext = () => buildAiContext(form, activities, personnel, personnelAssignments, timelineItems, evaluationObjectives);

    const currentSnapshot = React.useMemo(() => buildExerciseFormSnapshot({
        form,
        activities,
        personnel,
        personnelAssignments,
        timelineItems,
        evaluationObjectives,
    }), [form, activities, personnel, personnelAssignments, timelineItems, evaluationObjectives]);

    const [baseline, setBaseline] = React.useState(() => buildExerciseFormSnapshot({
        form: {
            title: formData?.template?.title || '',
            category: formData?.template?.category || 'Fire Safety',
            exercise_type: formData?.template?.exercise_type || 'Drill',
            difficulty_level: formData?.template?.difficulty_level || 'Intermediate',
            estimated_duration_minutes: formData?.template?.estimated_duration_minutes ?? '',
            objectives: formData?.template?.objectives || '',
            scenario_summary: formData?.template?.scenario_summary || '',
            expected_hazards: formData?.template?.expected_hazards || '',
            learning_objectives: formData?.template?.learning_objectives || '',
            safety_reminders: formData?.template?.safety_reminders || '',
            status: formData?.template?.status || 'draft',
        },
        activities: formData?.activities || [],
        personnel: formData?.personnel || [],
        personnelAssignments: formData?.personnel_assignments || [],
        timelineItems: formData?.timeline_items || [],
        evaluationObjectives: formData?.evaluation_objectives || [],
    }));

    const isDirty = React.useMemo(
        () => JSON.stringify(currentSnapshot) !== JSON.stringify(baseline),
        [baseline, currentSnapshot],
    );

    const applySnapshot = React.useCallback((snapshot) => {
        setForm(snapshot.form);
        setActivities(snapshot.activities || []);
        setPersonnel(snapshot.personnel || []);
        setPersonnelAssignments((snapshot.personnel_assignments || []).map((row) => ({
            ...row,
            person_ref: row.source_group && row.qualified_trainer_id
                ? encodePersonRef(row.source_group, row.qualified_trainer_id)
                : '',
        })));
        setTimelineItems(snapshot.timeline_items || []);
        setEvaluationObjectives(snapshot.evaluation_objectives || []);
    }, []);

    const discardChanges = React.useCallback(() => {
        applySnapshot(baseline);
    }, [applySnapshot, baseline]);

    const validateEssentials = () => {
        if (!form.title.trim()) {
            showAppAlert({ title: 'Missing title', description: 'Exercise title is required.', icon: 'warning' });
            return false;
        }
        return true;
    };

    const handleGeneratePlan = async () => {
        if (!validateEssentials()) return;

        setIsGenerating(true);
        try {
            const response = await fetch('/admin/simulation-exercise-templates/generate-plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    ...getCsrfHeaders(),
                },
                body: JSON.stringify(aiInput()),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to generate exercise plan.');
            }

            applyPlanToState(data.plan || {}, setters);
            setPlanGenerated(true);
        } catch (error) {
            showAppAlert({
                title: 'Generation failed',
                description: error.message || 'Could not generate exercise plan.',
                icon: 'error',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRegenerateSection = async (section) => {
        if (!validateEssentials()) return;

        setRegeneratingSection(section);
        try {
            const response = await fetch('/admin/simulation-exercise-templates/regenerate-section', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    ...getCsrfHeaders(),
                },
                body: JSON.stringify({
                    section,
                    ...aiInput(),
                    context: aiContext(),
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to regenerate section.');
            }

            const result = data.result || {};

            if (section === 'objectives') {
                setField('objectives', result.objectives || '');
            } else if (section === 'activities') {
                setActivities(result.activities || []);
                if (result.estimated_duration_minutes) {
                    setField('estimated_duration_minutes', result.estimated_duration_minutes);
                }
            } else if (section === 'timeline') {
                setTimelineItems(result.timeline_items || []);
            } else if (section === 'personnel') {
                setPersonnel(result.personnel || []);
            } else if (section === 'equipment') {
                setActivities(result.activities || activities);
            } else if (section === 'scenario') {
                setForm((prev) => ({
                    ...prev,
                    scenario_summary: result.scenario_summary || '',
                    expected_hazards: result.expected_hazards || '',
                    learning_objectives: result.learning_objectives || '',
                    safety_reminders: result.safety_reminders || '',
                }));
            } else if (section === 'evaluation_objectives') {
                setEvaluationObjectives(result.evaluation_objectives || []);
            }
        } catch (error) {
            showAppAlert({
                title: 'Regeneration failed',
                description: error.message || 'Could not regenerate this section.',
                icon: 'error',
            });
        } finally {
            setRegeneratingSection(null);
        }
    };

    const addActivity = () => setActivities((prev) => [
        ...prev,
        { title: '', description: '', duration_minutes: 15, equipment: [], sort_order: prev.length + 1 },
    ]);

    const updateActivity = (index, patch) => setActivities((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    const removeActivity = (index) => setActivities((prev) => prev.filter((_, i) => i !== index));

    const addActivityEquipment = (activityIndex) => {
        setActivities((prev) => prev.map((item, i) => (
            i === activityIndex
                ? { ...item, equipment: [...(item.equipment || []), { resource_id: '', required_quantity: 1 }] }
                : item
        )));
    };

    const updateActivityEquipment = (activityIndex, equipmentIndex, patch) => {
        setActivities((prev) => prev.map((item, i) => {
            if (i !== activityIndex) return item;
            const equipment = (item.equipment || []).map((row, j) => (j === equipmentIndex ? { ...row, ...patch } : row));
            return { ...item, equipment };
        }));
    };

    const removeActivityEquipment = (activityIndex, equipmentIndex) => {
        setActivities((prev) => prev.map((item, i) => {
            if (i !== activityIndex) return item;
            return { ...item, equipment: (item.equipment || []).filter((_, j) => j !== equipmentIndex) };
        }));
    };

    const addRecommendedEquipment = () => {
        if (activities.length === 0) {
            showAppAlert({
                title: 'Add an activity first',
                description: 'Equipment must be linked to an activity. Add at least one activity before adding equipment.',
                icon: 'warning',
            });
            return;
        }

        addActivityEquipment(activities.length - 1);
    };

    const addPersonnel = () => setPersonnel((prev) => [
        ...prev,
        { role: '', recommended_count: 1, notes: '', sort_order: prev.length + 1 },
    ]);

    const addPersonnelAssignment = () => setPersonnelAssignments((prev) => [
        ...prev,
        {
            role: '',
            person_ref: '',
            source_group: '',
            qualified_trainer_id: '',
            person_name: '',
            notes: '',
            sort_order: prev.length + 1,
        },
    ]);
    const addTimeline = () => setTimelineItems((prev) => [...prev, { start_time: '08:00', label: '', description: '', activity_index: null, sort_order: prev.length + 1 }]);
    const addEvaluation = () => setEvaluationObjectives((prev) => [...prev, { heading: '', objective_text: '', activity_index: null, sort_order: prev.length + 1 }]);

    const activityLinkValue = (row) => {
        if (row.activity_id) return String(row.activity_id);
        if (row.activity_index != null && row.activity_index !== '') return `index:${row.activity_index}`;
        return '';
    };

    const handleActivityLinkChange = (index, value, listSetter) => {
        listSetter((prev) => prev.map((item, i) => {
            if (i !== index) return item;
            if (value.startsWith('index:')) {
                return {
                    ...item,
                    activity_id: null,
                    activity_index: Number(value.replace('index:', '')),
                };
            }
            return {
                ...item,
                activity_id: value ? Number(value) : null,
                activity_index: null,
            };
        }));
    };

    const resolvedStatus = formData?.template?.status || 'draft';

    const persistForm = async ({ redirect = true } = {}) => {
        if (!validateEssentials()) return false;

        setIsSaving(true);
        const payload = {
            ...form,
            difficulty_level: form.difficulty_level || 'Intermediate',
            estimated_duration_minutes: form.estimated_duration_minutes === '' || form.estimated_duration_minutes == null
                ? null
                : Number(form.estimated_duration_minutes),
            status: resolvedStatus,
            activities,
            personnel,
            personnel_assignments: personnelAssignments
                .map((row) => {
                    let sourceGroup = row.source_group || '';
                    let trainerId = row.qualified_trainer_id || null;
                    let personName = row.person_name || '';

                    if (row.person_ref) {
                        const decoded = decodePersonRef(row.person_ref);
                        if (decoded) {
                            sourceGroup = decoded.source_group;
                            trainerId = decoded.id;
                            const member = findPoolMember(personnelPool, sourceGroup, trainerId);
                            personName = member?.name || personName;
                        }
                    }

                    return {
                        id: row.id,
                        role: row.role,
                        source_group: sourceGroup,
                        qualified_trainer_id: trainerId,
                        person_name: personName,
                        person_external_id: row.person_external_id || null,
                        notes: row.notes || '',
                    };
                })
                .filter((row) => row.role && row.person_name),
            timeline_items: timelineItems,
            evaluation_objectives: evaluationObjectives,
        };

        const url = mode === 'create'
            ? '/admin/simulation-exercise-templates'
            : `/admin/simulation-exercise-templates/${templateId}`;
        const method = mode === 'create' ? 'POST' : 'PUT';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    ...getCsrfHeaders(),
                },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to save template.');
            }

            setBaseline(buildExerciseFormSnapshot({
                form: { ...form, status: payload.status },
                activities,
                personnel,
                personnelAssignments: payload.personnel_assignments,
                timelineItems,
                evaluationObjectives,
            }));

            if (redirect) {
                window.location.href = data.redirect || `/admin/simulation-exercise-templates/${data.template?.id || templateId}`;
            }

            return true;
        } catch (error) {
            showAppAlert({
                title: 'Save failed',
                description: error.message || 'Failed to save template.',
                icon: 'error',
            });
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = async () => {
        await persistForm({ redirect: true });
    };

    const { requestClose } = useLessonClosePrompt({
        isDirty,
        title: 'Unsaved changes',
        description: 'You have unsaved exercise plan changes. What would you like to do?',
        onSaveDraft: async () => persistForm({ redirect: false }),
        onDiscard: discardChanges,
    });

    React.useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (!isDirty) return;
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    React.useEffect(() => {
        const handleDocumentClick = async (event) => {
            if (!isDirty) return;

            const anchor = event.target.closest('a[href]');
            if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

            const href = anchor.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

            let destination;
            try {
                destination = new URL(anchor.href, window.location.origin);
            } catch {
                return;
            }

            if (destination.origin !== window.location.origin) return;
            if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;

            event.preventDefault();
            event.stopPropagation();

            const canLeave = await requestClose();
            if (canLeave) {
                window.location.href = destination.href;
            }
        };

        document.addEventListener('click', handleDocumentClick, true);
        return () => document.removeEventListener('click', handleDocumentClick, true);
    }, [isDirty, requestClose]);

    const handleNavigateAway = async (href) => {
        const canLeave = await requestClose();
        if (canLeave) {
            window.location.href = href;
        }
    };

    const equipmentRows = flattenEquipment(activities);
    const computedDuration = activities.reduce((sum, item) => sum + (Number(item.duration_minutes) || 0), 0);

    return (
        <AdminPageShell>
            <AdminPageHeader
                icon={Layers}
                title={mode === 'create' ? 'Create Exercise Plan' : form.title || 'Edit Exercise Plan'}
                description="Provide essential exercise details, let AI draft the plan, assign personnel from integrated groups, then save."
                actions={(
                    <div className="flex flex-wrap gap-2">
                        <AdminSecondaryButton onClick={() => handleNavigateAway('/admin/simulation-events?tab=templates')}>
                            Back to Simulation Event Planning
                        </AdminSecondaryButton>
                        <AdminPrimaryButton onClick={handleSave} disabled={isSaving}>
                            Save Draft
                        </AdminPrimaryButton>
                    </div>
                )}
            />

            <CollapsibleSection title="Exercise Information" icon={BookOpen}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="text-sm md:col-span-2">
                        <span className="font-medium text-slate-700">
                            Exercise Title
                            <span className="text-rose-600"> *</span>
                        </span>
                        <input
                            className={`mt-1 ${inputClass()}`}
                            value={form.title}
                            onChange={(e) => setField('title', e.target.value)}
                            placeholder="e.g. Community Fire Safety Practical Drill"
                        />
                    </label>
                    <label className="text-sm">
                        <span className="font-medium text-slate-700">
                            Exercise Category
                            <span className="text-rose-600"> *</span>
                        </span>
                        <select className={`mt-1 ${inputClass()}`} value={form.category} onChange={(e) => setField('category', e.target.value)}>
                            {(options.categories || []).map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </label>
                    <label className="text-sm">
                        <span className="font-medium text-slate-700">
                            Exercise Type
                            <span className="text-rose-600"> *</span>
                        </span>
                        <select className={`mt-1 ${inputClass()}`} value={form.exercise_type} onChange={(e) => setField('exercise_type', e.target.value)}>
                            {(options.exercise_types || []).map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </label>
                    <label className="text-sm md:col-span-2">
                        <span className="font-medium text-slate-700">Estimated Duration (minutes)</span>
                        <input
                            type="number"
                            min="15"
                            className={`mt-1 ${inputClass('max-w-xs')}`}
                            value={form.estimated_duration_minutes}
                            onChange={(e) => setField('estimated_duration_minutes', e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="Optional"
                        />
                        <p className="mt-1.5 text-xs text-slate-500">
                            Leave this blank to allow AI to estimate the total exercise duration based on the generated activities.
                        </p>
                    </label>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
                    <AdminPrimaryButton onClick={handleGeneratePlan} disabled={isGenerating}>
                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        Generate Exercise Plan
                    </AdminPrimaryButton>
                    <span className="text-xs text-slate-500">
                        Optional — you can also fill in the sections below manually.
                    </span>
                    {computedDuration > 0 ? (
                        <span className="text-xs text-slate-500">
                            Current activity total: {computedDuration} min
                            {form.estimated_duration_minutes ? ` · Target: ${form.estimated_duration_minutes} min` : ''}
                        </span>
                    ) : null}
                </div>
            </CollapsibleSection>

            <CollapsibleSection
                title="Exercise Objectives"
                icon={Target}
                defaultOpen={!planGenerated}
                actions={(
                    <RegenerateButton
                        onClick={() => handleRegenerateSection('objectives')}
                        loading={regeneratingSection === 'objectives'}
                        label="AI Assist"
                    />
                )}
            >
                <textarea
                    rows={5}
                    className={inputClass()}
                    value={form.objectives}
                    onChange={(e) => setField('objectives', e.target.value)}
                    placeholder="Overall exercise objectives..."
                />
            </CollapsibleSection>

            <CollapsibleSection
                title="Exercise Activities"
                icon={ClipboardList}
                defaultOpen={!planGenerated}
                actions={(
                    <RegenerateButton
                        onClick={() => handleRegenerateSection('activities')}
                        loading={regeneratingSection === 'activities'}
                        label="AI Assist"
                    />
                )}
            >
                <div className="space-y-4">
                    {activities.length === 0 ? (
                        <p className="text-sm text-slate-500">No activities yet. Add one manually or use Generate Exercise Plan above.</p>
                    ) : null}
                    {activities.map((activity, index) => (
                        <div key={activity.id || `activity-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <span
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700"
                                        title="Activity order in the exercise"
                                    >
                                        {index + 1}
                                    </span>
                                    Activity {index + 1}
                                </div>
                                <div className="flex gap-1">
                                    <button type="button" onClick={() => setActivities((prev) => moveItem(prev, index, -1))} className="rounded-lg border border-slate-200 p-1.5"><ArrowUp className="h-4 w-4" /></button>
                                    <button type="button" onClick={() => setActivities((prev) => moveItem(prev, index, 1))} className="rounded-lg border border-slate-200 p-1.5"><ArrowDown className="h-4 w-4" /></button>
                                    <button type="button" onClick={() => removeActivity(index)} className="rounded-lg border border-rose-200 p-1.5 text-rose-600"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            </div>
                            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                                <label className="text-sm md:col-span-2">
                                    <span className="mb-1 block text-xs font-semibold text-slate-600">Activity Title</span>
                                    <input className={inputClass()} placeholder="e.g. Registration and Welcome Remarks" value={activity.title} onChange={(e) => updateActivity(index, { title: e.target.value })} />
                                </label>
                                <label className="text-sm">
                                    <span className="mb-1 block text-xs font-semibold text-slate-600">Duration (minutes)</span>
                                    <input type="number" min="1" className={inputClass()} placeholder="15" value={activity.duration_minutes} onChange={(e) => updateActivity(index, { duration_minutes: Number(e.target.value) })} />
                                </label>
                                <label className="text-sm md:col-span-3">
                                    <span className="mb-1 block text-xs font-semibold text-slate-600">Description</span>
                                    <textarea rows={2} className={inputClass()} placeholder="What happens during this activity..." value={activity.description || ''} onChange={(e) => updateActivity(index, { description: e.target.value })} />
                                </label>
                            </div>
                            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Equipment for this activity</p>
                                    <button type="button" onClick={() => addActivityEquipment(index)} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                        <Plus className="h-3.5 w-3.5" />
                                        Add Equipment
                                    </button>
                                </div>
                                {(activity.equipment || []).length === 0 ? (
                                    <p className="mt-2 text-xs text-slate-500">No equipment added for this activity yet.</p>
                                ) : null}
                                {(activity.equipment || []).map((row, equipmentIndex) => {
                                    const selected = resources.find((item) => String(item.id) === String(row.resource_id));
                                    return (
                                        <div key={`${index}-eq-${equipmentIndex}`} className="mt-2 grid grid-cols-1 items-end gap-2 md:grid-cols-4">
                                            <label className="text-sm md:col-span-2">
                                                <span className="mb-1 block text-xs font-semibold text-slate-600">Equipment</span>
                                                <select className={inputClass()} value={row.resource_id || ''} onChange={(e) => updateActivityEquipment(index, equipmentIndex, { resource_id: Number(e.target.value) })}>
                                                    <option value="">Select equipment</option>
                                                    {resources.map((resource) => <option key={resource.id} value={resource.id}>{resource.name}</option>)}
                                                </select>
                                            </label>
                                            <label className="text-sm">
                                                <span className="mb-1 block text-xs font-semibold text-slate-600">Quantity</span>
                                                <input type="number" min="1" className={inputClass()} value={row.required_quantity || 1} onChange={(e) => updateActivityEquipment(index, equipmentIndex, { required_quantity: Number(e.target.value) })} />
                                            </label>
                                            <div className="flex items-end justify-between gap-2 pb-2 text-xs text-slate-600">
                                                <span>{selected ? `${selected.available ?? 0} available · ${selected.status || '—'}` : row.resource_name || 'Select from inventory'}</span>
                                                <button type="button" onClick={() => removeActivityEquipment(index, equipmentIndex)} className="rounded-lg border border-rose-200 px-2 py-1 text-rose-600">Remove</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    <AdminSecondaryButton onClick={addActivity}><Plus className="h-4 w-4" /> Add Activity</AdminSecondaryButton>
                </div>
            </CollapsibleSection>

            <CollapsibleSection
                title="Operational Timeline"
                icon={Clock3}
                defaultOpen={false}
                actions={(
                    <RegenerateButton
                        onClick={() => handleRegenerateSection('timeline')}
                        loading={regeneratingSection === 'timeline'}
                        label="AI Assist"
                    />
                )}
            >
                        <div className="space-y-3">
                            {timelineItems.map((row, index) => (
                                <div key={row.id || `timeline-${index}`} className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-5">
                                    <input type="time" className={inputClass()} value={row.start_time || '08:00'} onChange={(e) => setTimelineItems((prev) => prev.map((item, i) => (i === index ? { ...item, start_time: e.target.value } : item)))} />
                                    <input className={inputClass()} placeholder="Label" value={row.label || ''} onChange={(e) => setTimelineItems((prev) => prev.map((item, i) => (i === index ? { ...item, label: e.target.value } : item)))} />
                                    <select
                                        className={inputClass()}
                                        value={activityLinkValue(row)}
                                        onChange={(e) => handleActivityLinkChange(index, e.target.value, setTimelineItems)}
                                    >
                                        <option value="">Link activity (optional)</option>
                                        {activities.map((item, activityIndex) => (
                                            <option key={item.id || `timeline-act-${activityIndex}`} value={item.id ? String(item.id) : `index:${activityIndex}`}>
                                                {item.title || `Activity ${activityIndex + 1}`}
                                            </option>
                                        ))}
                                    </select>
                                    <input className={inputClass('md:col-span-2')} placeholder="Description" value={row.description || ''} onChange={(e) => setTimelineItems((prev) => prev.map((item, i) => (i === index ? { ...item, description: e.target.value } : item)))} />
                                    <div className="md:col-span-5 flex justify-end">
                                        <button type="button" onClick={() => setTimelineItems((prev) => prev.filter((_, i) => i !== index))} className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600">Remove</button>
                                    </div>
                                </div>
                            ))}
                            <AdminSecondaryButton onClick={addTimeline}><Plus className="h-4 w-4" /> Add Timeline Item</AdminSecondaryButton>
                        </div>
                    </CollapsibleSection>

            <CollapsibleSection
                title="Recommended Personnel"
                icon={Users}
                defaultOpen={false}
                actions={(
                    <RegenerateButton
                        onClick={() => handleRegenerateSection('personnel')}
                        loading={regeneratingSection === 'personnel'}
                        label="AI Assist"
                    />
                )}
            >
                <p className="mb-4 text-sm text-slate-600">
                    Define required roles and staffing levels for the exercise. Assign specific people in the section below.
                </p>
                <div className="space-y-3">
                    {personnel.length === 0 ? (
                        <p className="text-sm text-slate-500">No roles planned yet. Add roles manually or use AI Assist.</p>
                    ) : null}
                    {personnel.map((row, index) => (
                        <div key={row.id || `person-${index}`} className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-4">
                            <label className="text-sm">
                                <span className="mb-1 block text-xs font-semibold text-slate-600">Role</span>
                                <select className={inputClass()} value={row.role || ''} onChange={(e) => setPersonnel((prev) => prev.map((item, i) => (i === index ? { ...item, role: e.target.value } : item)))}>
                                    <option value="">Select role…</option>
                                    {(options.personnel_roles || []).map((role) => <option key={role} value={role}>{role}</option>)}
                                </select>
                            </label>
                            <label className="text-sm">
                                <span className="mb-1 block text-xs font-semibold text-slate-600">Recommended Count</span>
                                <input
                                    type="number"
                                    min="1"
                                    max="99"
                                    className={inputClass()}
                                    value={row.recommended_count || 1}
                                    onChange={(e) => setPersonnel((prev) => prev.map((item, i) => (
                                        i === index ? { ...item, recommended_count: Math.max(1, Number(e.target.value) || 1) } : item
                                    )))}
                                />
                            </label>
                            <label className="text-sm md:col-span-2">
                                <span className="mb-1 block text-xs font-semibold text-slate-600">Notes</span>
                                <input className={inputClass()} placeholder="e.g. Monitors hazards during live demos" value={row.notes || ''} onChange={(e) => setPersonnel((prev) => prev.map((item, i) => (i === index ? { ...item, notes: e.target.value } : item)))} />
                            </label>
                            <div className="md:col-span-4 flex justify-end">
                                <button type="button" onClick={() => setPersonnel((prev) => prev.filter((_, i) => i !== index))} className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600">Remove</button>
                            </div>
                        </div>
                    ))}
                    <AdminSecondaryButton onClick={addPersonnel}>
                        <Plus className="h-4 w-4" /> Add Personnel Role
                    </AdminSecondaryButton>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Assign Personnel" icon={Users} defaultOpen>
                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 space-y-2">
                    <p>
                        Assign available personnel from integrated groups. People are fetched from each group&apos;s registry when integration is enabled.
                    </p>
                    {personnelPool.map((pool) => (
                        <div key={pool.group_key}>
                            <span className="font-medium text-slate-800">{pool.group_label}</span>
                            {pool.integration_pending ? (
                                <span className="text-amber-700"> — integration pending</span>
                            ) : (
                                <span className="text-emerald-700"> — {pool.members?.length || 0} available</span>
                            )}
                        </div>
                    ))}
                    {availablePersonCount === 0 && (
                        <p className="text-amber-700">No personnel available yet. Sync Group 6 trainers or wait for other group integrations.</p>
                    )}
                </div>
                <div className="space-y-3">
                    {personnelAssignments.length === 0 ? (
                        <p className="text-sm text-slate-500">No personnel assigned yet. Add an assignment below.</p>
                    ) : null}
                    {personnelAssignments.map((row, index) => {
                        const poolOptions = availablePoolOptions(personnelPool, personnelAssignments, index);
                        const personRef = row.person_ref || (
                            row.source_group && row.qualified_trainer_id
                                ? encodePersonRef(row.source_group, row.qualified_trainer_id)
                                : ''
                        );

                        return (
                            <div key={row.id || `assign-${index}`} className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-4">
                                <label className="text-sm">
                                    <span className="mb-1 block text-xs font-semibold text-slate-600">Role</span>
                                    <select className={inputClass()} value={row.role || ''} onChange={(e) => setPersonnelAssignments((prev) => prev.map((item, i) => (i === index ? { ...item, role: e.target.value } : item)))}>
                                        <option value="">Select role…</option>
                                        {(options.personnel_roles || []).map((role) => <option key={role} value={role}>{role}</option>)}
                                    </select>
                                </label>
                                <label className="text-sm md:col-span-2">
                                    <span className="mb-1 block text-xs font-semibold text-slate-600">Assign Personnel</span>
                                    <select
                                        className={inputClass()}
                                        value={personRef}
                                        disabled={availablePersonCount === 0}
                                        onChange={(e) => {
                                            const decoded = decodePersonRef(e.target.value);
                                            const member = decoded
                                                ? findPoolMember(personnelPool, decoded.source_group, decoded.id)
                                                : null;
                                            setPersonnelAssignments((prev) => prev.map((item, i) => (
                                                i === index
                                                    ? {
                                                        ...item,
                                                        person_ref: e.target.value,
                                                        source_group: decoded?.source_group || '',
                                                        qualified_trainer_id: decoded?.id || '',
                                                        person_name: member?.name || '',
                                                    }
                                                    : item
                                            )));
                                        }}
                                    >
                                        <option value="">{availablePersonCount > 0 ? 'Select person to assign…' : 'No personnel available'}</option>
                                        {personnelPool.map((pool) => (
                                            pool.members?.length > 0 ? (
                                                <optgroup key={pool.group_key} label={pool.group_label}>
                                                    {pool.members
                                                        .filter((member) => poolOptions.some((opt) => opt.person_ref === encodePersonRef(pool.group_key, member.id)))
                                                        .map((member) => (
                                                            <option key={`${pool.group_key}-${member.id}`} value={encodePersonRef(pool.group_key, member.id)}>
                                                                {member.name}
                                                                {member.specialization ? ` — ${member.specialization}` : ''}
                                                                {member.barangay ? ` (${member.barangay})` : ''}
                                                            </option>
                                                        ))}
                                                </optgroup>
                                            ) : null
                                        ))}
                                    </select>
                                </label>
                                <label className="text-sm">
                                    <span className="mb-1 block text-xs font-semibold text-slate-600">Notes</span>
                                    <input className={inputClass()} placeholder="Optional assignment notes" value={row.notes || ''} onChange={(e) => setPersonnelAssignments((prev) => prev.map((item, i) => (i === index ? { ...item, notes: e.target.value } : item)))} />
                                </label>
                                <div className="md:col-span-4 flex justify-end">
                                    <button type="button" onClick={() => setPersonnelAssignments((prev) => prev.filter((_, i) => i !== index))} className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600">Remove</button>
                                </div>
                            </div>
                        );
                    })}
                    <AdminSecondaryButton onClick={addPersonnelAssignment} disabled={availablePersonCount === 0}>
                        <Plus className="h-4 w-4" /> Add Personnel Assignment
                    </AdminSecondaryButton>
                </div>
            </CollapsibleSection>

            <CollapsibleSection
                title="Recommended Equipment"
                icon={Wrench}
                defaultOpen={false}
                actions={(
                    <div className="flex items-center gap-2">
                        <AdminSecondaryButton
                            type="button"
                            onClick={addRecommendedEquipment}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add Equipment
                        </AdminSecondaryButton>
                        <RegenerateButton
                            onClick={() => handleRegenerateSection('equipment')}
                            loading={regeneratingSection === 'equipment'}
                            label="AI Assist"
                        />
                    </div>
                )}
            >
                {equipmentRows.length === 0 ? (
                    <p className="text-sm text-slate-500">
                        No equipment yet. Click &quot;Add Equipment&quot; or add items under each activity above.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {equipmentRows.map((row) => {
                            const selected = resources.find((item) => String(item.id) === String(row.resource_id));
                            return (
                                <div key={row.key} className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-5">
                                    <label className="text-sm md:col-span-2">
                                        <span className="mb-1 block text-xs font-semibold text-slate-600">Activity</span>
                                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                                            {row.activityTitle || `Activity ${row.activityIndex + 1}`}
                                        </div>
                                    </label>
                                    <label className="text-sm">
                                        <span className="mb-1 block text-xs font-semibold text-slate-600">Equipment</span>
                                        <select
                                            className={inputClass()}
                                            value={row.resource_id || ''}
                                            onChange={(e) => updateActivityEquipment(row.activityIndex, row.equipmentIndex, { resource_id: Number(e.target.value) })}
                                        >
                                            <option value="">Select equipment</option>
                                            {resources.map((resource) => <option key={resource.id} value={resource.id}>{resource.name}</option>)}
                                        </select>
                                    </label>
                                    <label className="text-sm">
                                        <span className="mb-1 block text-xs font-semibold text-slate-600">Quantity</span>
                                        <input
                                            type="number"
                                            min="1"
                                            className={inputClass()}
                                            value={row.required_quantity || 1}
                                            onChange={(e) => updateActivityEquipment(row.activityIndex, row.equipmentIndex, { required_quantity: Number(e.target.value) })}
                                        />
                                    </label>
                                    <div className="flex items-end justify-between gap-2 pb-2 text-xs text-slate-600">
                                        <span>{selected ? `${selected.available ?? 0} available` : row.resource_name || '—'}</span>
                                        <button type="button" onClick={() => removeActivityEquipment(row.activityIndex, row.equipmentIndex)} className="rounded-lg border border-rose-200 px-2 py-1 text-rose-600">Remove</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CollapsibleSection>

            <CollapsibleSection
                title="Scenario Brief"
                icon={Shield}
                defaultOpen={false}
                actions={(
                    <RegenerateButton
                        onClick={() => handleRegenerateSection('scenario')}
                        loading={regeneratingSection === 'scenario'}
                        label="AI Assist"
                    />
                )}
            >
                        <div className="grid grid-cols-1 gap-4">
                            <label className="text-sm"><span className="font-medium text-slate-700">Scenario Summary</span><textarea rows={3} className={`mt-1 ${inputClass()}`} value={form.scenario_summary} onChange={(e) => setField('scenario_summary', e.target.value)} /></label>
                            <label className="text-sm"><span className="font-medium text-slate-700">Expected Hazards</span><textarea rows={3} className={`mt-1 ${inputClass()}`} value={form.expected_hazards} onChange={(e) => setField('expected_hazards', e.target.value)} /></label>
                            <label className="text-sm"><span className="font-medium text-slate-700">Learning Objectives</span><textarea rows={3} className={`mt-1 ${inputClass()}`} value={form.learning_objectives} onChange={(e) => setField('learning_objectives', e.target.value)} /></label>
                            <label className="text-sm"><span className="font-medium text-slate-700">Safety Reminders</span><textarea rows={3} className={`mt-1 ${inputClass()}`} value={form.safety_reminders} onChange={(e) => setField('safety_reminders', e.target.value)} /></label>
                        </div>
                    </CollapsibleSection>

            <CollapsibleSection
                title="Evaluation Objectives"
                icon={Target}
                defaultOpen={false}
                actions={(
                    <RegenerateButton
                        onClick={() => handleRegenerateSection('evaluation_objectives')}
                        loading={regeneratingSection === 'evaluation_objectives'}
                        label="AI Assist"
                    />
                )}
            >
                        <div className="space-y-3">
                            {evaluationObjectives.map((row, index) => (
                                <div key={row.id || `eval-${index}`} className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-4">
                                    <input className={inputClass()} placeholder="Heading" value={row.heading || ''} onChange={(e) => setEvaluationObjectives((prev) => prev.map((item, i) => (i === index ? { ...item, heading: e.target.value } : item)))} />
                                    <select
                                        className={inputClass()}
                                        value={activityLinkValue(row)}
                                        onChange={(e) => handleActivityLinkChange(index, e.target.value, setEvaluationObjectives)}
                                    >
                                        <option value="">Link activity (optional)</option>
                                        {activities.map((item, activityIndex) => (
                                            <option key={item.id || `eval-act-${activityIndex}`} value={item.id ? String(item.id) : `index:${activityIndex}`}>
                                                {item.title || `Activity ${activityIndex + 1}`}
                                            </option>
                                        ))}
                                    </select>
                                    <input className={inputClass('md:col-span-2')} placeholder="Evaluation objective" value={row.objective_text || ''} onChange={(e) => setEvaluationObjectives((prev) => prev.map((item, i) => (i === index ? { ...item, objective_text: e.target.value } : item)))} />
                                    <div className="md:col-span-4 flex justify-end">
                                        <button type="button" onClick={() => setEvaluationObjectives((prev) => prev.filter((_, i) => i !== index))} className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600">Remove</button>
                                    </div>
                                </div>
                            ))}
                            <AdminSecondaryButton onClick={addEvaluation}><Plus className="h-4 w-4" /> Add Evaluation Objective</AdminSecondaryButton>
                        </div>
                    </CollapsibleSection>
        </AdminPageShell>
    );
}
