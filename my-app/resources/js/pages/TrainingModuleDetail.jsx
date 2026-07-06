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
    Pencil,
    Plus,
    Trash2,
    Video,
    X,
} from 'lucide-react';
import { getCsrfHeaders, getCsrfToken, pingSessionActivity } from '../utils/csrf';

const CONTENT_TYPE_LABELS = {
    text: 'Text Lesson',
    pdf: 'PDF Document',
    youtube: 'YouTube Video',
    video: 'Uploaded Video',
    image: 'Image',
};

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

function renderContentPreview(content) {
    const url = content.display_url || content.file_path || content.external_url;

    if (content.content_type === 'text') {
        return (
            <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-line">
                {content.body || 'No text content.'}
            </div>
        );
    }

    if (content.content_type === 'youtube' && url) {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
        if (match) {
            return (
                <div className="aspect-video rounded-lg overflow-hidden border border-slate-200">
                    <iframe
                        src={`https://www.youtube.com/embed/${match[1]}`}
                        title={content.title}
                        className="w-full h-full"
                        allowFullScreen
                    />
                </div>
            );
        }
    }

    if (content.content_type === 'video' && url) {
        return <video controls src={url} className="w-full rounded-lg border border-slate-200" />;
    }

    if (content.content_type === 'image' && url) {
        return <img src={url} alt={content.title} className="w-full rounded-lg border border-slate-200 object-contain max-h-96" />;
    }

    if (content.content_type === 'pdf' && url) {
        return (
            <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-emerald-700 hover:underline text-sm">
                <FileText className="w-4 h-4" /> Open PDF
            </a>
        );
    }

    if (url) {
        return (
            <a href={url} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline text-sm">
                {url}
            </a>
        );
    }

    return <p className="text-sm text-slate-500">No preview available.</p>;
}

function ContentTypeIcon({ type }) {
    if (type === 'video' || type === 'youtube') return <Video className="w-5 h-5 text-slate-600" />;
    if (type === 'image') return <ImageIcon className="w-5 h-5 text-slate-600" />;
    return <FileText className="w-5 h-5 text-slate-600" />;
}

async function submitTrainingForm(form, moduleId) {
    const ping = await pingSessionActivity();
    if (!ping.ok) {
        const message = ping.status === 419 || ping.status === 401
            ? 'Your session expired. Please refresh the page and try again.'
            : 'Could not verify your session. Please refresh and try again.';
        await Swal.fire({ icon: 'error', title: 'Session error', text: message });
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
        headers: {
            Accept: 'text/html,application/xhtml+xml',
            'X-Requested-With': 'XMLHttpRequest',
            ...getCsrfHeaders(),
        },
        redirect: 'manual',
    });

    if (response.status === 419) {
        await Swal.fire({ icon: 'error', title: 'Session expired', text: 'Please refresh the page and try again.' });
        return false;
    }

    if (response.status === 422) {
        const data = await response.json().catch(() => ({}));
        const errors = data.errors ? Object.values(data.errors).flat().join('\n') : data.message;
        await Swal.fire({ icon: 'error', title: 'Validation failed', text: errors || 'Please check the form and try again.' });
        return false;
    }

    if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('Location');
        const showUrl = `/admin/training-modules/${moduleId}`;
        const nextUrl = location && !location.includes('/contents')
            ? new URL(location, window.location.origin).pathname
            : showUrl;
        window.location.assign(nextUrl);
        return true;
    }

    if (!response.ok) {
        await Swal.fire({ icon: 'error', title: 'Request failed', text: 'Could not save changes. Please try again.' });
        return false;
    }

    window.location.assign(`/admin/training-modules/${moduleId}`);
    return true;
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

    const [contents, setContents] = React.useState(
        [...(module.contents || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    );
    const [selectedContent, setSelectedContent] = React.useState(null);
    const [isEditMode, setIsEditMode] = React.useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);
    const [draggedId, setDraggedId] = React.useState(null);
    const [contentType, setContentType] = React.useState('text');
    const [editFormData, setEditFormData] = React.useState({ title: '', body: '', external_url: '', content_type: 'text' });

    const thumbnailUrl = module.thumbnail_url || (module.thumbnail_path ? `/storage/${module.thumbnail_path}` : null);

    const handleDragStart = (id) => setDraggedId(id);

    const handleDragOver = (e) => e.preventDefault();

    const handleDrop = async (targetId) => {
        if (!draggedId || draggedId === targetId) return;

        const current = [...contents];
        const fromIndex = current.findIndex((c) => c.id === draggedId);
        const toIndex = current.findIndex((c) => c.id === targetId);
        if (fromIndex < 0 || toIndex < 0) return;

        const [moved] = current.splice(fromIndex, 1);
        current.splice(toIndex, 0, moved);
        setContents(current);
        setDraggedId(null);

        const order = current.map((c) => c.id);
        try {
            await pingSessionActivity();
            const token = getCsrfToken();
            const formData = new FormData();
            formData.append('_token', token);
            order.forEach((id, index) => formData.append(`order[${index}]`, id));

            const response = await fetch(`/admin/training-modules/${module.id}/contents/reorder`, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...getCsrfHeaders(),
                },
            });

            if (response.status === 419) {
                await Swal.fire({ icon: 'error', title: 'Session expired', text: 'Please refresh the page and try again.' });
            }
        } catch (e) {
            console.error('Failed to reorder contents', e);
        }
    };

    const handleAddContent = async (e) => {
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

        await submitTrainingForm(form, module.id);
    };

    const handleDeleteContent = async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const ok = await Swal.fire({ title: 'Delete content?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626' });
        if (!ok.isConfirmed) return;
        await submitTrainingForm(form, module.id);
    };

    const handleEditContent = async (e) => {
        e.preventDefault();
        await submitTrainingForm(e.currentTarget, module.id);
    };

    const handleContentClick = (content) => {
        setSelectedContent(content);
        setIsEditMode(false);
        setEditFormData({
            title: content.title || '',
            body: content.body || '',
            external_url: content.external_url || '',
            content_type: content.content_type || 'text',
        });
    };

    return (
        <div className="py-2 space-y-6">
            <div className="flex items-center justify-between mb-1">
                <a href="/admin/training-modules" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
                    <ChevronLeft className="w-4 h-4" /> Back to Training Modules
                </a>
            </div>

            {flashStatus && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">{flashStatus}</div>
            )}

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
                        <div className="flex items-start justify-between gap-4">
                            <div>
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
                            </div>
                            <a href={`/admin/training-modules/${module.id}/edit`} className="rounded-xl border border-slate-300 p-2.5 hover:bg-slate-50">
                                <Pencil className="w-4 h-4" />
                            </a>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-medium">{module.difficulty}</span>
                            {module.category && <span className="rounded-lg bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 font-medium">{module.category}</span>}
                            {formatDuration(module.estimated_duration_minutes) && (
                                <span className="rounded-lg bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 font-medium">{formatDuration(module.estimated_duration_minutes)}</span>
                            )}
                            <span className="rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 font-medium capitalize">{module.status}</span>
                        </div>
                        {module.learning_objectives?.length > 0 && (
                            <ul className="mt-4 text-sm text-slate-600 list-disc list-inside space-y-1">
                                {module.learning_objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                            </ul>
                        )}
                        <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap gap-4">
                            <span><span className="font-semibold text-slate-600">Created by:</span> {module.owner?.name ?? '—'}</span>
                            <span><span className="font-semibold text-slate-600">Created:</span> {formatDateTime(module.created_at)}</span>
                            <span><span className="font-semibold text-slate-600">Updated:</span> {formatDateTime(module.updated_at)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800">Learning Content</h3>
                        <p className="text-xs text-slate-500">Drag items to reorder</p>
                    </div>
                    {contents.length === 0 ? (
                        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center text-slate-500 text-sm">
                            No learning content yet. Add your first item using the form.
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {contents.map((content, index) => (
                                <li
                                    key={content.id}
                                    draggable
                                    onDragStart={() => handleDragStart(content.id)}
                                    onDragOver={handleDragOver}
                                    onDrop={() => handleDrop(content.id)}
                                    className={`rounded-2xl bg-white border border-slate-200 shadow-sm p-4 ${draggedId === content.id ? 'opacity-50' : ''}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <button type="button" className="mt-1 cursor-grab text-slate-400 hover:text-slate-600" aria-label="Drag to reorder">
                                            <GripVertical className="w-5 h-5" />
                                        </button>
                                        <div className="shrink-0 w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                            <ContentTypeIcon type={content.content_type} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-400">#{index + 1}</span>
                                                <h4 className="font-semibold text-slate-900">{content.title}</h4>
                                                <span className="text-[0.65rem] uppercase font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                                    {CONTENT_TYPE_LABELS[content.content_type] || content.content_type}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2 pl-14">
                                        <button type="button" onClick={() => handleContentClick(content)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
                                            <Eye className="w-3.5 h-3.5" /> View
                                        </button>
                                        <form method="POST" action={`/admin/training-modules/${module.id}/contents/${content.id}`} onSubmit={handleDeleteContent}>
                                            <input type="hidden" name="_token" value={getCsrfToken()} />
                                            <input type="hidden" name="_method" value="DELETE" />
                                            <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                                                <Trash2 className="w-3.5 h-3.5" /> Delete
                                            </button>
                                        </form>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-800">Add Learning Content</h3>
                    <form
                        method="POST"
                        action={`/admin/training-modules/${module.id}/contents`}
                        encType="multipart/form-data"
                        className="space-y-3 rounded-2xl bg-white border border-slate-200 shadow-md p-5"
                        onSubmit={handleAddContent}
                    >
                        <input type="hidden" name="_token" value={getCsrfToken()} />
                        <input type="hidden" name="storage_target" value="auto" />
                        <div>
                            <label className="block text-[0.7rem] font-semibold text-slate-600 mb-1">Title *</label>
                            <input name="title" type="text" required className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-[0.7rem] font-semibold text-slate-600 mb-1">Content Type *</label>
                            <select name="content_type" value={contentType} onChange={(e) => setContentType(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
                                {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>
                        {contentType === 'text' && (
                            <div>
                                <label className="block text-[0.7rem] font-semibold text-slate-600 mb-1">Text Content *</label>
                                <textarea name="body" rows={5} required className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                            </div>
                        )}
                        {contentType === 'youtube' && (
                            <div>
                                <label className="block text-[0.7rem] font-semibold text-slate-600 mb-1">YouTube URL *</label>
                                <input name="external_url" type="url" required placeholder="https://www.youtube.com/watch?v=..." className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                            </div>
                        )}
                        {['pdf', 'video', 'image'].includes(contentType) && (
                            <div>
                                <label className="block text-[0.7rem] font-semibold text-slate-600 mb-1">Upload File *</label>
                                <input name="file" type="file" required accept={contentType === 'pdf' ? '.pdf' : contentType === 'image' ? 'image/*' : 'video/*,.mp4,.mov,.avi'} className="w-full text-sm" />
                            </div>
                        )}
                        <button type="submit" className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5">
                            <Plus className="w-4 h-4" /> Add Content
                        </button>
                    </form>
                </div>
            </div>

            <Dialog.Root open={selectedContent !== null} onOpenChange={(open) => !open && setSelectedContent(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] bg-white rounded-xl shadow-lg z-50 overflow-hidden flex flex-col">
                        <Dialog.Title className="sr-only">Content Details</Dialog.Title>
                        {selectedContent && (
                            <>
                                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                                    <h2 className="text-xl font-semibold text-slate-800">{isEditMode ? 'Edit Content' : selectedContent.title}</h2>
                                    <div className="flex items-center gap-2">
                                        {!isEditMode && (
                                            <button type="button" onClick={() => setIsEditMode(true)} className="rounded-md border border-emerald-500/60 bg-emerald-50 p-2">
                                                <Pencil className="w-4 h-4 text-emerald-800" />
                                            </button>
                                        )}
                                        <Dialog.Close asChild>
                                            <button type="button" className="w-8 h-8 rounded-full hover:bg-slate-100"><X className="w-4 h-4 mx-auto" /></button>
                                        </Dialog.Close>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6">
                                    {isEditMode ? (
                                        <form method="POST" action={`/admin/training-modules/${module.id}/contents/${selectedContent.id}`} encType="multipart/form-data" className="space-y-4" onSubmit={handleEditContent}>
                                            <input type="hidden" name="_token" value={getCsrfToken()} />
                                            <input type="hidden" name="_method" value="PUT" />
                                            <input name="title" type="text" required value={editFormData.title} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                                            <select name="content_type" value={editFormData.content_type} onChange={(e) => setEditFormData({ ...editFormData, content_type: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                                                {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
                                                    <option key={value} value={value}>{label}</option>
                                                ))}
                                            </select>
                                            {editFormData.content_type === 'text' && (
                                                <textarea name="body" rows={6} value={editFormData.body} onChange={(e) => setEditFormData({ ...editFormData, body: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                                            )}
                                            {editFormData.content_type === 'youtube' && (
                                                <input name="external_url" type="url" value={editFormData.external_url} onChange={(e) => setEditFormData({ ...editFormData, external_url: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                                            )}
                                            {['pdf', 'video', 'image'].includes(editFormData.content_type) && (
                                                <input name="file" type="file" className="w-full text-sm" />
                                            )}
                                            <div className="flex justify-end gap-2">
                                                <button type="button" onClick={() => setIsEditMode(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">Cancel</button>
                                                <button type="submit" className="rounded-md bg-emerald-600 text-white px-4 py-1.5 text-sm">Save Changes</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="space-y-4">
                                            <span className="text-xs uppercase font-semibold text-slate-500">{CONTENT_TYPE_LABELS[selectedContent.content_type]}</span>
                                            {renderContentPreview(selectedContent)}
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
