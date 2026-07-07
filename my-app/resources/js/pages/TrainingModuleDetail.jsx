import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import Swal from 'sweetalert2';
import {
    ChevronDown,
    ChevronLeft,
    ChevronUp,
    Eye,
    FileText,
    GripVertical,
    Image as ImageIcon,
    Loader2,
    Pencil,
    Plus,
    RefreshCw,
    Trash2,
    Video,
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

function formatDate(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
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

    const thumbnailUrl = module.thumbnail_url || (module.thumbnail_path ? `/storage/${module.thumbnail_path}` : null);

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
        </div>
    );
}
