import React from 'react';
import Swal from 'sweetalert2';
import {
    Sparkles,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Settings,
    Eye,
    Pencil,
    Trash2,
    RefreshCw,
    Plus,
    Save,
    Send,
    ChevronDown,
    X,
} from 'lucide-react';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminPrimaryButton,
    AdminSecondaryButton,
    AdminContentCard,
    adminSelectClass,
    adminCompactInputClass,
} from '../components/admin/AdminLayout';
import { AdminDataTable, AdminTableActionButton } from '../components/admin/AdminDataTable';
import { AiScenarioLanguageSwitcher } from '../components/AiScenarioLanguageSwitcher';
import {
    AI_SCENARIO_DEFAULT_LANGUAGE,
    resolveLearningObjectives,
    resolveQuestionForLocale,
    resolveScenarioDescription,
    resolveScenarioTitle,
} from '../utils/aiScenarioLocale';

const QUESTION_COUNTS = [10, 15, 20];

const GENERATION_LANGUAGES = [
    { value: 'en', label: 'English' },
    { value: 'fil', label: 'Filipino' },
];

function formatDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString();
}

function formatDifficulty(value) {
    if (!value) return '—';
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function displayAssessmentStatus(status) {
    if (status === 'published') return 'Published';
    if (status === 'archived') return 'Archived';
    return 'Draft';
}

function AssessmentStatusBadge({ status }) {
    const label = displayAssessmentStatus(status);
    const styles = {
        Published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        Draft: 'bg-amber-50 text-amber-700 border-amber-200',
        Archived: 'bg-slate-50 text-slate-600 border-slate-200',
    };

    return (
        <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-medium ${styles[label] || styles.Draft}`}>
            {label}
        </span>
    );
}

function workflowUrl(configId, versionId, suffix = '') {
    return `/admin/ai-scenario-config/${configId}/versions/${versionId}${suffix}`;
}

function serializeConfigPayload(payload) {
    return JSON.stringify(payload);
}

export function AiScenarioTrainingModule({ modules = [], configs = [] }) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';

    const configByModuleId = React.useMemo(() => {
        const map = {};
        (configs || []).forEach((c) => {
            map[c.training_module_id] = c;
        });
        return map;
    }, [configs]);

    const [selectedModuleId, setSelectedModuleId] = React.useState(
        modules[0]?.id ? String(modules[0].id) : '',
    );
    const [localConfigs, setLocalConfigs] = React.useState(configs || []);
    const [configExpanded, setConfigExpanded] = React.useState(false);
    const [configSynced, setConfigSynced] = React.useState(false);
    const [savedPayloadKey, setSavedPayloadKey] = React.useState('');

    const [displayLanguage, setDisplayLanguage] = React.useState(AI_SCENARIO_DEFAULT_LANGUAGE);
    const [saving, setSaving] = React.useState(false);
    const [generating, setGenerating] = React.useState(false);
    const [workflowBusy, setWorkflowBusy] = React.useState(false);

    const [activeVersion, setActiveVersion] = React.useState(null);
    const [panelMode, setPanelMode] = React.useState(null);
    const [editingQuestion, setEditingQuestion] = React.useState(null);
    const [scenarioDraft, setScenarioDraft] = React.useState(null);

    const [questionCount, setQuestionCount] = React.useState(10);
    const [generationLanguage, setGenerationLanguage] = React.useState(AI_SCENARIO_DEFAULT_LANGUAGE);
    const [isEnabled, setIsEnabled] = React.useState(false);
    const [timeLimitMinutes, setTimeLimitMinutes] = React.useState(60);
    const [maxAttempts, setMaxAttempts] = React.useState(3);
    const [passingScore, setPassingScore] = React.useState(75);
    const [failRetakePolicy, setFailRetakePolicy] = React.useState('require_lesson_review');
    const [autoSubmitOnExpire, setAutoSubmitOnExpire] = React.useState(true);
    const [allowResumeAttempt, setAllowResumeAttempt] = React.useState(true);
    const [shuffleQuestions, setShuffleQuestions] = React.useState(true);
    const [shuffleAnswerChoices, setShuffleAnswerChoices] = React.useState(true);

    const selectedConfig = localConfigs.find(
        (c) => String(c.training_module_id) === String(selectedModuleId),
    );
    const selectedModule = modules.find((m) => String(m.id) === String(selectedModuleId));

    const buildPayload = React.useCallback(() => ({
        training_module_id: Number(selectedModuleId),
        number_of_questions: questionCount,
        generation_language: generationLanguage,
        is_enabled: isEnabled,
        time_limit_minutes: timeLimitMinutes,
        max_attempts: maxAttempts,
        passing_score: passingScore,
        fail_retake_policy: failRetakePolicy,
        auto_submit_on_expire: autoSubmitOnExpire,
        allow_resume_attempt: allowResumeAttempt,
        shuffle_questions: shuffleQuestions,
        shuffle_answer_choices: shuffleAnswerChoices,
    }), [
        selectedModuleId, questionCount, generationLanguage, isEnabled, timeLimitMinutes,
        maxAttempts, passingScore, failRetakePolicy, autoSubmitOnExpire, allowResumeAttempt,
        shuffleQuestions, shuffleAnswerChoices,
    ]);

    const hydrateConfigForm = React.useCallback((existing) => {
        if (existing) {
            setQuestionCount(existing.number_of_questions || 10);
            setGenerationLanguage(existing.generation_language || existing.generated_language || AI_SCENARIO_DEFAULT_LANGUAGE);
            setIsEnabled(existing.is_enabled === true);
            setTimeLimitMinutes(existing.time_limit_minutes ?? 60);
            setMaxAttempts(existing.max_attempts ?? 3);
            setPassingScore(existing.passing_score ?? 75);
            setFailRetakePolicy(existing.fail_retake_policy || 'require_lesson_review');
            setAutoSubmitOnExpire(existing.auto_submit_on_expire !== false);
            setAllowResumeAttempt(existing.allow_resume_attempt !== false);
            setShuffleQuestions(existing.shuffle_questions !== false);
            setShuffleAnswerChoices(existing.shuffle_answer_choices !== false);
        } else {
            setQuestionCount(10);
            setGenerationLanguage(AI_SCENARIO_DEFAULT_LANGUAGE);
            setIsEnabled(false);
            setTimeLimitMinutes(60);
            setMaxAttempts(3);
            setPassingScore(75);
            setFailRetakePolicy('require_lesson_review');
            setAutoSubmitOnExpire(true);
            setAllowResumeAttempt(true);
            setShuffleQuestions(true);
            setShuffleAnswerChoices(true);
        }
    }, []);

    React.useEffect(() => {
        const existing = configByModuleId[Number(selectedModuleId)];
        hydrateConfigForm(existing);
        if (existing) {
            const payload = {
                training_module_id: Number(selectedModuleId),
                number_of_questions: existing.number_of_questions || 10,
                generation_language: existing.generation_language || existing.generated_language || AI_SCENARIO_DEFAULT_LANGUAGE,
                is_enabled: existing.is_enabled === true,
                time_limit_minutes: existing.time_limit_minutes ?? 60,
                max_attempts: existing.max_attempts ?? 3,
                passing_score: existing.passing_score ?? 75,
                fail_retake_policy: existing.fail_retake_policy || 'require_lesson_review',
                auto_submit_on_expire: existing.auto_submit_on_expire !== false,
                allow_resume_attempt: existing.allow_resume_attempt !== false,
                shuffle_questions: existing.shuffle_questions !== false,
                shuffle_answer_choices: existing.shuffle_answer_choices !== false,
            };
            setSavedPayloadKey(serializeConfigPayload(payload));
            setConfigSynced(true);
        } else {
            setSavedPayloadKey('');
            setConfigSynced(false);
        }
    }, [selectedModuleId, configByModuleId, hydrateConfigForm]);

    React.useEffect(() => {
        const currentKey = serializeConfigPayload(buildPayload());
        setConfigSynced(Boolean(savedPayloadKey) && currentKey === savedPayloadKey);
    }, [buildPayload, savedPayloadKey]);

    const scenarioRows = React.useMemo(() => {
        const rows = [];
        localConfigs.forEach((config) => {
            (config.versions || []).forEach((version) => {
                if (version.status === 'archived') return;
                rows.push({
                    ...version,
                    configId: config.id,
                    trainingModuleId: config.training_module_id,
                    trainingModuleTitle: config.training_module?.title || '—',
                    config,
                });
            });
        });
        return rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [localConfigs]);

    const refreshConfig = (config) => {
        setLocalConfigs((prev) => {
            const others = prev.filter((c) => c.training_module_id !== config.training_module_id);
            return [...others, config];
        });
    };

    const refreshAllConfigs = (updatedConfig) => {
        refreshConfig(updatedConfig);
    };

    const findVersionContext = (versionRow) => {
        const config = localConfigs.find((c) =>
            c.id === versionRow.configId
            || c.versions?.some((v) => v.id === versionRow.id),
        ) || versionRow.config;
        const version = config?.versions?.find((v) => v.id === versionRow.id) || versionRow;
        return { config, version };
    };

    const apiFetch = async (url, options = {}) => {
        const res = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrf,
                Accept: 'application/json',
                ...(options.headers || {}),
            },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const errors = data.errors ? Object.values(data.errors).flat().join('\n') : '';
            throw new Error(errors || data.message || 'Request failed');
        }
        return data;
    };

    const handleSaveConfig = async (e) => {
        e?.preventDefault?.();
        if (!selectedModuleId) return;
        setSaving(true);
        try {
            const payload = buildPayload();
            const data = await apiFetch('/admin/ai-scenario-config', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            refreshConfig(data.config);
            setSavedPayloadKey(serializeConfigPayload(payload));
            setConfigSynced(true);
            Swal.fire({ icon: 'success', title: 'Saved', text: data.message, timer: 2000, showConfirmButton: false });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleGenerate = async () => {
        if (!selectedConfig?.id || !configSynced) return;

        const result = await Swal.fire({
            title: 'Generate AI Scenario & Questions?',
            html: 'Gemini will determine difficulty from the training module and generate the assessment as a draft.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Generate',
            confirmButtonColor: '#059669',
        });
        if (!result.isConfirmed) return;

        setGenerating(true);
        try {
            const genData = await apiFetch(`/admin/ai-scenario-config/${selectedConfig.id}/generate`, { method: 'POST' });
            refreshConfig(genData.config);
            setConfigExpanded(false);
            Swal.fire({
                icon: 'success',
                title: 'Generated',
                text: 'Review the new assessment in the table below.',
            });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Generation failed', text: err.message });
        } finally {
            setGenerating(false);
        }
    };

    const runWorkflow = async (configId, versionId, suffix, { method = 'POST', body, successTitle, successText } = {}) => {
        if (!configId || !versionId) return null;
        setWorkflowBusy(true);
        try {
            const data = await apiFetch(workflowUrl(configId, versionId, suffix), {
                method,
                body: body ? JSON.stringify(body) : undefined,
            });
            if (data.config) {
                refreshAllConfigs(data.config);
            }
            if (successTitle) {
                Swal.fire({ icon: 'success', title: successTitle, text: successText || data.message, timer: 2500, showConfirmButton: false });
            }
            return data;
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Action failed', text: err.message });
            return null;
        } finally {
            setWorkflowBusy(false);
        }
    };

    const openViewPanel = (row) => {
        const { version } = findVersionContext(row);
        setActiveVersion(version);
        setDisplayLanguage(version.generated_language || AI_SCENARIO_DEFAULT_LANGUAGE);
        setPanelMode('view');
    };

    const openEditPanel = (row) => {
        const { version } = findVersionContext(row);
        setActiveVersion(version);
        setDisplayLanguage(version.generated_language || AI_SCENARIO_DEFAULT_LANGUAGE);
        setScenarioDraft({
            title_en: version.title_en || '',
            title_fil: version.title_fil || '',
            description_en: version.description_en || '',
            description_fil: version.description_fil || '',
            learning_objectives_en: version.learning_objectives_en || '',
            learning_objectives_fil: version.learning_objectives_fil || '',
            disaster_type: version.disaster_type || '',
        });
        setPanelMode('edit');
    };

    const closePanel = () => {
        setPanelMode(null);
        setActiveVersion(null);
        setScenarioDraft(null);
        setEditingQuestion(null);
    };

    const handlePublish = async (row) => {
        const { config, version } = findVersionContext(row);
        if (!config?.id || !version?.id) return;

        const confirm = await Swal.fire({
            title: 'Publish assessment?',
            text: 'Participants will be able to access this assessment when the module is enabled.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#059669',
        });
        if (!confirm.isConfirmed) return;

        const data = await runWorkflow(config.id, version.id, '/publish', { successTitle: 'Published' });
        if (data?.config) {
            closePanel();
        }
    };

    const handleDelete = async (row) => {
        const { config, version } = findVersionContext(row);
        if (!config?.id || !version?.id) return;

        const confirm = await Swal.fire({
            title: `Delete version ${version.version_number}?`,
            text: 'This draft assessment will be permanently removed.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
        });
        if (!confirm.isConfirmed) return;

        const data = await runWorkflow(config.id, version.id, '', { method: 'DELETE', successTitle: 'Deleted' });
        if (data && panelMode && activeVersion?.id === version.id) {
            closePanel();
        }
    };

    const handleSaveScenario = async () => {
        if (!scenarioDraft || !activeVersion) return;
        const { config } = findVersionContext(activeVersion);
        const data = await runWorkflow(config.id, activeVersion.id, '/scenario', {
            method: 'PATCH',
            body: scenarioDraft,
            successTitle: 'Scenario saved',
        });
        if (data?.config) {
            const updated = data.config.versions?.find((v) => v.id === activeVersion.id);
            if (updated) {
                setActiveVersion(updated);
                setScenarioDraft({
                    title_en: updated.title_en || '',
                    title_fil: updated.title_fil || '',
                    description_en: updated.description_en || '',
                    description_fil: updated.description_fil || '',
                    learning_objectives_en: updated.learning_objectives_en || '',
                    learning_objectives_fil: updated.learning_objectives_fil || '',
                    disaster_type: updated.disaster_type || '',
                });
            }
        }
    };

    const handleDeleteQuestion = async (questionNumber) => {
        if (!activeVersion) return;
        const { config } = findVersionContext(activeVersion);
        const confirm = await Swal.fire({
            title: 'Delete question?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
        });
        if (!confirm.isConfirmed) return;

        const data = await runWorkflow(config.id, activeVersion.id, `/questions/${questionNumber}`, {
            method: 'DELETE',
            successTitle: 'Deleted',
        });
        if (data?.config) {
            const updated = data.config.versions?.find((v) => v.id === activeVersion.id);
            if (updated) setActiveVersion(updated);
        }
    };

    const handleRegenerateQuestion = async (questionNumber) => {
        if (!activeVersion) return;
        const { config } = findVersionContext(activeVersion);
        const confirm = await Swal.fire({
            title: 'Regenerate this question?',
            icon: 'question',
            showCancelButton: true,
        });
        if (!confirm.isConfirmed) return;

        const data = await runWorkflow(config.id, activeVersion.id, `/questions/${questionNumber}/regenerate`, {
            successTitle: 'Regenerated',
        });
        if (data?.config) {
            const updated = data.config.versions?.find((v) => v.id === activeVersion.id);
            if (updated) setActiveVersion(updated);
        }
    };

    const openManualQuestion = () => {
        setEditingQuestion({
            isNew: true,
            question_en: '',
            question_fil: '',
            choice_a_en: '',
            choice_b_en: '',
            choice_c_en: '',
            choice_d_en: '',
            choice_a_fil: '',
            choice_b_fil: '',
            choice_c_fil: '',
            choice_d_fil: '',
            correct_answer: 'A',
            explanation_en: '',
            explanation_fil: '',
            competency: 'knowledge',
        });
    };

    const openEditQuestion = (question) => {
        setEditingQuestion({
            isNew: false,
            number: question.number,
            question_en: question.question_en || '',
            question_fil: question.question_fil || '',
            choice_a_en: question.choice_a_en || question.choices?.A || '',
            choice_b_en: question.choice_b_en || question.choices?.B || '',
            choice_c_en: question.choice_c_en || question.choices?.C || '',
            choice_d_en: question.choice_d_en || question.choices?.D || '',
            choice_a_fil: question.choice_a_fil || '',
            choice_b_fil: question.choice_b_fil || '',
            choice_c_fil: question.choice_c_fil || '',
            choice_d_fil: question.choice_d_fil || '',
            correct_answer: question.correct_answer || 'A',
            explanation_en: question.explanation_en || '',
            explanation_fil: question.explanation_fil || '',
            competency: question.competency || 'knowledge',
        });
    };

    const saveQuestion = async () => {
        if (!editingQuestion || !activeVersion) return;
        const { config } = findVersionContext(activeVersion);
        const payload = { ...editingQuestion };
        delete payload.isNew;
        delete payload.number;

        setWorkflowBusy(true);
        try {
            const suffix = editingQuestion.isNew
                ? '/questions'
                : `/questions/${editingQuestion.number}`;
            const method = editingQuestion.isNew ? 'POST' : 'PATCH';
            const data = await apiFetch(workflowUrl(config.id, activeVersion.id, suffix), {
                method,
                body: JSON.stringify(payload),
            });
            refreshAllConfigs(data.config);
            const updated = data.config.versions?.find((v) => v.id === activeVersion.id);
            if (updated) setActiveVersion(updated);
            setEditingQuestion(null);
            Swal.fire({ icon: 'success', title: 'Saved', timer: 1500, showConfirmButton: false });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.message });
        } finally {
            setWorkflowBusy(false);
        }
    };

    const activeVersionEditable = activeVersion
        && activeVersion.status !== 'published'
        && activeVersion.status !== 'archived';

    const scenarioColumns = [
        {
            key: 'version_number',
            label: 'Version',
            render: (row) => <span className="font-medium text-slate-800">v{row.version_number}</span>,
        },
        {
            key: 'trainingModuleTitle',
            label: 'Training Module',
            className: 'max-w-xs whitespace-normal',
            render: (row) => <span className="text-slate-700">{row.trainingModuleTitle}</span>,
        },
        {
            key: 'difficulty',
            label: 'Difficulty',
            render: (row) => <span className="capitalize text-slate-600">{formatDifficulty(row.difficulty)}</span>,
        },
        {
            key: 'question_count',
            label: 'Questions',
            render: (row) => <span className="text-slate-700">{row.question_count ?? (row.generated_questions?.length || 0)}</span>,
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => <AssessmentStatusBadge status={row.status} />,
        },
        {
            key: 'created_at',
            label: 'Generated Date',
            render: (row) => <span className="text-slate-600 text-sm">{formatDate(row.created_at)}</span>,
        },
    ];

    const renderScenarioContent = (version, { readOnly = false } = {}) => {
        const snapshot = version;
        const title = resolveScenarioTitle(snapshot, displayLanguage);
        const description = resolveScenarioDescription(snapshot, displayLanguage);
        const objectives = resolveLearningObjectives(snapshot, displayLanguage);
        const questions = (version.generated_questions || []).filter((q) => (q.status || '') !== 'archived');

        return (
            <div className="space-y-6">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Version {version.version_number}
                                {version.difficulty && (
                                    <> · Difficulty: <span className="capitalize">{version.difficulty}</span></>
                                )}
                            </p>
                        </div>
                        <AiScenarioLanguageSwitcher value={displayLanguage} onChange={setDisplayLanguage} />
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-line">{description}</p>
                    {objectives && (
                        <ul className="list-disc list-inside text-sm text-slate-600">
                            {objectives.split('\n').filter(Boolean).map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    )}
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-3">Questions ({questions.length})</h4>
                    <div className="space-y-4">
                        {questions.map((question) => {
                            const q = resolveQuestionForLocale(question, displayLanguage, { includeAnswers: true });
                            return (
                                <div key={q.number} className="rounded-lg border border-slate-200 p-4 bg-white">
                                    <p className="font-medium text-slate-900 mb-2">Q{q.number}. {q.question}</p>
                                    <ul className="text-sm space-y-1 mb-2">
                                        {['A', 'B', 'C', 'D'].map((letter) => (
                                            <li
                                                key={letter}
                                                className={letter === q.correct_answer ? 'text-emerald-700 font-semibold' : 'text-slate-600'}
                                            >
                                                {letter}. {q.choices[letter]}
                                            </li>
                                        ))}
                                    </ul>
                                    {q.explanation && (
                                        <p className="text-sm text-slate-600 pt-2 border-t border-slate-100">
                                            <span className="font-medium">Explanation:</span> {q.explanation}
                                        </p>
                                    )}
                                    {!readOnly && activeVersionEditable && (
                                        <div className="flex gap-1 mt-3 pt-3 border-t border-slate-100">
                                            <AdminTableActionButton icon={Pencil} title="Edit" variant="edit" onClick={() => openEditQuestion(question)} />
                                            <AdminTableActionButton icon={RefreshCw} title="Regenerate" variant="warning" onClick={() => handleRegenerateQuestion(q.number)} disabled={workflowBusy} />
                                            <AdminTableActionButton icon={Trash2} title="Delete" variant="danger" onClick={() => handleDeleteQuestion(q.number)} disabled={workflowBusy} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AdminPageShell>
            <AdminPageHeader
                icon={Sparkles}
                title="AI Scenario Training"
                description="Configure, generate, review, edit, and publish AI assessments for participant training."
                actions={(
                    <select className={adminSelectClass} value={selectedModuleId} onChange={(e) => setSelectedModuleId(e.target.value)}>
                        <option value="">Select module…</option>
                        {(modules || []).map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                    </select>
                )}
            />

            <AdminContentCard className="overflow-hidden">
                <button
                    type="button"
                    onClick={() => setConfigExpanded((prev) => !prev)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                >
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <Settings className="w-4 h-4 text-emerald-600" />
                        Configuration
                        {selectedModule && (
                            <span className="font-normal text-slate-500">— {selectedModule.title}</span>
                        )}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${configExpanded ? 'rotate-180' : ''}`} />
                </button>

                {configExpanded && (
                    <div className="px-4 pb-4 border-t border-slate-100">
                        <form onSubmit={handleSaveConfig} className="pt-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Questions</label>
                                    <select className={adminCompactInputClass} value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))}>
                                        {QUESTION_COUNTS.map((n) => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Generation Language</label>
                                    <select className={adminCompactInputClass} value={generationLanguage} onChange={(e) => setGenerationLanguage(e.target.value)}>
                                        {GENERATION_LANGUAGES.map((lang) => <option key={lang.value} value={lang.value}>{lang.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Time Limit (minutes)</label>
                                    <input type="number" min={5} max={480} className={adminCompactInputClass} value={timeLimitMinutes} onChange={(e) => setTimeLimitMinutes(Number(e.target.value))} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Passing Score (%)</label>
                                    <input type="number" min={1} max={100} className={adminCompactInputClass} value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Max Attempts</label>
                                    <input type="number" min={1} max={20} className={adminCompactInputClass} value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value))} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Fail Retake Policy</label>
                                    <select className={adminCompactInputClass} value={failRetakePolicy} onChange={(e) => setFailRetakePolicy(e.target.value)}>
                                        <option value="require_lesson_review">Require lesson review</option>
                                        <option value="quiz_retake_only">Quiz retake only</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4">
                                <label className="flex items-center gap-2 text-sm text-slate-700">
                                    <input type="checkbox" checked={shuffleQuestions} onChange={(e) => setShuffleQuestions(e.target.checked)} className="rounded border-slate-300 text-emerald-600" />
                                    Shuffle questions
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-700">
                                    <input type="checkbox" checked={shuffleAnswerChoices} onChange={(e) => setShuffleAnswerChoices(e.target.checked)} className="rounded border-slate-300 text-emerald-600" />
                                    Shuffle answer choices
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-700">
                                    <input type="checkbox" checked={autoSubmitOnExpire} onChange={(e) => setAutoSubmitOnExpire(e.target.checked)} className="rounded border-slate-300 text-emerald-600" />
                                    Auto-submit on expire
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-700">
                                    <input type="checkbox" checked={allowResumeAttempt} onChange={(e) => setAllowResumeAttempt(e.target.checked)} className="rounded border-slate-300 text-emerald-600" />
                                    Allow resume attempt
                                </label>
                                <label className="flex items-start gap-2 text-sm text-slate-700">
                                    <input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} className="mt-0.5 rounded border-slate-300 text-emerald-600" />
                                    <span>
                                        Enable for participants
                                        <span className="block text-xs text-slate-500">Requires a published assessment.</span>
                                    </span>
                                </label>
                            </div>

                            {selectedModule?.difficulty && (
                                <p className="text-xs text-slate-500">
                                    AI difficulty is determined automatically from the training module ({selectedModule.difficulty}).
                                </p>
                            )}

                            <div className="flex flex-wrap items-center gap-2 pt-2">
                                <AdminPrimaryButton type="submit" disabled={saving || !selectedModuleId}>
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Configuration
                                </AdminPrimaryButton>
                                <AdminPrimaryButton
                                    type="button"
                                    onClick={handleGenerate}
                                    disabled={generating || !configSynced || !selectedConfig?.id}
                                    className="bg-violet-600 hover:bg-violet-700"
                                >
                                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    Generate AI Content
                                </AdminPrimaryButton>
                                {!configSynced && selectedModuleId && (
                                    <span className="text-xs text-amber-600 inline-flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        Save configuration before generating
                                    </span>
                                )}
                            </div>
                        </form>
                    </div>
                )}
            </AdminContentCard>

            <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-800">Generated AI Scenarios</h2>
                {selectedConfig?.published_version && (
                    <span className="text-xs text-emerald-700 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {selectedConfig.training_module?.title}: published v{selectedConfig.published_version.version_number}
                    </span>
                )}
            </div>

            <AdminDataTable
                columns={scenarioColumns}
                data={scenarioRows}
                rowKey="id"
                minWidth="1000px"
                emptyTitle="No generated scenarios"
                emptyDescription="Save configuration and generate AI content to see assessments here."
                renderActions={(row) => (
                    <div className="flex justify-end gap-1">
                        <AdminTableActionButton icon={Eye} title="View" variant="view" onClick={() => openViewPanel(row)} />
                        {row.status !== 'published' && (
                            <>
                                <AdminTableActionButton icon={Pencil} title="Edit" variant="edit" onClick={() => openEditPanel(row)} />
                                <AdminTableActionButton icon={Trash2} title="Delete" variant="danger" onClick={() => handleDelete(row)} disabled={workflowBusy} />
                                <AdminTableActionButton icon={Send} title="Publish" variant="edit" onClick={() => handlePublish(row)} disabled={workflowBusy} />
                            </>
                        )}
                    </div>
                )}
            />

            {panelMode && activeVersion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col">
                        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 shrink-0">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">
                                    {panelMode === 'view' ? 'View Assessment' : 'Edit Assessment'}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Version {activeVersion.version_number} · <AssessmentStatusBadge status={activeVersion.status} />
                                </p>
                            </div>
                            <button type="button" onClick={closePanel} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 px-5 py-4">
                            {panelMode === 'view' && renderScenarioContent(activeVersion, { readOnly: true })}

                            {panelMode === 'edit' && scenarioDraft && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Title (English)</label>
                                                <input className={adminCompactInputClass} value={scenarioDraft.title_en} onChange={(e) => setScenarioDraft({ ...scenarioDraft, title_en: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Title (Filipino)</label>
                                                <input className={adminCompactInputClass} value={scenarioDraft.title_fil} onChange={(e) => setScenarioDraft({ ...scenarioDraft, title_fil: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Disaster Type</label>
                                                <input className={adminCompactInputClass} value={scenarioDraft.disaster_type} onChange={(e) => setScenarioDraft({ ...scenarioDraft, disaster_type: e.target.value })} />
                                            </div>
                                            {activeVersion.difficulty && (
                                                <p className="text-xs text-slate-500">
                                                    AI-determined difficulty: <span className="capitalize font-medium">{activeVersion.difficulty}</span>
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Description (English)</label>
                                                <textarea rows={4} className={adminCompactInputClass} value={scenarioDraft.description_en} onChange={(e) => setScenarioDraft({ ...scenarioDraft, description_en: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Description (Filipino)</label>
                                                <textarea rows={4} className={adminCompactInputClass} value={scenarioDraft.description_fil} onChange={(e) => setScenarioDraft({ ...scenarioDraft, description_fil: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Learning Objectives (English)</label>
                                                <textarea rows={3} className={adminCompactInputClass} value={scenarioDraft.learning_objectives_en} onChange={(e) => setScenarioDraft({ ...scenarioDraft, learning_objectives_en: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Learning Objectives (Filipino)</label>
                                                <textarea rows={3} className={adminCompactInputClass} value={scenarioDraft.learning_objectives_fil} onChange={(e) => setScenarioDraft({ ...scenarioDraft, learning_objectives_fil: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <AdminPrimaryButton onClick={handleSaveScenario} disabled={workflowBusy}>
                                            <Save className="w-4 h-4" /> Save Scenario
                                        </AdminPrimaryButton>
                                        <AdminPrimaryButton onClick={openManualQuestion} disabled={workflowBusy}>
                                            <Plus className="w-4 h-4" /> Add Question
                                        </AdminPrimaryButton>
                                    </div>

                                    {renderScenarioContent(activeVersion)}
                                </div>
                            )}
                        </div>

                        {panelMode === 'edit' && activeVersionEditable && (
                            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2 shrink-0">
                                <AdminSecondaryButton onClick={closePanel}>Close</AdminSecondaryButton>
                                <AdminPrimaryButton onClick={() => handlePublish(activeVersion)} disabled={workflowBusy}>
                                    <Send className="w-4 h-4" /> Publish
                                </AdminPrimaryButton>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {editingQuestion && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900">
                            {editingQuestion.isNew ? 'Add Question' : `Edit Question #${editingQuestion.number}`}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {['question', 'explanation'].map((field) => (
                                <React.Fragment key={field}>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1 capitalize">{field} (EN)</label>
                                        <textarea rows={field === 'question' ? 3 : 2} className={adminCompactInputClass} value={editingQuestion[`${field}_en`]} onChange={(e) => setEditingQuestion({ ...editingQuestion, [`${field}_en`]: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1 capitalize">{field} (FIL)</label>
                                        <textarea rows={field === 'question' ? 3 : 2} className={adminCompactInputClass} value={editingQuestion[`${field}_fil`]} onChange={(e) => setEditingQuestion({ ...editingQuestion, [`${field}_fil`]: e.target.value })} />
                                    </div>
                                </React.Fragment>
                            ))}
                            {['a', 'b', 'c', 'd'].map((letter) => (
                                <React.Fragment key={letter}>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Choice {letter.toUpperCase()} (EN)</label>
                                        <input className={adminCompactInputClass} value={editingQuestion[`choice_${letter}_en`]} onChange={(e) => setEditingQuestion({ ...editingQuestion, [`choice_${letter}_en`]: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Choice {letter.toUpperCase()} (FIL)</label>
                                        <input className={adminCompactInputClass} value={editingQuestion[`choice_${letter}_fil`]} onChange={(e) => setEditingQuestion({ ...editingQuestion, [`choice_${letter}_fil`]: e.target.value })} />
                                    </div>
                                </React.Fragment>
                            ))}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Correct Answer</label>
                                <select className={adminCompactInputClass} value={editingQuestion.correct_answer} onChange={(e) => setEditingQuestion({ ...editingQuestion, correct_answer: e.target.value })}>
                                    {['A', 'B', 'C', 'D'].map((l) => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <AdminSecondaryButton onClick={() => setEditingQuestion(null)}>Cancel</AdminSecondaryButton>
                            <AdminPrimaryButton onClick={saveQuestion} disabled={workflowBusy}>Save Question</AdminPrimaryButton>
                        </div>
                    </div>
                </div>
            )}
        </AdminPageShell>
    );
}
