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

function formatDate(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatTime(timeString) {
    if (!timeString) return '—';
    const [hours = '00', minutes = '00'] = String(timeString).split(':');
    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);
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
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
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
    const [deliveryMethod, setDeliveryMethod] = React.useState(module.delivery_method || 'in_person');
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
    const [trainingSessions, setTrainingSessions] = React.useState(
        Array.isArray(module.available_training_sessions) && module.available_training_sessions.length > 0
            ? module.available_training_sessions
            : [],
    );
    const [isSavingProfile, setIsSavingProfile] = React.useState(false);
    const [isSubmittingCampaign, setIsSubmittingCampaign] = React.useState(false);
    const [campaignRequests, setCampaignRequests] = React.useState([]);
    const [isLoadingCampaignRequests, setIsLoadingCampaignRequests] = React.useState(false);
    const [selectedCampaignRequest, setSelectedCampaignRequest] = React.useState(null);
    const [isCampaignRequestDialogOpen, setIsCampaignRequestDialogOpen] = React.useState(false);

    const thumbnailUrl = module.thumbnail_url || (module.thumbnail_path ? `/storage/${module.thumbnail_path}` : null);
    const recommendations = module.recommended_communities || null;
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

    const addTrainingSession = () => setTrainingSessions((current) => [
        ...current,
        { title: '', date: '', start_time: '', end_time: '', venue: '', maximum_participants: 30 },
    ]);
    const updateTrainingSession = (index, field, value) => setTrainingSessions((current) => (
        current.map((item, idx) => idx === index ? { ...item, [field]: value } : item)
    ));
    const removeTrainingSession = (index) => setTrainingSessions((current) => current.filter((_, idx) => idx !== index));

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
        const confirm = await Swal.fire({
            icon: 'question',
            title: 'Submit to Campaign?',
            text: 'Submit this Training Intelligence Profile to the Public Safety Campaign Management System for review.',
            showCancelButton: true,
            confirmButtonText: 'Submit',
            cancelButtonText: 'Cancel',
        });

        if (!confirm.isConfirmed) return;

        setIsSubmittingCampaign(true);
        try {
            const formData = new FormData();
            formData.append('_token', getCsrfToken());

            const response = await fetch(`/admin/training-modules/${module.id}/campaign-requests`, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin',
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...getCsrfHeaders() },
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Could not submit Training Intelligence Profile.');
            }

            await Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Submitted',
                text: 'Training Intelligence Profile submitted successfully. You can monitor its progress under Campaign Requests.',
                showConfirmButton: false,
                timer: 4500,
            });

            setActiveTab('campaign_requests');
        } catch (e) {
            await Swal.fire({ icon: 'error', title: 'Submission failed', text: e?.message || 'Could not submit.' });
        } finally {
            setIsSubmittingCampaign(false);
        }
    };

    const handleViewCampaignRequest = async (requestId) => {
        setSelectedCampaignRequest(null);
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

    const handleSaveProfile = async () => {
        const cleanedObjectives = profileObjectives.map((item) => item.trim()).filter(Boolean);
        if (cleanedObjectives.length === 0) {
            await Swal.fire({ icon: 'warning', title: 'Missing objectives', text: 'Please add at least one training objective.' });
            return;
        }

        if (!String(relatedHazard || '').trim()) {
            await Swal.fire({ icon: 'warning', title: 'Missing related hazard', text: 'Please enter at least one Related Hazard(s).' });
            return;
        }

        if (!['in_person', 'online'].includes(String(deliveryMethod))) {
            await Swal.fire({ icon: 'warning', title: 'Invalid delivery method', text: 'Please choose a valid delivery method.' });
            return;
        }

        const normalizedSessions = trainingSessions
            .map((item) => ({
                title: item.title || '',
                date: item.date || '',
                start_time: item.start_time || '',
                end_time: item.end_time || '',
                venue: item.venue || '',
                maximum_participants: Number(item.maximum_participants),
            }))
            .filter((item) => item.title || item.date || item.start_time || item.end_time || item.venue || item.maximum_participants);
        const invalidSession = normalizedSessions.find((item) => (
            !item.date
            || !item.start_time
            || !item.end_time
            || item.end_time <= item.start_time
            || !Number.isInteger(item.maximum_participants)
            || item.maximum_participants < 1
            || item.maximum_participants > 500
        ));
        if (invalidSession) {
            await Swal.fire({ icon: 'warning', title: 'Invalid training session', text: 'Each proposed session needs a date, valid time range, and maximum participants between 1 and 500.' });
            return;
        }

        const confirm = await Swal.fire({
            icon: 'question',
            title: 'Confirm save?',
            text: 'Your changes will be saved for this Training Intelligence Profile.',
            showCancelButton: true,
            confirmButtonText: 'Yes, save',
            cancelButtonText: 'Cancel',
        });

        if (!confirm.isConfirmed) return;

        setIsSavingProfile(true);
        try {
            const formData = new FormData();
            formData.append('_token', getCsrfToken());
            formData.append('_method', 'PUT');
            formData.append('title', module.title || '');
            formData.append('description', module.description || '');
            formData.append('short_description', shortDescription);
            formData.append('category', module.category || '');
            formData.append('related_hazard', relatedHazard);
            formData.append('delivery_method', deliveryMethod);
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
                formData.append(`available_training_sessions[${index}][venue]`, item.venue);
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
                await Swal.fire({ icon: 'error', title: 'Save failed', text: message });
                return;
            }

            await Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Saved',
                text: 'Training Intelligence Profile saved successfully.',
                showConfirmButton: false,
                timer: 2000,
            });
            window.location.assign(`/admin/training-modules/${module.id}#intelligence`);
        } finally {
            setIsSavingProfile(false);
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
                            {module.category && <span className="rounded-lg bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 font-medium">{module.category}</span>}
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-700">{lessons.length} {lessons.length === 1 ? 'Lesson' : 'Lessons'}</span>
                            <span className="rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 font-medium capitalize">{module.status}</span>
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
                        <h3 className="text-sm font-semibold text-slate-800 mb-3">Training Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Related Hazard(s)</label>
                                <input value={relatedHazard} onChange={(e) => setRelatedHazard(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                            </div>
                            <div><p className="text-xs text-slate-500">Estimated Duration</p><p className="text-sm font-medium text-slate-800">{formatDuration(module.estimated_duration_minutes) || '—'}</p></div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Delivery Method</label>
                                <select value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
                                    <option value="in_person">Face-to-Face</option>
                                    <option value="online">Online</option>
                                </select>
                            </div>
                            <div><p className="text-xs text-slate-500">Total Lessons</p><p className="text-sm font-medium text-slate-800">{lessons.length}</p></div>
                        </div>
                    </AdminContentCard>

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
                                <p className="text-xs text-slate-500 mt-1">Proposed schedules only. Campaign Management will choose from these later.</p>
                            </div>
                            <button type="button" onClick={addTrainingSession} className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"><Plus className="w-3.5 h-3.5" /> Add Session</button>
                        </div>

                        {trainingSessions.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                                No proposed training sessions have been added yet.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {trainingSessions.map((session, index) => (
                                    <div key={`session-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">Session Title</label>
                                                <input type="text" value={session.title || ''} onChange={(e) => updateTrainingSession(index, 'title', e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Optional session title" />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">Date</label>
                                                <input type="date" value={session.date || ''} onChange={(e) => updateTrainingSession(index, 'date', e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">Venue</label>
                                                <input type="text" value={session.venue || ''} onChange={(e) => updateTrainingSession(index, 'venue', e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Optional venue" />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">Start Time</label>
                                                <input type="time" value={session.start_time || ''} onChange={(e) => updateTrainingSession(index, 'start_time', e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">End Time</label>
                                                <input type="time" value={session.end_time || ''} onChange={(e) => updateTrainingSession(index, 'end_time', e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">Maximum Participants</label>
                                                <input type="number" min="1" max="500" value={session.maximum_participants ?? 30} onChange={(e) => updateTrainingSession(index, 'maximum_participants', e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
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
                                ))}
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
                            <p><span className="font-semibold text-slate-700">Delivery Method:</span> {DELIVERY_METHOD_LABELS[deliveryMethod] || '—'}</p>
                            <p><span className="font-semibold text-slate-700">Proposed Sessions:</span> {trainingSessions.length}</p>
                        </div>
                        <p className="mt-2 text-xs font-semibold text-amber-700">Only Published modules will be available to the Campaign Management System.</p>
                    </AdminContentCard>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-end">
                        <button
                            type="button"
                            onClick={handleSubmitToCampaign}
                            disabled={isSubmittingCampaign}
                            className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold px-4 py-2.5 disabled:opacity-60"
                        >
                            {isSubmittingCampaign ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Submit to Campaign
                        </button>
                        <button type="button" onClick={handleSaveProfile} disabled={isSavingProfile} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 disabled:opacity-60">
                            {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Save Training Intelligence Profile
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
                                                    {req.proposed_session_label ? (
                                                        (() => {
                                                            const parts = req.proposed_session_label.split(' • ').filter(Boolean);
                                                            const timePart = parts.length >= 1 ? parts[parts.length - 1] : null;
                                                            const datePart = parts.length >= 2 ? parts[parts.length - 2] : null;
                                                            const titlePart = parts.length > 2 ? parts.slice(0, -2).join(' • ') : null;
                                                            return (
                                                                <div>
                                                                    {titlePart ? <div className="font-medium text-slate-900">{titlePart}</div> : null}
                                                                    {datePart ? <div className="text-slate-700">{datePart}</div> : null}
                                                                    {timePart ? <div className="text-xs text-slate-500 mt-0.5">{timePart}</div> : null}
                                                                </div>
                                                            );
                                                        })()
                                                    ) : (
                                                        <div className="text-slate-700">—</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-slate-700">{req.submitted_to || '—'}</div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {req.submitted_at ? (
                                                        <>
                                                            <div className="text-slate-900">{new Date(req.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                                            <div className="text-xs text-slate-500 mt-0.5">{new Date(req.submitted_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
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

                    <Dialog.Root open={isCampaignRequestDialogOpen} onOpenChange={setIsCampaignRequestDialogOpen}>
                        <Dialog.Portal>
                            {/* Keep the table visible — use a right-side slide-over drawer */}
                            <div className="fixed inset-0 z-40 pointer-events-none" />
                            <Dialog.Content className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-lg z-50 overflow-auto flex flex-col border-l border-slate-200">
                                <div className="flex items-center justify-between p-6">
                                    <div>
                                        <Dialog.Title className="text-lg font-semibold text-slate-800">Campaign Request {selectedCampaignRequest ? `#${selectedCampaignRequest.id}` : ''}</Dialog.Title>
                                        <p className="text-xs text-slate-500 mt-1">{selectedCampaignRequest?.training_module?.title || ''}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {selectedCampaignRequest ? <CampaignRequestStatusBadge status={selectedCampaignRequest.status} /> : null}
                                        <Dialog.Close asChild>
                                            <button type="button" className="w-8 h-8 rounded-full hover:bg-slate-100" aria-label="Close">
                                                <X className="w-4 h-4 mx-auto" />
                                            </button>
                                        </Dialog.Close>
                                    </div>
                                </div>

                                <div className="flex-1 p-6 space-y-6">
                                    {!selectedCampaignRequest ? (
                                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">Loading request details…</div>
                                    ) : (
                                        <>
                                            {/* Top summary */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div>
                                                    <p className="text-xs text-slate-500">Request ID</p>
                                                    <div className="text-sm font-medium text-slate-900">#{selectedCampaignRequest.id}</div>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500">Submitted</p>
                                                    {selectedCampaignRequest.submitted_at ? (
                                                        <>
                                                            <div className="text-sm text-slate-900">{new Date(selectedCampaignRequest.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                                            <div className="text-xs text-slate-500 mt-0.5">{new Date(selectedCampaignRequest.submitted_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
                                                        </>
                                                    ) : (
                                                        <div className="text-sm text-slate-700">—</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500">Submitted By</p>
                                                    <div className="text-sm text-slate-900">{selectedCampaignRequest.submitted_by?.name || '—'}</div>
                                                </div>
                                            </div>

                                            {/* Training Description (truncated) */}
                                            <div>
                                                <p className="text-xs text-slate-500">Training Description</p>
                                                <div className="text-sm text-slate-700">
                                                    {(() => {
                                                        const desc = selectedCampaignRequest.payload?.short_description || '';
                                                        if (!desc) return '—';
                                                        if (!isDescriptionExpanded && desc.length > 240) {
                                                            return (
                                                                <>
                                                                    <div>{desc.slice(0, 240)}…</div>
                                                                    <button type="button" onClick={() => setIsDescriptionExpanded(true)} className="mt-2 text-xs text-emerald-600">Read more</button>
                                                                </>
                                                            );
                                                        }
                                                        return (
                                                            <>
                                                                <div>{desc}</div>
                                                                {desc.length > 240 ? (
                                                                    <button type="button" onClick={() => setIsDescriptionExpanded(false)} className="mt-2 text-xs text-emerald-600">Show less</button>
                                                                ) : null}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Key metadata row */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div>
                                                    <p className="text-xs text-slate-500">Related Hazard</p>
                                                    <div className="text-sm text-slate-900">{Array.isArray(selectedCampaignRequest.payload?.related_hazards) ? selectedCampaignRequest.payload.related_hazards.join(', ') : (selectedCampaignRequest.payload?.related_hazards || '—')}</div>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-slate-500">Lead Trainer(s)</p>
                                                    <div className="text-sm text-slate-900">{Array.isArray(selectedCampaignRequest.payload?.assigned_trainers) ? selectedCampaignRequest.payload.assigned_trainers.map(t => t.name).join(', ') : '—'}</div>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-slate-500">Recommended Communities</p>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {(() => {
                                                            const rc = selectedCampaignRequest.payload?.recommended_communities;
                                                            let list = [];
                                                            if (Array.isArray(rc)) {
                                                                list = rc.map(c => (typeof c === 'string' ? c : (c?.name || c?.label || JSON.stringify(c))));
                                                            } else if (rc && Array.isArray(rc.communities)) {
                                                                list = rc.communities.map(c => (typeof c === 'string' ? c : (c?.name || c?.label || JSON.stringify(c))));
                                                            }
                                                            if (list.length === 0) return <div className="text-sm text-slate-700">—</div>;
                                                            return list.map((c, i) => (
                                                                <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-xs text-slate-700">{c}</span>
                                                            ));
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Proposed Sessions */}
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Proposed Sessions</p>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {(() => {
                                                        const sessions = selectedCampaignRequest.payload?.available_training_sessions || [];
                                                        if (!sessions.length) return <div className="text-sm text-slate-700">No sessions provided.</div>;
                                                        return sessions.map((s, idx) => {
                                                            const date = s?.date ? new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
                                                            const start = s?.start_time ? new Date(s.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null;
                                                            const end = s?.end_time ? new Date(s.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null;
                                                            const timeRange = start && end ? `${start} – ${end}` : (start || '—');
                                                            const maxParts = s?.maximum_participants ?? s?.maximumParticipants ?? null;

                                                            return (
                                                                <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-white">
                                                                    {s?.title ? <div className="font-medium text-slate-900">{s.title}</div> : null}
                                                                    <div className="mt-2 text-sm text-slate-700">
                                                                        {date ? <div className="flex items-center gap-2"><span className="text-slate-400">📅</span><span>{date}</span></div> : null}
                                                                        {timeRange ? <div className="flex items-center gap-2 mt-1"><span className="text-slate-400">🕙</span><span className="text-xs text-slate-500">{timeRange}</span></div> : null}
                                                                    </div>
                                                                    <div className="mt-3 text-sm text-slate-700">{maxParts ? `${maxParts} Participants` : '—'}</div>
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Remarks */}
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Campaign Remarks</p>
                                                {selectedCampaignRequest.remarks ? (
                                                    <pre className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 overflow-auto">{JSON.stringify(selectedCampaignRequest.remarks, null, 2)}</pre>
                                                ) : (
                                                    <p className="text-sm text-slate-600">No remarks yet.</p>
                                                )}
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
