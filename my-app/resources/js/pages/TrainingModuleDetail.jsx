import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import Swal from 'sweetalert2';
import {
    CalendarDays,
    ChevronDown,
    ChevronLeft,
    ChevronUp,
    Clock3,
    Database,
    Eye,
    FileText,
    GripVertical,
    Image as ImageIcon,
    Loader2,
    Pencil,
    Plus,
    Trash2,
    Users,
    Video,
    Workflow,
    X,
    CheckCircle2,
    AlertCircle,
    Sparkles,
} from 'lucide-react';
import { getCsrfHeaders, getCsrfToken, pingSessionActivity } from '../utils/csrf';
import { registerAppAlert, registerAppChoice, registerAppConfirm, showAppAlert, showAppChoice, showAppConfirm } from '../utils/appAlert';
import {
    LessonAuditTrail,
    LessonConfirmDialog,
    LessonFormFields,
    blurAllFocus,
    buildLessonFormSnapshot,
    buildLessonFormOverrides,
    clearLessonDraft,
    getLessonDraftKey,
    getLessonTextResource,
    isLessonFormDirty,
    readLessonDraft,
    resolveResourceStorageTarget,
    useLessonClosePrompt,
    validateLessonForm,
    writeLessonDraft,
} from '../components/LessonFormFields';
import { AdminContentCard } from '../components/admin/AdminLayout';
import { AdminTableActionButton } from '../components/admin/AdminDataTable';
import {
    CampaignRequestProposedSessionsCell,
    CampaignRequestStatusBadge,
    CommunityRecommendationsTable,
    formatDate,
    formatDateTimeParts,
    formatTime,
    getRecommendedCommunityEntries,
} from '../components/campaign/CampaignRequestUi';

const RESOURCE_TYPE_LABELS = {
    text: 'Rich Text',
    pdf: 'PDF',
    youtube: 'YouTube Video',
    image: 'Image',
};

const RESOURCE_GROUPS = [
    { key: 'text', label: 'Rich Text' },
    { key: 'pdf', label: 'PDF Documents' },
    { key: 'image', label: 'Images' },
    { key: 'youtube', label: 'YouTube Videos' },
];

const AUDIENCE_OPTIONS = [
    { value: 'residents', label: 'Residents' },
    { value: 'barangay_officials', label: 'Barangay Officials' },
    { value: 'emergency_responders', label: 'Emergency Responders' },
    { value: 'volunteers', label: 'Volunteers' },
    { value: 'students', label: 'Students' },
    { value: 'employees', label: 'Employees' },
    { value: 'community_leaders', label: 'Community Leaders' },
    { value: 'others', label: 'Others' },
];

const RECOMMENDED_PARTICIPANTS_OPTIONS = [10, 15, 20, 25, 30];

function toDateTimeLocalValue(value) {
    if (!value) return '';
    return String(value).replace(' ', 'T').slice(0, 16);
}

const DELIVERY_METHOD_LABELS = {
    in_person: 'Face-to-Face',
    online: 'Online',
};

function parseHazardTokens(value) {
    return String(value || '')
        .split(/[,&/]+/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);
}

function resourcesAffectingLessonStatus(resources = []) {
    return resources.filter((resource) => resource.resource_type === 'text');
}

function getLessonStatus(lesson) {
    const resources = resourcesAffectingLessonStatus(lesson.resources || []);

    if (resources.length === 0) {
        return { label: 'No Resources', className: 'bg-slate-100 text-slate-600 border-slate-200' };
    }

    if (resources.some((resource) => ['pending', 'processing'].includes(resource.ai_processing_status))) {
        return { label: 'Processing', className: 'bg-violet-50 text-violet-700 border-violet-200' };
    }

    if (resources.some((resource) => resource.ai_processing_status === 'failed')) {
        return { label: 'Needs Attention', className: 'bg-amber-50 text-amber-800 border-amber-200' };
    }

    return { label: 'Ready', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
}

function isTrainingSessionPartiallyFilled(session) {
    const maxParticipants = Number(session.maximum_participants);

    return Boolean(
        String(session.title || '').trim()
        || String(session.date || '').trim()
        || String(session.start_time || '').trim()
        || String(session.end_time || '').trim()
        || String(session.venue || '').trim()
        || String(session.online_platform || '').trim()
        || String(session.meeting_link || '').trim()
        || (Number.isFinite(maxParticipants) && maxParticipants > 0),
    );
}

function validateTrainingSessionFields(session) {
    const errors = {};

    if (!String(session.date || '').trim()) {
        errors.date = 'Date is required.';
    }
    if (!String(session.start_time || '').trim()) {
        errors.start_time = 'Start time is required.';
    }
    if (!String(session.end_time || '').trim()) {
        errors.end_time = 'End time is required.';
    } else if (String(session.start_time || '').trim() && session.end_time <= session.start_time) {
        errors.end_time = 'End time must be after start time.';
    }

    const deliveryMethod = session.delivery_method || 'in_person';
    if (deliveryMethod === 'in_person') {
        if (!String(session.venue || '').trim()) {
            errors.venue = 'Venue is required for face-to-face sessions.';
        }
    } else if (deliveryMethod === 'online') {
        if (!String(session.online_platform || '').trim()) {
            errors.online_platform = 'Platform is required for online sessions.';
        }
        if (!String(session.meeting_link || '').trim()) {
            errors.meeting_link = 'Meeting link is required for online sessions.';
        }
    }

    const maxParticipants = Number(session.maximum_participants);
    if (!Number.isInteger(maxParticipants) || maxParticipants < 1 || maxParticipants > 500) {
        errors.maximum_participants = 'Enter a number from 1 to 500.';
    }

    return errors;
}

function computeTrainingSessionFieldErrors(sessions) {
    const errorsByIndex = {};

    sessions.forEach((session, index) => {
        if (!isTrainingSessionPartiallyFilled(session)) {
            return;
        }

        const fieldErrors = validateTrainingSessionFields(session);
        if (Object.keys(fieldErrors).length > 0) {
            errorsByIndex[index] = fieldErrors;
        }
    });

    return errorsByIndex;
}

function trainingSessionInputClass(hasError) {
    return [
        'w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2',
        hasError
            ? 'border-rose-400 bg-rose-50/60 text-rose-900 focus:border-rose-500 focus:ring-rose-500/20'
            : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20',
    ].join(' ');
}

function SessionFieldError({ message }) {
    if (!message) return null;

    return <p className="mt-1 text-xs text-rose-600">{message}</p>;
}

function RequiredFieldLabel({ children }) {
    return (
        <label className="block text-xs text-slate-500 mb-1">
            {children}
            {' '}
            <span className="text-rose-500">*</span>
        </label>
    );
}

function formatDuration(minutes) {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function getResourceFileUrl(resource) {
    return resource.display_url || resource.file_url || resource.external_url || null;
}

function getPdfDownloadLabel(resource) {
    const filePath = String(resource.file_path || resource.display_url || '');
    const segment = filePath.split('/').pop() || '';
    const decoded = decodeURIComponent(segment.split('?')[0] || '');

    if (decoded.toLowerCase().endsWith('.pdf')) {
        return decoded;
    }

    const title = String(resource.title || '').trim();
    return title ? `${title}.pdf` : 'Download PDF';
}

function shouldShowAiProcessingStatus() {
    return false;
}

function ResourceDownloadLink({ resource }) {
    const url = getResourceFileUrl(resource);
    if (!url) {
        return <p className="text-xs text-slate-500 mt-1">File unavailable.</p>;
    }

    if (resource.resource_type === 'pdf') {
        return (
            <a
                href={url}
                target="_blank"
                rel="noreferrer"
                download
                className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
            >
                <FileText className="w-3.5 h-3.5" />
                {getPdfDownloadLabel(resource)}
            </a>
        );
    }

    if (resource.resource_type === 'image') {
        return (
            <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
            >
                <ImageIcon className="w-3.5 h-3.5" />
                Open image
            </a>
        );
    }

    if (resource.resource_type === 'video') {
        return (
            <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
            >
                <Video className="w-3.5 h-3.5" />
                Download video
            </a>
        );
    }

    if (resource.resource_type === 'youtube') {
        return (
            <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 hover:underline break-all"
            >
                <Video className="w-3.5 h-3.5 shrink-0" />
                {url}
            </a>
        );
    }

    return null;
}

function LessonSupplementaryResourceItem({
    resource,
    moduleId,
    lessonId,
    editMode = false,
    onDelete,
}) {
    const isFileResource = ['pdf', 'image', 'video', 'youtube'].includes(resource.resource_type);

    return (
        <li className="rounded-xl border border-slate-200 p-3 bg-slate-50/50">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800 text-sm">{resource.title}</p>
                    {resource.creator?.name ? (
                        <p className="text-xs text-slate-500 mt-0.5">Uploaded by {resource.creator.name}</p>
                    ) : null}
                    {isFileResource ? <ResourceDownloadLink resource={resource} /> : null}
                    {shouldShowAiProcessingStatus(resource) ? <ResourceStatusBadge resource={resource} /> : null}
                </div>
                {editMode ? (
                    <form
                        method="POST"
                        action={`/admin/training-modules/${moduleId}/contents/${lessonId}/resources/${resource.id}/delete`}
                        onSubmit={onDelete}
                        className="shrink-0"
                    >
                        <input type="hidden" name="_token" value={getCsrfToken()} />
                        <button type="submit" className="rounded-lg px-2 py-1 text-xs bg-white border border-rose-200 text-rose-700">
                            Delete
                        </button>
                    </form>
                ) : null}
            </div>
        </li>
    );
}

function renderResourcePreview(resource) {
    const url = resource.display_url || resource.file_url || resource.external_url;

    if (resource.resource_type === 'text') {
        return (
            <div
                className="prose prose-sm max-w-none text-slate-700 lesson-rich-editor__body lesson-rich-text-preview"
                dangerouslySetInnerHTML={{ __html: resource.body || '<p>No text content.</p>' }}
            />
        );
    }

    if (resource.resource_type === 'youtube' && url) {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
        if (match) {
            return (
                <div className="aspect-video rounded-lg overflow-hidden border border-slate-200">
                    <iframe src={`https://www.youtube.com/embed/${match[1]}`} title={resource.title} className="w-full h-full" allowFullScreen />
                </div>
            );
        }
    }

    if (resource.resource_type === 'image' && url) {
        return <img src={url} alt={resource.title} className="w-full rounded-lg border border-slate-200 object-contain max-h-96" />;
    }

    if (resource.resource_type === 'pdf' && url) {
        return (
            <a href={url} target="_blank" rel="noreferrer" download className="inline-flex items-center gap-2 text-emerald-700 hover:underline text-sm font-medium">
                <FileText className="w-4 h-4" />
                {getPdfDownloadLabel(resource)}
            </a>
        );
    }

    if (url) {
        return (
            <a href={url} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline text-sm break-all">
                {url}
            </a>
        );
    }

    return <p className="text-sm text-slate-500">No preview available.</p>;
}

function ResourceStatusBadge({ resource }) {
    if (!shouldShowAiProcessingStatus(resource)) {
        return null;
    }

    const isReady = resource.ai_processing_status === 'ready' && resource.has_readable_content;
    const isProcessing = ['pending', 'processing'].includes(resource.ai_processing_status);
    const isFailed = resource.ai_processing_status === 'failed';

    return (
        <div className="flex items-start gap-2 text-xs">
            {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600 mt-0.5" />}
            {isReady && <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600" />}
            {isFailed && <AlertCircle className="w-3.5 h-3.5 text-red-600 mt-0.5" />}
            <div>
                <span className={isReady ? 'text-emerald-700 font-medium' : isFailed ? 'text-red-700' : 'text-slate-600'}>
                    {isReady ? `✅ ${resource.ai_processing_status_label}` : resource.ai_processing_status_label}
                </span>
                {isFailed && resource.ai_processing_error && (
                    <p className="text-red-600 mt-0.5">❌ {resource.ai_processing_error}</p>
                )}
            </div>
        </div>
    );
}

async function submitTrainingForm(form, moduleId, { fieldOverrides = {} } = {}) {
    const ping = await pingSessionActivity();
    if (!ping.ok) {
        await showAppAlert({ icon: 'error', title: 'Session error', description: 'Your session expired. Please refresh and try again.' });
        return false;
    }

    const token = getCsrfToken();
    const formData = new FormData(form);
    formData.set('_token', token);

    Object.entries(fieldOverrides).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            formData.set(key, value);
        }
    });

    const spoofedMethod = formData.get('_method');
    const method = spoofedMethod ? 'POST' : (form.getAttribute('method') || 'POST').toUpperCase();
    const action = new URL(form.getAttribute('action') || '', window.location.origin).pathname;

    let response;
    const controller = new AbortController();
    const uploadTimeoutMs = 300000;
    const timeoutId = window.setTimeout(() => controller.abort(), uploadTimeoutMs);

    try {
        response = await fetch(action, {
            method,
            body: formData,
            credentials: 'same-origin',
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...getCsrfHeaders() },
            signal: controller.signal,
        });
    } catch (error) {
        const isAbort = error?.name === 'AbortError';
        await showAppAlert({
            icon: 'error',
            title: 'Request failed',
            description: isAbort
                ? 'The upload took too long. Try a smaller file or check your connection.'
                : 'The request was interrupted. If you uploaded a large video, check PHP upload limits and Cloudinary settings.',
        });
        return false;
    } finally {
        window.clearTimeout(timeoutId);
    }

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await response.json().catch(() => ({})) : {};

    if (response.status === 0) {
        await showAppAlert({
            icon: 'error',
            title: 'Request failed',
            description: 'The request was interrupted. Please try again.',
        });
        return false;
    }

    if (response.status >= 500) {
        await showAppAlert({
            icon: 'error',
            title: 'Server error',
            description: data.message || data.error || `Upload failed (HTTP ${response.status}). Check Cloudinary configuration and file size limits.`,
        });
        return false;
    }

    if (response.status === 419) {
        await showAppAlert({ icon: 'error', title: 'Session expired', description: 'Please refresh and try again.' });
        return false;
    }

    if (response.status === 404) {
        await showAppAlert({
            icon: 'error',
            title: 'Lesson not found',
            description: data.message || 'This lesson may have been deleted or moved. Please refresh the page and try again.',
        });
        return false;
    }

    if (response.status === 422) {
        const errors = data.errors ? Object.values(data.errors).flat().join('\n') : data.message || data.error;
        await showAppAlert({ icon: 'error', title: 'Validation failed', description: errors || 'Please check the form.' });
        return false;
    }

    if (response.ok && data.success !== false) {
        window.location.assign(`/admin/training-modules/${moduleId}`);
        return true;
    }

    if (response.status >= 300 && response.status < 400) {
        window.location.assign(`/admin/training-modules/${moduleId}`);
        return true;
    }

    await showAppAlert({
        icon: 'error',
        title: 'Request failed',
        description: data.message || data.error || `Could not complete the request. (HTTP ${response.status})`,
    });
    return false;
}

function blurActiveElement() {
    blurAllFocus();
}

function focusDialogField(container) {
    const focusable = container?.querySelector(
        'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), [contenteditable="true"]',
    );
    focusable?.focus({ preventScroll: true });
}

function AddResourceForm({ moduleId, lessonId, onCancel }) {
    const [resourceType, setResourceType] = React.useState('text');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fileInput = form.querySelector('input[name="file"]');

        const fieldOverrides = { storage_target: 'auto' };
        if (fileInput?.files?.length) {
            fieldOverrides.storage_target = resolveResourceStorageTarget(resourceType);
        }

        const ok = await submitTrainingForm(form, moduleId, { fieldOverrides });
        if (ok) onCancel?.();
    };

    return (
        <form
            method="POST"
            action={`/admin/training-modules/${moduleId}/contents/${lessonId}/resources`}
            encType="multipart/form-data"
            className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3"
            onSubmit={handleSubmit}
        >
            <input type="hidden" name="_token" value={getCsrfToken()} />
            <input type="hidden" name="storage_target" value="auto" />
            <h4 className="text-sm font-semibold text-slate-800">Add Resource</h4>
            <div>
                <label className="block text-[0.7rem] font-semibold text-slate-600 mb-1">Resource Type *</label>
                <select name="resource_type" value={resourceType} onChange={(e) => setResourceType(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
                    {Object.entries(RESOURCE_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-[0.7rem] font-semibold text-slate-600 mb-1">Title *</label>
                <input name="title" type="text" required className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            </div>
            {resourceType === 'text' && (
                <div>
                    <label className="block text-[0.7rem] font-semibold text-slate-600 mb-1">Rich Text *</label>
                    <textarea name="body" rows={4} required className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                </div>
            )}
            {resourceType === 'youtube' && (
                <>
                    <div>
                        <label className="block text-[0.7rem] font-semibold text-slate-600 mb-1">YouTube URL *</label>
                        <input name="external_url" type="url" required placeholder="https://www.youtube.com/watch?v=..." className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                    </div>
                    <p className="text-xs text-slate-500">YouTube videos are reference materials only. AI quiz generation uses the lesson rich text content.</p>
                </>
            )}
            {['pdf', 'image'].includes(resourceType) && (
                <div>
                    <label className="block text-[0.7rem] font-semibold text-slate-600 mb-1">Upload File *</label>
                    <input name="file" type="file" required accept={resourceType === 'pdf' ? '.pdf' : 'image/*'} className="w-full text-sm" />
                </div>
            )}
            <div className="flex gap-2">
                <button type="submit" className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2">
                    <Plus className="w-4 h-4" /> Add Resource
                </button>
                <button type="button" onClick={onCancel} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
            </div>
        </form>
    );
}

const LessonFormEditor = React.forwardRef(function LessonFormEditor({
    mode,
    moduleId,
    lessonId = null,
    initialLesson = null,
    formId = null,
    onCancel,
    onSubmitted,
    showActions = true,
    submitLabel,
}, ref) {
    const draftKey = getLessonDraftKey(moduleId, lessonId);
    const baseline = React.useMemo(
        () => (mode === 'edit' ? buildLessonFormSnapshot(initialLesson) : null),
        [mode, initialLesson?.id],
    );

    const [lessonTitle, setLessonTitle] = React.useState(() => baseline?.lessonTitle || '');
    const [contentBody, setContentBody] = React.useState(() => baseline?.contentBody || '');
    const [extraResources, setExtraResources] = React.useState([]);
    const [draftPromptDone, setDraftPromptDone] = React.useState(false);
    const [fieldErrors, setFieldErrors] = React.useState({});
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    React.useEffect(() => {
        if (draftPromptDone) {
            return undefined;
        }

        const draft = readLessonDraft(draftKey);
        if (!draft) {
            setDraftPromptDone(true);
            return undefined;
        }

        let cancelled = false;

        (async () => {
            const choice = await showAppChoice({
                title: 'Restore draft?',
                description: 'A saved draft was found for this lesson. Would you like to restore it?',
                buttons: [
                    { label: 'Restore draft', variant: 'primary', value: 'restore' },
                    { label: 'Start fresh', variant: 'secondary', value: 'fresh' },
                ],
            });

            if (cancelled) {
                return;
            }

            if (choice === 'restore') {
                setLessonTitle(draft.lessonTitle || '');
                setContentBody(draft.contentBody || '');
                setExtraResources([]);
            } else {
                clearLessonDraft(draftKey);
            }

            setDraftPromptDone(true);
        })();

        return () => {
            cancelled = true;
        };
    }, [draftKey, draftPromptDone]);

    React.useEffect(() => {
        if (mode !== 'edit' || !initialLesson) {
            return;
        }
        const snapshot = buildLessonFormSnapshot(initialLesson);
        setLessonTitle(snapshot.lessonTitle);
        setContentBody(snapshot.contentBody);
        setExtraResources([]);
    }, [mode, initialLesson?.id]);

    const currentSnapshot = React.useMemo(() => ({
        lessonTitle,
        contentBody,
        extraResources,
    }), [lessonTitle, contentBody, extraResources]);

    const isDirty = isLessonFormDirty(currentSnapshot, baseline);

    const persistDraft = React.useCallback(() => {
        writeLessonDraft(draftKey, currentSnapshot);
    }, [currentSnapshot, draftKey]);

    const discardDraft = React.useCallback(() => {
        clearLessonDraft(draftKey);
    }, [draftKey]);

    const { requestClose, dialog: unsavedChangesDialog } = useLessonClosePrompt({
        isDirty,
        onSaveDraft: persistDraft,
        onDiscard: discardDraft,
    });

    React.useImperativeHandle(ref, () => ({ requestClose }), [requestClose]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const form = e.currentTarget;

        const validation = validateLessonForm({
            lessonTitle,
            contentBody,
            form,
            extraResources,
            mode,
        });

        if (!validation.valid) {
            setFieldErrors(validation.errors);
            await showAppAlert({
                icon: 'warning',
                title: 'Please complete required fields',
                description: Object.values(validation.errors).join('\n'),
            });
            return;
        }

        setFieldErrors({});
        setIsSubmitting(true);

        try {
            const ok = await submitTrainingForm(form, moduleId, {
                fieldOverrides: buildLessonFormOverrides(form, contentBody),
            });
            if (ok) {
                clearLessonDraft(draftKey);
                onSubmitted?.();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClearFieldError = (field) => {
        setFieldErrors((prev) => {
            if (!prev[field]) {
                return prev;
            }
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const handleCancel = async () => {
        const canClose = await requestClose();
        if (canClose) {
            onCancel?.();
        }
    };

    const action = mode === 'edit'
        ? `/admin/training-modules/${moduleId}/contents/${lessonId}/update`
        : `/admin/training-modules/${moduleId}/contents`;

    return (
        <form
            id={formId || undefined}
            method="POST"
            action={action}
            encType="multipart/form-data"
            className="space-y-4"
            onSubmit={handleSubmit}
        >
            <input type="hidden" name="_token" value={getCsrfToken()} />
            <input type="hidden" name="storage_target" value="auto" />
            <input type="hidden" name="content_body" value={contentBody} readOnly />

            <LessonFormFields
                lessonTitle={lessonTitle}
                setLessonTitle={setLessonTitle}
                contentBody={contentBody}
                setContentBody={setContentBody}
                extraResources={extraResources}
                setExtraResources={setExtraResources}
                fieldErrors={fieldErrors}
                onClearFieldError={handleClearFieldError}
            />

            {showActions ? (
                <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {submitLabel || (mode === 'edit' ? 'Save Lesson' : 'Add Lesson')}
                    </button>
                </div>
            ) : null}

            {unsavedChangesDialog}
        </form>
    );
});

export function TrainingModuleDetail({ module }) {
    const rootEl = document.getElementById('app');
    const flashStatus = rootEl?.getAttribute('data-status') || '';
    const flashErrors = React.useMemo(() => {
        const raw = rootEl?.getAttribute('data-errors');
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }, [rootEl]);

    const [lessons, setLessons] = React.useState(
        [...(module.contents || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    );
    const [selectedLesson, setSelectedLesson] = React.useState(null);
    const [selectedResource, setSelectedResource] = React.useState(null);
    const [isEditLessonMode, setIsEditLessonMode] = React.useState(false);
    const [isEditResourceMode, setIsEditResourceMode] = React.useState(false);
    const [showAddResource, setShowAddResource] = React.useState(false);
    const [showAddLessonModal, setShowAddLessonModal] = React.useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);
    const [draggedId, setDraggedId] = React.useState(null);
    const lessonRowRefs = React.useRef({});
    const addLessonFormRef = React.useRef(null);
    const editLessonFormRef = React.useRef(null);
    const [appAlert, setAppAlert] = React.useState(null);
    const [appConfirm, setAppConfirm] = React.useState(null);
    const [appChoice, setAppChoice] = React.useState(null);
    const [resourceForm, setResourceForm] = React.useState({ title: '', body: '', external_url: '', resource_type: 'text' });
    const [activeTab, setActiveTab] = React.useState(() => {
        const hash = String(window.location.hash || '').replace('#', '');
        if (hash === 'intelligence') return 'intelligence';
        if (hash === 'campaign_requests') return 'campaign_requests';
        return 'lessons';
    });
    const [relatedHazard] = React.useState(module.related_hazard || module.category || '');
    const moduleTitle = String(module.title || '').trim();
    const moduleShortDescription = String(module.short_description || module.description || '').trim();
    const [targetAudience, setTargetAudience] = React.useState(Array.isArray(module.target_audience) ? module.target_audience : []);
    const [campaignRegistrationOpens, setCampaignRegistrationOpens] = React.useState(
        toDateTimeLocalValue(module.campaign_registration_opens),
    );
    const [campaignRegistrationDeadline, setCampaignRegistrationDeadline] = React.useState(
        toDateTimeLocalValue(module.campaign_registration_deadline),
    );
    const [campaignTrainingCompletionDeadline, setCampaignTrainingCompletionDeadline] = React.useState(
        toDateTimeLocalValue(module.campaign_training_completion_deadline),
    );
    const [campaignExpectedParticipants, setCampaignExpectedParticipants] = React.useState(
        module.campaign_expected_participants ?? '',
    );
    const [campaignMaximumParticipants, setCampaignMaximumParticipants] = React.useState(
        module.campaign_maximum_participants ?? '',
    );
    const [isSubmittingProfile, setIsSubmittingProfile] = React.useState(false);
    const [campaignRequests, setCampaignRequests] = React.useState([]);
    const [isLoadingCampaignRequests, setIsLoadingCampaignRequests] = React.useState(false);

    const thumbnailUrl = module.thumbnail_url || (module.thumbnail_path ? `/storage/${module.thumbnail_path}` : null);
    const recommendations = module.recommended_communities || null;
    const recommendedCommunityEntries = React.useMemo(
        () => getRecommendedCommunityEntries(recommendations),
        [recommendations],
    );

    React.useEffect(() => {
        if (activeTab === 'intelligence') {
            window.location.hash = 'intelligence';
            return;
        }
        if (activeTab === 'campaign_requests') {
            window.location.hash = 'campaign_requests';
            return;
        }
        if (window.location.hash === '#intelligence' || window.location.hash === '#campaign_requests') {
            history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    }, [activeTab]);

    React.useEffect(() => {
        registerAppAlert(({ title, description, icon }) => new Promise((resolve) => {
            setAppAlert({
                title,
                description,
                icon,
                onClose: () => {
                    setAppAlert(null);
                    resolve();
                },
            });
        }));

        registerAppConfirm(({
            title,
            description,
            confirmLabel,
            cancelLabel,
            confirmVariant,
        }) => new Promise((resolve) => {
            setAppConfirm({
                title,
                description,
                confirmLabel,
                cancelLabel,
                confirmVariant,
                onConfirm: () => {
                    setAppConfirm(null);
                    resolve(true);
                },
                onCancel: () => {
                    setAppConfirm(null);
                    resolve(false);
                },
            });
        }));

        registerAppChoice(({
            title,
            description,
            icon,
            buttons,
        }) => new Promise((resolve) => {
            setAppChoice({
                title,
                description,
                icon,
                buttons: buttons.map((button) => ({
                    ...button,
                    onClick: () => {
                        setAppChoice(null);
                        resolve(button.value ?? button.label);
                    },
                })),
                onCancel: () => {
                    setAppChoice(null);
                    resolve(null);
                },
            });
        }));

        return () => {
            registerAppAlert(null);
            registerAppConfirm(null);
            registerAppChoice(null);
        };
    }, []);

    const handleDragStart = (event, id) => {
        event.stopPropagation();
        setDraggedId(id);
        const row = lessonRowRefs.current[id];
        if (row) {
            event.dataTransfer.setDragImage(row, 24, 24);
        }
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(id));
    };

    const handleDragEnd = () => {
        setDraggedId(null);
    };

    const handleDragOver = (e) => e.preventDefault();

    const handleDrop = async (targetId) => {
        if (!draggedId || draggedId === targetId) {
            setDraggedId(null);
            return;
        }
        const current = [...lessons];
        const fromIndex = current.findIndex((c) => c.id === draggedId);
        const toIndex = current.findIndex((c) => c.id === targetId);
        if (fromIndex < 0 || toIndex < 0) return;
        const [moved] = current.splice(fromIndex, 1);
        current.splice(toIndex, 0, moved);
        setLessons(current);
        setDraggedId(null);

        const order = current.map((c) => c.id);
        try {
            await pingSessionActivity();
            const formData = new FormData();
            formData.append('_token', getCsrfToken());
            order.forEach((id, index) => formData.append(`order[${index}]`, id));
            await fetch(`/admin/training-modules/${module.id}/contents/reorder`, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin',
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...getCsrfHeaders() },
            });
        } catch (e) {
            console.error('Failed to reorder lessons', e);
        }
    };

    const handleLessonClick = (lesson) => {
        setSelectedLesson(lesson);
        setSelectedResource(null);
        setIsEditLessonMode(false);
        setIsEditResourceMode(false);
        setShowAddResource(false);
    };

    const handleLessonEdit = (lesson) => {
        setSelectedLesson(lesson);
        setSelectedResource(null);
        setIsEditLessonMode(true);
        setIsEditResourceMode(false);
        setShowAddResource(false);
    };

    const handleAddLessonModalChange = async (open) => {
        if (open) {
            setShowAddLessonModal(true);
            return;
        }

        blurActiveElement();
        const canClose = await addLessonFormRef.current?.requestClose?.();
        if (canClose !== false) {
            setShowAddLessonModal(false);
        }
    };

    const handleLessonDialogChange = async (open) => {
        if (open) {
            return;
        }

        blurActiveElement();

        if (isEditLessonMode) {
            const canClose = await editLessonFormRef.current?.requestClose?.();
            if (canClose === false) {
                return;
            }
        }

        setSelectedLesson(null);
        setSelectedResource(null);
        setIsEditLessonMode(false);
        setIsEditResourceMode(false);
        setShowAddResource(false);
    };

    const handleToggleEditLessonMode = async () => {
        if (isEditLessonMode) {
            blurActiveElement();
            const canClose = await editLessonFormRef.current?.requestClose?.();
            if (canClose === false) {
                return;
            }
        }
        setIsEditLessonMode((prev) => !prev);
        setShowAddResource(false);
    };

    const handleResourceClick = (resource) => {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        setSelectedResource(resource);
        setIsEditResourceMode(false);
        setResourceForm({
            title: resource.title || '',
            body: resource.body || '',
            external_url: resource.external_url || '',
            resource_type: resource.resource_type || 'text',
        });
    };

    const handleBackToLesson = () => {
        blurActiveElement();
        setSelectedResource(null);
        setIsEditResourceMode(false);
    };

    const handleDeleteLesson = async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const ok = await showAppConfirm({
            title: 'Delete lesson and all its resources?',
            description: 'This action cannot be undone.',
            confirmLabel: 'Delete lesson',
            cancelLabel: 'Cancel',
            confirmVariant: 'danger',
        });
        if (!ok) return;
        await submitTrainingForm(form, module.id);
    };

    const handleDeleteResource = async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const ok = await showAppConfirm({
            title: 'Delete this resource?',
            description: 'This resource will be permanently removed from the lesson.',
            confirmLabel: 'Delete resource',
            cancelLabel: 'Cancel',
            confirmVariant: 'danger',
        });
        if (!ok) return;
        await submitTrainingForm(form, module.id);
    };

    const toggleAudience = (value) => {
        setTargetAudience((current) => (
            current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
        ));
    };

    const loadCampaignRequests = async () => {
        setIsLoadingCampaignRequests(true);
        setCampaignRequests([]);
        try {
            const response = await fetch(`/admin/training-modules/${module.id}/campaign-requests`, {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...getCsrfHeaders(),
                },
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.message || 'Could not load campaign requests.');
            }

            setCampaignRequests(Array.isArray(data.requests) ? data.requests : []);
        } catch (e) {
            await Swal.fire({ icon: 'error', title: 'Load failed', text: e?.message || 'Could not load campaign requests.' });
        } finally {
            setIsLoadingCampaignRequests(false);
        }
    };

    const copyCampaignRegistrationLink = async (requestItem) => {
        const link = requestItem?.registration_link;
        if (!link) {
            await Swal.fire({
                icon: 'info',
                title: 'Registration link unavailable',
                text: 'Registration link becomes available after approval and while registration is open.',
            });
            return;
        }

        try {
            await navigator.clipboard.writeText(link);
            await Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Registration link copied',
                showConfirmButton: false,
                timer: 2200,
            });
        } catch {
            await Swal.fire({
                icon: 'error',
                title: 'Copy failed',
                text: 'Unable to copy link. Please copy it manually from the details page.',
            });
        }
    };

    const handleSubmitToCampaign = async () => {
        const response = await fetch(`/admin/training-modules/${module.id}/campaign-requests`, {
            method: 'POST',
            body: (() => {
                const formData = new FormData();
                formData.append('_token', getCsrfToken());
                return formData;
            })(),
            credentials: 'same-origin',
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...getCsrfHeaders() },
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Could not submit Training Intelligence Profile.');
        }

        return data;
    };

    React.useEffect(() => {
        if (activeTab === 'campaign_requests') {
            loadCampaignRequests();
        }
    }, [activeTab]);

    const campaignPlanningPreview = React.useMemo(() => ({
        training_module_id: module.id,
        training_title: moduleTitle,
        short_description: moduleShortDescription,
        recommended_communities: recommendations,
        target_audience: targetAudience,
        registration_opens: campaignRegistrationOpens || null,
        registration_deadline: campaignRegistrationDeadline || null,
        training_completion_deadline: campaignTrainingCompletionDeadline || null,
        expected_participants: Number(campaignExpectedParticipants) > 0 ? Number(campaignExpectedParticipants) : null,
        maximum_participants: Number(campaignMaximumParticipants) > 0 ? Number(campaignMaximumParticipants) : null,
        registered_participants_count: 0,
        registration_link: `${window.location.origin}/participant/register?campaign_request={campaign_request_id}`,
        published_status: module.status || 'draft',
        registration_enabled: Number(campaignMaximumParticipants) > 0
            ? 0 < Number(campaignMaximumParticipants)
            : true,
    }), [
        module.id,
        module.status,
        moduleTitle,
        moduleShortDescription,
        recommendations,
        targetAudience,
        campaignRegistrationOpens,
        campaignRegistrationDeadline,
        campaignTrainingCompletionDeadline,
        campaignExpectedParticipants,
        campaignMaximumParticipants,
    ]);

    const validateIntelligenceProfile = () => {
        if (!moduleTitle) {
            return {
                ok: false,
                title: 'Missing training title',
                text: 'Add a title to this training module in the module header above.',
            };
        }

        if (!moduleShortDescription) {
            return {
                ok: false,
                title: 'Missing description',
                text: 'Add a description to this training module in the module header above.',
            };
        }

        if (targetAudience.length === 0) {
            return {
                ok: false,
                title: 'Missing target audience',
                text: 'Select at least one target audience.',
            };
        }

        if (!campaignRegistrationOpens) {
            return {
                ok: false,
                title: 'Missing registration opens date',
                text: 'Set when participant registration opens.',
            };
        }

        if (!campaignRegistrationDeadline) {
            return {
                ok: false,
                title: 'Missing registration deadline',
                text: 'Set the registration deadline.',
            };
        }

        if (!campaignTrainingCompletionDeadline) {
            return {
                ok: false,
                title: 'Missing training completion deadline',
                text: 'Set the deadline for participants to complete the online training.',
            };
        }

        if (new Date(campaignRegistrationDeadline) < new Date(campaignRegistrationOpens)) {
            return {
                ok: false,
                title: 'Invalid registration period',
                text: 'Registration deadline must be on or after registration opens.',
            };
        }

        if (new Date(campaignTrainingCompletionDeadline) <= new Date(campaignRegistrationDeadline)) {
            return {
                ok: false,
                title: 'Invalid training completion deadline',
                text: 'Training completion deadline must be later than the registration deadline.',
            };
        }

        const maxParticipants = Number(campaignMaximumParticipants);
        if (!Number.isFinite(maxParticipants) || maxParticipants < 2) {
            return {
                ok: false,
                title: 'Missing maximum participants',
                text: 'Enter a maximum participants value of at least 2.',
            };
        }

        if (maxParticipants > 40) {
            return {
                ok: false,
                title: 'Maximum participants too high',
                text: 'Maximum participants cannot be more than 40.',
            };
        }

        const expectedParticipants = Number(campaignExpectedParticipants);
        if (!Number.isFinite(expectedParticipants) || expectedParticipants < 1) {
            return {
                ok: false,
                title: 'Missing expected participants',
                text: 'Enter the expected number of participants.',
            };
        }

        if (expectedParticipants >= maxParticipants) {
            return {
                ok: false,
                title: 'Expected participants exceed maximum',
                text: 'Expected participants must be lower than maximum participants.',
            };
        }

        return { ok: true };
    };

    const persistIntelligenceProfile = async () => {
        const formData = new FormData();
        formData.append('_token', getCsrfToken());
        formData.append('_method', 'PUT');
        formData.append('title', moduleTitle);
        formData.append('description', module.description || '');
        formData.append('short_description', moduleShortDescription);
        formData.append('category', module.category || '');
        formData.append('related_hazard', relatedHazard);
        formData.append('estimated_duration_minutes', String(module.estimated_duration_minutes || ''));
        formData.append('visibility', module.visibility || 'all');
        formData.append('status', module.status || 'draft');
        formData.append('difficulty', module.difficulty || 'Beginner');
        targetAudience.forEach((item, index) => formData.append(`target_audience[${index}]`, item));
        formData.append('campaign_registration_opens', campaignRegistrationOpens);
        formData.append('campaign_registration_deadline', campaignRegistrationDeadline);
        formData.append('campaign_training_completion_deadline', campaignTrainingCompletionDeadline);
        formData.append('campaign_expected_participants', String(campaignExpectedParticipants));
        formData.append('campaign_maximum_participants', String(campaignMaximumParticipants));

        const response = await fetch(`/admin/training-modules/${module.id}`, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin',
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...getCsrfHeaders() },
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            const message = data.message || Object.values(data.errors || {}).flat()[0] || 'Could not save profile.';
            throw new Error(message);
        }

        return true;
    };

    const handleSaveAndSubmitProfile = async () => {
        const validation = validateIntelligenceProfile();
        if (!validation.ok) {
            await Swal.fire({
                icon: 'warning',
                title: validation.title,
                text: validation.text,
            });
            return;
        }

        const publishNote = String(module.status || '').toLowerCase() !== 'published'
            ? '<p class="mt-3 text-sm text-amber-700">Only published modules are available to the Campaign Management System.</p>'
            : '';

        const confirm = await Swal.fire({
            icon: 'question',
            title: 'Save and submit to Campaign?',
            html: `
                <p class="text-sm text-slate-600">Your Training Intelligence Profile will be saved, then submitted to the Public Safety Campaign Management System for review.</p>
                ${publishNote}
            `,
            showCancelButton: true,
            confirmButtonText: 'Yes, save & submit',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#059669',
        });

        if (!confirm.isConfirmed) return;

        setIsSubmittingProfile(true);
        try {
            await persistIntelligenceProfile();

            await handleSubmitToCampaign();

            await Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Saved & submitted',
                text: 'Training Intelligence Profile saved and submitted to Campaign. Track progress under Campaign Requests.',
                showConfirmButton: false,
                timer: 4500,
            });

            window.location.assign(`/admin/training-modules/${module.id}#campaign_requests`);
        } catch (e) {
            await Swal.fire({
                icon: 'error',
                title: 'Could not complete',
                text: e?.message || 'Save or campaign submission failed.',
            });
        } finally {
            setIsSubmittingProfile(false);
        }
    };

    const groupedResources = React.useMemo(() => {
        if (!selectedLesson?.resources) return {};
        return RESOURCE_GROUPS.reduce((acc, group) => {
            acc[group.key] = (selectedLesson.resources || [])
                .filter((r) => r.resource_type === group.key)
                .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            return acc;
        }, {});
    }, [selectedLesson]);

    return (
        <div className="py-2 space-y-6">
            <div className="flex items-center justify-between mb-1">
                <a href="/admin/training-modules" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
                    <ChevronLeft className="w-4 h-4" /> Back to Training Modules
                </a>
            </div>

            {flashStatus && <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">{flashStatus}</div>}
            {flashErrors.length > 0 && (
                <div className="rounded-xl bg-rose-600 text-white px-4 py-3 text-sm">
                    <ul className="list-disc list-inside">{flashErrors.map((error, idx) => <li key={idx}>{error}</li>)}</ul>
                </div>
            )}

            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        {thumbnailUrl ? (
                            <img src={thumbnailUrl} alt={module.title} className="w-full h-40 object-cover rounded-xl border border-slate-200" />
                        ) : (
                            <div className="w-full h-40 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-sm">No thumbnail</div>
                        )}
                    </div>
                    <div className="md:col-span-2">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Training module</div>
                        <h2 className="text-xl font-semibold text-slate-800">{module.title}</h2>
                        {module.description && (
                            <div className="mt-2">
                                <p className={`text-sm text-slate-600 whitespace-pre-line ${!isDescriptionExpanded ? 'line-clamp-3' : ''}`}>{module.description}</p>
                                <button type="button" onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)} className="text-xs text-emerald-700 mt-1 inline-flex items-center gap-1">
                                    {isDescriptionExpanded ? <>See less <ChevronUp className="w-3 h-3" /></> : <>See more <ChevronDown className="w-3 h-3" /></>}
                                </button>
                            </div>
                        )}
                        <div className="mt-4 flex flex-wrap gap-2 text-xs">
                            {module.category && (
                                <span className="rounded-lg bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 font-medium">
                                    {module.category}
                                </span>
                            )}
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                                {lessons.length} {lessons.length === 1 ? 'Lesson' : 'Lessons'}
                            </span>
                            <span className="rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 font-medium capitalize">
                                {module.status}
                            </span>
                            {formatDuration(module.estimated_duration_minutes) && (
                                <span className="rounded-lg bg-slate-50 text-slate-800 border border-slate-200 px-2.5 py-1 font-medium">
                                    Estimated: {formatDuration(module.estimated_duration_minutes)}
                                </span>
                            )}
                            <span className="rounded-lg bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1 font-medium capitalize">
                                Visibility: {module.visibility || 'All'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('lessons')}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === 'lessons' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                        Lesson Management
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('intelligence')}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === 'intelligence' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                        Training Intelligence Profile
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('campaign_requests')}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === 'campaign_requests' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                        Campaign Requests
                    </button>
                </div>
            </div>

            {activeTab === 'intelligence' && (
                <div className="space-y-4">
                    <AdminContentCard className="p-5">
                        <div className="flex items-center gap-2 mb-3"><Users className="w-4 h-4 text-emerald-700" /><h3 className="text-sm font-semibold text-slate-800">Target Audience</h3></div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {AUDIENCE_OPTIONS.map((option) => (
                                <label key={option.value} className={`rounded-xl border px-3 py-2 text-sm cursor-pointer ${targetAudience.includes(option.value) ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200'}`}>
                                    <input type="checkbox" className="mr-2" checked={targetAudience.includes(option.value)} onChange={() => toggleAudience(option.value)} />
                                    {option.label}
                                </label>
                            ))}
                        </div>
                    </AdminContentCard>

                    <AdminContentCard className="p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <CalendarDays className="w-4 h-4 text-emerald-700" />
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">Campaign Registration Settings</h3>
                                <p className="text-xs text-slate-500 mt-1">Self-paced online training window shared with Campaign Planning for public registration and completion deadlines.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Registration Opens <span className="text-rose-500">*</span></label>
                                <input
                                    type="datetime-local"
                                    value={campaignRegistrationOpens}
                                    onChange={(e) => setCampaignRegistrationOpens(e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Registration Deadline <span className="text-rose-500">*</span></label>
                                <input
                                    type="datetime-local"
                                    value={campaignRegistrationDeadline}
                                    onChange={(e) => setCampaignRegistrationDeadline(e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Training Completion Deadline <span className="text-rose-500">*</span></label>
                                <input
                                    type="datetime-local"
                                    value={campaignTrainingCompletionDeadline}
                                    onChange={(e) => setCampaignTrainingCompletionDeadline(e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Maximum Participants <span className="text-rose-500">*</span></label>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <select
                                        value=""
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                setCampaignMaximumParticipants(e.target.value);
                                            }
                                        }}
                                        className="w-full sm:w-52 rounded-xl border border-slate-300 px-3 py-2 text-sm"
                                    >
                                        <option value="">Recommended</option>
                                        {RECOMMENDED_PARTICIPANTS_OPTIONS.map((value) => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        min="1"
                                        max="40"
                                        value={campaignMaximumParticipants}
                                        onChange={(e) => setCampaignMaximumParticipants(e.target.value.replace(/\D/g, '').slice(0, 2))}
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                                        placeholder="Type maximum participants"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-slate-500">Use the recommended preset up to 30, or type any number from 2 to 40.</p>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Expected Participants <span className="text-rose-500">*</span></label>
                                <input
                                    type="number"
                                    min="2"
                                    max={Number(campaignMaximumParticipants) > 1 ? Number(campaignMaximumParticipants) - 1 : 39}
                                    value={campaignExpectedParticipants}
                                    onChange={(e) => {
                                        const nextValue = e.target.value.replace(/\D/g, '').slice(0, 2);
                                        const nextNumber = Number(nextValue);
                                        const currentMaximum = Number(campaignMaximumParticipants);

                                        if (!nextValue) {
                                            setCampaignExpectedParticipants('');
                                            return;
                                        }

                                        if (Number.isFinite(currentMaximum) && currentMaximum > 1 && nextNumber >= currentMaximum) {
                                            setCampaignExpectedParticipants(String(currentMaximum - 1));
                                            return;
                                        }

                                        setCampaignExpectedParticipants(nextValue);
                                    }}
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                                    placeholder="Up to current maximum"
                                />
                                <p className="mt-1 text-xs text-slate-500">
                                    Expected participants is your target and must stay lower than maximum participants. Registration automatically closes once actual registered participants reach maximum capacity.
                                </p>
                            </div>
                        </div>
                    </AdminContentCard>

                    <AdminContentCard className="p-5">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-slate-800">Recommended Communities</h3>
                            <p className="mt-1 text-xs text-slate-500">
                                Priority-based recommendations from Hazard Assessment. Campaign teams may still include other communities when needed.
                            </p>
                        </div>

                        {recommendations?.summary ? (
                            <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                    <p className="text-xs text-slate-500">Communities Found</p>
                                    <p className="text-lg font-semibold text-slate-900">{recommendations.summary.total_communities}</p>
                                </div>
                                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
                                    <p className="text-xs text-rose-700">Priority 1</p>
                                    <p className="text-lg font-semibold text-rose-800">{recommendations.summary.high_priority}</p>
                                </div>
                                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                                    <p className="text-xs text-amber-700">Priority 2</p>
                                    <p className="text-lg font-semibold text-amber-800">{recommendations.summary.medium_priority}</p>
                                </div>
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                                    <p className="text-xs text-emerald-700">Priority 3</p>
                                    <p className="text-lg font-semibold text-emerald-800">{recommendations.summary.low_priority}</p>
                                </div>
                            </div>
                        ) : null}

                        {recommendedCommunityEntries.length > 0 ? (
                            <CommunityRecommendationsTable communities={recommendedCommunityEntries} />
                        ) : (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                                No communities currently match the selected hazard classification.
                            </div>
                        )}
                    </AdminContentCard>

                    <AdminContentCard className="p-5">
                        <div className="flex items-center gap-2 mb-2"><Workflow className="w-4 h-4 text-emerald-700" /><h3 className="text-sm font-semibold text-slate-800">Integration Preview</h3></div>
                        <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">Publish Training Module → Campaign Planning announcement &amp; registration → Participant completes self-paced online training → Eligible for Simulation Event Planning.</p>
                    </AdminContentCard>

                    <AdminContentCard className="p-5">
                        <div className="flex items-center gap-2 mb-2"><Database className="w-4 h-4 text-emerald-700" /><h3 className="text-sm font-semibold text-slate-800">Campaign API Payload Preview</h3></div>
                        <p className="text-sm text-slate-600 mb-3">Only campaign announcement and registration data is sent. Lessons, quizzes, trainers, and internal training configuration stay in Training Module Management.</p>
                        <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 mb-3">
                            <li>Training Module ID</li>
                            <li>Training Title &amp; Short Description (from module header)</li>
                            <li>Recommended Communities</li>
                            <li>Target Audience</li>
                            <li>Registration Opens / Deadline / Training Completion Deadline</li>
                            <li>Expected Participants and Maximum Participants</li>
                            <li>Participant Registration Link</li>
                            <li>Published Status and auto-calculated Registration Enabled</li>
                        </ul>
                        <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                            {JSON.stringify(campaignPlanningPreview, null, 2)}
                        </pre>
                        <p className="mt-2 text-xs text-slate-500">The registration link is generated when you submit and includes the campaign request ID for Group 6 to share with participants.</p>
                        <p className="mt-2 text-xs font-semibold text-amber-700">Only Published modules will be available to the Campaign Management System.</p>
                    </AdminContentCard>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-end">
                        <button
                            type="button"
                            onClick={handleSaveAndSubmitProfile}
                            disabled={isSubmittingProfile}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 disabled:opacity-60 w-full sm:w-auto"
                        >
                            {isSubmittingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Save &amp; Submit to Campaign
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'campaign_requests' && (
                <div className="space-y-4">
                    <AdminContentCard className="p-5">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">Campaign Requests</h3>
                                <p className="text-xs text-slate-500 mt-1">Submission tracking for Training Intelligence Profiles.</p>
                            </div>
                            <div className="text-xs text-slate-500">
                                {isLoadingCampaignRequests ? 'Loading…' : `${campaignRequests.length} request${campaignRequests.length === 1 ? '' : 's'}`}
                            </div>
                        </div>

                        {isLoadingCampaignRequests ? (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                                Loading campaign requests…
                            </div>
                        ) : campaignRequests.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                                No campaign requests yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                <table className="min-w-full divide-y divide-slate-200 text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Request ID</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Training Module</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Registration Period</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Submitted To</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Submitted Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {campaignRequests.map((req) => (
                                            <tr key={req.id}>
                                                <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900">{req.id}</td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-slate-900">{req.training_module?.title || '—'}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <CampaignRequestProposedSessionsCell request={req} />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-slate-700">{req.submitted_to || '—'}</div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {req.submitted_at ? (
                                                        <>
                                                            <div className="text-slate-900">{formatDate(req.submitted_at)}</div>
                                                            <div className="text-xs text-slate-500 mt-0.5">{formatDateTimeParts(req.submitted_at).time}</div>
                                                        </>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <CampaignRequestStatusBadge status={req.status} />
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                                    <div className="inline-flex items-center gap-2">
                                                        <a
                                                            href={`/admin/campaign-requests/${req.id}`}
                                                            className="inline-flex rounded-lg px-3 py-1.5 text-xs bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                                                        >
                                                            View
                                                        </a>
                                                        <button
                                                            type="button"
                                                            onClick={() => copyCampaignRegistrationLink(req)}
                                                            disabled={!req.registration_link_active}
                                                            className="inline-flex rounded-lg px-3 py-1.5 text-xs border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Copy Link
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </AdminContentCard>
                </div>
            )}

            {activeTab === 'lessons' && (
            <>
            <AdminContentCard className="overflow-hidden">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/60">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-800">Lesson Management</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Drag rows to reorder lessons</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowAddLessonModal(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5"
                    >
                        <Plus className="w-4 h-4" />
                        Add Lesson
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm" style={{ minWidth: '880px' }}>
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Lesson #</th>
                                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Lesson Title</th>
                                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Resources</th>
                                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Status</th>
                                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Created</th>
                                <th className="px-5 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {lessons.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center">
                                        <p className="text-slate-500 font-medium">No lessons yet</p>
                                        <p className="text-slate-400 text-xs mt-1">Add your first lesson to start building this module.</p>
                                    </td>
                                </tr>
                            ) : (
                                lessons.map((lesson, index) => {
                                    const status = getLessonStatus(lesson);
                                    const resourceCount = (lesson.resources || []).length;

                                    return (
                                        <tr
                                            key={lesson.id}
                                            ref={(element) => {
                                                if (element) {
                                                    lessonRowRefs.current[lesson.id] = element;
                                                } else {
                                                    delete lessonRowRefs.current[lesson.id];
                                                }
                                            }}
                                            onDragOver={handleDragOver}
                                            onDrop={() => handleDrop(lesson.id)}
                                            className={`bg-white hover:bg-slate-50/80 transition-colors ${
                                                draggedId === lesson.id ? 'bg-emerald-50/70 shadow-[inset_0_0_0_2px_rgba(16,185,129,0.35)]' : ''
                                            }`}
                                        >
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="inline-flex items-center gap-2 text-slate-500">
                                                    <button
                                                        type="button"
                                                        draggable
                                                        onDragStart={(event) => handleDragStart(event, lesson.id)}
                                                        onDragEnd={handleDragEnd}
                                                        className="cursor-grab text-slate-400 hover:text-slate-600 active:cursor-grabbing"
                                                        aria-label="Drag to reorder"
                                                    >
                                                        <GripVertical className="w-4 h-4" />
                                                    </button>
                                                    <span className="font-medium text-slate-700">{index + 1}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="min-w-48 max-w-md">
                                                    <p className="font-medium text-slate-900">{lesson.title}</p>
                                                    {lesson.description && (
                                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{lesson.description}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-slate-700">
                                                {resourceCount} {resourceCount === 1 ? 'resource' : 'resources'}
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[0.7rem] font-semibold ${status.className}`}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                                                {formatDate(lesson.created_at)}
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    <AdminTableActionButton
                                                        icon={Eye}
                                                        title="Manage Resources"
                                                        variant="view"
                                                        onClick={() => handleLessonClick(lesson)}
                                                    />
                                                    <AdminTableActionButton
                                                        icon={Pencil}
                                                        title="Edit Lesson"
                                                        variant="edit"
                                                        onClick={() => handleLessonEdit(lesson)}
                                                    />
                                                    <form
                                                        method="POST"
                                                        action={`/admin/training-modules/${module.id}/contents/${lesson.id}/delete`}
                                                        onSubmit={handleDeleteLesson}
                                                        className="inline-flex"
                                                    >
                                                        <input type="hidden" name="_token" value={getCsrfToken()} />
                                                        <AdminTableActionButton
                                                            icon={Trash2}
                                                            title="Delete Lesson"
                                                            variant="danger"
                                                            type="submit"
                                                        />
                                                    </form>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </AdminContentCard>

            <Dialog.Root open={showAddLessonModal} onOpenChange={handleAddLessonModalChange}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                    <Dialog.Content
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(100%,80rem)] max-w-5xl max-h-[92vh] bg-white rounded-xl shadow-lg z-50 overflow-hidden flex flex-col"
                        onOpenAutoFocus={(event) => {
                            event.preventDefault();
                            focusDialogField(event.currentTarget);
                        }}
                    >
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <div>
                                <Dialog.Title className="text-lg font-semibold text-slate-800">Add Lesson</Dialog.Title>
                                <Dialog.Description className="sr-only">
                                    Create a new lesson for this training module.
                                </Dialog.Description>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleAddLessonModalChange(false)}
                                className="w-8 h-8 rounded-full hover:bg-slate-100"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4 mx-auto" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto overflow-x-visible">
                            <LessonFormEditor
                                ref={addLessonFormRef}
                                mode="create"
                                moduleId={module.id}
                                onCancel={() => handleAddLessonModalChange(false)}
                                onSubmitted={() => setShowAddLessonModal(false)}
                            />
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            <Dialog.Root
                open={selectedLesson !== null}
                onOpenChange={handleLessonDialogChange}
            >
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                    <Dialog.Content
                        onOpenAutoFocus={(event) => {
                            event.preventDefault();
                            focusDialogField(event.currentTarget);
                        }}
                        onCloseAutoFocus={(event) => {
                            event.preventDefault();
                        }}
                        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(100%,80rem)] ${selectedResource ? 'max-w-4xl' : 'max-w-5xl'} max-h-[92vh] bg-white rounded-xl shadow-lg z-50 overflow-hidden flex flex-col`}
                    >
                        <Dialog.Title className="sr-only">
                            {selectedResource
                                ? (isEditResourceMode ? 'Edit Resource' : selectedResource?.title || 'Resource')
                                : (selectedLesson?.title || 'Lesson Resources')}
                        </Dialog.Title>
                        <Dialog.Description className="sr-only">
                            {selectedResource
                                ? 'View or edit the selected learning resource.'
                                : 'View and manage learning resources for this lesson.'}
                        </Dialog.Description>
                        {selectedLesson && selectedResource ? (
                            <>
                                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                                    <div className="min-w-0">
                                        <button
                                            type="button"
                                            onClick={handleBackToLesson}
                                            className="mb-1 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                                        >
                                            <ChevronLeft className="w-3.5 h-3.5" />
                                            Back to {selectedLesson.title}
                                        </button>
                                        <h2 className="text-xl font-semibold text-slate-800 truncate">{isEditResourceMode ? 'Edit Resource' : selectedResource.title}</h2>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!isEditResourceMode && (
                                            <button type="button" onClick={() => setIsEditResourceMode(true)} className="rounded-md border border-emerald-500/60 bg-emerald-50 p-2">
                                                <Pencil className="w-4 h-4 text-emerald-800" />
                                            </button>
                                        )}
                                        <Dialog.Close asChild>
                                            <button type="button" className="w-8 h-8 rounded-full hover:bg-slate-100" aria-label="Close">
                                                <X className="w-4 h-4 mx-auto" />
                                            </button>
                                        </Dialog.Close>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6">
                                    {isEditResourceMode ? (
                                        <form method="POST" action={`/admin/training-modules/${module.id}/contents/${selectedLesson.id}/resources/${selectedResource.id}`} encType="multipart/form-data" className="space-y-4" onSubmit={(e) => { e.preventDefault(); submitTrainingForm(e.currentTarget, module.id); }}>
                                            <input type="hidden" name="_token" value={getCsrfToken()} />
                                            <input type="hidden" name="_method" value="PUT" />
                                            <input name="title" type="text" required value={resourceForm.title} onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                                            <select name="resource_type" value={resourceForm.resource_type} onChange={(e) => setResourceForm({ ...resourceForm, resource_type: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                                                {Object.entries(RESOURCE_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                            </select>
                                            {resourceForm.resource_type === 'text' && (
                                                <textarea name="body" rows={6} value={resourceForm.body} onChange={(e) => setResourceForm({ ...resourceForm, body: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                                            )}
                                            {resourceForm.resource_type === 'youtube' && (
                                                <>
                                                    <input name="external_url" type="url" value={resourceForm.external_url} onChange={(e) => setResourceForm({ ...resourceForm, external_url: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                                                    <p className="text-xs text-slate-500">YouTube videos are reference materials only. AI quiz generation uses the lesson rich text content.</p>
                                                </>
                                            )}
                                            {['pdf', 'image'].includes(resourceForm.resource_type) && (
                                                <div>
                                                    <label className="block text-xs text-slate-500 mb-1">Replace file (optional)</label>
                                                    <input name="file" type="file" accept={resourceForm.resource_type === 'pdf' ? '.pdf' : 'image/*'} className="w-full text-sm" />
                                                </div>
                                            )}
                                            <button type="submit" className="rounded-md bg-emerald-600 text-white px-4 py-1.5 text-sm">Save Changes</button>
                                        </form>
                                    ) : (
                                        <div className="space-y-4">
                                            <ResourceStatusBadge resource={selectedResource} />
                                            {renderResourcePreview(selectedResource)}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : selectedLesson ? (
                            <>
                                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                                    <h2 className="text-xl font-semibold text-slate-800">{selectedLesson.title}</h2>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleToggleEditLessonMode}
                                            className={`rounded-md border p-2 ${isEditLessonMode ? 'border-emerald-600 bg-emerald-100' : 'border-emerald-500/60 bg-emerald-50'}`}
                                            title={isEditLessonMode ? 'Switch to view mode' : 'Edit lesson'}
                                        >
                                            <Pencil className="w-4 h-4 text-emerald-800" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleLessonDialogChange(false)}
                                            className="w-8 h-8 rounded-full hover:bg-slate-100"
                                            aria-label="Close"
                                        >
                                            <X className="w-4 h-4 mx-auto" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto overflow-x-visible p-6 space-y-6">
                                    {isEditLessonMode ? (
                                        <>
                                            <LessonFormEditor
                                                ref={editLessonFormRef}
                                                mode="edit"
                                                moduleId={module.id}
                                                lessonId={selectedLesson.id}
                                                initialLesson={selectedLesson}
                                                formId="lesson-edit-form"
                                                showActions={false}
                                                onSubmitted={() => setIsEditLessonMode(false)}
                                            />

                                            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                                <h3 className="text-sm font-semibold text-slate-800">Existing Resources</h3>
                                                <button type="submit" form="lesson-edit-form" className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold">
                                                    Save Lesson
                                                </button>
                                            </div>

                                            {RESOURCE_GROUPS.map((group) => {
                                                const textResource = getLessonTextResource(selectedLesson);
                                                const items = (groupedResources[group.key] || []).filter((resource) => resource.id !== textResource?.id);
                                                if (items.length === 0) return null;
                                                return (
                                                    <div key={group.key} className="space-y-2">
                                                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{group.label}</h4>
                                                        <ul className="space-y-2">
                                                            {items.map((resource) => (
                                                                <LessonSupplementaryResourceItem
                                                                    key={resource.id}
                                                                    resource={resource}
                                                                    moduleId={module.id}
                                                                    lessonId={selectedLesson.id}
                                                                    editMode
                                                                    onDelete={handleDeleteResource}
                                                                />
                                                            ))}
                                                        </ul>
                                                    </div>
                                                );
                                            })}
                                        </>
                                    ) : (
                                        <>
                                            <LessonAuditTrail lesson={selectedLesson} resources={selectedLesson.resources || []} />

                                            {(() => {
                                                const textResource = getLessonTextResource(selectedLesson);
                                                if (!textResource) return null;
                                                return (
                                                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Training Content</p>
                                                        {renderResourcePreview(textResource)}
                                                    </div>
                                                );
                                            })()}

                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-800">Learning Resources</h3>
                                            </div>

                                            {RESOURCE_GROUPS.map((group) => {
                                                const textResource = getLessonTextResource(selectedLesson);
                                                const items = (groupedResources[group.key] || []).filter((resource) => resource.id !== textResource?.id);
                                                if (items.length === 0) return null;
                                                return (
                                                    <div key={group.key} className="space-y-2">
                                                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{group.label}</h4>
                                                        <ul className="space-y-2">
                                                            {items.map((resource) => (
                                                                <LessonSupplementaryResourceItem
                                                                    key={resource.id}
                                                                    resource={resource}
                                                                    moduleId={module.id}
                                                                    lessonId={selectedLesson.id}
                                                                />
                                                            ))}
                                                        </ul>
                                                    </div>
                                                );
                                            })}

                                            {(() => {
                                                const textResource = getLessonTextResource(selectedLesson);
                                                const supplementaryCount = (selectedLesson.resources || []).filter((resource) => resource.id !== textResource?.id).length;
                                                if (supplementaryCount > 0) return null;
                                                return <p className="text-sm text-slate-500">No additional learning resources attached to this lesson yet.</p>;
                                            })()}
                                        </>
                                    )}
                                </div>
                            </>
                        ) : null}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
            </>
            )}

            <LessonConfirmDialog
                open={Boolean(appAlert)}
                title={appAlert?.title || ''}
                description={appAlert?.description || ''}
                icon={appAlert?.icon || 'warning'}
                buttons={[
                    { label: 'OK', variant: 'primary', onClick: () => appAlert?.onClose?.() },
                ]}
                onOpenChange={(open) => {
                    if (!open) {
                        appAlert?.onClose?.();
                    }
                }}
            />

            <LessonConfirmDialog
                open={Boolean(appConfirm)}
                title={appConfirm?.title || ''}
                description={appConfirm?.description || ''}
                buttons={[
                    {
                        label: appConfirm?.confirmLabel || 'Confirm',
                        variant: appConfirm?.confirmVariant || 'danger',
                        onClick: () => appConfirm?.onConfirm?.(),
                    },
                    {
                        label: appConfirm?.cancelLabel || 'Cancel',
                        variant: 'secondary',
                        onClick: () => appConfirm?.onCancel?.(),
                    },
                ]}
                onOpenChange={(open) => {
                    if (!open) {
                        appConfirm?.onCancel?.();
                    }
                }}
            />

            <LessonConfirmDialog
                open={Boolean(appChoice)}
                title={appChoice?.title || ''}
                description={appChoice?.description || ''}
                icon={appChoice?.icon || 'warning'}
                buttons={appChoice?.buttons || []}
                onOpenChange={(open) => {
                    if (!open) {
                        appChoice?.onCancel?.();
                    }
                }}
            />
        </div>
    );
}
