import React from 'react';
import {
    Wallet,
    Plus,
    Eye,
    Pencil,
    Trash2,
    Send,
    CheckCircle2,
    XCircle,
    FileText,
    Package,
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminCollapsibleFilterBar,
    AdminFilterSelect,
    AdminPrimaryButton,
    AdminSecondaryButton,
    AdminContentCard,
    adminCompactInputClass,
    adminSelectClass,
} from './admin/AdminLayout';
import {
    AdminDataTable,
    AdminTableActionButton,
} from './admin/AdminDataTable';

const STATUS_STYLES = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    submitted: 'bg-amber-100 text-amber-800 border-amber-200',
    approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    rejected: 'bg-rose-100 text-rose-800 border-rose-200',
};

const PRIORITY_STYLES = {
    high: 'bg-rose-100 text-rose-800 border-rose-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    low: 'bg-slate-100 text-slate-700 border-slate-200',
};

function formatCurrency(value) {
    const num = Number(value) || 0;
    return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function StatusBadge({ status, labels = {} }) {
    return (
        <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>
            {labels[status] || status}
        </span>
    );
}

function PriorityBadge({ priority, labels = {} }) {
    return (
        <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold capitalize ${PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium}`}>
            {labels[priority] || priority}
        </span>
    );
}

function CardSection({ title, icon: Icon, actions, children }) {
    return (
        <AdminContentCard>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/50">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    {Icon && <Icon className="w-4 h-4 text-emerald-600" />}
                    {title}
                </h2>
                {actions}
            </div>
            {children}
        </AdminContentCard>
    );
}

function SummaryCards({ summary, fundLabels }) {
    const stats = summary || {};
    const cards = [
        { label: 'Total Proposals', value: stats.total ?? 0, sub: null },
        { label: 'Pending Review', value: stats.submitted ?? 0, sub: formatCurrency(stats.pending_amount) },
        { label: 'Approved', value: stats.approved ?? 0, sub: formatCurrency(stats.approved_amount) },
        { label: 'Drafts', value: stats.draft ?? 0, sub: null },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {cards.map((card) => (
                <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{card.value}</p>
                    {card.sub && <p className="mt-1 text-xs text-emerald-600 font-medium">{card.sub}</p>}
                </div>
            ))}
        </div>
    );
}

export function ResourceBudgetProposalList({ proposals = [], summary = null, options = {} }) {
    const fundLabels = options.fund_sources || {};
    const statusLabels = options.statuses || {};
    const priorityLabels = options.priorities || {};

    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [fundFilter, setFundFilter] = React.useState('all');
    const [priorityFilter, setPriorityFilter] = React.useState('all');
    const [sortKey, setSortKey] = React.useState('created_at');
    const [sortDir, setSortDir] = React.useState('desc');
    const [proposalsData, setProposalsData] = React.useState(proposals || []);
    const [pagination, setPagination] = React.useState(null);
    const [summaryData, setSummaryData] = React.useState(summary);
    const [isLoading, setIsLoading] = React.useState(false);

    const fetchProposals = React.useCallback(async (page = 1) => {
        setIsLoading(true);
        try {
            const url = new URL('/admin/api/resource-budget-proposals', window.location.origin);
            url.searchParams.set('page', page);
            if (searchTerm.trim()) url.searchParams.set('search', searchTerm.trim());
            if (statusFilter !== 'all') url.searchParams.set('status', statusFilter);
            if (fundFilter !== 'all') url.searchParams.set('fund_source', fundFilter);
            if (priorityFilter !== 'all') url.searchParams.set('priority', priorityFilter);
            url.searchParams.set('sort_by', sortKey);
            url.searchParams.set('sort_dir', sortDir);

            const res = await fetch(url.toString(), {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error('Failed to load proposals');
            const data = await res.json();
            setProposalsData(data.proposals || []);
            setPagination(data.pagination || null);
            setSummaryData(data.summary || summary);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, statusFilter, fundFilter, priorityFilter, sortKey, sortDir, summary]);

    React.useEffect(() => {
        const timer = setTimeout(() => fetchProposals(1), 300);
        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, fundFilter, priorityFilter, sortKey, sortDir, fetchProposals]);

    const handleDelete = async (proposal) => {
        const result = await Swal.fire({
            title: 'Delete proposal?',
            text: `Remove ${proposal.reference_number}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#059669',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Delete',
        });
        if (!result.isConfirmed) return;

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/admin/resource-budget-proposals/${proposal.id}`;
        const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
        form.innerHTML = `<input type="hidden" name="_token" value="${csrf}"><input type="hidden" name="_method" value="DELETE">`;
        document.body.appendChild(form);
        form.submit();
    };

    const columns = [
        {
            key: 'reference_number',
            label: 'Reference',
            sortable: true,
            render: (row) => <span className="font-mono text-xs font-semibold text-slate-800">{row.reference_number}</span>,
        },
        {
            key: 'title',
            label: 'Title',
            sortable: true,
            render: (row) => (
                <div>
                    <p className="font-medium text-slate-900">{row.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{row.items_count ?? row.items?.length ?? 0} item(s)</p>
                </div>
            ),
        },
        {
            key: 'fund_source',
            label: 'Fund Source',
            render: (row) => (
                <span className="text-sm text-slate-700">{fundLabels[row.fund_source] || row.fund_source}</span>
            ),
        },
        {
            key: 'total_estimated_cost',
            label: 'Estimated Cost',
            sortable: true,
            align: 'right',
            render: (row) => <span className="font-semibold text-slate-900">{formatCurrency(row.total_estimated_cost)}</span>,
        },
        {
            key: 'priority',
            label: 'Priority',
            sortable: true,
            render: (row) => <PriorityBadge priority={row.priority} labels={priorityLabels} />,
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (row) => <StatusBadge status={row.status} labels={statusLabels} />,
        },
        {
            key: 'created_at',
            label: 'Created',
            sortable: true,
            render: (row) => <span className="text-sm text-slate-600">{formatDate(row.created_at)}</span>,
        },
    ];

    return (
        <AdminPageShell>
            <AdminPageHeader
                icon={Wallet}
                title="Resource Budget Proposals"
                description="Document and justify funding requests for disaster preparedness equipment and supplies."
                actions={
                    <AdminPrimaryButton href="/admin/resource-budget-proposals/create">
                        <Plus className="w-4 h-4" />
                        New Proposal
                    </AdminPrimaryButton>
                }
            />

            <SummaryCards summary={summaryData} fundLabels={fundLabels} />

            <AdminCollapsibleFilterBar
                searchValue={searchTerm}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                searchPlaceholder="Search by title or reference number..."
                hasActiveFilters={statusFilter !== 'all' || fundFilter !== 'all' || priorityFilter !== 'all'}
                onClearFilters={() => {
                    setStatusFilter('all');
                    setFundFilter('all');
                    setPriorityFilter('all');
                }}
            >
                <AdminFilterSelect label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All statuses</option>
                    {Object.entries(statusLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </AdminFilterSelect>
                <AdminFilterSelect label="Fund Source" value={fundFilter} onChange={(e) => setFundFilter(e.target.value)}>
                    <option value="all">All fund sources</option>
                    {Object.entries(fundLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </AdminFilterSelect>
                <AdminFilterSelect label="Priority" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                    <option value="all">All priorities</option>
                    {Object.entries(priorityLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </AdminFilterSelect>
            </AdminCollapsibleFilterBar>

            <AdminDataTable
                columns={columns}
                data={proposalsData}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={(key, dir) => { setSortKey(key); setSortDir(dir); }}
                isLoading={isLoading}
                emptyTitle="No budget proposals yet"
                emptyDescription="Create a proposal to justify funding for equipment and supplies."
                pagination={pagination}
                onPageChange={(page) => fetchProposals(page)}
                renderActions={(row) => (
                    <>
                        <AdminTableActionButton href={`/admin/resource-budget-proposals/${row.id}`} icon={Eye} title="View" variant="view" />
                        {(row.status === 'draft' || row.status === 'rejected') && (
                            <AdminTableActionButton href={`/admin/resource-budget-proposals/${row.id}/edit`} icon={Pencil} title="Edit" variant="edit" />
                        )}
                        {row.status === 'draft' && (
                            <AdminTableActionButton onClick={() => handleDelete(row)} icon={Trash2} title="Delete" variant="danger" />
                        )}
                    </>
                )}
            />
        </AdminPageShell>
    );
}

const emptyItem = () => ({
    item_name: '',
    category: 'Other',
    quantity: 1,
    unit_cost: '',
    notes: '',
});

export function ResourceBudgetProposalForm({ proposal = null, options = {} }) {
    const isEdit = Boolean(proposal?.id);
    const fundSources = options.fund_sources || {};
    const priorities = options.priorities || {};
    const justificationSources = options.justification_sources || {};
    const categories = options.resource_categories || [];
    const resources = options.resources || [];
    const events = options.simulation_events || [];
    const barangayProfiles = options.barangay_profiles || [];

    const [items, setItems] = React.useState(
        proposal?.items?.length
            ? proposal.items.map((item) => ({
                item_name: item.item_name || '',
                category: item.category || 'Other',
                quantity: item.quantity || 1,
                unit_cost: item.unit_cost ?? '',
                notes: item.notes || '',
            }))
            : [emptyItem()]
    );

    const lineTotal = items.reduce((sum, item) => {
        const qty = Number(item.quantity) || 0;
        const cost = Number(item.unit_cost) || 0;
        return sum + qty * cost;
    }, 0);

    const updateItem = (index, field, value) => {
        setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    };

    const addItem = () => setItems((prev) => [...prev, emptyItem()]);
    const removeItem = (index) => setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));

    const handleResourceSelect = (resourceId) => {
        if (!resourceId) return;
        const resource = resources.find((r) => String(r.id) === String(resourceId));
        if (!resource) return;
        setItems((prev) => {
            const next = [...prev];
            next[0] = {
                ...next[0],
                item_name: resource.name,
                category: resource.category || 'Other',
            };
            return next;
        });
    };

    return (
        <AdminPageShell>
            <AdminPageHeader
                icon={Wallet}
                title={isEdit ? 'Edit Budget Proposal' : 'Create Budget Proposal'}
                description="Specify items, estimated costs, fund source, and justification for LGU review."
                actions={
                    <AdminSecondaryButton href={isEdit ? `/admin/resource-budget-proposals/${proposal.id}` : '/admin/resource-budget-proposals'}>
                        Cancel
                    </AdminSecondaryButton>
                }
            />

            <form
                method="POST"
                action={isEdit ? `/admin/resource-budget-proposals/${proposal.id}` : '/admin/resource-budget-proposals'}
                className="space-y-4"
            >
                <input type="hidden" name="_token" value={document.querySelector('meta[name="csrf-token"]')?.content || ''} />
                {isEdit && <input type="hidden" name="_method" value="PUT" />}

                <CardSection title="Proposal Details" icon={FileText}>
                    <div className="grid gap-4 md:grid-cols-2 p-5">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Proposal Title *</label>
                            <input
                                type="text"
                                name="title"
                                required
                                defaultValue={proposal?.title || ''}
                                placeholder="e.g. Restock fire extinguishers for barangay drills"
                                className={adminCompactInputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Fund Source *</label>
                            <select name="fund_source" required defaultValue={proposal?.fund_source || ''} className={`${adminSelectClass} w-full`}>
                                <option value="" disabled>Select fund source</option>
                                {Object.entries(fundSources).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Priority *</label>
                            <select name="priority" required defaultValue={proposal?.priority || 'medium'} className={`${adminSelectClass} w-full`}>
                                {Object.entries(priorities).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Justification Source *</label>
                            <select name="justification_source" required defaultValue={proposal?.justification_source || 'general'} className={`${adminSelectClass} w-full`}>
                                {Object.entries(justificationSources).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Link to Inventory Item</label>
                            <select
                                name="resource_id"
                                defaultValue={proposal?.resource_id || ''}
                                className={`${adminSelectClass} w-full`}
                                onChange={(e) => handleResourceSelect(e.target.value)}
                            >
                                <option value="">None</option>
                                {resources.map((r) => (
                                    <option key={r.id} value={r.id}>{r.name} ({r.category})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Link to Simulation Event</label>
                            <select name="simulation_event_id" defaultValue={proposal?.simulation_event_id || ''} className={`${adminSelectClass} w-full`}>
                                <option value="">None</option>
                                {events.map((e) => (
                                    <option key={e.id} value={e.id}>{e.title}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Link to Hazard Assessment</label>
                            <select name="barangay_profile_id" defaultValue={proposal?.barangay_profile_id || ''} className={`${adminSelectClass} w-full`}>
                                <option value="">None</option>
                                {barangayProfiles.map((bp) => (
                                    <option key={bp.id} value={bp.id}>{bp.barangay_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Justification / Rationale</label>
                            <textarea
                                name="justification"
                                rows={4}
                                defaultValue={proposal?.justification || ''}
                                placeholder="Explain why these resources are needed and how they support disaster preparedness..."
                                className={`${adminCompactInputClass} resize-y min-h-[100px]`}
                            />
                        </div>
                    </div>
                </CardSection>

                <CardSection
                    title="Line Items"
                    icon={Package}
                    actions={
                        <button type="button" onClick={addItem} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                            + Add item
                        </button>
                    }
                >
                    <div className="p-5 space-y-4">
                        {items.map((item, index) => (
                            <div key={index} className="grid gap-3 md:grid-cols-12 items-end border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                                <div className="md:col-span-3">
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Item Name *</label>
                                    <input
                                        type="text"
                                        name={`items[${index}][item_name]`}
                                        required
                                        value={item.item_name}
                                        onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                                        className={adminCompactInputClass}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                                    <select
                                        name={`items[${index}][category]`}
                                        value={item.category}
                                        onChange={(e) => updateItem(index, 'category', e.target.value)}
                                        className={`${adminSelectClass} w-full`}
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Qty *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        name={`items[${index}][quantity]`}
                                        required
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                        className={adminCompactInputClass}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Unit Cost (₱) *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        name={`items[${index}][unit_cost]`}
                                        required
                                        value={item.unit_cost}
                                        onChange={(e) => updateItem(index, 'unit_cost', e.target.value)}
                                        className={adminCompactInputClass}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                                    <input
                                        type="text"
                                        name={`items[${index}][notes]`}
                                        value={item.notes}
                                        onChange={(e) => updateItem(index, 'notes', e.target.value)}
                                        className={adminCompactInputClass}
                                    />
                                </div>
                                <div className="md:col-span-1 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        disabled={items.length <= 1}
                                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30"
                                        title="Remove item"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <div className="flex justify-end pt-2 border-t border-slate-200">
                            <p className="text-sm text-slate-600">
                                Estimated Total: <span className="font-bold text-emerald-700 text-lg">{formatCurrency(lineTotal)}</span>
                            </p>
                        </div>
                    </div>
                </CardSection>

                <div className="flex justify-end gap-2">
                    <AdminSecondaryButton href={isEdit ? `/admin/resource-budget-proposals/${proposal.id}` : '/admin/resource-budget-proposals'}>
                        Cancel
                    </AdminSecondaryButton>
                    <AdminPrimaryButton type="submit">
                        {isEdit ? 'Save Changes' : 'Create Proposal'}
                    </AdminPrimaryButton>
                </div>
            </form>
        </AdminPageShell>
    );
}

export function ResourceBudgetProposalDetail({ proposal, options = {}, role = '' }) {
    if (!proposal) return null;

    const fundLabels = options.fund_sources || {};
    const statusLabels = options.statuses || {};
    const priorityLabels = options.priorities || {};
    const justificationLabels = options.justification_sources || {};
    const csrf = document.querySelector('meta[name="csrf-token"]')?.content || '';
    const items = proposal.items || [];
    const canEdit = proposal.status === 'draft' || proposal.status === 'rejected';
    const canSubmit = proposal.status === 'draft';
    const canReview = proposal.status === 'submitted' && role === 'LGU_ADMIN';

    const postAction = (action, extraFields = {}) => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/admin/resource-budget-proposals/${proposal.id}/${action}`;
        let html = `<input type="hidden" name="_token" value="${csrf}">`;
        Object.entries(extraFields).forEach(([key, val]) => {
            html += `<input type="hidden" name="${key}" value="${String(val).replace(/"/g, '&quot;')}">`;
        });
        form.innerHTML = html;
        document.body.appendChild(form);
        form.submit();
    };

    const handleSubmit = async () => {
        const result = await Swal.fire({
            title: 'Submit for review?',
            text: 'This proposal will be sent to the LGU administrator for approval.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#059669',
        });
        if (result.isConfirmed) postAction('submit');
    };

    const handleApprove = async () => {
        const { value: notes } = await Swal.fire({
            title: 'Approve proposal?',
            input: 'textarea',
            inputLabel: 'Review notes (optional)',
            inputPlaceholder: 'Optional approval remarks...',
            showCancelButton: true,
            confirmButtonColor: '#059669',
        });
        if (notes !== undefined) postAction('approve', { review_notes: notes || '' });
    };

    const handleReject = async () => {
        const { value: notes } = await Swal.fire({
            title: 'Reject proposal',
            input: 'textarea',
            inputLabel: 'Reason for rejection *',
            inputPlaceholder: 'Explain why this proposal was rejected...',
            inputValidator: (v) => (!v?.trim() ? 'A rejection reason is required.' : undefined),
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
        });
        if (notes) postAction('reject', { review_notes: notes });
    };

    return (
        <AdminPageShell>
            <AdminPageHeader
                icon={Wallet}
                title={proposal.title}
                description={proposal.reference_number}
                actions={
                    <div className="flex flex-wrap gap-2">
                        {canEdit && (
                            <AdminSecondaryButton href={`/admin/resource-budget-proposals/${proposal.id}/edit`}>
                                <Pencil className="w-4 h-4" /> Edit
                            </AdminSecondaryButton>
                        )}
                        {canSubmit && (
                            <AdminPrimaryButton onClick={handleSubmit}>
                                <Send className="w-4 h-4" /> Submit
                            </AdminPrimaryButton>
                        )}
                        {canReview && (
                            <>
                                <AdminPrimaryButton onClick={handleApprove}>
                                    <CheckCircle2 className="w-4 h-4" /> Approve
                                </AdminPrimaryButton>
                                <button
                                    type="button"
                                    onClick={handleReject}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-sm"
                                >
                                    <XCircle className="w-4 h-4" /> Reject
                                </button>
                            </>
                        )}
                    </div>
                }
            />

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                    <CardSection title="Line Items" icon={Package}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Item</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Category</th>
                                        <th className="px-5 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Qty</th>
                                        <th className="px-5 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Unit Cost</th>
                                        <th className="px-5 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-5 py-3">
                                                <p className="font-medium text-slate-900">{item.item_name}</p>
                                                {item.notes && <p className="text-xs text-slate-500 mt-0.5">{item.notes}</p>}
                                            </td>
                                            <td className="px-5 py-3 text-slate-600">{item.category || '—'}</td>
                                            <td className="px-5 py-3 text-right text-slate-700">{item.quantity}</td>
                                            <td className="px-5 py-3 text-right text-slate-700">{formatCurrency(item.unit_cost)}</td>
                                            <td className="px-5 py-3 text-right font-semibold text-slate-900">{formatCurrency(item.total_cost)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-emerald-50/50 border-t border-emerald-100">
                                        <td colSpan={4} className="px-5 py-3 text-right text-sm font-semibold text-slate-700">Estimated Total</td>
                                        <td className="px-5 py-3 text-right text-lg font-bold text-emerald-700">{formatCurrency(proposal.total_estimated_cost)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardSection>

                    {proposal.justification && (
                        <CardSection title="Justification" icon={FileText}>
                            <p className="p-5 text-sm text-slate-700 whitespace-pre-wrap">{proposal.justification}</p>
                        </CardSection>
                    )}
                </div>

                <div className="space-y-4">
                    <CardSection title="Summary" icon={Wallet}>
                        <dl className="p-5 space-y-3 text-sm">
                            <div className="flex justify-between gap-4">
                                <dt className="text-slate-500">Status</dt>
                                <dd><StatusBadge status={proposal.status} labels={statusLabels} /></dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-slate-500">Priority</dt>
                                <dd><PriorityBadge priority={proposal.priority} labels={priorityLabels} /></dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-slate-500">Fund Source</dt>
                                <dd className="font-medium text-slate-900 text-right">{fundLabels[proposal.fund_source] || proposal.fund_source}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-slate-500">Need Source</dt>
                                <dd className="font-medium text-slate-900 text-right">{justificationLabels[proposal.justification_source] || proposal.justification_source}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-slate-500">Created</dt>
                                <dd className="text-slate-700">{formatDate(proposal.created_at)}</dd>
                            </div>
                            {proposal.submitted_at && (
                                <div className="flex justify-between gap-4">
                                    <dt className="text-slate-500">Submitted</dt>
                                    <dd className="text-slate-700">{formatDate(proposal.submitted_at)}</dd>
                                </div>
                            )}
                            {proposal.reviewed_at && (
                                <div className="flex justify-between gap-4">
                                    <dt className="text-slate-500">Reviewed</dt>
                                    <dd className="text-slate-700">{formatDate(proposal.reviewed_at)}</dd>
                                </div>
                            )}
                            {proposal.creator && (
                                <div className="flex justify-between gap-4">
                                    <dt className="text-slate-500">Prepared by</dt>
                                    <dd className="text-slate-700">{proposal.creator.name}</dd>
                                </div>
                            )}
                        </dl>
                    </CardSection>

                    {(proposal.resource || proposal.simulation_event || proposal.simulationEvent || proposal.barangay_profile || proposal.barangayProfile) && (
                        <CardSection title="Linked Records" icon={FileText}>
                            <ul className="p-5 space-y-2 text-sm">
                                {(proposal.resource) && (
                                    <li><span className="text-slate-500">Inventory:</span> <span className="font-medium">{proposal.resource.name}</span></li>
                                )}
                                {(proposal.simulation_event || proposal.simulationEvent) && (
                                    <li><span className="text-slate-500">Event:</span> <span className="font-medium">{(proposal.simulation_event || proposal.simulationEvent).title}</span></li>
                                )}
                                {(proposal.barangay_profile || proposal.barangayProfile) && (
                                    <li><span className="text-slate-500">Hazard profile:</span> <span className="font-medium">{(proposal.barangay_profile || proposal.barangayProfile).barangay_name}</span></li>
                                )}
                            </ul>
                        </CardSection>
                    )}

                    {proposal.review_notes && (
                        <CardSection title="Review Notes" icon={FileText}>
                            <p className="p-5 text-sm text-slate-700 whitespace-pre-wrap">{proposal.review_notes}</p>
                        </CardSection>
                    )}
                </div>
            </div>
        </AdminPageShell>
    );
}
