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

const BANK_COUNTS = [10, 20, 30];
const DEFAULT_BANK_COUNT = 20;

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

const GENERATION_LANGUAGES = [
    { value: 'en', label: 'English' },
    { value: 'fil', label: 'Filipino' },
];
const QUICK_TIME_LIMITS = [10, 15, 20];

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
    const [bankQuestionCount, setBankQuestionCount] = React.useState(DEFAULT_BANK_COUNT);
    const [quizQuestionCount, setQuizQuestionCount] = React.useState(recommendedQuizSizeForBank(DEFAULT_BANK_COUNT));
    const [quizSizePoolNotice, setQuizSizePoolNotice] = React.useState('');
    const [generationLanguage, setGenerationLanguage] = React.useState(AI_SCENARIO_DEFAULT_LANGUAGE);
    const [displayLanguage, setDisplayLanguage] = React.useState(AI_SCENARIO_DEFAULT_LANGUAGE);
    const [timeLimitMinutes, setTimeLimitMinutes] = React.useState(60);
    const [maxAttempts, setMaxAttempts] = React.useState(3);
    const [passingScore, setPassingScore] = React.useState(75);
    const [failRetakePolicy, setFailRetakePolicy] = React.useState('require_lesson_review');
    const [autoSubmitOnExpire, setAutoSubmitOnExpire] = React.useState(true);
    const [shuffleQuestions, setShuffleQuestions] = React.useState(true);
    const [shuffleAnswerChoices, setShuffleAnswerChoices] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [generating, setGenerating] = React.useState(false);
    const [localConfigs, setLocalConfigs] = React.useState(configs || []);

    React.useEffect(() => {
        const existing = configByModuleId[Number(selectedModuleId)];
        if (existing) {
            setDifficulty(existing.difficulty || 'medium');
            const bankCount = normalizeBankCount(existing.bank_question_count || existing.number_of_questions || DEFAULT_BANK_COUNT);
            setBankQuestionCount(bankCount);
            setQuizQuestionCount(normalizeQuizSize(existing.quiz_question_count, bankCount));
            setQuizSizePoolNotice('');
            setGenerationLanguage(existing.generation_language || existing.generated_language || AI_SCENARIO_DEFAULT_LANGUAGE);
            setDisplayLanguage(existing.generated_language || AI_SCENARIO_DEFAULT_LANGUAGE);
            setTimeLimitMinutes(existing.time_limit_minutes > 0 ? existing.time_limit_minutes : 60);
            setMaxAttempts(existing.max_attempts ?? 3);
            setPassingScore(existing.passing_score ?? 75);
            setFailRetakePolicy(existing.fail_retake_policy || 'require_lesson_review');
            setAutoSubmitOnExpire(existing.auto_submit_on_expire !== false);
            setShuffleQuestions(existing.shuffle_questions !== false);
            setShuffleAnswerChoices(existing.shuffle_answer_choices !== false);
        } else {
            setDifficulty('medium');
            setBankQuestionCount(DEFAULT_BANK_COUNT);
            setQuizQuestionCount(recommendedQuizSizeForBank(DEFAULT_BANK_COUNT));
            setQuizSizePoolNotice('');
            setGenerationLanguage(AI_SCENARIO_DEFAULT_LANGUAGE);
            setDisplayLanguage(AI_SCENARIO_DEFAULT_LANGUAGE);
            setTimeLimitMinutes(60);
            setMaxAttempts(3);
            setPassingScore(75);
            setFailRetakePolicy('require_lesson_review');
            setAutoSubmitOnExpire(true);
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
        bank_question_count: bankQuestionCount,
        quiz_question_count: Number(quizQuestionCount),
        generation_language: generationLanguage,
        time_limit_minutes: Number(timeLimitMinutes) > 0 ? Number(timeLimitMinutes) : 60,
        max_attempts: maxAttempts,
        passing_score: passingScore,
        fail_retake_policy: failRetakePolicy,
        auto_submit_on_expire: autoSubmitOnExpire,
        shuffle_questions: shuffleQuestions,
        shuffle_answer_choices: shuffleAnswerChoices,
    });

    const handleBankQuestionCountChange = (nextBank) => {
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
    };

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
                body: JSON.stringify(buildPayload()),
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
                                {buildParticipantQuizSizeOptions(bankQuestionCount).map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                            {quizSizePoolNotice && (
                                <p className="text-xs text-slate-600 mt-1">{quizSizePoolNotice}</p>
                            )}
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
                                                <span className="font-medium">Review All Lessons</span>
                                                <span className="block text-xs text-slate-500">Reset lesson review progress and require the participant to re-open every lesson before retaking the Final Assessment. Lesson quizzes stay passed — no quiz retake. (Recommended)</span>
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
                                                <span className="font-medium">Final Assessment Retake Only</span>
                                                <span className="block text-xs text-slate-500">Keep lesson progress and allow an immediate Final AI Scenario Assessment retake when attempts remain.</span>
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
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        min={1}
                                        max={480}
                                        className={adminCompactInputClass}
                                        value={timeLimitMinutes === '' || timeLimitMinutes === null ? '' : String(timeLimitMinutes)}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/[^\d]/g, '');
                                            setTimeLimitMinutes(raw === '' ? '' : Number(raw));
                                        }}
                                        onBlur={() => {
                                            if (timeLimitMinutes === '' || timeLimitMinutes === null) {
                                                setTimeLimitMinutes(60);
                                                return;
                                            }
                                            setTimeLimitMinutes(Math.min(480, Math.max(1, Number(timeLimitMinutes) || 60)));
                                        }}
                                    />
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {QUICK_TIME_LIMITS.map((minutes) => (
                                            <button
                                                key={minutes}
                                                type="button"
                                                onClick={() => setTimeLimitMinutes(minutes)}
                                                className={`rounded-md border px-2.5 py-1 text-[0.7rem] font-medium transition-colors ${
                                                    Number(timeLimitMinutes) === minutes
                                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                {minutes} min
                                            </button>
                                        ))}
                                    </div>
                                    <p className="mt-1 text-[0.7rem] text-slate-500">
                                        Clear the field to type a new value. Quick presets available above.
                                    </p>
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
                                        <td className="py-2 pr-4">{c.bank_question_count || c.number_of_questions} / {c.quiz_question_count || '—'}</td>
                                        <td className="py-2 pr-4 capitalize">{c.generated_language || 'en'}</td>
                                        <td className="py-2 pr-4">{c.passing_score ?? 75}%</td>
                                        <td className="py-2 pr-4">{c.max_attempts ?? 3}</td>
                                        <td className="py-2 pr-4 text-xs text-slate-600">
                                            {c.fail_retake_policy === 'quiz_retake_only'
                                                ? 'Final Retake Only'
                                                : 'Review All Lessons'}
                                        </td>
                                        <td className="py-2 pr-4">
                                            {c.published_version_id && (c.title_en || c.generated_scenario) ? (
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

