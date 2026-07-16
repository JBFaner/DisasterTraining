import React from 'react';
import Swal from 'sweetalert2';
import {
    Pencil,
    Save,
    X,
    Undo2,
    Redo2,
    Copy,
    Sparkles,
    Loader2,
    Columns2,
    Square,
    Globe,
    Plus,
    Trash2,
} from 'lucide-react';
import {
    AdminPrimaryButton,
    AdminSecondaryButton,
    adminCompactInputClass,
    adminSelectClass,
} from './admin/AdminLayout';
import { AdminTableActionButton } from './admin/AdminDataTable';
import {
    AI_SCENARIO_DEFAULT_LANGUAGE,
    AI_SCENARIO_LANGUAGES,
    resolveAiScenarioLanguage,
    resolveQuestionForLocale,
} from '../utils/aiScenarioLocale';

const LOCALE_FIELDS = {
    en: {
        question: 'question_en',
        explanation: 'explanation_en',
        choices: ['choice_a_en', 'choice_b_en', 'choice_c_en', 'choice_d_en'],
    },
    fil: {
        question: 'question_fil',
        explanation: 'explanation_fil',
        choices: ['choice_a_fil', 'choice_b_fil', 'choice_c_fil', 'choice_d_fil'],
    },
};

function activeQuestions(version) {
    return (version?.generated_questions || []).filter((q) => (q.status || '') !== 'archived');
}

export function questionsToDrafts(questions) {
    return questions.map((question) => {
        const en = resolveQuestionForLocale(question, 'en', { includeAnswers: true });
        const fil = resolveQuestionForLocale(question, 'fil', { includeAnswers: true });

        return {
            number: question.number,
            question_en: en.question || '',
            question_fil: fil.question || '',
            choice_a_en: en.choices?.A || '',
            choice_b_en: en.choices?.B || '',
            choice_c_en: en.choices?.C || '',
            choice_d_en: en.choices?.D || '',
            choice_a_fil: fil.choices?.A || '',
            choice_b_fil: fil.choices?.B || '',
            choice_c_fil: fil.choices?.C || '',
            choice_d_fil: fil.choices?.D || '',
            correct_answer: String(en.correct_answer || 'A').toUpperCase(),
            explanation_en: en.explanation || '',
            explanation_fil: fil.explanation || '',
        };
    });
}

function serializeDrafts(drafts) {
    return JSON.stringify(drafts);
}

function getDirtyDrafts(localDrafts, baselineDrafts) {
    const baselineMap = new Map(baselineDrafts.map((d) => [d.number, d]));

    return localDrafts.filter((draft) => {
        const baseline = baselineMap.get(draft.number);
        if (!baseline) return true;
        return JSON.stringify(draft) !== JSON.stringify(baseline);
    });
}

function ReviewToolbar({
    viewMode,
    onViewModeChange,
    displayLanguage,
    onDisplayLanguageChange,
    hasUnsavedChanges,
    readOnly,
}) {
    const currentLanguage = resolveAiScenarioLanguage(displayLanguage);

    return (
        <div className="shrink-0 z-20 border-b border-slate-200 bg-white px-5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">View Mode</span>
                        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5">
                            <button
                                type="button"
                                onClick={() => onViewModeChange('single')}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                    viewMode === 'single'
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Square className="w-3.5 h-3.5" />
                                Single View
                            </button>
                            <button
                                type="button"
                                onClick={() => onViewModeChange('split')}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                    viewMode === 'split'
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Columns2 className="w-3.5 h-3.5" />
                                Split View
                            </button>
                        </div>
                    </div>

                    {viewMode === 'single' && (
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <Globe className="w-3.5 h-3.5" aria-hidden />
                                Language
                            </span>
                            <div
                                className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5"
                                role="group"
                                aria-label="Display language"
                            >
                                {Object.entries(AI_SCENARIO_LANGUAGES).map(([code, meta]) => {
                                    const active = currentLanguage === code;

                                    return (
                                        <button
                                            key={code}
                                            type="button"
                                            onClick={() => onDisplayLanguageChange(code)}
                                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                                active
                                                    ? 'bg-emerald-600 text-white shadow-sm'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                            aria-pressed={active}
                                        >
                                            {meta.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {hasUnsavedChanges && !readOnly && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                        <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden />
                        Unsaved Changes
                    </span>
                )}
            </div>
        </div>
    );
}

function LocaleColumn({
    locale,
    draft,
    readOnly,
    isEditing,
    onFieldChange,
    showCorrectHighlight = true,
}) {
    const meta = AI_SCENARIO_LANGUAGES[locale];
    const fields = LOCALE_FIELDS[locale];
    const choiceLetters = ['A', 'B', 'C', 'D'];

    return (
        <div className="space-y-3 min-w-0">
            <div className="flex items-center gap-2">
                <span aria-hidden>{meta?.flag}</span>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{meta?.label}</span>
                {locale === 'en' && (
                    <span className="text-[0.65rem] font-medium text-slate-400">(Source)</span>
                )}
            </div>

            {isEditing && !readOnly ? (
                <textarea
                    rows={3}
                    className={adminCompactInputClass}
                    value={draft[fields.question]}
                    onChange={(e) => onFieldChange(fields.question, e.target.value)}
                    placeholder="Question text"
                />
            ) : (
                <p className="text-sm font-medium text-slate-900 whitespace-pre-wrap">{draft[fields.question] || '—'}</p>
            )}

            <div className="space-y-2">
                {choiceLetters.map((letter, index) => {
                    const fieldKey = fields.choices[index];
                    const isCorrect = draft.correct_answer === letter;

                    return (
                        <div key={letter} className="flex items-start gap-3">
                            <span
                                className={`w-6 shrink-0 text-sm font-medium leading-6 ${isCorrect && showCorrectHighlight ? 'text-emerald-700' : 'text-slate-500'}`}
                            >
                                {letter}.
                            </span>
                            {isEditing && !readOnly ? (
                                <input
                                    className={`${adminCompactInputClass} flex-1 min-w-0`}
                                    value={draft[fieldKey]}
                                    onChange={(e) => onFieldChange(fieldKey, e.target.value)}
                                    placeholder={`Choice ${letter}`}
                                />
                            ) : (
                                <span
                                    className={`text-sm flex-1 min-w-0 leading-6 ${isCorrect && showCorrectHighlight ? 'text-emerald-700 font-medium' : 'text-slate-700'}`}
                                >
                                    {draft[fieldKey] || '—'}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Explanation</p>
                {isEditing && !readOnly ? (
                    <textarea
                        rows={2}
                        className={adminCompactInputClass}
                        value={draft[fields.explanation]}
                        onChange={(e) => onFieldChange(fields.explanation, e.target.value)}
                        placeholder="Explanation"
                    />
                ) : (
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{draft[fields.explanation] || '—'}</p>
                )}
            </div>
        </div>
    );
}

function QuestionReviewCard({
    draft,
    viewMode,
    displayLanguage,
    readOnly,
    editable,
    isEditing,
    canUndo,
    canRedo,
    busy,
    onEdit,
    onSave,
    onCancel,
    onUndo,
    onRedo,
    onDuplicate,
    onRegenerate,
    onDelete,
    onFieldChange,
    onCorrectAnswerChange,
}) {
    const showSingle = viewMode === 'single';
    const singleLocale = displayLanguage;

    return (
        <article className={`rounded-xl border bg-white transition-colors ${isEditing ? 'border-emerald-300 ring-1 ring-emerald-100' : 'border-slate-200'}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                <h4 className="text-sm font-semibold text-slate-900">Question #{draft.number}</h4>
                {editable && (
                    <div className="flex flex-wrap items-center gap-1">
                        {isEditing ? (
                            <>
                                <AdminTableActionButton icon={Undo2} title="Undo" variant="view" onClick={onUndo} disabled={!canUndo || busy} />
                                <AdminTableActionButton icon={Redo2} title="Redo" variant="view" onClick={onRedo} disabled={!canRedo || busy} />
                                <AdminTableActionButton icon={Save} title="Save" variant="edit" onClick={onSave} disabled={busy} />
                                <AdminTableActionButton icon={X} title="Cancel" variant="view" onClick={onCancel} disabled={busy} />
                            </>
                        ) : (
                            <>
                                <AdminTableActionButton icon={Pencil} title="Edit" variant="edit" onClick={onEdit} disabled={busy} />
                                <AdminTableActionButton icon={Copy} title="Duplicate" variant="view" onClick={onDuplicate} disabled={busy} />
                                <AdminTableActionButton icon={Sparkles} title="Regenerate Question with AI" variant="view" onClick={onRegenerate} disabled={busy} />
                                <AdminTableActionButton icon={Trash2} title="Delete Question" variant="danger" onClick={onDelete} disabled={busy} />
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="p-4 space-y-4">
                {isEditing && editable && (
                    <div className="max-w-xs">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Correct Answer</label>
                        <select
                            className={adminSelectClass}
                            value={draft.correct_answer}
                            onChange={(e) => onCorrectAnswerChange(e.target.value)}
                        >
                            {['A', 'B', 'C', 'D'].map((letter) => (
                                <option key={letter} value={letter}>{letter}</option>
                            ))}
                        </select>
                    </div>
                )}

                {showSingle ? (
                    <LocaleColumn
                        locale={singleLocale}
                        draft={draft}
                        readOnly={readOnly}
                        isEditing={isEditing}
                        onFieldChange={onFieldChange}
                    />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <LocaleColumn
                            locale="en"
                            draft={draft}
                            readOnly={readOnly}
                            isEditing={isEditing}
                            onFieldChange={onFieldChange}
                        />
                        <div className="lg:border-l lg:border-slate-100 lg:pl-6">
                            <LocaleColumn
                                locale="fil"
                                draft={draft}
                                readOnly={readOnly}
                                isEditing={isEditing}
                                onFieldChange={onFieldChange}
                            />
                        </div>
                    </div>
                )}
            </div>
        </article>
    );
}

export function LessonQuizQuestionBankReview({
    version,
    lessonTitle,
    quizQuestionCount,
    readOnly = false,
    editable = false,
    workflowBusy = false,
    languageVersionsPanel = null,
    prependContent = null,
    workflowUrl,
    apiFetch,
    onVersionUpdated,
    onDirtyChange,
}) {
    const [viewMode, setViewMode] = React.useState('split');
    const [displayLanguage, setDisplayLanguage] = React.useState(
        version?.generated_language || AI_SCENARIO_DEFAULT_LANGUAGE,
    );
    const [localDrafts, setLocalDrafts] = React.useState([]);
    const [baselineDrafts, setBaselineDrafts] = React.useState([]);
    const [editingNumber, setEditingNumber] = React.useState(null);
    const [editSession, setEditSession] = React.useState(null);
    const [saving, setSaving] = React.useState(false);
    const [actionBusy, setActionBusy] = React.useState(false);
    const pendingEditRef = React.useRef(null);

    const questions = React.useMemo(() => activeQuestions(version), [version]);
    const questionSignature = React.useMemo(
        () => JSON.stringify(version?.generated_questions || []),
        [version?.generated_questions],
    );

    React.useEffect(() => {
        const drafts = questionsToDrafts(questions);
        setLocalDrafts(drafts);
        setBaselineDrafts(drafts);

        const editNumber = pendingEditRef.current;
        if (editNumber != null) {
            const draft = drafts.find((item) => item.number === editNumber);
            if (draft) {
                setEditingNumber(editNumber);
                setEditSession({ draft: { ...draft }, past: [], future: [] });
            } else {
                setEditingNumber(null);
                setEditSession(null);
            }
            pendingEditRef.current = null;
        } else {
            setEditingNumber(null);
            setEditSession(null);
        }

        setDisplayLanguage(version?.generated_language || AI_SCENARIO_DEFAULT_LANGUAGE);
    }, [version?.id, questionSignature]);

    const hasUnsavedChanges = React.useMemo(
        () => serializeDrafts(localDrafts) !== serializeDrafts(baselineDrafts),
        [localDrafts, baselineDrafts],
    );

    const dirtyDrafts = React.useMemo(
        () => getDirtyDrafts(localDrafts, baselineDrafts),
        [localDrafts, baselineDrafts],
    );

    const confirmLeave = React.useCallback(() => {
        if (!hasUnsavedChanges) return true;
        return window.confirm('You have unsaved changes. Do you want to leave without saving?');
    }, [hasUnsavedChanges]);

    React.useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (!hasUnsavedChanges) return;
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    React.useEffect(() => {
        onDirtyChange?.(hasUnsavedChanges);
    }, [hasUnsavedChanges, onDirtyChange]);

    const updateEditDraft = React.useCallback((updater) => {
        setEditSession((prev) => {
            if (!prev) return prev;
            const nextDraft = typeof updater === 'function' ? updater(prev.draft) : updater;
            return {
                draft: nextDraft,
                past: [...prev.past, prev.draft],
                future: [],
            };
        });
    }, []);

    const startEdit = (number) => {
        if (editingNumber != null && editingNumber !== number && editSession) {
            setLocalDrafts((prev) => prev.map((d) => (
                d.number === editingNumber ? { ...editSession.draft } : d
            )));
        }

        const draft = localDrafts.find((d) => d.number === number)
            ?? (editingNumber === number && editSession ? editSession.draft : null);
        if (!draft) return;

        setEditingNumber(number);
        setEditSession({ draft: { ...draft }, past: [], future: [] });
    };

    const cancelEdit = () => {
        setEditingNumber(null);
        setEditSession(null);
    };

    const saveEditLocally = () => {
        if (!editSession || editingNumber == null) return;
        setLocalDrafts((prev) => prev.map((d) => (
            d.number === editingNumber ? { ...editSession.draft } : d
        )));
        setEditingNumber(null);
        setEditSession(null);
    };

    const undoEdit = () => {
        setEditSession((prev) => {
            if (!prev || prev.past.length === 0) return prev;
            const previous = prev.past[prev.past.length - 1];
            return {
                draft: previous,
                past: prev.past.slice(0, -1),
                future: [prev.draft, ...prev.future],
            };
        });
    };

    const redoEdit = () => {
        setEditSession((prev) => {
            if (!prev || prev.future.length === 0) return prev;
            const next = prev.future[0];
            return {
                draft: next,
                past: [...prev.past, prev.draft],
                future: prev.future.slice(1),
            };
        });
    };

    const applyVersion = (data) => {
        if (data?.version) {
            const drafts = questionsToDrafts(activeQuestions(data.version));
            setLocalDrafts(drafts);
            setBaselineDrafts(drafts);
            setEditingNumber(null);
            setEditSession(null);
            onVersionUpdated?.(data.version, data.config);
        }
    };

    const runAction = async (runner) => {
        setActionBusy(true);
        try {
            await runner();
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Action failed', text: err.message });
        } finally {
            setActionBusy(false);
        }
    };

    const saveAllChanges = async () => {
        if (!editable) return;

        const mergedDrafts = (editingNumber != null && editSession)
            ? localDrafts.map((d) => (d.number === editingNumber ? { ...editSession.draft } : d))
            : localDrafts;

        const draftsToSave = getDirtyDrafts(mergedDrafts, baselineDrafts);
        if (draftsToSave.length === 0) return;

        setEditingNumber(null);
        setEditSession(null);
        setLocalDrafts(mergedDrafts);

        setSaving(true);
        try {
            const data = await apiFetch(workflowUrl('/questions/bulk-save'), {
                method: 'POST',
                body: JSON.stringify({ questions: draftsToSave }),
            });
            applyVersion(data);
            Swal.fire({ icon: 'success', title: 'Changes saved', timer: 1800, showConfirmButton: false });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Save failed', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleAddQuestion = async () => {
        await runAction(async () => {
            const data = await apiFetch(workflowUrl('/questions'), {
                method: 'POST',
                body: JSON.stringify({
                    question_en: 'New scenario question',
                    choice_a_en: 'Option A',
                    choice_b_en: 'Option B',
                    choice_c_en: 'Option C',
                    choice_d_en: 'Option D',
                    correct_answer: 'A',
                    explanation_en: '',
                    competency: 'knowledge',
                }),
            });
            const newNumber = Math.max(0, ...activeQuestions(data.version).map((item) => item.number));
            pendingEditRef.current = newNumber;
            applyVersion(data);
        });
    };

    const handleDuplicate = async (number) => {
        await runAction(async () => {
            const data = await apiFetch(workflowUrl(`/questions/${number}/duplicate`), { method: 'POST' });
            applyVersion(data);
        });
    };

    const handleRegenerate = async (number) => {
        if (!window.confirm('Regenerate this question with AI? Current content will be replaced.')) return;

        await runAction(async () => {
            const data = await apiFetch(workflowUrl(`/questions/${number}/regenerate`), { method: 'POST' });
            applyVersion(data);
            Swal.fire({ icon: 'success', title: 'Question regenerated', timer: 1600, showConfirmButton: false });
        });
    };

    const handleDelete = async (number) => {
        const result = await Swal.fire({
            title: `Delete Question #${number}?`,
            text: 'This removes the question from the draft bank. You can still add or generate new ones.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            confirmButtonColor: '#dc2626',
        });
        if (!result.isConfirmed) return;

        await runAction(async () => {
            const data = await apiFetch(workflowUrl(`/questions/${number}`), { method: 'DELETE' });
            applyVersion(data);
            if (editingNumber === number) {
                setEditingNumber(null);
                setEditSession(null);
            }
            Swal.fire({ icon: 'success', title: 'Question deleted', timer: 1400, showConfirmButton: false });
        });
    };

    const handleGenerateQuestion = async () => {
        const result = await Swal.fire({
            title: 'Generate a new Q&A with AI?',
            text: 'Gemini will create one new question and answer based on this module/lesson, then add it to the bank.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Generate',
            confirmButtonColor: '#059669',
        });
        if (!result.isConfirmed) return;

        await runAction(async () => {
            const data = await apiFetch(workflowUrl('/questions/generate'), { method: 'POST' });
            const newNumber = Math.max(0, ...activeQuestions(data.version).map((item) => item.number));
            pendingEditRef.current = newNumber;
            applyVersion(data);
            Swal.fire({ icon: 'success', title: 'AI question added', timer: 1600, showConfirmButton: false });
        });
    };

    const busy = workflowBusy || saving || actionBusy;
    const displayDrafts = localDrafts;

    return (
        <div className="relative flex flex-1 min-h-0 flex-col">
            <ReviewToolbar
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                displayLanguage={displayLanguage}
                onDisplayLanguageChange={setDisplayLanguage}
                hasUnsavedChanges={hasUnsavedChanges}
                readOnly={readOnly || !editable}
            />

            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
                <div className="space-y-6">
                    {prependContent}

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
                        <h3 className="text-lg font-semibold text-slate-900">{lessonTitle || 'Lesson Quiz'}</h3>
                        <p className="text-xs text-slate-500">
                            Version {version.version_number}
                            {' · '}
                            {displayDrafts.length} questions in bank
                        </p>
                        <p className="text-sm text-slate-600">
                            Participants receive {quizQuestionCount || '—'} random questions per attempt from this published bank.
                        </p>
                        {viewMode === 'split' && (
                            <p className="text-xs text-slate-500">
                                Split view shows English (source) beside Filipino for faster translation review.
                            </p>
                        )}
                    </div>

                    {languageVersionsPanel}

                    <div>
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                            <h4 className="text-sm font-semibold text-slate-800">Questions ({displayDrafts.length})</h4>
                            {editable && !readOnly ? (
                                <div className="flex flex-wrap items-center gap-2">
                                    <AdminSecondaryButton
                                        type="button"
                                        onClick={handleGenerateQuestion}
                                        disabled={busy}
                                        className="inline-flex items-center gap-1.5 text-xs"
                                    >
                                        {actionBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                        Generate Q&A with AI
                                    </AdminSecondaryButton>
                                    <AdminSecondaryButton
                                        type="button"
                                        onClick={handleAddQuestion}
                                        disabled={busy}
                                        className="inline-flex items-center gap-1.5 text-xs"
                                    >
                                        {actionBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                        Add Blank Question
                                    </AdminSecondaryButton>
                                </div>
                            ) : null}
                        </div>
                        <div className="space-y-4 pb-20">
                            {displayDrafts.map((draft) => {
                                const isEditing = editingNumber === draft.number;
                                const activeDraft = isEditing && editSession ? editSession.draft : draft;

                                return (
                                    <QuestionReviewCard
                                        key={draft.number}
                                        draft={activeDraft}
                                        viewMode={viewMode}
                                        displayLanguage={displayLanguage}
                                        readOnly={readOnly}
                                        editable={editable}
                                        isEditing={isEditing}
                                        canUndo={Boolean(editSession?.past?.length)}
                                        canRedo={Boolean(editSession?.future?.length)}
                                        busy={busy}
                                        onEdit={() => startEdit(draft.number)}
                                        onSave={saveEditLocally}
                                        onCancel={cancelEdit}
                                        onUndo={undoEdit}
                                        onRedo={redoEdit}
                                        onDuplicate={() => handleDuplicate(draft.number)}
                                        onRegenerate={() => handleRegenerate(draft.number)}
                                        onDelete={() => handleDelete(draft.number)}
                                        onFieldChange={(field, value) => updateEditDraft((current) => ({ ...current, [field]: value }))}
                                        onCorrectAnswerChange={(value) => updateEditDraft((current) => ({ ...current, correct_answer: value }))}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {hasUnsavedChanges && editable && !readOnly && (
                <div className="pointer-events-none absolute bottom-4 right-4 z-30">
                    <AdminPrimaryButton
                        type="button"
                        onClick={saveAllChanges}
                        disabled={busy}
                        className="pointer-events-auto shadow-lg px-5 py-3 text-sm inline-flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                        {dirtyDrafts.length > 0 && (
                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{dirtyDrafts.length}</span>
                        )}
                    </AdminPrimaryButton>
                </div>
            )}
        </div>
    );
}

export { confirmUnsavedQuestionBankChanges };

function confirmUnsavedQuestionBankChanges(hasUnsavedChanges) {
    if (!hasUnsavedChanges) return true;
    return window.confirm('You have unsaved changes. Do you want to leave without saving?');
}
