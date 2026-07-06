import React from 'react';
import Swal from 'sweetalert2';
import {
    Sparkles,
    BookOpen,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Settings,
    ClipboardCheck,
    History,
    Eye,
    Pencil,
    Trash2,
    Copy,
    RefreshCw,
    Plus,
    Save,
    Send,
    RotateCcw,
} from 'lucide-react';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminPrimaryButton,
    AdminSecondaryButton,
    AdminContentCard,
    adminSelectClass,
    adminCompactInputClass,
    AdminCollapsibleFilterBar,
    AdminFilterSelect,
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

const TABS = [
    { id: 'configuration', label: 'Configuration', icon: Settings },
    { id: 'generation', label: 'Generation', icon: Sparkles },
    { id: 'review', label: 'Review & Approval', icon: ClipboardCheck },
    { id: 'published', label: 'Published', icon: CheckCircle2 },
    { id: 'history', label: 'History', icon: History },
];

const DIFFICULTIES = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
];

const QUESTION_COUNTS = [10, 15, 20];

const GENERATION_LANGUAGES = [
    { value: 'en', label: 'English' },
    { value: 'fil', label: 'Filipino' },
];

const VERSION_STATUS_LABELS = {
    ai_generated: 'AI Generated',
    under_review: 'Under Review',
    approved: 'Approved',
    published: 'Published',
    archived: 'Archived',
};

function WorkflowStatusBadge({ status }) {
    const styles = {
        ai_generated: 'bg-violet-50 text-violet-700 border-violet-200',
        under_review: 'bg-amber-50 text-amber-700 border-amber-200',
        approved: 'bg-sky-50 text-sky-700 border-sky-200',
        published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        archived: 'bg-slate-50 text-slate-600 border-slate-200',
    };

    return (
        <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-medium ${styles[status] || styles.archived}`}>
            {VERSION_STATUS_LABELS[status] || status}
        </span>
    );
}

function QuestionStatusBadge({ status }) {
    return <WorkflowStatusBadge status={status || 'ai_generated'} />;
}

function formatDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString();
}

function workflowUrl(configId, versionId, suffix = '') {
    return `/admin/ai-scenario-config/${configId}/versions/${versionId}${suffix}`;
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

    const [activeTab, setActiveTab] = React.useState('configuration');
    const [selectedModuleId, setSelectedModuleId] = React.useState(
        modules[0]?.id ? String(modules[0].id) : '',
    );
    const [localConfigs, setLocalConfigs] = React.useState(configs || []);
    const [displayLanguage, setDisplayLanguage] = React.useState(AI_SCENARIO_DEFAULT_LANGUAGE);
    const [questionSearch, setQuestionSearch] = React.useState('');
    const [questionStatusFilter, setQuestionStatusFilter] = React.useState('');
    const [saving, setSaving] = React.useState(false);
    const [generating, setGenerating] = React.useState(false);
    const [workflowBusy, setWorkflowBusy] = React.useState(false);
    const [viewingVersionId, setViewingVersionId] = React.useState(null);
    const [editingQuestion, setEditingQuestion] = React.useState(null);
    const [previewQuestion, setPreviewQuestion] = React.useState(null);
    const [scenarioDraft, setScenarioDraft] = React.useState(null);

    const [difficulty, setDifficulty] = React.useState('medium');
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
    const currentVersion = selectedConfig?.current_version || null;
    const publishedVersion = selectedConfig?.published_version || null;
    const allVersions = selectedConfig?.versions || [];
    const displayVersion = viewingVersionId
        ? allVersions.find((v) => v.id === viewingVersionId) || currentVersion
        : currentVersion;

    React.useEffect(() => {
        const existing = configByModuleId[Number(selectedModuleId)];
        if (existing) {
            setDifficulty(existing.difficulty || 'medium');
            setQuestionCount(existing.number_of_questions || 10);
            setGenerationLanguage(existing.generation_language || existing.generated_language || AI_SCENARIO_DEFAULT_LANGUAGE);
            setDisplayLanguage(existing.current_version?.generated_language || existing.generated_language || AI_SCENARIO_DEFAULT_LANGUAGE);
            setIsEnabled(existing.is_enabled === true);
            setTimeLimitMinutes(existing.time_limit_minutes ?? 60);
            setMaxAttempts(existing.max_attempts ?? 3);
            setPassingScore(existing.passing_score ?? 75);
            setFailRetakePolicy(existing.fail_retake_policy || 'require_lesson_review');
            setAutoSubmitOnExpire(existing.auto_submit_on_expire !== false);
            setAllowResumeAttempt(existing.allow_resume_attempt !== false);
            setShuffleQuestions(existing.shuffle_questions !== false);
            setShuffleAnswerChoices(existing.shuffle_answer_choices !== false);
        }
    }, [selectedModuleId, configByModuleId]);

    React.useEffect(() => {
        if (displayVersion) {
            setScenarioDraft({
                title_en: displayVersion.title_en || '',
                title_fil: displayVersion.title_fil || '',
                description_en: displayVersion.description_en || '',
                description_fil: displayVersion.description_fil || '',
                learning_objectives_en: displayVersion.learning_objectives_en || '',
                learning_objectives_fil: displayVersion.learning_objectives_fil || '',
                disaster_type: displayVersion.disaster_type || selectedConfig?.training_module?.category || '',
                difficulty: displayVersion.difficulty || difficulty,
                estimated_time_minutes: displayVersion.estimated_time_minutes || timeLimitMinutes,
            });
        } else {
            setScenarioDraft(null);
        }
    }, [displayVersion?.id]);

    const refreshConfig = (config) => {
        setLocalConfigs((prev) => {
            const others = prev.filter((c) => c.training_module_id !== config.training_module_id);
            return [...others, config];
        });
        if (config.current_version?.generated_language) {
            setDisplayLanguage(config.current_version.generated_language);
        }
    };

    const buildPayload = () => ({
        training_module_id: Number(selectedModuleId),
        difficulty,
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
    });

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
            const data = await apiFetch('/admin/ai-scenario-config', {
                method: 'POST',
                body: JSON.stringify(buildPayload()),
            });
            refreshConfig(data.config);
            Swal.fire({ icon: 'success', title: 'Saved', text: data.message, timer: 2000, showConfirmButton: false });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleGenerate = async () => {
        if (!selectedModuleId) return;

        const result = await Swal.fire({
            title: 'Generate AI Scenario & Questions?',
            html: 'Gemini will generate the scenario and quiz. Content stays in draft until you review, approve, and publish.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Generate',
            confirmButtonColor: '#059669',
        });
        if (!result.isConfirmed) return;

        setGenerating(true);
        try {
            const saveData = await apiFetch('/admin/ai-scenario-config', {
                method: 'POST',
                body: JSON.stringify(buildPayload()),
            });
            const configId = saveData.config?.id;
            if (!configId) throw new Error('Configuration ID missing');

            const genData = await apiFetch(`/admin/ai-scenario-config/${configId}/generate`, { method: 'POST' });
            refreshConfig(genData.config);
            setActiveTab('review');
            Swal.fire({
                icon: 'success',
                title: 'Generated',
                text: 'Review and edit the content before approving and publishing.',
            });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Generation failed', text: err.message });
        } finally {
            setGenerating(false);
        }
    };

    const runWorkflow = async (suffix, { method = 'POST', body, successTitle, successText, versionId } = {}) => {
        const targetVersionId = versionId || currentVersion?.id;
        if (!selectedConfig?.id || !targetVersionId) {
            Swal.fire({ icon: 'warning', title: 'No draft', text: 'Generate content first.' });
            return;
        }
        setWorkflowBusy(true);
        try {
            const data = await apiFetch(workflowUrl(selectedConfig.id, targetVersionId, suffix), {
                method,
                body: body ? JSON.stringify(body) : undefined,
            });
            refreshConfig(data.config);
            setViewingVersionId(null);
            Swal.fire({ icon: 'success', title: successTitle || 'Done', text: successText || data.message, timer: 2500, showConfirmButton: false });
            return data;
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Action failed', text: err.message });
            return null;
        } finally {
            setWorkflowBusy(false);
        }
    };

    const handleSaveScenario = async () => {
        if (!scenarioDraft) return;
        await runWorkflow('/scenario', {
            method: 'PATCH',
            body: scenarioDraft,
            successTitle: 'Scenario saved',
        });
    };

    const handleSaveDraft = () => runWorkflow('/save-draft', { successTitle: 'Draft saved' });
    const handleApprove = async () => {
        const confirm = await Swal.fire({
            title: 'Approve assessment?',
            text: 'All questions will be marked approved. You can publish afterward.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#059669',
        });
        if (confirm.isConfirmed) await runWorkflow('/approve', { successTitle: 'Approved' });
    };
    const handlePublish = async () => {
        const confirm = await Swal.fire({
            title: 'Publish assessment?',
            text: 'Participants will see this version once the module is enabled.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#059669',
        });
        if (confirm.isConfirmed) await runWorkflow('/publish', { successTitle: 'Published' });
    };

    const handleDeleteQuestion = async (questionNumber) => {
        const confirm = await Swal.fire({
            title: 'Delete question?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
        });
        if (!confirm.isConfirmed) return;
        await runWorkflow(`/questions/${questionNumber}`, { method: 'DELETE', successTitle: 'Deleted' });
    };

    const handleRegenerateQuestion = async (questionNumber) => {
        const confirm = await Swal.fire({
            title: 'Regenerate this question?',
            text: 'Only the selected question will be replaced by AI.',
            icon: 'question',
            showCancelButton: true,
        });
        if (!confirm.isConfirmed) return;
        await runWorkflow(`/questions/${questionNumber}/regenerate`, { successTitle: 'Regenerated' });
    };

    const handleDuplicateQuestion = (questionNumber) =>
        runWorkflow(`/questions/${questionNumber}/duplicate`, { successTitle: 'Duplicated' });

    const handleRestoreVersion = async (version) => {
        const confirm = await Swal.fire({
            title: `Restore version ${version.version_number}?`,
            text: 'Creates a new editable draft from this version.',
            icon: 'question',
            showCancelButton: true,
        });
        if (!confirm.isConfirmed || !selectedConfig?.id) return;
        setWorkflowBusy(true);
        try {
            const data = await apiFetch(workflowUrl(selectedConfig.id, version.id, '/restore'), { method: 'POST' });
            refreshConfig(data.config);
            setActiveTab('review');
            Swal.fire({ icon: 'success', title: 'Restored', text: data.message });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.message });
        } finally {
            setWorkflowBusy(false);
        }
    };

    const handleDuplicateVersion = async (version) => {
        if (!selectedConfig?.id) return;
        setWorkflowBusy(true);
        try {
            const data = await apiFetch(workflowUrl(selectedConfig.id, version.id, '/duplicate'), { method: 'POST' });
            refreshConfig(data.config);
            setActiveTab('review');
            Swal.fire({ icon: 'success', title: 'Duplicated', text: data.message });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.message });
        } finally {
            setWorkflowBusy(false);
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
            difficulty: currentVersion?.difficulty || difficulty,
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
            difficulty: question.difficulty || currentVersion?.difficulty || difficulty,
        });
    };

    const saveQuestion = async () => {
        if (!editingQuestion || !selectedConfig?.id || !currentVersion?.id) return;
        const payload = { ...editingQuestion };
        delete payload.isNew;
        delete payload.number;

        setWorkflowBusy(true);
        try {
            const suffix = editingQuestion.isNew
                ? '/questions'
                : `/questions/${editingQuestion.number}`;
            const method = editingQuestion.isNew ? 'POST' : 'PATCH';
            const data = await apiFetch(workflowUrl(selectedConfig.id, currentVersion.id, suffix), {
                method,
                body: JSON.stringify(payload),
            });
            refreshConfig(data.config);
            setEditingQuestion(null);
            Swal.fire({ icon: 'success', title: 'Saved', timer: 1500, showConfirmButton: false });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.message });
        } finally {
            setWorkflowBusy(false);
        }
    };

    const filteredQuestions = React.useMemo(() => {
        const questions = displayVersion?.generated_questions || [];
        return questions.filter((q) => {
            if (questionStatusFilter && (q.status || 'ai_generated') !== questionStatusFilter) return false;
            if (!questionSearch.trim()) return true;
            const localized = resolveQuestionForLocale(q, displayLanguage);
            const haystack = `${localized.number} ${localized.question}`.toLowerCase();
            return haystack.includes(questionSearch.toLowerCase());
        });
    }, [displayVersion, questionSearch, questionStatusFilter, displayLanguage]);

    const questionColumns = [
        {
            key: 'number',
            label: '#',
            render: (row) => <span className="font-medium text-slate-800">{row.number}</span>,
        },
        {
            key: 'question',
            label: 'Question',
            className: 'max-w-md whitespace-normal',
            render: (row) => {
                const localized = resolveQuestionForLocale(row, displayLanguage);
                return <span className="text-slate-700 line-clamp-2">{localized.question}</span>;
            },
        },
        {
            key: 'choices',
            label: 'Choices',
            className: 'whitespace-normal max-w-xs',
            render: (row) => {
                const localized = resolveQuestionForLocale(row, displayLanguage);
                return (
                    <span className="text-xs text-slate-500 line-clamp-2">
                        {['A', 'B', 'C', 'D'].map((l) => `${l}: ${localized.choices[l]}`).join(' · ')}
                    </span>
                );
            },
        },
        {
            key: 'correct',
            label: 'Answer',
            render: (row) => <span className="font-semibold text-emerald-700">{row.correct_answer}</span>,
        },
        {
            key: 'difficulty',
            label: 'Difficulty',
            render: (row) => <span className="capitalize text-slate-600">{row.difficulty || displayVersion?.difficulty || difficulty}</span>,
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => <QuestionStatusBadge status={row.status} />,
        },
    ];

    const renderConfigurationTab = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AdminContentCard className="p-4">
                <h2 className="text-sm font-semibold text-slate-800 mb-3">AI Scenario Configuration</h2>
                <form onSubmit={handleSaveConfig} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Training Module</label>
                        <select className={adminCompactInputClass} value={selectedModuleId} onChange={(e) => setSelectedModuleId(e.target.value)} required>
                            <option value="">Select module…</option>
                            {(modules || []).map((m) => (
                                <option key={m.id} value={m.id}>{m.title}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Difficulty</label>
                            <select className={adminCompactInputClass} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                                {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Questions</label>
                            <select className={adminCompactInputClass} value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))}>
                                {QUESTION_COUNTS.map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Generation Language</label>
                        <select className={adminCompactInputClass} value={generationLanguage} onChange={(e) => setGenerationLanguage(e.target.value)}>
                            {GENERATION_LANGUAGES.map((lang) => <option key={lang.value} value={lang.value}>{lang.label}</option>)}
                        </select>
                    </div>
                    <label className="flex items-start gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} className="mt-1 rounded border-slate-300 text-emerald-600" />
                        <span>
                            <span className="font-medium">Enable for participants</span>
                            <span className="block text-xs text-slate-500">Requires a published assessment. Participants never see unpublished content.</span>
                        </span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Passing Score (%)</label>
                            <input type="number" min={1} max={100} className={adminCompactInputClass} value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Max Attempts</label>
                            <input type="number" min={1} max={20} className={adminCompactInputClass} value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value))} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Time Limit (minutes)</label>
                        <input type="number" min={5} max={480} className={adminCompactInputClass} value={timeLimitMinutes} onChange={(e) => setTimeLimitMinutes(Number(e.target.value))} />
                    </div>
                    <AdminPrimaryButton type="submit" disabled={saving || !selectedModuleId}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Configuration
                    </AdminPrimaryButton>
                </form>
            </AdminContentCard>
            <AdminContentCard className="p-4">
                <h2 className="text-sm font-semibold text-slate-800 mb-2">Workflow Status</h2>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between gap-2">
                        <span className="text-slate-600">Current draft</span>
                        {currentVersion ? (
                            <span className="flex items-center gap-2">
                                <span className="font-medium">v{currentVersion.version_number}</span>
                                <WorkflowStatusBadge status={currentVersion.status} />
                            </span>
                        ) : (
                            <span className="text-slate-400">None</span>
                        )}
                    </div>
                    <div className="flex justify-between gap-2">
                        <span className="text-slate-600">Published</span>
                        {publishedVersion ? (
                            <span className="flex items-center gap-2">
                                <span className="font-medium">v{publishedVersion.version_number}</span>
                                <WorkflowStatusBadge status="published" />
                            </span>
                        ) : (
                            <span className="text-amber-600 text-xs">Not published</span>
                        )}
                    </div>
                    <div className="flex justify-between gap-2">
                        <span className="text-slate-600">Participant access</span>
                        {isEnabled && publishedVersion ? (
                            <span className="text-emerald-700 text-xs font-medium inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Live</span>
                        ) : (
                            <span className="text-slate-500 text-xs inline-flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Blocked</span>
                        )}
                    </div>
                </div>
            </AdminContentCard>
        </div>
    );

    const renderGenerationTab = () => (
        <AdminContentCard className="p-6 text-center space-y-4">
            <Sparkles className="w-10 h-10 text-emerald-600 mx-auto" />
            <div>
                <h2 className="text-lg font-semibold text-slate-900">Generate AI Scenario & Questions</h2>
                <p className="text-sm text-slate-600 mt-1 max-w-xl mx-auto">
                    Gemini creates the disaster scenario and multiple-choice questions. Content is saved as a draft and never published automatically.
                </p>
            </div>
            {!selectedConfig && (
                <p className="text-sm text-amber-700">Save configuration for a training module first.</p>
            )}
            <AdminPrimaryButton onClick={handleGenerate} disabled={generating || !selectedModuleId}>
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate AI Content
            </AdminPrimaryButton>
            {currentVersion && (
                <div className="text-left max-w-lg mx-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                    <p className="font-medium text-slate-800">Latest generation</p>
                    <p className="text-slate-600 mt-1">Version {currentVersion.version_number} · {formatDate(currentVersion.created_at)}</p>
                    <p className="text-slate-600">{currentVersion.change_note}</p>
                </div>
            )}
        </AdminContentCard>
    );

    const renderReviewTab = () => {
        if (!displayVersion) {
            return (
                <AdminContentCard className="p-8 text-center text-sm text-slate-500">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    No generated content yet. Use the Generation tab first.
                </AdminContentCard>
            );
        }

        const isReadOnly = viewingVersionId && viewingVersionId !== currentVersion?.id;
        const canEdit = !isReadOnly && displayVersion.status !== 'published' && displayVersion.status !== 'archived';

        return (
            <div className="space-y-4">
                {isReadOnly && (
                    <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-800 flex items-center justify-between gap-2">
                        <span>Viewing version {displayVersion.version_number} (read-only)</span>
                        <AdminSecondaryButton onClick={() => setViewingVersionId(null)}>Back to current draft</AdminSecondaryButton>
                    </div>
                )}
                <AdminContentCard className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-800">Scenario Review</h2>
                            <p className="text-xs text-slate-500">Version {displayVersion.version_number} · <WorkflowStatusBadge status={displayVersion.status} /></p>
                        </div>
                        <AiScenarioLanguageSwitcher value={displayLanguage} onChange={setDisplayLanguage} />
                    </div>
                    {scenarioDraft && canEdit && (
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
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Disaster Type</label>
                                        <input className={adminCompactInputClass} value={scenarioDraft.disaster_type} onChange={(e) => setScenarioDraft({ ...scenarioDraft, disaster_type: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Difficulty</label>
                                        <select className={adminCompactInputClass} value={scenarioDraft.difficulty} onChange={(e) => setScenarioDraft({ ...scenarioDraft, difficulty: e.target.value })}>
                                            {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Est. completion (minutes)</label>
                                    <input type="number" min={5} className={adminCompactInputClass} value={scenarioDraft.estimated_time_minutes} onChange={(e) => setScenarioDraft({ ...scenarioDraft, estimated_time_minutes: Number(e.target.value) })} />
                                </div>
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
                            </div>
                        </div>
                    )}
                    {scenarioDraft && !canEdit && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
                            <h3 className="font-semibold text-slate-900">{resolveScenarioTitle(scenarioDraft, displayLanguage)}</h3>
                            <p className="text-slate-700 whitespace-pre-line">{resolveScenarioDescription(scenarioDraft, displayLanguage)}</p>
                            {resolveLearningObjectives(scenarioDraft, displayLanguage) && (
                                <ul className="list-disc list-inside text-slate-600">
                                    {resolveLearningObjectives(scenarioDraft, displayLanguage).split('\n').filter(Boolean).map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                    {canEdit && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200">
                        <AdminSecondaryButton onClick={handleSaveScenario} disabled={workflowBusy}>
                            <Save className="w-4 h-4" /> Save Scenario
                        </AdminSecondaryButton>
                        <AdminSecondaryButton onClick={handleGenerate} disabled={generating || workflowBusy}>
                            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            Regenerate Scenario
                        </AdminSecondaryButton>
                        <AdminSecondaryButton onClick={handleSaveDraft} disabled={workflowBusy}>
                            Save Draft
                        </AdminSecondaryButton>
                        <AdminPrimaryButton onClick={handleApprove} disabled={workflowBusy || displayVersion.status === 'approved'}>
                            <CheckCircle2 className="w-4 h-4" /> Approve
                        </AdminPrimaryButton>
                        <AdminPrimaryButton onClick={handlePublish} disabled={workflowBusy || displayVersion.status !== 'approved'}>
                            <Send className="w-4 h-4" /> Publish
                        </AdminPrimaryButton>
                    </div>
                    )}
                </AdminContentCard>

                <AdminCollapsibleFilterBar
                    searchValue={questionSearch}
                    onSearchChange={(e) => setQuestionSearch(e.target.value)}
                    searchPlaceholder="Search questions…"
                    hasActiveFilters={Boolean(questionStatusFilter)}
                    onClearFilters={() => { setQuestionSearch(''); setQuestionStatusFilter(''); }}
                >
                    <AdminFilterSelect label="Status" value={questionStatusFilter} onChange={(e) => setQuestionStatusFilter(e.target.value)}>
                        <option value="">All statuses</option>
                        {Object.entries(VERSION_STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </AdminFilterSelect>
                </AdminCollapsibleFilterBar>

                <div className="flex justify-between items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-800">Question Bank ({filteredQuestions.length})</h3>
                    {canEdit && (
                        <AdminPrimaryButton onClick={openManualQuestion} disabled={workflowBusy}>
                            <Plus className="w-4 h-4" /> Add Manual Question
                        </AdminPrimaryButton>
                    )}
                </div>

                <AdminDataTable
                    columns={questionColumns}
                    data={filteredQuestions}
                    rowKey="number"
                    minWidth="1100px"
                    renderActions={canEdit ? (row) => (
                        <div className="flex justify-end gap-1">
                            <AdminTableActionButton icon={Eye} title="Preview" variant="view" onClick={() => setPreviewQuestion(row)} />
                            <AdminTableActionButton icon={Pencil} title="Edit" variant="edit" onClick={() => openEditQuestion(row)} />
                            <AdminTableActionButton icon={RefreshCw} title="Regenerate" variant="warning" onClick={() => handleRegenerateQuestion(row.number)} disabled={workflowBusy} />
                            <AdminTableActionButton icon={Copy} title="Duplicate" onClick={() => handleDuplicateQuestion(row.number)} disabled={workflowBusy} />
                            <AdminTableActionButton icon={Trash2} title="Delete" variant="danger" onClick={() => handleDeleteQuestion(row.number)} disabled={workflowBusy} />
                        </div>
                    ) : (row) => (
                        <AdminTableActionButton icon={Eye} title="Preview" variant="view" onClick={() => setPreviewQuestion(row)} />
                    )}
                    emptyTitle="No questions"
                    emptyDescription="Generate or add manual questions."
                />
            </div>
        );
    };

    const versionColumns = [
        { key: 'version_number', label: 'Version', render: (row) => <span className="font-medium">v{row.version_number}</span> },
        { key: 'scenario_title', label: 'Scenario', className: 'max-w-xs whitespace-normal', render: (row) => row.scenario_title || row.title_en || '—' },
        { key: 'module', label: 'Module', render: () => selectedConfig?.training_module?.title || '—' },
        { key: 'creator', label: 'Generated By', render: (row) => row.creator?.name || '—' },
        { key: 'created_at', label: 'Date', render: (row) => formatDate(row.created_at) },
        { key: 'status', label: 'Status', render: (row) => <WorkflowStatusBadge status={row.status} /> },
    ];

    const renderVersionTable = (versions, { showRestore = false } = {}) => (
        <AdminDataTable
            columns={versionColumns}
            data={versions}
            rowKey="id"
            minWidth="900px"
            emptyTitle="No versions"
            renderActions={(row) => (
                <div className="flex justify-end gap-1">
                    <AdminTableActionButton icon={Eye} title="View" variant="view" onClick={() => { setViewingVersionId(row.id); setActiveTab('review'); }} />
                    {showRestore && (
                        <>
                            <AdminTableActionButton icon={RotateCcw} title="Restore" variant="edit" onClick={() => handleRestoreVersion(row)} />
                            <AdminTableActionButton icon={Copy} title="Duplicate" onClick={() => handleDuplicateVersion(row)} />
                        </>
                    )}
                </div>
            )}
        />
    );

    const publishedVersions = allVersions.filter((v) => v.status === 'published');

    return (
        <AdminPageShell>
            <AdminPageHeader
                icon={Sparkles}
                title="AI Scenario Training"
                description="Configure, generate, review, approve, and publish AI assessments before participants can access them."
                actions={(
                    <select className={adminSelectClass} value={selectedModuleId} onChange={(e) => setSelectedModuleId(e.target.value)}>
                        <option value="">Select module…</option>
                        {(modules || []).map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                    </select>
                )}
            />

            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {activeTab === 'configuration' && renderConfigurationTab()}
            {activeTab === 'generation' && renderGenerationTab()}
            {activeTab === 'review' && renderReviewTab()}
            {activeTab === 'published' && renderVersionTable(publishedVersions)}
            {activeTab === 'history' && renderVersionTable(allVersions, { showRestore: true })}

            {editingQuestion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900">
                            {editingQuestion.isNew ? 'Add Manual Question' : `Edit Question #${editingQuestion.number}`}
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

            {previewQuestion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-5 space-y-3">
                        <h3 className="text-lg font-semibold">Question Preview</h3>
                        {(() => {
                            const q = resolveQuestionForLocale(previewQuestion, displayLanguage, { includeAnswers: true });
                            return (
                                <>
                                    <p className="font-medium">Q{q.number}. {q.question}</p>
                                    <ul className="text-sm space-y-1">
                                        {['A', 'B', 'C', 'D'].map((l) => (
                                            <li key={l} className={l === q.correct_answer ? 'text-emerald-700 font-semibold' : 'text-slate-600'}>
                                                {l}. {q.choices[l]}
                                            </li>
                                        ))}
                                    </ul>
                                    {q.explanation && <p className="text-sm text-slate-600 pt-2 border-t"><span className="font-medium">Explanation:</span> {q.explanation}</p>}
                                </>
                            );
                        })()}
                        <div className="flex justify-end">
                            <AdminSecondaryButton onClick={() => setPreviewQuestion(null)}>Close</AdminSecondaryButton>
                        </div>
                    </div>
                </div>
            )}
        </AdminPageShell>
    );
}
