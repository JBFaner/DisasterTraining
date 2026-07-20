import React from 'react';
import {
    Archive,
    BookOpen,
    CheckCircle2,
    ClipboardList,
    Eye,
    Layers,
    Pencil,
    Plus,
    Rocket,
} from 'lucide-react';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminPrimaryButton,
    AdminSecondaryButton,
    AdminStatCard,
} from './admin/AdminLayout';
import {
    AdminCollapsibleFilterBar,
    AdminFilterSelect,
} from './admin/AdminCollapsibleFilterBar';
import { AdminDataTable } from './admin/AdminDataTable';
import { getCsrfHeaders } from '../utils/csrf';
import { showAppAlert, showAppConfirm, formatApiErrors } from '../utils/appAlert';
import { simulationEventHref } from '../utils/simulationEventNavigation';

const STATUS_TONES = {
    draft: 'bg-amber-50 text-amber-800 border-amber-200',
    published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    archived: 'bg-slate-50 text-slate-600 border-slate-300',
};

function formatPlanTime(value) {
    if (!value) return '—';
    const [hoursRaw, minutesRaw] = String(value).split(':');
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw ?? 0);
    if (!Number.isFinite(hours)) return String(value);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function StatusBadge({ status }) {
    const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Draft';
    return (
        <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${STATUS_TONES[status] || STATUS_TONES.draft}`}>
            {label}
        </span>
    );
}

export function SimulationExerciseTemplateModule({
    templates = [],
    summary = {},
    approvedSchedules = [],
    embedded = false,
}) {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [filterCategory, setFilterCategory] = React.useState('');
    const [filterStatus, setFilterStatus] = React.useState('');
    const [filterType, setFilterType] = React.useState('');
    const [reuseModalOpen, setReuseModalOpen] = React.useState(false);
    const [reuseForm, setReuseForm] = React.useState({
        template_id: '',
        campaign_request_id: '',
        event_date: '',
        venue: '',
    });
    const [isReusing, setIsReusing] = React.useState(false);
    const [templateRows, setTemplateRows] = React.useState(templates);
    const [publishingId, setPublishingId] = React.useState(null);
    const [reuseCampaignHandled, setReuseCampaignHandled] = React.useState(false);

    const publishedTemplates = React.useMemo(
        () => templateRows.filter((item) => item.status === 'published'),
        [templateRows],
    );

    const selectedReuseTemplate = React.useMemo(
        () => publishedTemplates.find((item) => String(item.id) === String(reuseForm.template_id)) || null,
        [publishedTemplates, reuseForm.template_id],
    );

    const planStartDisplay = formatPlanTime(selectedReuseTemplate?.plan_start_time);
    const planEndDisplay = formatPlanTime(selectedReuseTemplate?.plan_end_time);

    const openReuseModal = React.useCallback(({
        templateId = '',
        campaignRequestId = '',
    } = {}) => {
        const defaultTemplateId = templateId
            || (publishedTemplates[0] ? String(publishedTemplates[0].id) : '');

        setReuseModalOpen(true);
        setReuseForm({
            template_id: defaultTemplateId,
            campaign_request_id: campaignRequestId ? String(campaignRequestId) : '',
            event_date: '',
            venue: '',
        });
    }, [publishedTemplates]);

    React.useEffect(() => {
        setTemplateRows(templates);
    }, [templates]);

    React.useEffect(() => {
        if (typeof window === 'undefined' || reuseCampaignHandled) return;

        const params = new URLSearchParams(window.location.search);
        const campaignId = params.get('reuse_campaign');
        if (!campaignId) return;

        setReuseCampaignHandled(true);

        if (publishedTemplates.length === 0) {
            showAppAlert({
                title: 'No published exercise plans',
                description: 'Create and submit an exercise plan before scheduling a simulation event for this campaign.',
                icon: 'warning',
            });
            params.delete('reuse_campaign');
            const nextSearch = params.toString();
            const nextUrl = nextSearch
                ? `${window.location.pathname}?${nextSearch}`
                : window.location.pathname;
            window.history.replaceState({}, '', nextUrl);
            return;
        }

        openReuseModal({ campaignRequestId: campaignId });

        params.delete('reuse_campaign');
        const nextSearch = params.toString();
        const nextUrl = nextSearch
            ? `${window.location.pathname}?${nextSearch}`
            : window.location.pathname;
        window.history.replaceState({}, '', nextUrl);
    }, [openReuseModal, publishedTemplates, reuseCampaignHandled]);

    const categories = React.useMemo(
        () => [...new Set(templateRows.map((item) => item.category).filter(Boolean))].sort(),
        [templateRows],
    );

    const filtered = React.useMemo(() => templateRows.filter((item) => {
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch = !query
            || item.title?.toLowerCase().includes(query)
            || item.category?.toLowerCase().includes(query);
        const matchesCategory = !filterCategory || item.category === filterCategory;
        const matchesStatus = !filterStatus || item.status === filterStatus;
        const matchesType = !filterType || item.exercise_type === filterType;
        return matchesSearch && matchesCategory && matchesStatus && matchesType;
    }), [templateRows, searchQuery, filterCategory, filterStatus, filterType]);

    const handlePublish = async (row) => {
        const confirmed = await showAppConfirm({
            title: 'Publish exercise plan?',
            description: `Publish "${row.title}" so it can be reused to create simulation events.`,
            confirmLabel: 'Publish',
            cancelLabel: 'Cancel',
            confirmVariant: 'primary',
        });
        if (!confirmed) return;

        setPublishingId(row.id);
        try {
            const response = await fetch(`/admin/simulation-exercise-templates/${row.id}/publish`, {
                method: 'POST',
                headers: { Accept: 'application/json', ...getCsrfHeaders() },
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(formatApiErrors(data, 'Failed to publish exercise plan.'));
            }

            setTemplateRows((prev) => prev.map((item) => (
                item.id === row.id ? { ...item, ...data.template } : item
            )));
            showAppAlert({
                title: 'Exercise plan published',
                description: `"${row.title}" is now available for Use Template when scheduling simulation events.`,
                icon: 'success',
            });
        } catch (error) {
            showAppAlert({
                title: 'Publish failed',
                description: error.message || 'Could not publish exercise plan.',
                icon: 'error',
            });
        } finally {
            setPublishingId(null);
        }
    };

    const handleReuse = async () => {
        if (!reuseForm.template_id) {
            showAppAlert({
                title: 'Select an exercise plan',
                description: 'Choose a published exercise plan to create the simulation event.',
                icon: 'warning',
            });
            return;
        }

        setIsReusing(true);
        try {
            const response = await fetch(`/admin/simulation-exercise-templates/${reuseForm.template_id}/reuse`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    ...getCsrfHeaders(),
                },
                body: JSON.stringify(reuseForm),
            });

            let payload = {};
            try {
                payload = await response.json();
            } catch {
                payload = {};
            }

            if (!response.ok) {
                throw new Error(formatApiErrors(payload, `Failed to create simulation event (${response.status}).`));
            }
            window.location.href = payload.redirect || simulationEventHref({ id: payload.event_id, simulation_exercise_template_id: reuseForm.template_id }, { tab: 'readiness' });
        } catch (error) {
            showAppAlert({
                title: 'Reuse failed',
                description: error.message || 'Failed to create simulation event from exercise plan.',
                icon: 'error',
            });
        } finally {
            setIsReusing(false);
        }
    };

    const columns = [
        {
            key: 'title',
            label: 'Exercise Title',
            className: 'min-w-[220px]',
            render: (row) => (
                <div>
                    <span className="block font-medium text-slate-900">{row.title}</span>
                    <span className="mt-1 block text-[11px] text-slate-500">
                        {row.activities_count ?? 0} activities · used {row.events_count ?? 0} times
                    </span>
                </div>
            ),
        },
        { key: 'category', label: 'Category', render: (row) => row.category || '—' },
        { key: 'exercise_type', label: 'Exercise Type', render: (row) => row.exercise_type || '—' },
        {
            key: 'estimated_duration_minutes',
            label: 'Duration',
            render: (row) => (row.estimated_duration_minutes ? `${row.estimated_duration_minutes} min` : '—'),
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => <StatusBadge status={row.status} />,
        },
    ];

    const content = (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <AdminStatCard label="Total Templates" value={summary.total ?? templates.length} accent="slate" />
                <AdminStatCard label="Published" value={summary.published ?? 0} accent="emerald" />
                <AdminStatCard label="Draft" value={summary.draft ?? 0} accent="amber" />
                <AdminStatCard label="Archived" value={summary.archived ?? 0} accent="blue" />
            </div>

            <AdminCollapsibleFilterBar
                searchValue={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search exercise templates..."
                hasActiveFilters={Boolean(filterCategory || filterStatus || filterType)}
                onClearFilters={() => {
                    setFilterCategory('');
                    setFilterStatus('');
                    setFilterType('');
                }}
            >
                <AdminFilterSelect label="Category" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                    ))}
                </AdminFilterSelect>
                <AdminFilterSelect label="Exercise Type" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="">All Types</option>
                    <option value="Drill">Drill</option>
                    <option value="Functional Exercise">Functional Exercise</option>
                    <option value="Full Scale Exercise">Full Scale Exercise</option>
                </AdminFilterSelect>
                <AdminFilterSelect label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                </AdminFilterSelect>
            </AdminCollapsibleFilterBar>

            <AdminDataTable
                columns={columns}
                data={filtered}
                compact
                emptyTitle="No exercise templates yet"
                emptyDescription="Create reusable disaster training exercise templates that can be scheduled for multiple campaigns."
                minWidth="1100px"
                renderActions={(row) => (
                    <div className="flex items-center justify-end gap-2">
                        <a
                            href={`/admin/simulation-exercise-templates/${row.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                        >
                            <Eye className="w-3.5 h-3.5" />
                            View
                        </a>
                        <a
                            href={`/admin/simulation-exercise-templates/${row.id}/edit`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                        </a>
                        {row.status !== 'published' ? (
                            <button
                                type="button"
                                onClick={() => handlePublish(row)}
                                disabled={publishingId === row.id}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {publishingId === row.id ? 'Publishing…' : 'Publish'}
                            </button>
                        ) : null}
                        {row.status === 'published' ? (
                            <button
                                type="button"
                                onClick={() => openReuseModal({ templateId: row.id })}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                            >
                                <Rocket className="w-3.5 h-3.5" />
                                Reuse
                            </button>
                        ) : null}
                    </div>
                )}
            />

            {reuseModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-semibold text-slate-900">Use Exercise Plan</h3>
                        <p className="mt-1 text-sm text-slate-600">
                            Create a simulation event from a published exercise plan. The exercise plan stays unchanged.
                        </p>
                        <div className="mt-4 space-y-3">
                            <label className="block text-sm">
                                <span className="font-medium text-slate-700">Exercise Plan</span>
                                <select
                                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                                    value={reuseForm.template_id}
                                    onChange={(e) => setReuseForm((prev) => ({ ...prev, template_id: e.target.value }))}
                                >
                                    <option value="">Select exercise plan...</option>
                                    {publishedTemplates.map((template) => (
                                        <option key={template.id} value={template.id}>
                                            {template.title}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            {selectedReuseTemplate ? (
                                <p className="text-xs text-slate-500">
                                    {selectedReuseTemplate.category || 'Uncategorized'}
                                    {' · '}
                                    {selectedReuseTemplate.exercise_type || 'Exercise'}
                                    {selectedReuseTemplate.estimated_duration_minutes
                                        ? ` · ${selectedReuseTemplate.estimated_duration_minutes} min`
                                        : ''}
                                </p>
                            ) : null}
                            <label className="block text-sm">
                                <span className="font-medium text-slate-700">Campaign (optional)</span>
                                <select
                                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                                    value={reuseForm.campaign_request_id}
                                    onChange={(e) => setReuseForm((prev) => ({ ...prev, campaign_request_id: e.target.value }))}
                                >
                                    <option value="">No campaign link</option>
                                    {approvedSchedules.map((schedule) => {
                                        const scheduleId = schedule.campaign_request_id || schedule.campaign_id;
                                        return (
                                            <option key={scheduleId} value={scheduleId}>
                                                #{scheduleId} — {schedule.campaign_title}
                                            </option>
                                        );
                                    })}
                                </select>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="block text-sm">
                                    <span className="font-medium text-slate-700">Event Date</span>
                                    <input
                                        type="date"
                                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                                        value={reuseForm.event_date}
                                        onChange={(e) => setReuseForm((prev) => ({ ...prev, event_date: e.target.value }))}
                                    />
                                </label>
                                <label className="block text-sm">
                                    <span className="font-medium text-slate-700">Venue</span>
                                    <input
                                        type="text"
                                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                                        value={reuseForm.venue}
                                        onChange={(e) => setReuseForm((prev) => ({ ...prev, venue: e.target.value }))}
                                        placeholder="Evacuation Center"
                                    />
                                </label>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="block text-sm">
                                    <span className="font-medium text-slate-700">Start Time</span>
                                    <div className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                        {selectedReuseTemplate ? planStartDisplay : 'Select an exercise plan'}
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-500">From the exercise plan timeline (view only).</p>
                                </div>
                                <div className="block text-sm">
                                    <span className="font-medium text-slate-700">End Time</span>
                                    <div className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                        {selectedReuseTemplate ? planEndDisplay : 'Select an exercise plan'}
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-500">Computed from plan activities (view only).</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <AdminSecondaryButton onClick={() => setReuseModalOpen(false)} disabled={isReusing}>
                                Cancel
                            </AdminSecondaryButton>
                            <AdminPrimaryButton onClick={handleReuse} disabled={isReusing || !reuseForm.template_id}>
                                {isReusing ? 'Creating...' : 'Create Simulation Event'}
                            </AdminPrimaryButton>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );

    if (embedded) {
        return content;
    }

    return (
        <AdminPageShell>
            <AdminPageHeader
                icon={Layers}
                title="Exercise Plans"
                description="Create reusable disaster training exercise plans for drills, functional exercises, and full-scale simulations."
                actions={(
                    <AdminPrimaryButton href="/admin/simulation-exercise-templates/create">
                        <Plus className="w-4 h-4" />
                        New Exercise Plan
                    </AdminPrimaryButton>
                )}
            />
            {content}
        </AdminPageShell>
    );
}
