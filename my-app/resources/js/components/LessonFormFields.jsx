import React from 'react';
import { createPortal } from 'react-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { AlertCircle, HelpCircle, Plus } from 'lucide-react';
import { hasRichTextContent, LessonRichTextEditor } from './LessonRichTextEditor';
import { showAppChoice } from '../utils/appAlert';

import { blurAllFocus } from '../utils/blurFocus';

export { blurAllFocus };

export function LessonConfirmDialog({
    open,
    title,
    description,
    icon = 'warning',
    buttons = [],
    onOpenChange,
}) {
  const iconNode = icon === 'error'
        ? <AlertCircle className="mx-auto mb-3 h-12 w-12 text-red-500" />
        : <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-400 text-2xl text-amber-500">!</span>;

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[300] bg-black/50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 z-[301] w-[min(100%,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl outline-none">
                    <div className="text-center">
                        {iconNode}
                        <Dialog.Title className="text-lg font-semibold text-slate-800">{title}</Dialog.Title>
                        {description ? (
                            <Dialog.Description className="mt-2 text-sm text-slate-600">
                                {description}
                            </Dialog.Description>
                        ) : (
                            <Dialog.Description className="sr-only">{title}</Dialog.Description>
                        )}
                    </div>
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                        {buttons.map((button) => {
                            const base = 'rounded-lg px-4 py-2 text-sm font-semibold';
                            const variantClass = button.variant === 'danger'
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : button.variant === 'secondary'
                                    ? 'bg-slate-500 text-white hover:bg-slate-600'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700';

                            return (
                                <button
                                    key={button.label}
                                    type="button"
                                    onClick={button.onClick}
                                    className={`${base} ${variantClass}`}
                                >
                                    {button.label}
                                </button>
                            );
                        })}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

export function RedInfoTip({ text, className = '', align = 'start' }) {
    const anchorRef = React.useRef(null);
    const [open, setOpen] = React.useState(false);
    const [position, setPosition] = React.useState({ top: 0, left: 0 });

    const updatePosition = React.useCallback(() => {
        if (!anchorRef.current) return;
        const rect = anchorRef.current.getBoundingClientRect();
        setPosition({
            top: rect.bottom + 8,
            left: align === 'center' ? rect.left + (rect.width / 2) : rect.left,
        });
    }, [align]);

    const show = () => {
        updatePosition();
        setOpen(true);
    };

    const hide = () => setOpen(false);

    return (
        <>
            <button
                ref={anchorRef}
                type="button"
                className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-red-500 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 ${className}`}
                aria-label="More information"
                onMouseEnter={show}
                onMouseLeave={hide}
                onFocus={show}
                onBlur={hide}
            >
                <HelpCircle className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
            {open && createPortal(
                <span
                    role="tooltip"
                    style={{
                        position: 'fixed',
                        top: position.top,
                        left: position.left,
                        transform: align === 'center' ? 'translateX(-50%)' : 'none',
                        zIndex: 10000,
                    }}
                    className="pointer-events-none w-72 rounded-lg bg-slate-800 px-3 py-2 text-left text-[0.7rem] leading-relaxed text-white shadow-xl"
                >
                    {text}
                </span>,
                document.body,
            )}
        </>
    );
}

export function FieldLabel({ children, tip, required = false }) {
    return (
        <div className="mb-1 flex items-center gap-1.5">
            <label className="text-[0.7rem] font-semibold text-slate-600">
                {children}
                {required ? ' *' : ''}
            </label>
            {tip ? <RedInfoTip text={tip} /> : null}
        </div>
    );
}

const EXTRA_RESOURCE_OPTIONS = [
    { value: 'image', label: 'Image' },
    { value: 'youtube', label: 'YouTube Link' },
    { value: 'video', label: 'Video File' },
    { value: 'pdf', label: 'PDF Attachment' },
];

function ExtraResourceBlock({ resource, onRemove, fieldErrors = {}, onClearFieldError }) {
    if (resource.type === 'image') {
        return (
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700">Image</span>
                    <button type="button" onClick={onRemove} className="text-xs text-rose-600 hover:text-rose-700">Remove</button>
                </div>
                <input name="images[]" type="file" accept="image/*" multiple className="w-full text-sm" />
                <p className="text-xs text-slate-500">You can select one or more image files.</p>
            </div>
        );
    }

    if (resource.type === 'youtube') {
        return (
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700">YouTube Link</span>
                    <button type="button" onClick={onRemove} className="text-xs text-rose-600 hover:text-rose-700">Remove</button>
                </div>
                <input name="video_url" type="url" placeholder="https://www.youtube.com/watch?v=..." className={`w-full rounded-xl border px-3 py-2 text-sm ${fieldErrors.video_url ? 'border-rose-400' : 'border-slate-300'}`} onChange={() => onClearFieldError?.('video_url')} />
                {fieldErrors.video_url ? <p className="text-xs text-rose-600">{fieldErrors.video_url}</p> : null}
                <p className="text-xs text-slate-500">Reference video only. AI quiz generation uses the lesson rich text content above.</p>
            </div>
        );
    }

    if (resource.type === 'video') {
        return (
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700">Video File</span>
                    <button type="button" onClick={onRemove} className="text-xs text-rose-600 hover:text-rose-700">Remove</button>
                </div>
                <input name="video_file" type="file" accept="video/mp4,video/quicktime,video/x-msvideo" className="w-full text-sm" onChange={() => onClearFieldError?.('video_file')} />
                {fieldErrors.video_file ? <p className="text-xs text-rose-600">{fieldErrors.video_file}</p> : null}
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">PDF Attachment</span>
                <button type="button" onClick={onRemove} className="text-xs text-rose-600 hover:text-rose-700">Remove</button>
            </div>
            <input name="attachments[]" type="file" accept=".pdf,application/pdf" multiple className="w-full text-sm" />
            <p className="text-xs text-slate-500">You can select one or more PDF files.</p>
        </div>
    );
}

export function LessonExtraResourcesField({ resources, onChange, fieldErrors = {}, onClearFieldError }) {
    const [selectedType, setSelectedType] = React.useState('');

    const addResource = () => {
        if (!selectedType) return;

        if (selectedType === 'youtube' && resources.some((item) => item.type === 'youtube')) {
            return;
        }
        if (selectedType === 'video' && resources.some((item) => item.type === 'video')) {
            return;
        }

        onChange([...resources, { id: `${selectedType}-${Date.now()}`, type: selectedType }]);
        setSelectedType('');
    };

    const removeResource = (id) => {
        onChange(resources.filter((item) => item.id !== id));
    };

    const availableOptions = EXTRA_RESOURCE_OPTIONS.filter((option) => {
        if (option.value === 'youtube') {
            return !resources.some((item) => item.type === 'youtube');
        }
        if (option.value === 'video') {
            return !resources.some((item) => item.type === 'video');
        }
        return true;
    });

    return (
        <div className="space-y-3">
            <FieldLabel tip="Optional supporting materials. AI quiz questions and answers are generated from the rich text content above, not from transcripts or attachments.">
                Add More Resources
            </FieldLabel>

            <div className="flex flex-wrap items-center gap-2">
                <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="min-w-[180px] flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
                >
                    <option value="">Select resource type…</option>
                    {availableOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
                <button
                    type="button"
                    onClick={addResource}
                    disabled={!selectedType}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                </button>
            </div>

            {resources.length === 0 ? (
                <p className="text-xs text-slate-500">No additional resources added yet.</p>
            ) : (
                <div className="space-y-2">
                    {resources.map((resource) => (
                        <ExtraResourceBlock
                            key={resource.id}
                            resource={resource}
                            onRemove={() => removeResource(resource.id)}
                            fieldErrors={fieldErrors}
                            onClearFieldError={onClearFieldError}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function validateLessonForm({
    lessonTitle,
    contentBody,
    form = null,
    extraResources = [],
    mode = 'create',
}) {
    const errors = {};
    const trimmedTitle = String(lessonTitle || '').trim();

    if (!trimmedTitle) {
        errors.title = 'Lesson title is required.';
    } else if (trimmedTitle.length > 255) {
        errors.title = 'Lesson title must be 255 characters or less.';
    }

    const resolvedContent = resolveLessonContentBody(form, contentBody);
    if (mode === 'create' && !hasRichTextContent(resolvedContent)) {
        errors.content_body = 'Training content is required. Add lesson text in the rich text editor.';
    }

    if (form && (extraResources || []).length > 0) {
        const videoUrl = form.querySelector('input[name="video_url"]')?.value?.trim();
        if (extraResources.some((item) => item.type === 'youtube') && !videoUrl) {
            errors.video_url = 'YouTube URL is required when a YouTube resource is added.';
        }

        const videoFileInput = form.querySelector('input[name="video_file"]');
        if (extraResources.some((item) => item.type === 'video') && !(videoFileInput?.files?.length > 0)) {
            errors.video_file = 'Please select a video file for the video resource.';
        }
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    };
}

export function resolveLessonContentBody(form, contentBody) {
    const editorEl = form?.querySelector('.lesson-rich-editor [contenteditable="true"]');
    const editorHtml = editorEl?.innerHTML || '';

    if (hasRichTextContent(contentBody)) {
        return contentBody;
    }

    if (hasRichTextContent(editorHtml)) {
        return editorHtml;
    }

    return contentBody || editorHtml || '';
}

export function buildLessonFormOverrides(form, contentBody) {
    return {
        content_body: resolveLessonContentBody(form, contentBody),
        storage_target: 'auto',
    };
}

export function lessonFormHasFileUploads(form) {
    if (!form) {
        return false;
    }

    const fileInputs = form.querySelectorAll('input[type="file"]');
    return Array.from(fileInputs).some((input) => (input.files?.length ?? 0) > 0);
}

export function resolveResourceStorageTarget(resourceType) {
    return ['image', 'video'].includes(resourceType) ? 'auto' : 'local';
}

export function getLessonTextResource(lesson) {
    const resources = lesson?.resources || [];
    return resources.find((resource) => resource.resource_type === 'text' && resource.title === 'Training Content')
        || resources.find((resource) => resource.resource_type === 'text')
        || null;
}

export function buildLessonFormSnapshot(lesson) {
    const textResource = getLessonTextResource(lesson);

    return {
        lessonTitle: lesson?.title || '',
        contentBody: textResource?.body || '',
        extraResources: [],
    };
}

export function hasLessonFormInput({ lessonTitle, contentBody, extraResources }) {
    return Boolean(
        lessonTitle.trim()
        || hasRichTextContent(contentBody)
        || (extraResources || []).length > 0,
    );
}

export function isLessonFormDirty(current, baseline) {
    if (!baseline) {
        return hasLessonFormInput(current);
    }

    return JSON.stringify({
        lessonTitle: current.lessonTitle?.trim() || '',
        contentBody: current.contentBody || '',
        extraResources: (current.extraResources || []).map((item) => item.type),
    }) !== JSON.stringify({
        lessonTitle: baseline.lessonTitle?.trim() || '',
        contentBody: baseline.contentBody || '',
        extraResources: (baseline.extraResources || []).map((item) => item.type),
    });
}

export function getLessonDraftKey(moduleId, lessonId = null) {
    return lessonId ? `lesson-edit-draft-${moduleId}-${lessonId}` : `lesson-add-draft-${moduleId}`;
}

export function readLessonDraft(key) {
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function writeLessonDraft(key, data) {
    window.localStorage.setItem(key, JSON.stringify({
        ...data,
        savedAt: new Date().toISOString(),
    }));
}

export function clearLessonDraft(key) {
    window.localStorage.removeItem(key);
}

export function useLessonClosePrompt({
    isDirty,
    onSaveDraft,
    onDiscard,
    title = 'Unsaved changes',
    description = 'You have unsaved lesson changes. What would you like to do?',
}) {
    const requestClose = React.useCallback(async () => {
        if (!isDirty) {
            return true;
        }

        const choice = await showAppChoice({
            title,
            description,
            buttons: [
                { label: 'Save as draft', variant: 'primary', value: 'draft' },
                { label: 'Discard changes', variant: 'danger', value: 'discard' },
                { label: 'Keep editing', variant: 'secondary', value: 'cancel' },
            ],
        });

        if (choice === 'draft') {
            const saved = await Promise.resolve(onSaveDraft?.());
            return saved !== false;
        }

        if (choice === 'discard') {
            onDiscard?.();
            return true;
        }

        return false;
    }, [description, isDirty, onDiscard, onSaveDraft, title]);

    return { requestClose, dialog: null };
}

export function LessonAuditTrail({ lesson, resources = [] }) {
    const creatorName = lesson?.creator?.name || 'Unknown';
    const updaterName = lesson?.updater?.name;
    const createdAt = lesson?.created_at ? new Date(lesson.created_at).toLocaleString() : null;
    const updatedAt = lesson?.updated_at ? new Date(lesson.updated_at).toLocaleString() : null;
    const showUpdated = updaterName && updatedAt && updatedAt !== createdAt;

    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Audit</p>
            <div className="space-y-1 text-xs text-slate-600">
                <p>
                    <span className="font-semibold text-slate-700">Created by:</span>
                    {' '}
                    {creatorName}
                    {createdAt ? ` · ${createdAt}` : ''}
                </p>
                {showUpdated ? (
                    <p>
                        <span className="font-semibold text-slate-700">Last edited by:</span>
                        {' '}
                        {updaterName}
                        {' · '}
                        {updatedAt}
                    </p>
                ) : null}
            </div>
            {resources.length > 0 ? (
                <div className="border-t border-slate-200 pt-2 space-y-1">
                    {resources.map((resource) => {
                        const uploader = resource.creator?.name;
                        if (!uploader) return null;
                        return (
                            <p key={resource.id} className="text-xs text-slate-500">
                                <span className="font-medium text-slate-600">{resource.title}:</span>
                                {' '}
                                uploaded by
                                {' '}
                                {uploader}
                            </p>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
}

export function LessonFormFields({
    lessonTitle,
    setLessonTitle,
    contentBody,
    setContentBody,
    extraResources,
    setExtraResources,
    fieldErrors = {},
    onClearFieldError,
}) {
    return (
        <>
            <div>
                <label className="block text-[0.7rem] font-semibold text-slate-600 mb-1">Training Title *</label>
                <input
                    name="title"
                    type="text"
                    required
                    value={lessonTitle}
                    onChange={(e) => {
                        setLessonTitle(e.target.value);
                        onClearFieldError?.('title');
                    }}
                    className={`w-full rounded-xl border px-3 py-2 text-sm ${
                        fieldErrors.title ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-300'
                    }`}
                    placeholder="Enter lesson title"
                    aria-invalid={fieldErrors.title ? 'true' : 'false'}
                />
                {fieldErrors.title ? (
                    <p className="mt-1 text-xs text-rose-600">{fieldErrors.title}</p>
                ) : null}
            </div>

            <div>
                <FieldLabel required tip="Write the main lesson content here, including learning objectives. This is the primary source for AI quiz question and answer generation.">
                    Training Content (Rich Text)
                </FieldLabel>
                <div className={fieldErrors.content_body ? 'rounded-xl ring-2 ring-rose-300' : ''}>
                    <LessonRichTextEditor
                        value={contentBody}
                        onChange={(value) => {
                            setContentBody(value);
                            onClearFieldError?.('content_body');
                        }}
                        placeholder="Type lesson content with headings, lists, objectives, and formatting…"
                    />
                </div>
                {fieldErrors.content_body ? (
                    <p className="mt-1 text-xs text-rose-600">{fieldErrors.content_body}</p>
                ) : null}
            </div>

            <LessonExtraResourcesField
                resources={extraResources}
                onChange={setExtraResources}
                fieldErrors={fieldErrors}
                onClearFieldError={onClearFieldError}
            />
        </>
    );
}
