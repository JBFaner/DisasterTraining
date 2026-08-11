import React from 'react';
import Swal from 'sweetalert2';
import { Package, Plus, Trash2 } from 'lucide-react';
import { AdminPrimaryButton, AdminSecondaryButton } from './admin/AdminLayout';

function statusBadge(status) {
    const map = {
        pending: 'bg-amber-50 text-amber-800 border-amber-200',
        approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        rejected: 'bg-rose-50 text-rose-700 border-rose-200',
        cancelled: 'bg-slate-50 text-slate-600 border-slate-200',
    };
    return map[status] || 'bg-slate-50 text-slate-600 border-slate-200';
}

export function EventEquipmentRequestPanel({
    eventId,
    role,
    csrf,
    requests = [],
    inventory = [],
    disabled = false,
    onLifecycleUpdate,
}) {
    const [busy, setBusy] = React.useState(false);
    const [notes, setNotes] = React.useState('');
    const [rows, setRows] = React.useState([{ resource_id: '', quantity: 1 }]);

    const selectable = (inventory || []).filter((item) => item.selectable);
    const isTrainer = role === 'LEAD_TRAINER' || role === 'LGU_ADMIN' || role === 'SUPER_ADMIN';
    const isAdmin = role === 'LGU_ADMIN';
    const pending = (requests || []).filter((r) => r.status === 'pending');
    const canEdit = !disabled && !busy;

    const addRow = () => setRows((prev) => [...prev, { resource_id: '', quantity: 1 }]);
    const removeRow = (idx) => setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
    const updateRow = (idx, patch) => {
        setRows((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
    };

    const submitRequest = async () => {
        const items = rows
            .map((row) => ({
                resource_id: Number(row.resource_id),
                quantity: Number(row.quantity) || 0,
            }))
            .filter((row) => row.resource_id > 0 && row.quantity > 0);

        if (items.length === 0) {
            Swal.fire({ icon: 'warning', title: 'Add equipment', text: 'Select at least one inventory item and quantity.' });
            return;
        }

        setBusy(true);
        try {
            const response = await fetch(`/admin/simulation-events/${eventId}/equipment-requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
                body: JSON.stringify({ notes: notes || null, items }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit equipment request.');
            }
            if (data.lifecycle && onLifecycleUpdate) {
                onLifecycleUpdate(data.lifecycle);
            }
            setNotes('');
            setRows([{ resource_id: '', quantity: 1 }]);
            Swal.fire({ icon: 'success', title: 'Request submitted', text: data.message || 'Waiting for admin approval.' });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Request failed', text: err?.message || 'Could not submit.' });
        } finally {
            setBusy(false);
        }
    };

    const reviewRequest = async (requestId, action) => {
        let rejectionReason = null;
        if (action === 'reject') {
            const result = await Swal.fire({
                title: 'Reject equipment request?',
                input: 'textarea',
                inputLabel: 'Reason (optional)',
                showCancelButton: true,
                confirmButtonText: 'Reject',
                confirmButtonColor: '#dc2626',
            });
            if (!result.isConfirmed) return;
            rejectionReason = result.value || null;
        } else {
            const result = await Swal.fire({
                title: 'Approve and reserve stock?',
                text: 'Available inventory will be reserved for this event until Start / Complete.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Approve',
                confirmButtonColor: '#16a34a',
            });
            if (!result.isConfirmed) return;
        }

        setBusy(true);
        try {
            const response = await fetch(
                `/admin/simulation-events/${eventId}/equipment-requests/${requestId}/${action}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrf,
                    },
                    body: JSON.stringify(
                        action === 'reject' ? { rejection_reason: rejectionReason } : {},
                    ),
                },
            );
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.message || `Failed to ${action} request.`);
            }
            if (data.lifecycle && onLifecycleUpdate) {
                onLifecycleUpdate(data.lifecycle);
            }
            Swal.fire({
                icon: 'success',
                title: action === 'approve' ? 'Approved' : 'Rejected',
                text: data.message,
            });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Action failed', text: err?.message || 'Could not update request.' });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Equipment Requests (from stock)
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Trainer submits needed gear from inventory. Admin approves to reserve stock (separate from Resource Budget).
                    </p>
                </div>
                {pending.length > 0 && (
                    <span className="text-xs font-semibold rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-800">
                        {pending.length} pending
                    </span>
                )}
            </div>

            {isTrainer && (
                <div className="rounded-lg border border-white bg-white p-3 space-y-3">
                    <p className="text-xs font-semibold text-slate-700">New request</p>
                    <div className="space-y-2">
                        {rows.map((row, idx) => (
                            <div key={idx} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_100px_auto]">
                                <select
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                                    value={row.resource_id}
                                    disabled={!canEdit}
                                    onChange={(e) => updateRow(idx, { resource_id: e.target.value })}
                                >
                                    <option value="">Select equipment…</option>
                                    {selectable.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} (available: {item.available})
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    min={1}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    value={row.quantity}
                                    disabled={!canEdit}
                                    onChange={(e) => updateRow(idx, { quantity: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-2 text-slate-500 hover:bg-slate-50"
                                    disabled={!canEdit || rows.length <= 1}
                                    onClick={() => removeRow(idx)}
                                    aria-label="Remove row"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <textarea
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        rows={2}
                        placeholder="Notes for admin (optional)"
                        value={notes}
                        disabled={!canEdit}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                        <AdminSecondaryButton type="button" disabled={!canEdit} onClick={addRow}>
                            <Plus className="w-4 h-4" /> Add item
                        </AdminSecondaryButton>
                        <AdminPrimaryButton type="button" disabled={!canEdit} onClick={submitRequest}>
                            Submit for approval
                        </AdminPrimaryButton>
                    </div>
                    {selectable.length === 0 && (
                        <p className="text-xs text-amber-800">
                            No available inventory to request. Ask admin to add stock or submit a Resource Budget Proposal.
                        </p>
                    )}
                </div>
            )}

            <div className="space-y-3">
                {(requests || []).length === 0 ? (
                    <p className="text-sm text-slate-500">No equipment requests yet for this event.</p>
                ) : (
                    (requests || []).map((req) => (
                        <div key={req.id} className="rounded-lg border border-white bg-white p-3 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="text-sm text-slate-800">
                                    <span className="font-semibold">Request #{req.id}</span>
                                    <span className="text-slate-500"> · {req.requested_by?.name || 'Trainer'}</span>
                                    {req.created_at && (
                                        <span className="text-slate-400 text-xs"> · {req.created_at}</span>
                                    )}
                                </div>
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusBadge(req.status)}`}>
                                    {req.status}
                                </span>
                            </div>
                            <ul className="text-sm text-slate-700 space-y-1">
                                {(req.items || []).map((item) => (
                                    <li key={item.id} className="flex flex-wrap justify-between gap-2">
                                        <span>{item.resource_name || `Resource #${item.resource_id}`}</span>
                                        <span className="text-slate-500">
                                            qty {item.quantity_requested}
                                            {req.status === 'pending' && item.available_now != null
                                                ? ` · stock ${item.available_now}`
                                                : ''}
                                            {item.quantity_approved > 0 ? ` · approved ${item.quantity_approved}` : ''}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            {req.notes && <p className="text-xs text-slate-500">Notes: {req.notes}</p>}
                            {req.rejection_reason && (
                                <p className="text-xs text-rose-700">Rejected: {req.rejection_reason}</p>
                            )}
                            {isAdmin && req.status === 'pending' && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    <AdminPrimaryButton
                                        type="button"
                                        disabled={!canEdit}
                                        onClick={() => reviewRequest(req.id, 'approve')}
                                    >
                                        Approve & reserve
                                    </AdminPrimaryButton>
                                    <AdminSecondaryButton
                                        type="button"
                                        disabled={!canEdit}
                                        onClick={() => reviewRequest(req.id, 'reject')}
                                    >
                                        Reject
                                    </AdminSecondaryButton>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
