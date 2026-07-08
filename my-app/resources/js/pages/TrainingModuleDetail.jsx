import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import Swal from 'sweetalert2';
import {
    CircleDashed,
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
    RefreshCw,
    ShieldCheck,
    Target,
    Trash2,
    UserRound,
    Users,
    Video,
    Workflow,
    X,
    CheckCircle2,
    AlertCircle,
    Building2,
    Info,
    MapPin,
} from 'lucide-react';
import { getCsrfHeaders, getCsrfToken, pingSessionActivity } from '../utils/csrf';
import { AdminContentCard } from '../components/admin/AdminLayout';
import { AdminTableActionButton } from '../components/admin/AdminDataTable';

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

const DELIVERY_METHOD_LABELS = {
    in_person: 'Face-to-Face',
    online: 'Online',
};

function parseDateValue(value) {
    if (!value) return null;
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    const normalized = String(value).trim();
    if (!normalized) return null;

    const dateOnlyMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
        const [, year, month, day] = dateOnlyMatch;
        const parsed = new Date(Number(year), Number(month) - 1, Number(day));
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseTimeValue(value) {
    if (!value) return null;

    const normalized = String(value).trim();
    if (!normalized) return null;

    const timeMatch = normalized.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (timeMatch) {
        const [, hours = '0', minutes = '0', seconds = '0'] = timeMatch;
        const date = new Date();
        date.setHours(Number(hours), Number(minutes), Number(seconds), 0);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(dateString) {
    const date = parseDateValue(dateString);
    if (!date) return '—';
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatTime(timeString) {
    const date = parseTimeValue(timeString);
    if (!date) return '—';
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    });
}

function parseHazardTokens(value) {
    return String(value || '')
        .split(/[,&/]+/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);
}

function getLessonStatus(lesson) {
    const resources = lesson.resources || [];

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

function formatDateTime(dateString) {
    const date = parseDateValue(dateString);
    if (!date) return '—';
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function formatDateTimeParts(dateString) {
    const date = parseDateValue(dateString);
    if (!date) return { date: '—', time: '—' };

    return {
        date: formatDate(date),
        time: date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        }),
    };
}

function formatTimeRange(startTime, endTime) {
    const start = formatTime(startTime);
    const end = formatTime(endTime);

    if (start === '—' && end === '—') return '—';
    if (start !== '—' && end !== '—') return `${start} – ${end}`;
    return start !== '—' ? start : end;
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

function CampaignRequestProposedSessionsCell({ request }) {
    const sessions = Array.isArray(request?.proposed_sessions) ? request.proposed_sessions : [];

    if (sessions.length === 0) {
        if (!request?.proposed_session_label) {
            return <div className="text-slate-700">—</div>;
        }

        return <div className="text-slate-700">{request.proposed_session_label}</div>;
    }

    const maxVisible = 2;
    const visibleSessions = sessions.slice(0, maxVisible);
    const hiddenCount = sessions.length - visibleSessions.length;

    return (
        <div className="space-y-1">
            {visibleSessions.map((session, idx) => (
                <div key={`${session.label}-${idx}`} className="leading-tight">
                    <div className="font-medium text-slate-900">{session.label}</div>
                    {session.date ? (
                        <div className="text-xs text-slate-700">
                            {session.date}
                        </div>
                    ) : null}
                    {session.time ? (
                        <div className="text-[0.7rem] text-slate-500">
                            {session.time}
                        </div>
                    ) : null}
                </div>
            ))}
            {hiddenCount > 0 ? (
                <div className="text-xs font-medium text-emerald-700">+{hiddenCount} more</div>
            ) : null}
        </div>
    );
}

function getRecommendedCommunityEntries(value) {
    if (value && Array.isArray(value.communities)) {
        return value.communities.filter((item) => item && typeof item === 'object');
    }
    if (Array.isArray(value)) {
        return value.filter((item) => item && typeof item === 'object');
    }

    return [];
}

function getRiskBadgeClass(level) {
    const normalized = String(level || '').toLowerCase();
    if (normalized === 'high') return 'border-rose-200 bg-rose-50 text-rose-700';
    if (normalized === 'medium' || normalized === 'moderate') return 'border-amber-200 bg-amber-50 text-amber-700';
    return 'border-slate-200 bg-slate-100 text-slate-700';
}

function getPriorityBadgeClass(level) {
    if (level === 'Priority 1') return 'border-rose-200 bg-rose-50 text-rose-700';
    if (level === 'Priority 2') return 'border-amber-200 bg-amber-50 text-amber-700';
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
}

function formatDuration(minutes) {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function renderResourcePreview(resource) {
    const url = resource.display_url || resource.file_url || resource.external_url;

    if (resource.resource_type === 'text') {
        return (
            <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-line">
                {resource.body || 'No text content.'}
            </div>
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
            <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-emerald-700 hover:underline text-sm">
                <FileText className="w-4 h-4" /> Open PDF
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
    const isReady = resource.ai_processing_status === 'ready' && resource.has_readable_content;
    const isProcessing = ['pending', 'processing'].includes(resource.ai_processing_status);
    const isFailed = resource.ai_processing_status === 'failed';

    return (
        <div className="flex items-start gap-2 text-xs">
            {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600 mt-0.5" />}
            {isReady && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5" />}
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

function CampaignRequestStatusBadge({ status }) {
    const normalized = String(status || '').toLowerCase();

    const map = {
        draft: { label: 'Draft', cls: 'border-amber-200 bg-amber-50 text-amber-700' },
        submitted: { label: 'Submitted', cls: 'border-sky-200 bg-sky-50 text-sky-700' },
        waiting_for_approval: { label: 'Waiting for Approval', cls: 'border-amber-200 bg-amber-50 text-amber-700' },
        approved: { label: 'Approved', cls: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
        scheduled: { label: 'Scheduled', cls: 'border-violet-200 bg-violet-50 text-violet-700' },
        completed: { label: 'Completed', cls: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
        rejected: { label: 'Rejected', cls: 'border-rose-200 bg-rose-50 text-rose-700' },
    };

    const item = map[normalized] || { label: status || '—', cls: 'border-slate-200 bg-slate-50 text-slate-700' };

    return (
        <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${item.cls}`}>
            {item.label}
        </span>
    );
}

async function submitTrainingForm(form, moduleId) {
    const ping = await pingSessionActivity();
    if (!ping.ok) {
        await Swal.fire({ icon: 'error', title: 'Session error', text: 'Your session expired. Please refresh and try again.' });
        return false;
    }

    const token = getCsrfToken();
    const formData = new FormData(form);
    formData.set('_token', token);

    const spoofedMethod = formData.get('_method');
    const method = spoofedMethod ? 'POST' : (form.getAttribute('method') || 'POST').toUpperCase();

    const response = await fetch(form.action, {
        method,
        body: formData,
        credentials: 'same-origin',
        headers: { Accept: 'text/html,application/xhtml+xml', 'X-Requested-With': 'XMLHttpRequest', ...getCsrfHeaders() },
        redirect: 'manual',
    });

    if (response.status === 419) {
        await Swal.fire({ icon: 'error', title: 'Session expired', text: 'Please refresh and try again.' });
        return false;
    }

    if (response.status === 422) {
        const data = await response.json().catch(() => ({}));
        const errors = data.errors ? Object.values(data.errors).flat().join('\n') : data.message;
        await Swal.fire({ icon: 'error', title: 'Validation failed', text: errors || 'Please check the form.' });
        return false;
    }

    if (response.status >= 300 && response.status < 400) {
        window.location.assign(`/admin/training-modules/${moduleId}`);
        return true;
    }

    if (!response.ok) {
        await Swal.fire({ icon: 'error', title: 'Request failed', text: 'Could not save changes.' });
        return false;
    }

    window.location.assign(`/admin/training-modules/${moduleId}`);
    return true;
}

function AddResourceForm({ moduleId, lessonId, onCancel }) {
    const [resourceType, setResourceType] = React.useState('text');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fileInput = form.querySelector('input[name="file"]');

        if (fileInput?.files?.length) {
            const result = await Swal.fire({
                title: 'Storage location',
                text: 'Choose where to store the uploaded file.',
                icon: 'question',
                showCancelButton: true,
                showDenyButton: true,
                confirmButtonText: 'Cloudinary',
                denyButtonText: 'Local storage',
                cancelButtonText: 'Cancel',
            });
            if (result.isDismissed) return;
            form.querySelector('input[name="storage_target"]').value = result.isConfirmed ? 'cloudinary' : 'local';
        }

        const ok = await submitTrainingForm(form, moduleId);
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
                <div>
                    <label className="block text-[0.7rem] font-semibold text-slate-600 mb-1">YouTube URL *</label>
                    <input name="external_url" type="url" required placeholder="https://www.youtube.com/watch?v=..." className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                </div>
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

function AddLessonForm({ moduleId, onCancel }) {
    const handleSubmit = async (e) => {
        e.preventDefault();
        const ok = await submitTrainingForm(e.currentTarget, moduleId);
        if (ok) {
            onCancel?.();
        }
    };

    return (
        <form
            method="POST"
            action={`/admin/training-modules/${moduleId}/contents`}
            className="space-y-4"
            onSubmit={handleSubmit}
        >
            <input type="hidden" name="_token" value={getCsrfToken()} />
            <div>
                <label className="block text-[0.7rem] font-semibold text-slate-600 mb-1">Lesson Title *</label>
                <input name="title" type="text" required className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
                <label className="block text-[0.7rem] font-semibold text-slate-600 mb-1">Description (optional)</label>
                <textarea name="description" rows={3} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5"
                >
                    <Plus className="w-4 h-4" />
                    Add Lesson
                </button>
            </div>
        </form>
    );
}

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
    const [isCampaignDescriptionExpanded, setIsCampaignDescriptionExpanded] = React.useState(false);
    const [draggedId, setDraggedId] = React.useState(null);
    const [lessonForm, setLessonForm] = React.useState({ title: '', description: '' });
    const [resourceForm, setResourceForm] = React.useState({ title: '', body: '', external_url: '', resource_type: 'text' });
    const [activeTab, setActiveTab] = React.useState(() => {
        const hash = String(window.location.hash || '').replace('#', '');
        if (hash === 'intelligence') return 'intelligence';
        if (hash === 'campaign_requests') return 'campaign_requests';
        return 'lessons';
    });
    const shortDescription = module.short_description || '';
    const [relatedHazard, setRelatedHazard] = React.useState(module.related_hazard || module.category || '');
    const DELIVERY_METHOD_OPTIONS = React.useMemo(() => ([
        { value: 'in_person', label: 'Face-to-Face' },
        { value: 'online', label: 'Online' },
    ]), []);
    const ONLINE_PLATFORM_OPTIONS = React.useMemo(() => ([
        { value: 'google_meet', label: 'Google Meet' },
        { value: 'zoom', label: 'Zoom' },
        { value: 'microsoft_teams', label: 'Microsoft Teams' },
        { value: 'other', label: 'Other' },
    ]), []);
    const [targetAudience, setTargetAudience] = React.useState(Array.isArray(module.target_audience) ? module.target_audience : []);
    const [profileObjectives, setProfileObjectives] = React.useState(
        Array.isArray(module.learning_objectives) && module.learning_objectives.length > 0
            ? module.learning_objectives
            : [''],
    );
    const trainerOptions = React.useMemo(() => (
        Array.isArray(module.qualified_trainers) ? module.qualified_trainers : []
    ), [module.qualified_trainers]);
    const [selectedTrainerId, setSelectedTrainerId] = React.useState('');
    const [assignedTrainerIds, setAssignedTrainerIds] = React.useState(
        Array.isArray(module.assigned_qualified_trainer_ids) && module.assigned_qualified_trainer_ids.length > 0
            ? module.assigned_qualified_trainer_ids.map((id) => String(id))
            : (module.lead_qualified_trainer_id ? [String(module.lead_qualified_trainer_id)] : []),
    );
    const [trainingSessions, setTrainingSessions] = React.useState(() => (
        Array.isArray(module.available_training_sessions) && module.available_training_sessions.length > 0
            ? module.available_training_sessions.map((item) => ({
                title: item?.title || '',
                date: item?.date || '',
                start_time: item?.start_time || '',
                end_time: item?.end_time || '',
                delivery_method: item?.delivery_method || item?.deliveryMethod || 'in_person',
                venue: item?.venue || '',
                online_platform: item?.online_platform || item?.platform || 'google_meet',
                meeting_link: item?.meeting_link || item?.meetingLink || '',
                maximum_participants: item?.maximum_participants ?? item?.maximumParticipants ?? 20,
            }))
            : []
    ));
    const [sessionFieldErrors, setSessionFieldErrors] = React.useState({});
    const [sessionValidationActive, setSessionValidationActive] = React.useState(false);
    const [isSubmittingProfile, setIsSubmittingProfile] = React.useState(false);
    const [campaignRequests, setCampaignRequests] = React.useState([]);
    const [isLoadingCampaignRequests, setIsLoadingCampaignRequests] = React.useState(false);
    const [selectedCampaignRequest, setSelectedCampaignRequest] = React.useState(null);
    const [isCampaignRequestDialogOpen, setIsCampaignRequestDialogOpen] = React.useState(false);
    const [additionalCommunityQuery, setAdditionalCommunityQuery] = React.useState('');
    const [additionalCommunities, setAdditionalCommunities] = React.useState(() => (
        Array.isArray(module.additional_communities) ? module.additional_communities : []
    ));

    const thumbnailUrl = module.thumbnail_url || (module.thumbnail_path ? `/storage/${module.thumbnail_path}` : null);
    const recommendations = module.recommended_communities || null;
    const recommendedCommunityEntries = React.useMemo(
        () => getRecommendedCommunityEntries(recommendations),
        [recommendations],
    );
    const recommendedCommunityIds = React.useMemo(
        () => new Set(recommendedCommunityEntries.map((item) => Number(item.barangay_profile_id)).filter(Number.isFinite)),
        [recommendedCommunityEntries],
    );
    const availableCommunityOptions = React.useMemo(
        () => (Array.isArray(module.community_options) ? module.community_options : []),
        [module.community_options],
    );
    const filteredCommunityOptions = React.useMemo(() => {
        const selectedIds = new Set(additionalCommunities.map((item) => Number(item.barangay_profile_id)));
        const q = additionalCommunityQuery.trim().toLowerCase();

        return availableCommunityOptions
            .filter((item) => !selectedIds.has(Number(item.barangay_profile_id)))
            .filter((item) => !recommendedCommunityIds.has(Number(item.barangay_profile_id)))
            .filter((item) => {
                if (!q) return true;
                return [
                    item.barangay_name,
                    item.municipality_city,
                    item.province,
                ].join(' ').toLowerCase().includes(q);
            })
            .slice(0, 8);
    }, [availableCommunityOptions, additionalCommunities, additionalCommunityQuery, recommendedCommunityIds]);
    const hazardTokens = React.useMemo(() => parseHazardTokens(relatedHazard || module.category), [relatedHazard, module.category]);
    const activeTrainerOptions = React.useMemo(
        () => trainerOptions.filter((trainer) => String(trainer.status || '').toLowerCase() === 'active'),
        [trainerOptions],
    );
    const recommendedTrainerOptions = React.useMemo(() => {
        if (hazardTokens.length === 0) {
            return activeTrainerOptions;
        }
        return activeTrainerOptions.filter((trainer) => {
            const specialization = String(trainer.specialization || '').toLowerCase();
            return hazardTokens.some((token) => specialization.includes(token));
        });
    }, [activeTrainerOptions, hazardTokens]);
    const fallbackTrainerOptions = React.useMemo(() => {
        if (recommendedTrainerOptions.length > 0) {
            return recommendedTrainerOptions;
        }
        return activeTrainerOptions;
    }, [recommendedTrainerOptions, activeTrainerOptions]);
    const assignedTrainers = React.useMemo(() => (
        assignedTrainerIds
            .map((id) => trainerOptions.find((trainer) => String(trainer.id) === String(id)))
            .filter(Boolean)
    ), [assignedTrainerIds, trainerOptions]);
    const lessonQuizAvailable = lessons.some((lesson) => {
        const config = lesson.lesson_quiz_config || lesson.lessonQuizConfig;
        return Boolean(config?.is_enabled && config?.published_version_id);
    });
    const finalScenarioAvailable = Boolean(module.ai_scenario_config?.is_enabled && module.ai_scenario_config?.published_version_id);

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

    const handleDragStart = (id) => setDraggedId(id);

    const handleDragOver = (e) => e.preventDefault();

    const handleDrop = async (targetId) => {
        if (!draggedId || draggedId === targetId) return;
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
        setLessonForm({ title: lesson.title || '', description: lesson.description || '' });
    };

    const handleLessonEdit = (lesson) => {
        setSelectedLesson(lesson);
        setSelectedResource(null);
        setIsEditLessonMode(true);
        setIsEditResourceMode(false);
        setShowAddResource(false);
        setLessonForm({ title: lesson.title || '', description: lesson.description || '' });
    };

    const handleResourceClick = (resource) => {
        setSelectedResource(resource);
        setIsEditResourceMode(false);
        setResourceForm({
            title: resource.title || '',
            body: resource.body || '',
            external_url: resource.external_url || '',
            resource_type: resource.resource_type || 'text',
        });
    };


    const handleDeleteLesson = async (e) => {
        e.preventDefault();
        const ok = await Swal.fire({ title: 'Delete lesson and all its resources?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626' });
        if (!ok.isConfirmed) return;
        await submitTrainingForm(e.currentTarget, module.id);
    };

    const handleDeleteResource = async (e) => {
        e.preventDefault();
        const ok = await Swal.fire({ title: 'Delete this resource?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626' });
        if (!ok.isConfirmed) return;
        await submitTrainingForm(e.currentTarget, module.id);
    };

    const toggleAudience = (value) => {
        setTargetAudience((current) => (
            current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
        ));
    };

    const addObjective = () => setProfileObjectives((current) => [...current, '']);
    const updateObjective = (index, value) => setProfileObjectives((current) => current.map((item, idx) => idx === index ? value : item));
    const removeObjective = (index) => setProfileObjectives((current) => {
        const next = current.filter((_, idx) => idx !== index);
        return next.length > 0 ? next : [''];
    });
    const moveObjective = (index, direction) => setProfileObjectives((current) => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= current.length) return current;
        const next = [...current];
        [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
        return next;
    });

    const addAssignedTrainer = () => {
        if (!selectedTrainerId) return;
        setAssignedTrainerIds((current) => (
            current.includes(String(selectedTrainerId)) ? current : [...current, String(selectedTrainerId)]
        ));
        setSelectedTrainerId('');
    };

    const removeAssignedTrainer = (trainerId) => {
        setAssignedTrainerIds((current) => current.filter((id) => String(id) !== String(trainerId)));
    };

    const addTrainingSession = () => setTrainingSessions((current) => {
        const baseTitle = String(module.title || 'Training').trim() || 'Training';
        const nextIndex = current.length + 1;
        return [
            ...current,
            {
                title: `${baseTitle} - Session ${nextIndex}`,
                date: '',
                start_time: '',
                end_time: '',
                delivery_method: 'in_person',
                venue: '',
                online_platform: 'google_meet',
                meeting_link: '',
                maximum_participants: 30,
            },
        ];
    });
    const updateTrainingSession = (index, field, value) => setTrainingSessions((current) => (
        current.map((item, idx) => idx === index ? { ...item, [field]: value } : item)
    ));
    const removeTrainingSession = (index) => setTrainingSessions((current) => current.filter((_, idx) => idx !== index));
    const addAdditionalCommunity = (community) => {
        if (!community || !community.barangay_profile_id) return;
        setAdditionalCommunities((current) => (
            current.some((item) => Number(item.barangay_profile_id) === Number(community.barangay_profile_id))
                ? current
                : [...current, community]
        ));
        setAdditionalCommunityQuery('');
    };
    const removeAdditionalCommunity = (barangayProfileId) => {
        setAdditionalCommunities((current) => (
            current.filter((item) => Number(item.barangay_profile_id) !== Number(barangayProfileId))
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

    const handleViewCampaignRequest = async (requestId) => {
        setSelectedCampaignRequest(null);
        setIsCampaignDescriptionExpanded(false);
        setIsCampaignRequestDialogOpen(true);

        try {
            const response = await fetch(`/admin/campaign-requests/${requestId}`, {
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
                throw new Error(data.message || 'Could not load request details.');
            }

            setSelectedCampaignRequest(data.request || null);
        } catch (e) {
            setIsCampaignRequestDialogOpen(false);
            await Swal.fire({ icon: 'error', title: 'Load failed', text: e?.message || 'Could not load request details.' });
        }
    };

    React.useEffect(() => {
        if (activeTab === 'campaign_requests') {
            loadCampaignRequests();
        }
    }, [activeTab]);

    React.useEffect(() => {
        if (!sessionValidationActive) {
            return;
        }

        setSessionFieldErrors(computeTrainingSessionFieldErrors(trainingSessions));
    }, [trainingSessions, sessionValidationActive]);

    const activateSessionValidation = () => setSessionValidationActive(true);

    const getSessionFieldError = (index, field) => (
        sessionValidationActive ? sessionFieldErrors[index]?.[field] : undefined
    );

    const getNormalizedTrainingSessions = () => trainingSessions
        .map((item) => ({
            title: item.title || '',
            date: item.date || '',
            start_time: item.start_time || '',
            end_time: item.end_time || '',
            delivery_method: item.delivery_method || 'in_person',
            venue: item.venue || '',
            online_platform: item.online_platform || '',
            meeting_link: item.meeting_link || '',
            maximum_participants: Number(item.maximum_participants),
        }))
        .filter((item) => isTrainingSessionPartiallyFilled(item));

    const validateIntelligenceProfile = () => {
        const cleanedObjectives = profileObjectives.map((item) => item.trim()).filter(Boolean);
        if (cleanedObjectives.length === 0) {
            return {
                ok: false,
                title: 'Missing objectives',
                text: 'Please add at least one training objective.',
            };
        }

        if (!String(relatedHazard || '').trim()) {
            return {
                ok: false,
                title: 'Missing related hazard',
                text: 'Please enter at least one Related Hazard(s).',
            };
        }

        const normalizedSessions = getNormalizedTrainingSessions();
        if (normalizedSessions.length === 0) {
            return {
                ok: false,
                title: 'No training sessions',
                text: 'Add at least one complete training session before saving and submitting to Campaign.',
                activateSessionValidation: true,
            };
        }

        const nextSessionFieldErrors = computeTrainingSessionFieldErrors(trainingSessions);
        if (Object.keys(nextSessionFieldErrors).length > 0) {
            return {
                ok: false,
                title: 'Incomplete training session',
                text: 'Please fill in all required session fields highlighted in red.',
                activateSessionValidation: true,
                sessionFieldErrors: nextSessionFieldErrors,
            };
        }

        return { ok: true, cleanedObjectives, normalizedSessions };
    };

    const persistIntelligenceProfile = async ({ cleanedObjectives, normalizedSessions }) => {
        const formData = new FormData();
        formData.append('_token', getCsrfToken());
        formData.append('_method', 'PUT');
        formData.append('title', module.title || '');
        formData.append('description', module.description || '');
        formData.append('short_description', shortDescription);
        formData.append('category', module.category || '');
        formData.append('related_hazard', relatedHazard);
        formData.append('estimated_duration_minutes', String(module.estimated_duration_minutes || ''));
        formData.append('visibility', module.visibility || 'all');
        formData.append('status', module.status || 'draft');
        formData.append('difficulty', module.difficulty || 'Beginner');
        cleanedObjectives.forEach((item, index) => formData.append(`learning_objectives[${index}]`, item));
        targetAudience.forEach((item, index) => formData.append(`target_audience[${index}]`, item));
        assignedTrainerIds.forEach((item, index) => formData.append(`assigned_qualified_trainer_ids[${index}]`, item));
        normalizedSessions.forEach((item, index) => {
            formData.append(`available_training_sessions[${index}][title]`, item.title);
            formData.append(`available_training_sessions[${index}][date]`, item.date);
            formData.append(`available_training_sessions[${index}][start_time]`, item.start_time);
            formData.append(`available_training_sessions[${index}][end_time]`, item.end_time);
            formData.append(`available_training_sessions[${index}][delivery_method]`, item.delivery_method);
            formData.append(`available_training_sessions[${index}][venue]`, item.delivery_method === 'in_person' ? item.venue : '');
            formData.append(`available_training_sessions[${index}][online_platform]`, item.delivery_method === 'online' ? item.online_platform : '');
            formData.append(`available_training_sessions[${index}][meeting_link]`, item.delivery_method === 'online' ? item.meeting_link : '');
            formData.append(`available_training_sessions[${index}][maximum_participants]`, String(item.maximum_participants));
        });

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
            if (validation.activateSessionValidation) {
                setSessionValidationActive(true);
                setSessionFieldErrors(validation.sessionFieldErrors || computeTrainingSessionFieldErrors(trainingSessions));
            }

            await Swal.fire({
                icon: 'warning',
                title: validation.title,
                text: validation.text,
            });
            return;
        }

        setSessionValidationActive(false);
        setSessionFieldErrors({});

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
            await persistIntelligenceProfile({
                cleanedObjectives: validation.cleanedObjectives,
                normalizedSessions: validation.normalizedSessions,
            });

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
                        <div className="flex items-center gap-2 mb-3"><Target className="w-4 h-4 text-emerald-700" /><h3 className="text-sm font-semibold text-slate-800">Training Objectives</h3></div>
                        <div className="space-y-2">
                            {profileObjectives.map((objective, index) => (
                                <div key={`${index}-${objective}`} className="flex items-center gap-2">
                                    <button type="button" onClick={() => moveObjective(index, 'up')} className="rounded-lg border border-slate-300 p-2"><ChevronUp className="w-3.5 h-3.5" /></button>
                                    <button type="button" onClick={() => moveObjective(index, 'down')} className="rounded-lg border border-slate-300 p-2"><ChevronDown className="w-3.5 h-3.5" /></button>
                                    <input value={objective} onChange={(e) => updateObjective(index, e.target.value)} className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                                    <button type="button" onClick={() => removeObjective(index)} className="rounded-lg border border-rose-200 p-2 text-rose-700"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addObjective} className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"><Plus className="w-3.5 h-3.5" /> Add Objective</button>
                    </AdminContentCard>

                    <AdminContentCard className="p-5">
                        <div className="flex items-center gap-2 mb-4"><UserRound className="w-4 h-4 text-emerald-700" /><h3 className="text-sm font-semibold text-slate-800">Assigned Trainers</h3></div>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-end">
                                <div className="flex-1">
                                    <label className="block text-xs text-slate-500 mb-1">Assign Trainer</label>
                                    <select
                                        value={selectedTrainerId}
                                        onChange={(e) => setSelectedTrainerId(e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                                    >
                                        <option value="">Select a recommended trainer</option>
                                        {fallbackTrainerOptions.map((trainer) => {
                                            const isRecommended = recommendedTrainerOptions.some((item) => item.id === trainer.id);
                                            return (
                                                <option key={trainer.id} value={trainer.id}>
                                                    {`${isRecommended ? '⭐ ' : ''}${trainer.name} • ${trainer.specialization || 'General'}`}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    {recommendedTrainerOptions.length === 0 && (
                                        <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                            No qualified trainer is currently available for this training specialization.
                                        </p>
                                    )}
                                </div>
                                <button type="button" onClick={addAssignedTrainer} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                                    <Plus className="w-4 h-4" /> Assign Trainer
                                </button>
                            </div>

                            {assignedTrainers.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                                    No trainers assigned yet.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {assignedTrainers.map((trainer) => (
                                        <div key={trainer.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="space-y-2">
                                                    <p className="text-sm font-semibold text-slate-900">{trainer.name}</p>
                                                    <p className="text-xs text-slate-500">Role</p>
                                                    <p className="text-sm text-slate-700">Trainer</p>
                                                    <p className="text-xs text-slate-500">Specialization</p>
                                                    <p className="text-sm text-slate-700">{trainer.specialization || '—'}</p>
                                                    <p className="text-xs text-slate-500">Status</p>
                                                    <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${String(trainer.status).toLowerCase() === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-700'}`}>
                                                        {trainer.status || 'Inactive'}
                                                    </span>
                                                    <p className="text-xs text-slate-500">Certifications</p>
                                                    <p className="text-sm text-slate-700">
                                                        {Array.isArray(trainer.certifications) && trainer.certifications.length > 0
                                                            ? trainer.certifications.join(', ')
                                                            : '—'}
                                                    </p>
                                                </div>
                                                <button type="button" onClick={() => removeAssignedTrainer(trainer.id)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </AdminContentCard>

                    <AdminContentCard className="p-5">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">Available Training Sessions</h3>
                                <p className="text-xs text-slate-500 mt-1">Proposed schedules only. Campaign Management will choose from these later. Fields marked with <span className="text-rose-500">*</span> are required.</p>
                            </div>
                            <button type="button" onClick={addTrainingSession} className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"><Plus className="w-3.5 h-3.5" /> Add Session</button>
                        </div>

                        {trainingSessions.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                                No proposed training sessions have been added yet.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {trainingSessions.map((session, index) => {
                                    const sessionHasErrors = sessionValidationActive
                                        && sessionFieldErrors[index]
                                        && Object.keys(sessionFieldErrors[index]).length > 0;

                                    return (
                                    <div
                                        key={`session-${index}`}
                                        className={`rounded-2xl border p-4 ${sessionHasErrors ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 bg-slate-50'}`}
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">Session Title</label>
                                                <input type="text" value={session.title || ''} onChange={(e) => updateTrainingSession(index, 'title', e.target.value)} className={trainingSessionInputClass(false)} placeholder="Session title" />
                                            </div>
                                            <div>
                                                <RequiredFieldLabel>Date</RequiredFieldLabel>
                                                <input
                                                    type="date"
                                                    value={session.date || ''}
                                                    onChange={(e) => updateTrainingSession(index, 'date', e.target.value)}
                                                    onBlur={activateSessionValidation}
                                                    className={trainingSessionInputClass(Boolean(getSessionFieldError(index, 'date')))}
                                                />
                                                <SessionFieldError message={getSessionFieldError(index, 'date')} />
                                            </div>
                                            <div>
                                                <RequiredFieldLabel>Delivery Method</RequiredFieldLabel>
                                                <select
                                                    value={session.delivery_method || 'in_person'}
                                                    onChange={(e) => updateTrainingSession(index, 'delivery_method', e.target.value)}
                                                    onBlur={activateSessionValidation}
                                                    className={trainingSessionInputClass(false)}
                                                >
                                                    {DELIVERY_METHOD_OPTIONS.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <RequiredFieldLabel>Start Time</RequiredFieldLabel>
                                                <input
                                                    type="time"
                                                    value={session.start_time || ''}
                                                    onChange={(e) => updateTrainingSession(index, 'start_time', e.target.value)}
                                                    onBlur={activateSessionValidation}
                                                    className={trainingSessionInputClass(Boolean(getSessionFieldError(index, 'start_time')))}
                                                />
                                                <SessionFieldError message={getSessionFieldError(index, 'start_time')} />
                                            </div>
                                            <div>
                                                <RequiredFieldLabel>End Time</RequiredFieldLabel>
                                                <input
                                                    type="time"
                                                    value={session.end_time || ''}
                                                    onChange={(e) => updateTrainingSession(index, 'end_time', e.target.value)}
                                                    onBlur={activateSessionValidation}
                                                    className={trainingSessionInputClass(Boolean(getSessionFieldError(index, 'end_time')))}
                                                />
                                                <SessionFieldError message={getSessionFieldError(index, 'end_time')} />
                                            </div>
                                            {String(session.delivery_method || 'in_person') === 'in_person' ? (
                                                <div>
                                                    <RequiredFieldLabel>Venue</RequiredFieldLabel>
                                                    <input
                                                        type="text"
                                                        value={session.venue || ''}
                                                        onChange={(e) => updateTrainingSession(index, 'venue', e.target.value)}
                                                        onBlur={activateSessionValidation}
                                                        className={trainingSessionInputClass(Boolean(getSessionFieldError(index, 'venue')))}
                                                        placeholder="Venue"
                                                    />
                                                    <SessionFieldError message={getSessionFieldError(index, 'venue')} />
                                                </div>
                                            ) : (
                                                <>
                                                    <div>
                                                        <RequiredFieldLabel>Platform</RequiredFieldLabel>
                                                        <select
                                                            value={session.online_platform || 'google_meet'}
                                                            onChange={(e) => updateTrainingSession(index, 'online_platform', e.target.value)}
                                                            onBlur={activateSessionValidation}
                                                            className={trainingSessionInputClass(Boolean(getSessionFieldError(index, 'online_platform')))}
                                                        >
                                                            {ONLINE_PLATFORM_OPTIONS.map((opt) => (
                                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                            ))}
                                                        </select>
                                                        <SessionFieldError message={getSessionFieldError(index, 'online_platform')} />
                                                    </div>
                                                    <div className="xl:col-span-2">
                                                        <RequiredFieldLabel>Meeting Link</RequiredFieldLabel>
                                                        <input
                                                            type="url"
                                                            value={session.meeting_link || ''}
                                                            onChange={(e) => updateTrainingSession(index, 'meeting_link', e.target.value)}
                                                            onBlur={activateSessionValidation}
                                                            className={trainingSessionInputClass(Boolean(getSessionFieldError(index, 'meeting_link')))}
                                                            placeholder="https://..."
                                                        />
                                                        <SessionFieldError message={getSessionFieldError(index, 'meeting_link')} />
                                                    </div>
                                                </>
                                            )}
                                            <div>
                                                <RequiredFieldLabel>Maximum Participants</RequiredFieldLabel>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="500"
                                                    value={session.maximum_participants ?? 30}
                                                    onChange={(e) => updateTrainingSession(index, 'maximum_participants', e.target.value)}
                                                    onBlur={activateSessionValidation}
                                                    className={trainingSessionInputClass(Boolean(getSessionFieldError(index, 'maximum_participants')))}
                                                />
                                                <SessionFieldError message={getSessionFieldError(index, 'maximum_participants')} />
                                            </div>
                                        </div>
                                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 font-medium text-slate-700 border border-slate-200">
                                                    <CalendarDays className="w-3.5 h-3.5" /> {formatDate(session.date)}
                                                </span>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 font-medium text-slate-700 border border-slate-200">
                                                    <Clock3 className="w-3.5 h-3.5" /> {formatTime(session.start_time)} - {formatTime(session.end_time)}
                                                </span>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 border border-emerald-200">
                                                    Capacity: {session.maximum_participants || '—'}
                                                </span>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600 border border-slate-200">
                                                    Remaining slots: future placeholder
                                                </span>
                                            </div>
                                            <button type="button" onClick={() => removeTrainingSession(index)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50">Delete Session</button>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        )}
                    </AdminContentCard>

                    <AdminContentCard className="p-5">
                        <h3 className="text-sm font-semibold text-slate-800 mb-2">Recommended Communities</h3>
                        {recommendations && recommendations.summary.total_communities > 0 ? (
                            <>
                                <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                        <p className="text-xs text-slate-500">Communities Found</p>
                                        <p className="text-lg font-semibold text-slate-900">{recommendations.summary.total_communities}</p>
                                    </div>
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                                        <p className="text-xs text-emerald-700">High Priority</p>
                                        <p className="text-lg font-semibold text-emerald-800">{recommendations.summary.high_priority}</p>
                                    </div>
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                                        <p className="text-xs text-amber-700">Medium Priority</p>
                                        <p className="text-lg font-semibold text-amber-800">{recommendations.summary.medium_priority}</p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                        <p className="text-xs text-slate-500">Low Priority</p>
                                        <p className="text-lg font-semibold text-slate-800">{recommendations.summary.low_priority}</p>
                                    </div>
                                </div>
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Barangay</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Related Hazard</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Risk Level</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Priority Score</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Recommendation</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {recommendations.communities.map((row) => (
                                                <tr key={row.barangay_profile_id}>
                                                    <td className="px-4 py-2">
                                                        <div className="font-medium text-slate-900">{row.barangay_name}</div>
                                                        <div className="text-xs text-slate-500">
                                                            {row.municipality_city}{row.province ? `, ${row.province}` : ''}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-slate-700">{row.related_hazard}</td>
                                                    <td className="px-4 py-2 text-sm text-slate-700">{row.risk_level}</td>
                                                    <td className="px-4 py-2 text-sm font-semibold text-slate-900">{row.priority_score}</td>
                                                    <td className="px-4 py-2 text-xs text-slate-700">{row.recommendation}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                                No communities currently match the selected hazard classification.
                            </div>
                        )}
                    </AdminContentCard>

                    <AdminContentCard className="p-5">
                        <div className="flex items-center gap-2 mb-3"><ShieldCheck className="w-4 h-4 text-emerald-700" /><h3 className="text-sm font-semibold text-slate-800">Training Capabilities</h3></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {[
                                { label: 'Lesson Quiz Available', enabled: lessonQuizAvailable },
                                { label: 'Final AI Scenario Assessment Available', enabled: finalScenarioAvailable },
                                { label: 'Evaluation & Scoring Available', enabled: lessons.length > 0 },
                                { label: 'Certification Available', enabled: lessons.length > 0 },
                            ].map((item) => (
                                <div key={item.label} className="rounded-xl border border-slate-200 px-3 py-2 flex items-center justify-between">
                                    <span>{item.label}</span>
                                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${item.enabled ? 'text-emerald-700' : 'text-slate-600'}`}>{item.enabled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <CircleDashed className="w-3.5 h-3.5" />}{item.enabled ? 'Yes' : 'No'}</span>
                                </div>
                            ))}
                        </div>
                    </AdminContentCard>

                    <AdminContentCard className="p-5">
                        <div className="flex items-center gap-2 mb-2"><Workflow className="w-4 h-4 text-emerald-700" /><h3 className="text-sm font-semibold text-slate-800">Integration Preview</h3></div>
                        <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">Hazard Assessment Profile → Recommended Communities → Campaign Planning & Scheduling → Participant Registration → Training Management → Final AI Scenario Assessment → Simulation Event Planning → Evaluation & Certification</p>
                    </AdminContentCard>

                    <AdminContentCard className="p-5">
                        <div className="flex items-center gap-2 mb-2"><Database className="w-4 h-4 text-emerald-700" /><h3 className="text-sm font-semibold text-slate-800">Campaign Integration Preview</h3></div>
                        <p className="text-sm text-slate-700 mb-2">Future Data to Share:</p>
                        <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                            <li>Training Module ID</li>
                            <li>Training Title</li>
                            <li>Short Description</li>
                            <li>Related Hazard(s)</li>
                            <li>Recommended Communities</li>
                            <li>Recommended Audience</li>
                            <li>Estimated Duration</li>
                            <li>Total Lessons</li>
                            <li>Assigned Trainers</li>
                            <li>Available Training Sessions</li>
                            <li>Maximum Participants</li>
                        </ul>
                        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
                            <p><span className="font-semibold text-slate-700">Assigned Trainers:</span> {assignedTrainers.length > 0 ? assignedTrainers.map((trainer) => trainer.name).join(', ') : 'Not assigned'}</p>
                            <p><span className="font-semibold text-slate-700">Proposed Sessions:</span> {trainingSessions.length}</p>
                        </div>
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
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Proposed Session</th>
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
                                                    <button
                                                        type="button"
                                                        onClick={() => handleViewCampaignRequest(req.id)}
                                                        className="rounded-lg px-3 py-1.5 text-xs bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </AdminContentCard>

                    <Dialog.Root
                        open={isCampaignRequestDialogOpen}
                        onOpenChange={(open) => {
                            setIsCampaignRequestDialogOpen(open);
                            if (!open) {
                                setIsCampaignDescriptionExpanded(false);
                            }
                        }}
                    >
                        <Dialog.Portal>
                            {/* Keep the table visible — use a right-side slide-over drawer */}
                            <div className="fixed inset-0 z-40 pointer-events-none" />
                            <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col overflow-auto border-l border-slate-200 bg-slate-50 shadow-2xl sm:w-[42vw] sm:min-w-[620px] sm:max-w-[760px]">
                                <div className="border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <Dialog.Title className="text-lg font-semibold text-slate-900">Campaign Request {selectedCampaignRequest ? `#${selectedCampaignRequest.id}` : ''}</Dialog.Title>
                                            <p className="mt-1 truncate text-sm text-slate-500">{selectedCampaignRequest?.training_module?.title || 'Training campaign request details'}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {selectedCampaignRequest ? <CampaignRequestStatusBadge status={selectedCampaignRequest.status} /> : null}
                                            <Dialog.Close asChild>
                                                <button type="button" className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700" aria-label="Close">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </Dialog.Close>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4 p-4 sm:p-5 lg:p-6">
                                    {!selectedCampaignRequest ? (
                                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">Loading request details…</div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                        <FileText className="h-3.5 w-3.5" />
                                                        Request ID
                                                    </div>
                                                    <div className="mt-2 text-base font-semibold text-slate-900">#{selectedCampaignRequest.id}</div>
                                                    <p className="mt-1 text-xs text-slate-500">Operational reference</p>
                                                </div>

                                                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                        <CalendarDays className="h-3.5 w-3.5" />
                                                        Submitted
                                                    </div>
                                                    <div className="mt-2 text-sm font-semibold text-slate-900">{formatDate(selectedCampaignRequest.submitted_at)}</div>
                                                    <p className="mt-1 text-xs text-slate-500">{formatDateTimeParts(selectedCampaignRequest.submitted_at).time}</p>
                                                </div>

                                                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                        <UserRound className="h-3.5 w-3.5" />
                                                        Submitted By
                                                    </div>
                                                    <div className="mt-2 text-sm font-semibold text-slate-900">{selectedCampaignRequest.submitted_by?.name || '—'}</div>
                                                    <p className="mt-1 text-xs text-slate-500">Request owner</p>
                                                </div>

                                                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                        <Building2 className="h-3.5 w-3.5" />
                                                        Submitted To
                                                    </div>
                                                    <div className="mt-2 text-sm font-semibold text-slate-900">{selectedCampaignRequest.submitted_to || '—'}</div>
                                                    <p className="mt-1 text-xs text-slate-500">Destination system</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
                                                <section className="space-y-4">
                                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                            <Info className="h-3.5 w-3.5" />
                                                            Request Overview
                                                        </div>
                                                        <div className="mt-4 space-y-4">
                                                            <div>
                                                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Proposed Session Summary</div>
                                                                <div className="mt-1 text-sm font-medium text-slate-900">{selectedCampaignRequest.proposed_session_label || '—'}</div>
                                                            </div>

                                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                                <div>
                                                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Related Hazards</div>
                                                                    <div className="mt-1 text-sm text-slate-900">
                                                                        {Array.isArray(selectedCampaignRequest.payload?.related_hazards)
                                                                            ? selectedCampaignRequest.payload.related_hazards.join(', ')
                                                                            : (selectedCampaignRequest.payload?.related_hazards || '—')}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lead Trainers</div>
                                                                    <div className="mt-1 text-sm text-slate-900">
                                                                        {Array.isArray(selectedCampaignRequest.payload?.assigned_trainers)
                                                                            ? selectedCampaignRequest.payload.assigned_trainers.map((trainer) => trainer.name).filter(Boolean).join(', ')
                                                                            : '—'}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Training Description</div>
                                                                <div className="mt-2 text-sm leading-6 text-slate-700">
                                                                    {(() => {
                                                                        const desc = selectedCampaignRequest.payload?.short_description || '';
                                                                        if (!desc) return '—';
                                                                        if (!isCampaignDescriptionExpanded && desc.length > 220) {
                                                                            return (
                                                                                <>
                                                                                    <div>{desc.slice(0, 220)}…</div>
                                                                                    <button type="button" onClick={() => setIsCampaignDescriptionExpanded(true)} className="mt-2 text-xs font-medium text-emerald-700 hover:text-emerald-800">
                                                                                        Read more
                                                                                    </button>
                                                                                </>
                                                                            );
                                                                        }

                                                                        return (
                                                                            <>
                                                                                <div>{desc}</div>
                                                                                {desc.length > 220 ? (
                                                                                    <button type="button" onClick={() => setIsCampaignDescriptionExpanded(false)} className="mt-2 text-xs font-medium text-emerald-700 hover:text-emerald-800">
                                                                                        Show less
                                                                                    </button>
                                                                                ) : null}
                                                                            </>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                                <CalendarDays className="h-3.5 w-3.5" />
                                                                Proposed Sessions
                                                            </div>
                                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                                                {(selectedCampaignRequest.payload?.available_training_sessions || []).length} total
                                                            </span>
                                                        </div>

                                                        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                                                            {(() => {
                                                                const sessions = selectedCampaignRequest.payload?.available_training_sessions || [];
                                                                if (!sessions.length) {
                                                                    return <div className="bg-slate-50 px-4 py-6 text-sm text-slate-600">No sessions provided.</div>;
                                                                }

                                                                return (
                                                                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                                                                        <thead className="bg-slate-50">
                                                                            <tr>
                                                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Session Name</th>
                                                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                                                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Time</th>
                                                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Max Participants</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-100 bg-white">
                                                                            {sessions.map((session, idx) => {
                                                                                const maxParticipants = session?.maximum_participants ?? session?.maximumParticipants ?? '—';

                                                                                return (
                                                                                    <tr key={`${session?.title || 'session'}-${idx}`} className="align-top">
                                                                                        <td className="px-4 py-3 font-medium text-slate-900">{session?.title || '—'}</td>
                                                                                        <td className="px-4 py-3 text-slate-700">{formatDate(session?.date)}</td>
                                                                                        <td className="px-4 py-3 text-slate-700">{formatTimeRange(session?.start_time, session?.end_time)}</td>
                                                                                        <td className="px-4 py-3 text-slate-700">{maxParticipants}</td>
                                                                                    </tr>
                                                                                );
                                                                            })}
                                                                        </tbody>
                                                                    </table>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </section>

                                                <aside className="space-y-4">
                                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                            <MapPin className="h-3.5 w-3.5" />
                                                            Recommended Communities
                                                        </div>
                                                        <div className="mt-4 flex flex-wrap gap-2">
                                                            {(() => {
                                                                const communities = getRecommendedCommunitiesList(selectedCampaignRequest.payload?.recommended_communities);
                                                                if (!communities.length) {
                                                                    return <p className="text-sm text-slate-600">No recommended communities.</p>;
                                                                }

                                                                return communities.map((community, index) => (
                                                                    <span key={`${community}-${index}`} className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                                                                        {community}
                                                                    </span>
                                                                ));
                                                            })()}
                                                        </div>
                                                    </div>

                                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                            <Workflow className="h-3.5 w-3.5" />
                                                            Audit Trail
                                                        </div>
                                                        <dl className="mt-4 space-y-3">
                                                            <div>
                                                                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created</dt>
                                                                <dd className="mt-1 text-sm text-slate-900">{formatDateTime(selectedCampaignRequest.created_at)}</dd>
                                                            </div>
                                                            <div>
                                                                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last Updated</dt>
                                                                <dd className="mt-1 text-sm text-slate-900">{formatDateTime(selectedCampaignRequest.updated_at)}</dd>
                                                            </div>
                                                        </dl>
                                                    </div>

                                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                            <ShieldCheck className="h-3.5 w-3.5" />
                                                            Campaign Remarks
                                                        </div>
                                                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                                                            {selectedCampaignRequest.remarks ? (
                                                                <pre className="overflow-auto whitespace-pre-wrap wrap-break-word font-sans">{JSON.stringify(selectedCampaignRequest.remarks, null, 2)}</pre>
                                                            ) : (
                                                                <p>No remarks yet.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </aside>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </Dialog.Content>
                        </Dialog.Portal>
                    </Dialog.Root>
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
                                            draggable
                                            onDragStart={() => handleDragStart(lesson.id)}
                                            onDragOver={handleDragOver}
                                            onDrop={() => handleDrop(lesson.id)}
                                            className={`bg-white hover:bg-slate-50/80 transition-colors ${draggedId === lesson.id ? 'opacity-50' : ''}`}
                                        >
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="inline-flex items-center gap-2 text-slate-500">
                                                    <button type="button" className="cursor-grab text-slate-400 hover:text-slate-600" aria-label="Drag to reorder">
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
                                                        action={`/admin/training-modules/${module.id}/contents/${lesson.id}`}
                                                        onSubmit={handleDeleteLesson}
                                                        className="inline-flex"
                                                    >
                                                        <input type="hidden" name="_token" value={getCsrfToken()} />
                                                        <input type="hidden" name="_method" value="DELETE" />
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

            <Dialog.Root open={showAddLessonModal} onOpenChange={setShowAddLessonModal}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] bg-white rounded-xl shadow-lg z-50 overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <Dialog.Title className="text-lg font-semibold text-slate-800">Add Lesson</Dialog.Title>
                            <Dialog.Close asChild>
                                <button type="button" className="w-8 h-8 rounded-full hover:bg-slate-100" aria-label="Close">
                                    <X className="w-4 h-4 mx-auto" />
                                </button>
                            </Dialog.Close>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <AddLessonForm moduleId={module.id} onCancel={() => setShowAddLessonModal(false)} />
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            <Dialog.Root
                open={selectedLesson !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedLesson(null);
                        setIsEditLessonMode(false);
                        setShowAddResource(false);
                    }
                }}
            >
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-lg z-50 overflow-hidden flex flex-col">
                        <Dialog.Title className="sr-only">Lesson Resources</Dialog.Title>
                        {selectedLesson && (
                            <>
                                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                                    <div>
                                        <h2 className="text-xl font-semibold text-slate-800">{selectedLesson.title}</h2>
                                        {selectedLesson.description && <p className="text-sm text-slate-600 mt-1">{selectedLesson.description}</p>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button type="button" onClick={() => setIsEditLessonMode(!isEditLessonMode)} className="rounded-md border border-emerald-500/60 bg-emerald-50 p-2">
                                            <Pencil className="w-4 h-4 text-emerald-800" />
                                        </button>
                                        <Dialog.Close asChild>
                                            <button type="button" className="w-8 h-8 rounded-full hover:bg-slate-100"><X className="w-4 h-4 mx-auto" /></button>
                                        </Dialog.Close>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {isEditLessonMode ? (
                                        <form method="POST" action={`/admin/training-modules/${module.id}/contents/${selectedLesson.id}`} className="space-y-3" onSubmit={(e) => { e.preventDefault(); submitTrainingForm(e.currentTarget, module.id); }}>
                                            <input type="hidden" name="_token" value={getCsrfToken()} />
                                            <input type="hidden" name="_method" value="PUT" />
                                            <input name="title" type="text" required value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                                            <textarea name="description" rows={3} value={lessonForm.description} onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Lesson description (optional)" />
                                            <button type="submit" className="rounded-md bg-emerald-600 text-white px-4 py-1.5 text-sm">Save Lesson</button>
                                        </form>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-slate-800">Learning Resources</h3>
                                                {!showAddResource && (
                                                    <button type="button" onClick={() => setShowAddResource(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold">
                                                        <Plus className="w-3.5 h-3.5" /> Add Resource
                                                    </button>
                                                )}
                                            </div>

                                            {showAddResource && (
                                                <AddResourceForm moduleId={module.id} lessonId={selectedLesson.id} onCancel={() => setShowAddResource(false)} />
                                            )}

                                            {RESOURCE_GROUPS.map((group) => {
                                                const items = groupedResources[group.key] || [];
                                                if (items.length === 0) return null;
                                                return (
                                                    <div key={group.key} className="space-y-2">
                                                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{group.label}</h4>
                                                        <ul className="space-y-2">
                                                            {items.map((resource) => (
                                                                <li key={resource.id} className="rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                                                                    <div className="flex items-start justify-between gap-3">
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="font-medium text-slate-800 text-sm">{resource.title}</p>
                                                                            <ResourceStatusBadge resource={resource} />
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-1.5 shrink-0">
                                                                            <button type="button" onClick={() => handleResourceClick(resource)} className="rounded-lg px-2 py-1 text-xs bg-white border border-slate-200 text-slate-700">View</button>
                                                                            <form method="POST" action={`/admin/training-modules/${module.id}/contents/${selectedLesson.id}/resources/${resource.id}/reprocess`} onSubmit={(e) => { e.preventDefault(); submitTrainingForm(e.currentTarget, module.id); }}>
                                                                                <input type="hidden" name="_token" value={getCsrfToken()} />
                                                                                <button type="submit" className="rounded-lg px-2 py-1 text-xs bg-white border border-slate-200 text-violet-700 inline-flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Reprocess</button>
                                                                            </form>
                                                                            <form method="POST" action={`/admin/training-modules/${module.id}/contents/${selectedLesson.id}/resources/${resource.id}`} onSubmit={handleDeleteResource}>
                                                                                <input type="hidden" name="_token" value={getCsrfToken()} />
                                                                                <input type="hidden" name="_method" value="DELETE" />
                                                                                <button type="submit" className="rounded-lg px-2 py-1 text-xs bg-white border border-rose-200 text-rose-700">Delete</button>
                                                                            </form>
                                                                        </div>
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                );
                                            })}

                                            {(selectedLesson.resources || []).length === 0 && !showAddResource && (
                                                <p className="text-sm text-slate-500">No learning resources yet. Click &quot;Add Resource&quot; to attach materials to this lesson.</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            <Dialog.Root open={selectedResource !== null} onOpenChange={(open) => !open && setSelectedResource(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] bg-white rounded-xl shadow-lg z-50 overflow-hidden flex flex-col">
                        {selectedResource && selectedLesson && (
                            <>
                                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                                    <h2 className="text-xl font-semibold text-slate-800">{isEditResourceMode ? 'Edit Resource' : selectedResource.title}</h2>
                                    <div className="flex items-center gap-2">
                                        {!isEditResourceMode && (
                                            <button type="button" onClick={() => setIsEditResourceMode(true)} className="rounded-md border border-emerald-500/60 bg-emerald-50 p-2">
                                                <Pencil className="w-4 h-4 text-emerald-800" />
                                            </button>
                                        )}
                                        <Dialog.Close asChild><button type="button" className="w-8 h-8 rounded-full hover:bg-slate-100"><X className="w-4 h-4 mx-auto" /></button></Dialog.Close>
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
                                                <input name="external_url" type="url" value={resourceForm.external_url} onChange={(e) => setResourceForm({ ...resourceForm, external_url: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
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
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
            </>
            )}
        </div>
    );
}
