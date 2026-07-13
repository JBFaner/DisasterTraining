import React from 'react';
import Swal from 'sweetalert2';
import {
    Sparkles,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Settings,
    BookOpen,
    Eye,
    Pencil,
    Trash2,
    Save,
    Send,
    ChevronDown,
    X,
    FileText,
} from 'lucide-react';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminPrimaryButton,
    AdminSecondaryButton,
    AdminContentCard,
    adminSelectClass,
    adminCompactInputClass,
    AdminNumberInput,
} from './admin/AdminLayout';
import { AdminDataTable, AdminTableActionButton } from './admin/AdminDataTable';
import {
    LessonQuizQuestionBankReview,
    confirmUnsavedQuestionBankChanges,
} from './LessonQuizQuestionBankReview';
import { showPortalToast } from '../utils/portalToast';
import {
    AI_SCENARIO_DEFAULT_LANGUAGE,
    AI_SCENARIO_LANGUAGES,
} from '../utils/aiScenarioLocale';

const BANK_COUNTS = [10, 20, 30];
const DEFAULT_BANK_COUNT = 20;
const DEFAULT_PASSING_SCORE = 75;
const DEFAULT_MAX_ATTEMPTS = 3;

const BANK_COUNT_LABELS = {
    10: '10',
    20: '20 (Recommended)',
    30: '30 (Maximum)',
};

function recommendedQuizSizeForBank(bankCount) {
    const normalized = normalizeBankCount(bankCount);
    if (normalized === 10) return 5;
    if (normalized === 20) return 10;
    if (normalized === 30) return 15;

    return 10;
}

function buildParticipantQuizSizeOptions(poolSize) {
    const options = [];
    for (let size = 5; size <= poolSize; size += 5) {
        options.push(size);
    }
    return options;
}

function normalizeBankCount(count) {
    const parsed = Number(count);
    if (BANK_COUNTS.includes(parsed)) {
        return parsed;
    }

    if (parsed > 30) {
        return 30;
    }

    return DEFAULT_BANK_COUNT;
}

function normalizeQuizSize(count, bankCount) {
    const normalizedBank = normalizeBankCount(bankCount);
    const options = buildParticipantQuizSizeOptions(normalizedBank);
    const parsed = Number(count);

    if (options.includes(parsed)) {
        return parsed;
    }

    return recommendedQuizSizeForBank(normalizedBank);
}

function validatePassingScore(value) {
    if (value === '' || value === null || value === undefined) {
        return 'Passing score is required.';
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return 'Passing score must be a number.';
    }
    if (parsed < 50) {
        return 'Passing score must be at least 50%.';
    }
    if (parsed > 100) {
        return 'Passing score cannot exceed 100%.';
    }

    return '';
}

function validateMaxAttempts(value) {
    if (value === '' || value === null || value === undefined) {
        return 'Maximum attempts is required.';
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return 'Maximum attempts must be a number.';
    }
    if (parsed < 1) {
        return 'Maximum attempts must be at least 1.';
    }
    if (parsed > 10) {
        return 'Maximum attempts cannot exceed 10.';
    }

    return '';
}

function workflowUrl(configId, versionId, suffix = '') {
    return `/admin/lesson-quiz-config/${configId}/versions/${versionId}${suffix}`;
}

function serializeConfigPayload(payload) {
    return JSON.stringify(payload);
}

function formatDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString();
}

function formatGeneratedDateParts(value) {
    if (!value) {
        return { date: '—', time: null };
    }

    const parsed = new Date(value);
    return {
        date: parsed.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }),
        time: parsed.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' }),
    };
}

function GeneratedDateCell({ value }) {
    const { date, time } = formatGeneratedDateParts(value);

    return (
        <div className="text-slate-600 text-xs leading-tight whitespace-nowrap">
            <div>{date}</div>
            {time && <div className="text-slate-500">{time}</div>}
        </div>
    );
}

function formatUserName(user, fallbackName) {
    if (fallbackName) return fallbackName;
    if (!user) return '—';
    return user.name || user.email || '—';
}

function displayAssessmentStatus(status) {
    if (status === 'published') return 'Published';
    if (status === 'archived') return 'Archived';
    if (status === 'approved') return 'Approved';
    if (status === 'under_review') return 'Under Review';
    return 'Draft';
}

function AssessmentStatusBadge({ status }) {
    const label = displayAssessmentStatus(status);
    const styles = {
        Published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        Approved: 'bg-sky-50 text-sky-700 border-sky-200',
        'Under Review': 'bg-amber-50 text-amber-700 border-amber-200',
        Draft: 'bg-amber-50 text-amber-700 border-amber-200',
        Archived: 'bg-slate-50 text-slate-600 border-slate-200',
    };

    return (
        <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-medium ${styles[label] || styles.Draft}`}>
            {label}
        </span>
    );
}

function CurrentVersionBadge({ compact = false }) {
    return (
        <span className={`inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 font-medium text-sky-700 shrink-0 ${compact ? 'px-2 py-0.5 text-[0.65rem]' : 'px-2.5 py-0.5 text-xs'}`}>
            <CheckCircle2 className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            Current
        </span>
    );
}

function VersionAuditPanel({ version }) {
    const generatedBy = formatUserName(version.creator, version.generated_by_name);
    const publishedBy = formatUserName(version.publisher, version.published_by_name);
    const lastEditedBy = formatUserName(version.last_editor, version.last_edited_by_name);
    const isCurrent = version.is_current === true;

    const fields = [
        { label: 'Version', value: `v${version.version_number}` },
        { label: 'Generated By', value: generatedBy },
        { label: 'Generated On', value: formatDate(version.created_at) },
        { label: 'Published By', value: publishedBy },
        { label: 'Published On', value: formatDate(version.published_at) },
        { label: 'Status', value: <AssessmentStatusBadge status={version.status} /> },
        { label: 'Current Version', value: isCurrent ? 'Yes' : 'No' },
    ];

    if (version.last_edited_at) {
        fields.push(
            { label: 'Last Edited By', value: lastEditedBy },
            { label: 'Last Edited On', value: formatDate(version.last_edited_at) },
        );
    }

    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-6">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">Version Information</h4>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {fields.map((field) => (
                    <div key={field.label}>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{field.label}</dt>
                        <dd className="mt-0.5 text-slate-800">{field.value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

function LessonResourcesPanel({ resources, loading }) {
    if (loading) {
        return (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading lesson learning resources…
            </div>
        );
    }

    if (!resources) {
        return (
            <p className="text-sm text-slate-500 py-2">
                Select a lesson to load its learning resources from Training Module Management.
            </p>
        );
    }

    const resourceItems = (resources.resources || []).filter((resource) => resource.resource_type === 'text');
    const supplementaryCount = (resources.resources || []).filter(
        (resource) => ['pdf', 'image', 'youtube', 'video'].includes(resource.resource_type),
    ).length;

    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4 text-sm">
            <div>
                <p className="font-semibold text-slate-800">{resources.title}</p>
                {resources.description && <p className="text-slate-600 mt-1">{resources.description}</p>}
                <p className="text-xs text-slate-500 mt-2">
                    AI quiz generation uses the lesson rich text training content only.
                </p>
            </div>

            {resourceItems.length === 0 ? (
                <p className="text-amber-700">No rich text training content found for this lesson yet.</p>
            ) : (
                <ul className="space-y-3">
                    {resourceItems.map((resource) => {
                        const isReady = resource.ai_processing_status === 'ready' && resource.has_readable_content;
                        const isProcessing = ['pending', 'processing'].includes(resource.ai_processing_status);
                        const isFailed = resource.ai_processing_status === 'failed';

                        return (
                            <li key={resource.id} className="rounded-lg border border-slate-200 bg-white p-3">
                                <div className="flex items-start gap-2">
                                    <FileText className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-slate-800">{resource.resource_label || resource.title}</p>
                                        <p className="text-xs text-slate-500 capitalize mt-0.5">{resource.resource_type}</p>
                                        <div className="flex items-start gap-2 mt-2">
                                            {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600 mt-0.5" />}
                                            {isReady && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5" />}
                                            {isFailed && <AlertCircle className="w-3.5 h-3.5 text-red-600 mt-0.5" />}
                                            <div>
                                                <p className={`text-xs font-medium ${isReady ? 'text-emerald-700' : isFailed ? 'text-red-700' : 'text-slate-600'}`}>
                                                    {isReady ? `✅ ${resource.ai_processing_status_label}` : isFailed ? `❌ ${resource.ai_processing_status_label}` : resource.ai_processing_status_label}
                                                </p>
                                                {isFailed && resource.ai_processing_error && (
                                                    <p className="text-xs text-red-600 mt-0.5">{resource.ai_processing_error}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {supplementaryCount > 0 ? (
                <p className="text-xs text-slate-500 border-t border-slate-200 pt-3">
                    {supplementaryCount} supplementary file{supplementaryCount === 1 ? '' : 's'} (PDF, image, video) attached to this lesson but not used for AI quiz generation.
                </p>
            ) : null}

            {!resources.has_readable_content && (
                <p className="text-xs text-amber-700 border-t border-slate-200 pt-3">
                    Add rich text training content to this lesson before generating AI quiz questions.
                </p>
            )}
        </div>
    );
}

export function LessonQuizGeneratorModule({ modules = [], configs = [] }) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';

    const configByLessonId = React.useMemo(() => {
        const map = {};
        (configs || []).forEach((c) => {
            map[c.training_content_id] = c;
        });
        return map;
    }, [configs]);

    const [selectedModuleId, setSelectedModuleId] = React.useState(modules[0]?.id ? String(modules[0].id) : '');
    const [selectedLessonId, setSelectedLessonId] = React.useState('');
    const [localConfigs, setLocalConfigs] = React.useState(configs || []);
    const [configExpanded, setConfigExpanded] = React.useState(false);
    const [resourcesExpanded, setResourcesExpanded] = React.useState(true);
    const [configSynced, setConfigSynced] = React.useState(false);
    const [savedPayloadKey, setSavedPayloadKey] = React.useState('');

    const [lessonResources, setLessonResources] = React.useState(null);
    const [loadingResources, setLoadingResources] = React.useState(false);

    const [saving, setSaving] = React.useState(false);
    const [generating, setGenerating] = React.useState(false);
    const [workflowBusy, setWorkflowBusy] = React.useState(false);

    const [activeVersion, setActiveVersion] = React.useState(null);
    const [panelMode, setPanelMode] = React.useState(null);
    const [questionBankDirty, setQuestionBankDirty] = React.useState(false);
    const [translatingLocale, setTranslatingLocale] = React.useState(null);

    const [bankQuestionCount, setBankQuestionCount] = React.useState(DEFAULT_BANK_COUNT);
    const [quizQuestionCount, setQuizQuestionCount] = React.useState(recommendedQuizSizeForBank(DEFAULT_BANK_COUNT));
    const [quizSizePoolNotice, setQuizSizePoolNotice] = React.useState('');
    const [timeLimitMinutes, setTimeLimitMinutes] = React.useState(30);
    const [maxAttempts, setMaxAttempts] = React.useState(DEFAULT_MAX_ATTEMPTS);
    const [passingScore, setPassingScore] = React.useState(DEFAULT_PASSING_SCORE);
    const [passingScoreError, setPassingScoreError] = React.useState('');
    const [maxAttemptsError, setMaxAttemptsError] = React.useState('');
    const [shuffleQuestions, setShuffleQuestions] = React.useState(true);
    const [shuffleAnswerChoices, setShuffleAnswerChoices] = React.useState(true);
    const [autoTranslateFil, setAutoTranslateFil] = React.useState(true);
    const [activeGenerationJob, setActiveGenerationJob] = React.useState(null);
    const deepLinkHandled = React.useRef(false);
    const versionDeepLinkHandled = React.useRef(false);

    const selectedModule = modules.find((m) => String(m.id) === String(selectedModuleId));
    const lessons = React.useMemo(
        () => [...(selectedModule?.contents || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
        [selectedModule],
    );
    const selectedLesson = lessons.find((l) => String(l.id) === String(selectedLessonId));
    const selectedConfig = localConfigs.find((c) => String(c.training_content_id) === String(selectedLessonId));

    React.useEffect(() => {
        if (deepLinkHandled.current) return;

        const params = new URLSearchParams(window.location.search);
        const moduleId = params.get('module');
        const lessonId = params.get('lesson');

        if (!moduleId && !lessonId) return;

        if (moduleId && modules.some((module) => String(module.id) === String(moduleId))) {
            setSelectedModuleId(String(moduleId));
        }
        if (lessonId) {
            setSelectedLessonId(String(lessonId));
        }

        deepLinkHandled.current = true;
    }, [modules]);

    React.useEffect(() => {
        if (versionDeepLinkHandled.current) return;

        const versionId = new URLSearchParams(window.location.search).get('version');
        if (!versionId || !selectedConfig) return;

        const version = (selectedConfig.versions || []).find((item) => String(item.id) === String(versionId));
        if (!version) return;

        setActiveVersion(version);
        setPanelMode('view');
        setQuestionBankDirty(false);
        versionDeepLinkHandled.current = true;
    }, [selectedConfig]);

    React.useEffect(() => {
        setActiveGenerationJob(selectedConfig?.latest_generation_job?.is_active
            ? selectedConfig.latest_generation_job
            : null);
    }, [selectedConfig?.id, selectedConfig?.latest_generation_job]);

    React.useEffect(() => {
        if (!selectedModuleId) {
            setSelectedLessonId('');
            return;
        }
        if (lessons.length === 0) {
            setSelectedLessonId('');
            return;
        }
        const lessonBelongsToModule = lessons.some((lesson) => String(lesson.id) === String(selectedLessonId));
        if (!lessonBelongsToModule) {
            setSelectedLessonId(String(lessons[0].id));
        }
    }, [selectedModuleId, lessons, selectedLessonId]);

    const selectedLessonBelongsToModule = lessons.some(
        (lesson) => String(lesson.id) === String(selectedLessonId),
    );

    const participantQuizSizeOptions = React.useMemo(
        () => buildParticipantQuizSizeOptions(bankQuestionCount),
        [bankQuestionCount],
    );

    const buildPayload = React.useCallback(() => ({
        training_content_id: Number(selectedLessonId),
        bank_question_count: bankQuestionCount,
        quiz_question_count: Number(quizQuestionCount),
        is_enabled: false,
        time_limit_minutes: timeLimitMinutes || null,
        max_attempts: Number(maxAttempts),
        passing_score: Number(passingScore),
        shuffle_questions: shuffleQuestions,
        shuffle_answer_choices: shuffleAnswerChoices,
    }), [
        selectedLessonId, bankQuestionCount, quizQuestionCount,
        timeLimitMinutes, maxAttempts, passingScore, shuffleQuestions, shuffleAnswerChoices,
    ]);

    const handleBankQuestionCountChange = React.useCallback((nextBank) => {
        const normalizedBank = normalizeBankCount(nextBank);
        const previousQuiz = Number(quizQuestionCount);
        const recommended = recommendedQuizSizeForBank(normalizedBank);
        const exceeded = Number.isFinite(previousQuiz) && previousQuiz > normalizedBank;

        setBankQuestionCount(normalizedBank);
        setQuizQuestionCount(recommended);

        if (exceeded) {
            setQuizSizePoolNotice('The participant quiz size has been adjusted because it exceeded the available AI question pool.');
        } else {
            setQuizSizePoolNotice('');
        }
    }, [quizQuestionCount]);

    const hydrateConfigForm = React.useCallback((existing) => {
        if (existing) {
            const bankCount = normalizeBankCount(existing.bank_question_count || DEFAULT_BANK_COUNT);
            setBankQuestionCount(bankCount);
            setQuizQuestionCount(normalizeQuizSize(existing.quiz_question_count, bankCount));
            setQuizSizePoolNotice('');
            setTimeLimitMinutes(existing.time_limit_minutes ?? 30);
            setMaxAttempts(existing.max_attempts ?? DEFAULT_MAX_ATTEMPTS);
            setPassingScore(existing.passing_score ?? DEFAULT_PASSING_SCORE);
            setPassingScoreError('');
            setMaxAttemptsError('');
            setShuffleQuestions(existing.shuffle_questions !== false);
            setShuffleAnswerChoices(existing.shuffle_answer_choices !== false);
        } else {
            setBankQuestionCount(DEFAULT_BANK_COUNT);
            setQuizQuestionCount(recommendedQuizSizeForBank(DEFAULT_BANK_COUNT));
            setQuizSizePoolNotice('');
            setTimeLimitMinutes(30);
            setMaxAttempts(DEFAULT_MAX_ATTEMPTS);
            setPassingScore(DEFAULT_PASSING_SCORE);
            setPassingScoreError('');
            setMaxAttemptsError('');
            setShuffleQuestions(true);
            setShuffleAnswerChoices(true);
        }
    }, []);

    React.useEffect(() => {
        const existing = configByLessonId[Number(selectedLessonId)];
        hydrateConfigForm(existing);
        if (existing) {
            setSavedPayloadKey(serializeConfigPayload({
                training_content_id: Number(selectedLessonId),
                bank_question_count: normalizeBankCount(existing.bank_question_count || DEFAULT_BANK_COUNT),
                quiz_question_count: normalizeQuizSize(existing.quiz_question_count, existing.bank_question_count || DEFAULT_BANK_COUNT),
                is_enabled: false,
                time_limit_minutes: existing.time_limit_minutes ?? 30,
                max_attempts: existing.max_attempts ?? 3,
                passing_score: existing.passing_score ?? 75,
                shuffle_questions: existing.shuffle_questions !== false,
                shuffle_answer_choices: existing.shuffle_answer_choices !== false,
            }));
            setConfigSynced(true);
        } else {
            setSavedPayloadKey('');
            setConfigSynced(false);
        }
    }, [selectedLessonId, configByLessonId, hydrateConfigForm]);

    React.useEffect(() => {
        const currentKey = serializeConfigPayload(buildPayload());
        setConfigSynced(Boolean(savedPayloadKey) && currentKey === savedPayloadKey);
    }, [buildPayload, savedPayloadKey]);

    React.useEffect(() => {
        if (!selectedModuleId || !selectedLessonId || !selectedLessonBelongsToModule) {
            setLessonResources(null);
            return undefined;
        }

        let cancelled = false;

        const loadResources = () => {
            setLoadingResources(true);
            return fetch(`/admin/ai-scenario-training/lesson-quiz-generator/modules/${selectedModuleId}/lessons/${selectedLessonId}/resources`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            })
                .then(async (res) => {
                    if (!res.ok) {
                        throw new Error(`Failed to load lesson resources (${res.status})`);
                    }
                    return res.json();
                })
                .then((data) => {
                    if (!cancelled) {
                        setLessonResources(data.resources || null);
                    }
                })
                .catch(() => {
                    if (!cancelled) {
                        setLessonResources(null);
                    }
                })
                .finally(() => {
                    if (!cancelled) {
                        setLoadingResources(false);
                    }
                });
        };

        loadResources();

        return () => {
            cancelled = true;
        };
    }, [selectedModuleId, selectedLessonId, selectedLessonBelongsToModule]);

    React.useEffect(() => {
        if (!selectedModuleId || !selectedLessonId || !selectedLessonBelongsToModule || !lessonResources) {
            return undefined;
        }

        const isProcessing = (lessonResources.resources || [])
            .filter((resource) => resource.resource_type === 'text')
            .some((resource) =>
            resource.ai_processing_status === 'pending' || resource.ai_processing_status === 'processing',
        );

        if (!isProcessing) {
            return undefined;
        }

        const intervalId = window.setInterval(() => {
            fetch(`/admin/ai-scenario-training/lesson-quiz-generator/modules/${selectedModuleId}/lessons/${selectedLessonId}/resources`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            })
                .then(async (res) => {
                    if (!res.ok) return null;
                    return res.json();
                })
                .then((data) => {
                    if (data) setLessonResources(data.resources || null);
                })
                .catch(() => {});
        }, 4000);

        return () => window.clearInterval(intervalId);
    }, [selectedModuleId, selectedLessonId, selectedLessonBelongsToModule, lessonResources?.resources]);

    const canGenerateAiContent = Boolean(lessonResources?.has_readable_content);

    const versionRows = React.useMemo(() => {
        if (!selectedLessonId || !selectedConfig) return [];

        return (selectedConfig.versions || [])
            .filter((v) => v.status !== 'archived')
            .map((version) => ({
                ...version,
                is_current: version.is_current === true
                    || String(selectedConfig.published_version_id) === String(version.id),
                configId: selectedConfig.id,
                trainingModuleTitle: selectedModule?.title || '—',
                lessonTitle: selectedLesson?.title || selectedConfig.training_content?.title || '—',
                config: selectedConfig,
            }))
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [selectedConfig, selectedLessonId, selectedModule, selectedLesson]);

    const refreshConfig = (config) => {
        setLocalConfigs((prev) => {
            const others = prev.filter((c) => c.training_content_id !== config.training_content_id);
            return [...others, config];
        });
        if (config.latest_generation_job?.is_active) {
            setActiveGenerationJob(config.latest_generation_job);
        } else if (config.latest_generation_job) {
            setActiveGenerationJob((prev) => (
                prev && prev.lesson_quiz_config_id === config.id ? config.latest_generation_job : prev
            ));
        }
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
        if (!selectedLessonId) return;

        const nextPassingScoreError = validatePassingScore(passingScore);
        const nextMaxAttemptsError = validateMaxAttempts(maxAttempts);

        setPassingScoreError(nextPassingScoreError);
        setMaxAttemptsError(nextMaxAttemptsError);

        if (nextPassingScoreError || nextMaxAttemptsError) {
            Swal.fire({
                icon: 'warning',
                title: 'Invalid configuration',
                text: nextPassingScoreError || nextMaxAttemptsError,
            });
            return;
        }

        setSaving(true);
        try {
            const payload = buildPayload();
            const data = await apiFetch('/admin/lesson-quiz-config', {
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
        if (!selectedConfig?.id || !configSynced || activeGenerationJob?.is_active) return;

        const result = await Swal.fire({
            title: 'Generate Lesson Question Bank?',
            html: 'Gemini will analyze the selected lesson content and generate a draft question bank in the background.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Generate',
            confirmButtonColor: '#059669',
        });
        if (!result.isConfirmed) return;

        setGenerating(true);
        try {
            const data = await apiFetch(`/admin/lesson-quiz-config/${selectedConfig.id}/generate`, {
                method: 'POST',
                body: JSON.stringify({ auto_translate_fil: autoTranslateFil }),
            });
            setActiveGenerationJob(data.generation_job);
            setConfigExpanded(false);
            showPortalToast({
                title: 'Question Bank generation has started.',
                description: 'This process runs in the background. You may continue working.',
            });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Generation failed', text: err.message });
        } finally {
            setGenerating(false);
        }
    };

    React.useEffect(() => {
        if (!activeGenerationJob?.id || !activeGenerationJob?.is_active) return undefined;

        let cancelled = false;

        const pollStatus = async () => {
            try {
                const data = await apiFetch(`/admin/lesson-quiz-generation-jobs/${activeGenerationJob.id}`);
                if (cancelled) return;

                const job = data.generation_job;
                setActiveGenerationJob(job);

                if (data.config) {
                    refreshConfig(data.config);
                }

                if (job?.status === 'completed') {
                    setActiveGenerationJob(null);
                    window.dispatchEvent(new CustomEvent('portal-notifications-refresh'));
                    showPortalToast({
                        title: 'Question Bank generation completed.',
                        description: 'Review the new draft question bank when you are ready.',
                    });
                }

                if (job?.status === 'failed') {
                    setActiveGenerationJob(null);
                    window.dispatchEvent(new CustomEvent('portal-notifications-refresh'));
                }
            } catch {
                // keep polling on transient errors
            }
        };

        pollStatus();
        const timer = window.setInterval(pollStatus, 5000);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [activeGenerationJob?.id, activeGenerationJob?.is_active]);

    const runWorkflow = async (configId, versionId, suffix, { method = 'POST', body, successTitle, successText } = {}) => {
        if (!configId || !versionId) return null;
        setWorkflowBusy(true);
        try {
            const data = await apiFetch(workflowUrl(configId, versionId, suffix), {
                method,
                body: body ? JSON.stringify(body) : undefined,
            });
            if (data.config) {
                refreshConfig(data.config);
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
        setPanelMode('view');
        setQuestionBankDirty(false);
    };

    const openEditPanel = (row) => {
        const { version } = findVersionContext(row);
        setActiveVersion(version);
        setPanelMode('edit');
        setQuestionBankDirty(false);
    };

    const closePanel = () => {
        if (!confirmUnsavedQuestionBankChanges(questionBankDirty)) {
            return;
        }
        setPanelMode(null);
        setActiveVersion(null);
        setQuestionBankDirty(false);
    };

    const handlePublish = async (row) => {
        if (questionBankDirty && !confirmUnsavedQuestionBankChanges(questionBankDirty)) {
            return;
        }

        const { config, version } = findVersionContext(row);
        if (!config?.id || !version?.id) return;

        const confirm = await Swal.fire({
            title: 'Publish question bank?',
            text: 'Participants will receive random questions from this bank when taking the lesson quiz.',
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

    const activeVersionEditable = activeVersion
        && activeVersion.status !== 'published'
        && activeVersion.status !== 'archived';

    const handleTranslate = async (versionRow, locale) => {
        if (questionBankDirty && !confirmUnsavedQuestionBankChanges(questionBankDirty)) {
            return;
        }

        const { config, version } = findVersionContext(versionRow);
        if (!config?.id || !version?.id) return;

        const confirm = await Swal.fire({
            title: `Translate to ${AI_SCENARIO_LANGUAGES[locale]?.label || locale}?`,
            text: 'Gemini will generate a Filipino translation while preserving the original English content.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Translate',
            confirmButtonColor: '#059669',
        });
        if (!confirm.isConfirmed) return;

        setTranslatingLocale(locale);
        try {
            const data = await apiFetch(workflowUrl(config.id, version.id, '/translate'), {
                method: 'POST',
                body: JSON.stringify({ locale }),
            });
            refreshConfig(data.config);
            if (data.version) setActiveVersion(data.version);
            Swal.fire({ icon: 'success', title: 'Translation generated', timer: 2000, showConfirmButton: false });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Translation failed', text: err.message });
        } finally {
            setTranslatingLocale(null);
        }
    };

    const handlePublishTranslation = async (versionRow, locale) => {
        const { config, version } = findVersionContext(versionRow);
        if (!config?.id || !version?.id) return;

        const data = await runWorkflow(config.id, version.id, '/publish-translation', {
            body: { locale },
            successTitle: 'Translation published',
        });
        if (data?.version) {
            setActiveVersion(data.version);
        } else if (data?.config) {
            const updated = data.config.versions?.find((v) => v.id === version.id);
            if (updated) setActiveVersion(updated);
        }
    };

    const handleDeleteTranslation = async (versionRow, locale) => {
        const { config, version } = findVersionContext(versionRow);
        if (!config?.id || !version?.id) return;

        const confirm = await Swal.fire({
            title: 'Delete translation?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
        });
        if (!confirm.isConfirmed) return;

        setWorkflowBusy(true);
        try {
            const data = await apiFetch(workflowUrl(config.id, version.id, '/translation'), {
                method: 'DELETE',
                body: JSON.stringify({ locale }),
            });
            refreshConfig(data.config);
            if (data.version) setActiveVersion(data.version);
            Swal.fire({ icon: 'success', title: 'Translation deleted', timer: 2000, showConfirmButton: false });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Action failed', text: err.message });
        } finally {
            setWorkflowBusy(false);
        }
    };

    const renderLanguageVersionStatus = (version) => {
        const sourceLocale = version.generated_language || AI_SCENARIO_DEFAULT_LANGUAGE;
        const languageVersions = version.language_versions || {};

        const translatingLabel = translatingLocale
            ? AI_SCENARIO_LANGUAGES[translatingLocale]?.label || translatingLocale
            : null;

        return (
            <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                <h4 className="text-sm font-semibold text-slate-800">Language Versions</h4>
                {translatingLocale && (
                    <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
                        <Loader2 className="w-4 h-4 shrink-0 mt-0.5 animate-spin text-emerald-600" />
                        <div>
                            <p className="font-medium">Generating {translatingLabel} translation…</p>
                            <p className="text-xs text-emerald-800 mt-0.5">
                                Gemini is translating all questions. This may take a minute — please keep this window open.
                            </p>
                        </div>
                    </div>
                )}
                <div className="space-y-2">
                    {Object.entries(AI_SCENARIO_LANGUAGES).map(([code, meta]) => {
                        const info = languageVersions[code] || { status: code === sourceLocale ? 'draft' : 'not_started' };
                        const isSource = code === sourceLocale;
                        const statusLabel = info.outdated
                            ? 'Translation Outdated'
                            : info.status === 'published'
                                ? 'Published'
                                : info.status === 'draft'
                                    ? 'Draft'
                                    : 'Not started';

                        const statusClass = info.outdated
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : info.status === 'published'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : info.status === 'draft'
                                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                                    : 'bg-slate-50 text-slate-600 border-slate-200';

                        const isTranslatingThis = translatingLocale === code;

                        return (
                            <div
                                key={code}
                                className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 ${
                                    isTranslatingThis ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-100'
                                }`}
                            >
                                <div className="text-sm text-slate-700">
                                    <span className="mr-1.5" aria-hidden>{meta.flag}</span>
                                    {meta.label}{isSource ? ' (Original)' : ''}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-medium ${statusClass}`}>
                                        {statusLabel}
                                    </span>
                                    {!isSource && activeVersionEditable && info.status === 'not_started' && (
                                        <AdminSecondaryButton
                                            type="button"
                                            onClick={() => handleTranslate(version, code)}
                                            disabled={!!translatingLocale || workflowBusy}
                                            className="text-xs px-2 py-1 inline-flex items-center gap-1.5"
                                        >
                                            {isTranslatingThis ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    Translating…
                                                </>
                                            ) : (
                                                'Translate'
                                            )}
                                        </AdminSecondaryButton>
                                    )}
                                    {!isSource && activeVersionEditable && ['draft', 'published'].includes(info.status) && (
                                        <>
                                            <AdminSecondaryButton
                                                type="button"
                                                onClick={() => handleTranslate(version, code)}
                                                disabled={!!translatingLocale || workflowBusy}
                                                className="text-xs px-2 py-1 inline-flex items-center gap-1.5"
                                            >
                                                {isTranslatingThis ? (
                                                    <>
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        Translating…
                                                    </>
                                                ) : (
                                                    'Regenerate'
                                                )}
                                            </AdminSecondaryButton>
                                            {info.status === 'draft' && !info.outdated && (
                                                <AdminPrimaryButton
                                                    type="button"
                                                    onClick={() => handlePublishTranslation(version, code)}
                                                    disabled={workflowBusy || !!translatingLocale}
                                                    className="text-xs px-2 py-1"
                                                >
                                                    Publish
                                                </AdminPrimaryButton>
                                            )}
                                            <AdminSecondaryButton
                                                type="button"
                                                onClick={() => handleDeleteTranslation(version, code)}
                                                disabled={workflowBusy || !!translatingLocale}
                                                className="text-xs px-2 py-1 text-red-700 border-red-200"
                                            >
                                                Delete
                                            </AdminSecondaryButton>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderQuestionBankReview = (version, { readOnly = false } = {}) => {
        const { config } = findVersionContext(version);
        if (!config?.id || !version?.id) return null;

        return (
            <LessonQuizQuestionBankReview
                version={version}
                lessonTitle={selectedLesson?.title}
                quizQuestionCount={quizQuestionCount}
                readOnly={readOnly}
                editable={!readOnly && activeVersionEditable}
                workflowBusy={workflowBusy}
                languageVersionsPanel={renderLanguageVersionStatus(version)}
                prependContent={readOnly ? <VersionAuditPanel version={version} /> : null}
                workflowUrl={(suffix) => workflowUrl(config.id, version.id, suffix)}
                apiFetch={apiFetch}
                onDirtyChange={setQuestionBankDirty}
                onVersionUpdated={(updatedVersion, updatedConfig) => {
                    if (updatedConfig) {
                        refreshConfig(updatedConfig);
                    }
                    setActiveVersion(updatedVersion);
                    setQuestionBankDirty(false);
                }}
            />
        );
    };

    const versionColumns = [
        {
            key: 'version_number',
            label: 'Version',
            render: (row) => <span className="font-medium text-slate-800">v{row.version_number}</span>,
        },
        {
            key: 'lessonTitle',
            label: 'Lesson',
            className: 'max-w-xs whitespace-normal',
            render: (row) => <span className="text-slate-700">{row.lessonTitle}</span>,
        },
        {
            key: 'question_count',
            label: 'Questions',
            render: (row) => <span className="text-slate-700">{row.generated_questions?.length || 0}</span>,
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => <AssessmentStatusBadge status={row.status} />,
        },
        {
            key: 'created_at',
            label: 'Generated Date',
            className: 'whitespace-nowrap',
            render: (row) => <GeneratedDateCell value={row.created_at} />,
        },
    ];

    return (
        <AdminPageShell>
            <AdminPageHeader
                icon={BookOpen}
                title="Lesson Quiz Generator"
                description="Generate AI question banks from training module lessons. Lesson content is read-only from Training Module Management."
                actions={(
                    <select
                        className={adminSelectClass}
                        value={selectedModuleId}
                        onChange={(e) => {
                            setSelectedModuleId(e.target.value);
                            setSelectedLessonId('');
                            closePanel();
                        }}
                    >
                        <option value="">Select module…</option>
                        {(modules || []).map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                    </select>
                )}
            />

            <AdminContentCard className="overflow-hidden">
                <button
                    type="button"
                    onClick={() => setResourcesExpanded((prev) => !prev)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                >
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        Lesson Learning Resources
                        {selectedLesson && (
                            <span className="font-normal text-slate-500">— {selectedLesson.title}</span>
                        )}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${resourcesExpanded ? 'rotate-180' : ''}`} />
                </button>
                {resourcesExpanded && (
                    <div className="px-4 pb-4 border-t border-slate-100">
                        <div className="pt-4">
                            <LessonResourcesPanel resources={lessonResources} loading={loadingResources} />
                        </div>
                    </div>
                )}
            </AdminContentCard>

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
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Lesson</label>
                                    <select
                                        className={adminCompactInputClass}
                                        value={selectedLessonId}
                                        onChange={(e) => {
                                            setSelectedLessonId(e.target.value);
                                            closePanel();
                                        }}
                                        disabled={!selectedModuleId || lessons.length === 0}
                                    >
                                        <option value="">Select lesson…</option>
                                        {lessons.map((lesson) => (
                                            <option key={lesson.id} value={lesson.id}>
                                                {lesson.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">AI Questions to Generate</label>
                                    <select
                                        className={adminCompactInputClass}
                                        value={bankQuestionCount}
                                        onChange={(e) => handleBankQuestionCountChange(Number(e.target.value))}
                                    >
                                        {BANK_COUNTS.map((n) => (
                                            <option key={n} value={n}>{BANK_COUNT_LABELS[n] || n}</option>
                                        ))}
                                    </select>
                                    <p className="text-[0.7rem] text-slate-500 mt-1">
                                        Recommended: 20 questions. Maximum: 30 questions.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Participant Quiz Size</label>
                                    <select
                                        className={adminCompactInputClass}
                                        value={String(quizQuestionCount)}
                                        onChange={(e) => {
                                            setQuizQuestionCount(Number(e.target.value));
                                            setQuizSizePoolNotice('');
                                        }}
                                    >
                                        {participantQuizSizeOptions.map((n) => (
                                            <option key={n} value={n}>{n}</option>
                                        ))}
                                    </select>
                                    {quizSizePoolNotice && (
                                        <p className="text-xs text-slate-600 mt-1">{quizSizePoolNotice}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Time Limit (minutes)</label>
                                    <input type="number" min={5} max={180} className={adminCompactInputClass} value={timeLimitMinutes} onChange={(e) => setTimeLimitMinutes(Number(e.target.value))} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Passing Score (%)</label>
                                    <AdminNumberInput
                                        min={50}
                                        max={100}
                                        value={passingScore}
                                        onChange={(next) => {
                                            setPassingScore(next);
                                            setPassingScoreError(validatePassingScore(next));
                                        }}
                                        error={passingScoreError}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Maximum Attempts</label>
                                    <AdminNumberInput
                                        min={1}
                                        max={10}
                                        value={maxAttempts}
                                        onChange={(next) => {
                                            setMaxAttempts(next);
                                            setMaxAttemptsError(validateMaxAttempts(next));
                                        }}
                                        error={maxAttemptsError}
                                    />
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
                                    <input type="checkbox" checked={autoTranslateFil} onChange={(e) => setAutoTranslateFil(e.target.checked)} className="rounded border-slate-300 text-emerald-600" />
                                    Auto-translate to Filipino after generation
                                </label>
                            </div>

                            <p className="text-xs text-slate-500">
                                Questions are generated in English from the selected lesson&apos;s learning resources. Generation runs in the background so you can continue working.
                            </p>

                            {activeGenerationJob?.is_active && (
                                <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900 flex items-start gap-3">
                                    <Loader2 className="w-4 h-4 animate-spin mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-medium">AI generation in progress</p>
                                        <p className="text-violet-800/90 mt-1">
                                            {activeGenerationJob.status_label || 'Processing'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap items-center gap-2 pt-2">
                                <AdminPrimaryButton type="submit" disabled={saving || !selectedLessonId}>
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Configuration
                                </AdminPrimaryButton>
                                <AdminPrimaryButton
                                    type="button"
                                    onClick={handleGenerate}
                                    disabled={generating || !configSynced || !selectedConfig?.id || activeGenerationJob?.is_active || !canGenerateAiContent}
                                    className="bg-violet-600 hover:bg-violet-700"
                                >
                                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    Generate AI Content
                                </AdminPrimaryButton>
                                {!configSynced && selectedLessonId && (
                                    <span className="text-xs text-amber-600 inline-flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        Save configuration before generating
                                    </span>
                                )}
                                {configSynced && selectedLessonId && lessonResources && !canGenerateAiContent && (
                                    <span className="text-xs text-amber-600 inline-flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        {lessonResources.ai_processing_error
                                            || 'No readable lesson content is available for AI Question Bank generation.'}
                                    </span>
                                )}
                            </div>
                        </form>
                    </div>
                )}
            </AdminContentCard>

            <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-800">
                    Generated Question Banks
                    {selectedLesson && (
                        <span className="font-normal text-slate-500"> — {selectedLesson.title}</span>
                    )}
                </h2>
                {selectedConfig?.published_version && (
                    <span className="text-xs text-sky-700 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Learners use v{selectedConfig.published_version.version_number}
                        {!selectedConfig.is_enabled && (
                            <span className="text-slate-500">(lesson quiz disabled)</span>
                        )}
                    </span>
                )}
            </div>

            <AdminDataTable
                columns={versionColumns}
                data={versionRows}
                rowKey="id"
                minWidth="860px"
                emptyTitle="No generated question banks"
                emptyDescription={selectedLesson
                    ? `No question banks for "${selectedLesson.title}" yet. Save configuration and generate content.`
                    : 'Select a training module and lesson to view its question banks.'}
                renderActions={(row) => (
                    <div className="flex justify-end items-center gap-1.5">
                        <AdminTableActionButton icon={Eye} title="View" variant="view" onClick={() => openViewPanel(row)} />
                        {row.status !== 'published' && (
                            <>
                                <AdminTableActionButton icon={Pencil} title="Edit" variant="edit" onClick={() => openEditPanel(row)} />
                                <AdminTableActionButton icon={Send} title="Publish" variant="edit" onClick={() => handlePublish(row)} disabled={workflowBusy} />
                            </>
                        )}
                        {row.is_current && <CurrentVersionBadge compact />}
                    </div>
                )}
            />

            {panelMode && activeVersion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[92vh] flex flex-col min-h-0">
                        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 shrink-0">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">
                                    {panelMode === 'view' ? 'View Question Bank' : 'Edit Question Bank'}
                                </h3>
                                <p className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
                                    Version {activeVersion.version_number}
                                    <AssessmentStatusBadge status={activeVersion.status} />
                                    {activeVersion.is_current && <CurrentVersionBadge />}
                                    {questionBankDirty && (
                                        <span className="inline-flex items-center gap-1 text-amber-700">
                                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                            Unsaved Changes
                                        </span>
                                    )}
                                </p>
                            </div>
                            <button type="button" onClick={closePanel} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex flex-1 min-h-0 flex-col">
                            {renderQuestionBankReview(activeVersion, { readOnly: panelMode === 'view' })}
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
        </AdminPageShell>
    );
}
