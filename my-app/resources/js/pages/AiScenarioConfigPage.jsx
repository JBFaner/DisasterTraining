import React from 'react';
import Swal from 'sweetalert2';
import { Sparkles, BookOpen, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminFilterBar,
    AdminPrimaryButton,
    AdminSecondaryButton,
    AdminContentCard,
    adminSelectClass,
    adminCompactInputClass,
} from '../components/admin/AdminLayout';
import { AiScenarioLanguageSwitcher } from '../components/AiScenarioLanguageSwitcher';
import {
    AI_SCENARIO_DEFAULT_LANGUAGE,
    resolveLearningObjectives,
    resolveQuestionForLocale,
    resolveScenarioDescription,
    resolveScenarioTitle,
} from '../utils/aiScenarioLocale';

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

export function AiScenarioConfigPage({ modules = [], configs = [] }) {
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
    const [difficulty, setDifficulty] = React.useState('medium');
    const [questionCount, setQuestionCount] = React.useState(10);
    const [generationLanguage, setGenerationLanguage] = React.useState(AI_SCENARIO_DEFAULT_LANGUAGE);
    const [displayLanguage, setDisplayLanguage] = React.useState(AI_SCENARIO_DEFAULT_LANGUAGE);
    const [isEnabled, setIsEnabled] = React.useState(true);
    const [timeLimitMinutes, setTimeLimitMinutes] = React.useState(60);
    const [maxAttempts, setMaxAttempts] = React.useState(3);
    const [passingScore, setPassingScore] = React.useState(75);
    const [failRetakePolicy, setFailRetakePolicy] = React.useState('require_lesson_review');
    const [autoSubmitOnExpire, setAutoSubmitOnExpire] = React.useState(true);
    const [allowResumeAttempt, setAllowResumeAttempt] = React.useState(true);
    const [shuffleQuestions, setShuffleQuestions] = React.useState(true);
    const [shuffleAnswerChoices, setShuffleAnswerChoices] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [generating, setGenerating] = React.useState(false);
    const [localConfigs, setLocalConfigs] = React.useState(configs || []);

    React.useEffect(() => {
        const existing = configByModuleId[Number(selectedModuleId)];
        if (existing) {
            setDifficulty(existing.difficulty || 'medium');
            setQuestionCount(existing.number_of_questions || 10);
            setGenerationLanguage(existing.generation_language || existing.generated_language || AI_SCENARIO_DEFAULT_LANGUAGE);
            setDisplayLanguage(existing.generated_language || AI_SCENARIO_DEFAULT_LANGUAGE);
            setIsEnabled(existing.is_enabled !== false);
            setTimeLimitMinutes(existing.time_limit_minutes ?? 60);
            setMaxAttempts(existing.max_attempts ?? 3);
            setPassingScore(existing.passing_score ?? 75);
            setFailRetakePolicy(existing.fail_retake_policy || 'require_lesson_review');
            setAutoSubmitOnExpire(existing.auto_submit_on_expire !== false);
            setAllowResumeAttempt(existing.allow_resume_attempt !== false);
            setShuffleQuestions(existing.shuffle_questions !== false);
            setShuffleAnswerChoices(existing.shuffle_answer_choices !== false);
        } else {
            setDifficulty('medium');
            setQuestionCount(10);
            setGenerationLanguage(AI_SCENARIO_DEFAULT_LANGUAGE);
            setDisplayLanguage(AI_SCENARIO_DEFAULT_LANGUAGE);
            setIsEnabled(true);
            setTimeLimitMinutes(60);
            setMaxAttempts(3);
            setPassingScore(75);
            setFailRetakePolicy('require_lesson_review');
            setAutoSubmitOnExpire(true);
            setAllowResumeAttempt(true);
            setShuffleQuestions(true);
            setShuffleAnswerChoices(true);
        }
    }, [selectedModuleId, configByModuleId]);

    const selectedConfig = localConfigs.find(
        (c) => String(c.training_module_id) === String(selectedModuleId),
    );

    const refreshConfig = (config) => {
        setLocalConfigs((prev) => {
            const others = prev.filter((c) => c.training_module_id !== config.training_module_id);
            return [...others, config];
        });
        if (config.generated_language) {
            setDisplayLanguage(config.generated_language);
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

    const handleSave = async (e) => {
        e.preventDefault();
        if (!selectedModuleId) return;

        setSaving(true);
        try {
            const res = await fetch('/admin/ai-scenario-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    Accept: 'application/json',
                },
                body: JSON.stringify(buildPayload()),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to save configuration');
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
            title: 'Generate AI Scenario & Quiz?',
            html: 'This will call the Gemini API to generate content in the selected language and automatically translate it.<br><br>It may take up to two minutes.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Generate',
            confirmButtonColor: '#059669',
        });

        if (!result.isConfirmed) return;

        setGenerating(true);
        try {
            const saveRes = await fetch('/admin/ai-scenario-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    Accept: 'application/json',
                },
                body: JSON.stringify({ ...buildPayload(), is_enabled: true }),
            });
            const saveData = await saveRes.json();
            if (!saveRes.ok) throw new Error(saveData.message || 'Failed to save configuration');

            const configId = saveData.config?.id;
            if (!configId) throw new Error('Configuration ID missing');

            const genRes = await fetch(`/admin/ai-scenario-config/${configId}/generate`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrf,
                    Accept: 'application/json',
                },
            });
            const genData = await genRes.json();
            if (!genRes.ok) throw new Error(genData.message || 'Generation failed');

            refreshConfig(genData.config);
            setIsEnabled(true);
            setDisplayLanguage(genData.config?.generated_language || generationLanguage);
            Swal.fire({
                icon: 'success',
                title: 'Generated',
                text: `"${resolveScenarioTitle(genData.config, genData.config?.generated_language) || 'Scenario'}" is ready in English and Filipino.`,
            });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Generation failed', text: err.message });
        } finally {
            setGenerating(false);
        }
    };

    const previewTitle = resolveScenarioTitle(selectedConfig, displayLanguage);
    const previewDescription = resolveScenarioDescription(selectedConfig, displayLanguage);
    const previewObjectives = resolveLearningObjectives(selectedConfig, displayLanguage);
    const hasPreview = Boolean(previewTitle || previewDescription);

    return (
        <AdminPageShell>
            <AdminPageHeader
                icon={Sparkles}
                title="AI Scenario Configuration"
                description="Configure Gemini-generated disaster scenarios and quizzes per training module. Participants unlock this after completing all lessons."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <AdminContentCard className="lg:col-span-1 p-4">
                    <h2 className="text-sm font-semibold text-slate-800 mb-3">Configuration</h2>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Training Module</label>
                            <select
                                className={adminCompactInputClass}
                                value={selectedModuleId}
                                onChange={(e) => setSelectedModuleId(e.target.value)}
                                required
                            >
                                <option value="">Select module…</option>
                                {(modules || []).map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Difficulty</label>
                            <select
                                className={adminCompactInputClass}
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                            >
                                {DIFFICULTIES.map((d) => (
                                    <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Number of Questions</label>
                            <select
                                className={adminCompactInputClass}
                                value={questionCount}
                                onChange={(e) => setQuestionCount(Number(e.target.value))}
                            >
                                {QUESTION_COUNTS.map((n) => (
                                    <option key={n} value={n}>{n} questions</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Generation Language</label>
                            <select
                                className={adminCompactInputClass}
                                value={generationLanguage}
                                onChange={(e) => setGenerationLanguage(e.target.value)}
                            >
                                {GENERATION_LANGUAGES.map((lang) => (
                                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                                ))}
                            </select>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={(e) => setIsEnabled(e.target.checked)}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            Enable for participants
                        </label>

                        <div className="pt-4 border-t border-slate-200">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Training Policy</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Passing Score (%)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        className={adminCompactInputClass}
                                        value={passingScore}
                                        onChange={(e) => setPassingScore(Number(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Maximum Attempts</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={20}
                                        className={adminCompactInputClass}
                                        value={maxAttempts}
                                        onChange={(e) => setMaxAttempts(Number(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <p className="block text-xs font-semibold text-slate-600 mb-2">If Participant Fails</p>
                                    <div className="space-y-2">
                                        <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="fail_retake_policy"
                                                value="require_lesson_review"
                                                checked={failRetakePolicy === 'require_lesson_review'}
                                                onChange={(e) => setFailRetakePolicy(e.target.value)}
                                                className="mt-1 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span>
                                                <span className="font-medium">Require Lesson Review</span>
                                                <span className="block text-xs text-slate-500">Reset lesson progress and require the participant to complete all lessons again before retaking the quiz. (Recommended)</span>
                                            </span>
                                        </label>
                                        <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="fail_retake_policy"
                                                value="quiz_retake_only"
                                                checked={failRetakePolicy === 'quiz_retake_only'}
                                                onChange={(e) => setFailRetakePolicy(e.target.value)}
                                                className="mt-1 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span>
                                                <span className="font-medium">Quiz Retake Only</span>
                                                <span className="block text-xs text-slate-500">Keep lesson progress and allow an immediate quiz retake when attempts remain.</span>
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-200">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Quiz Settings</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Time Limit (minutes)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={480}
                                        className={adminCompactInputClass}
                                        value={timeLimitMinutes}
                                        onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                                    />
                                </div>
                                <label className="flex items-center gap-2 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={autoSubmitOnExpire}
                                        onChange={(e) => setAutoSubmitOnExpire(e.target.checked)}
                                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    Auto submit when time expires
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={allowResumeAttempt}
                                        onChange={(e) => setAllowResumeAttempt(e.target.checked)}
                                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    Allow resume attempt
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={shuffleQuestions}
                                        onChange={(e) => setShuffleQuestions(e.target.checked)}
                                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    Shuffle questions
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={shuffleAnswerChoices}
                                        onChange={(e) => setShuffleAnswerChoices(e.target.checked)}
                                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    Shuffle answer choices
                                </label>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                            <AdminPrimaryButton type="submit" disabled={saving || !selectedModuleId}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                Save Settings
                            </AdminPrimaryButton>
                            <AdminSecondaryButton type="button" onClick={handleGenerate} disabled={generating || !selectedModuleId}>
                                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                Generate Scenario & Quiz
                            </AdminSecondaryButton>
                        </div>
                    </form>
                </AdminContentCard>

                <AdminContentCard className="lg:col-span-2 p-4 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-800">Scenario Details</h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Generated content is stored in English and Filipino. Switch languages instantly without calling Gemini again.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                            {hasPreview && (
                                <AiScenarioLanguageSwitcher
                                    value={displayLanguage}
                                    onChange={setDisplayLanguage}
                                />
                            )}
                            {selectedConfig?.generated_at && (
                                <span className="text-[0.65rem] text-slate-500">
                                    Generated {new Date(selectedConfig.generated_at).toLocaleString()}
                                </span>
                            )}
                        </div>
                    </div>

                    {!hasPreview ? (
                        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                            <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                            No scenario generated yet. Save settings and click &quot;Generate Scenario &amp; Quiz&quot;.
                        </div>
                    ) : (
                        <>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-semibold uppercase text-emerald-700 tracking-wide">Scenario</p>
                                <h3 className="text-lg font-semibold text-slate-900 mt-1">{previewTitle}</h3>
                                <p className="text-sm text-slate-700 mt-2 whitespace-pre-line leading-relaxed">
                                    {previewDescription}
                                </p>
                                {previewObjectives && (
                                    <div className="mt-4 pt-4 border-t border-slate-200">
                                        <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Learning Objectives</p>
                                        <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
                                            {previewObjectives.split('\n').filter(Boolean).map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase text-slate-500 mb-2">
                                    Questions ({selectedConfig.generated_questions?.length || 0})
                                </p>
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                                    {(selectedConfig.generated_questions || []).map((q) => {
                                        const localized = resolveQuestionForLocale(q, displayLanguage, { includeAnswers: true });
                                        return (
                                            <div key={q.number} className="rounded-lg border border-slate-200 p-3 text-sm">
                                                <p className="font-medium text-slate-900">Q{localized.number}. {localized.question}</p>
                                                <ul className="mt-2 space-y-0.5 text-slate-600 text-xs">
                                                    {['A', 'B', 'C', 'D'].map((letter) => (
                                                        <li key={letter} className={letter === localized.correct_answer ? 'text-emerald-700 font-semibold' : ''}>
                                                            {letter}. {localized.choices?.[letter]}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </AdminContentCard>
            </div>

            <AdminFilterBar className="mt-2">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">All Configurations</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                                <th className="py-2 pr-4">Module</th>
                                <th className="py-2 pr-4">Difficulty</th>
                                <th className="py-2 pr-4">Questions</th>
                                <th className="py-2 pr-4">Language</th>
                                <th className="py-2 pr-4">Passing</th>
                                <th className="py-2 pr-4">Attempts</th>
                                <th className="py-2 pr-4">Fail Policy</th>
                                <th className="py-2 pr-4">Status</th>
                                <th className="py-2">Generated</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {localConfigs.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-4 text-slate-500 text-center">No configurations yet.</td>
                                </tr>
                            ) : (
                                localConfigs.map((c) => (
                                    <tr key={c.id}>
                                        <td className="py-2 pr-4 font-medium text-slate-800">
                                            {c.training_module?.title || `Module #${c.training_module_id}`}
                                        </td>
                                        <td className="py-2 pr-4 capitalize">{c.difficulty}</td>
                                        <td className="py-2 pr-4">{c.number_of_questions}</td>
                                        <td className="py-2 pr-4 capitalize">{c.generated_language || 'en'}</td>
                                        <td className="py-2 pr-4">{c.passing_score ?? 75}%</td>
                                        <td className="py-2 pr-4">{c.max_attempts ?? 3}</td>
                                        <td className="py-2 pr-4 text-xs text-slate-600">
                                            {c.fail_retake_policy === 'quiz_retake_only'
                                                ? 'Quiz Retake Only'
                                                : 'Lesson Review'}
                                        </td>
                                        <td className="py-2 pr-4">
                                            {c.is_enabled && (c.title_en || c.generated_scenario) ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-medium">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-medium">
                                                    <AlertCircle className="w-3.5 h-3.5" /> Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-2 text-xs text-slate-500">
                                            {c.generated_at ? new Date(c.generated_at).toLocaleString() : '—'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </AdminFilterBar>
        </AdminPageShell>
    );
}

