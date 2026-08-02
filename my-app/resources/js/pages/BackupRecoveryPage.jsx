import React from 'react';
import {
    DatabaseBackup,
    Download,
    RefreshCw,
    HardDrive,
    ShieldAlert,
    Clock,
    Trash2,
    RotateCcw,
    CheckCircle2,
    XCircle,
    Settings2,
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminPrimaryButton,
    AdminSecondaryButton,
    AdminContentCard,
    AdminFilterInput,
} from '../components/admin/AdminLayout';
import { AdminDataTable, AdminTableActionButton } from '../components/admin/AdminDataTable';

const ITEMS_PER_PAGE = 10;

function formatWhen(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: 'numeric',
            minute: '2-digit',
        });
    } catch (_) {
        return iso;
    }
}

export function BackupRecoveryPage({ backups: initialBackups = [], backupStatus: initialStatus = null }) {
    const [backups, setBackups] = React.useState(initialBackups || []);
    const [status, setStatus] = React.useState(initialStatus || {
        last_success_at: null,
        last_success_file: null,
        last_failure_at: null,
        last_failure_message: null,
        keep_latest: 20,
        daily_enabled: false,
        backup_count: (initialBackups || []).length,
    });
    const [keepLatest, setKeepLatest] = React.useState(String(initialStatus?.keep_latest ?? 20));
    const [dailyEnabled, setDailyEnabled] = React.useState(!!initialStatus?.daily_enabled);
    const [creating, setCreating] = React.useState(false);
    const [savingSettings, setSavingSettings] = React.useState(false);
    const [busyFile, setBusyFile] = React.useState(null);
    const [currentPage, setCurrentPage] = React.useState(1);
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';

    React.useEffect(() => {
        setBackups(initialBackups || []);
    }, [initialBackups]);

    React.useEffect(() => {
        if (initialStatus) {
            setStatus(initialStatus);
            setKeepLatest(String(initialStatus.keep_latest ?? 20));
            setDailyEnabled(!!initialStatus.daily_enabled);
        }
    }, [initialStatus]);

    const totalPages = Math.max(1, Math.ceil(backups.length / ITEMS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
    const pageBackups = backups.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    const pagination = backups.length > 0
        ? {
            current_page: safePage,
            last_page: totalPages,
            per_page: ITEMS_PER_PAGE,
            total: backups.length,
            from: startIndex + 1,
            to: Math.min(startIndex + ITEMS_PER_PAGE, backups.length),
        }
        : null;

    const applyPayload = (data) => {
        if (Array.isArray(data.backups)) setBackups(data.backups);
        if (data.status) {
            setStatus(data.status);
            setKeepLatest(String(data.status.keep_latest ?? keepLatest));
            setDailyEnabled(!!data.status.daily_enabled);
        }
    };

    const handleCreateBackup = async () => {
        const confirm = await Swal.fire({
            title: 'Create database backup?',
            text: `Stores a .sql dump on the server (keeps latest ${status.keep_latest || 20}).`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Create backup',
            confirmButtonColor: '#059669',
        });
        if (!confirm.isConfirmed) return;

        setCreating(true);
        try {
            const res = await fetch('/admin/backup-recovery', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
                credentials: 'same-origin',
                body: JSON.stringify({ _token: csrf }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) {
                applyPayload(data);
                await Swal.fire({
                    icon: 'error',
                    title: 'Backup failed',
                    text: data.message || 'Could not create backup.',
                });
                return;
            }
            applyPayload(data);
            setCurrentPage(1);
            await Swal.fire({
                icon: 'success',
                title: 'Backup created',
                text: data.message || 'Backup saved successfully.',
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (err) {
            console.error(err);
            await Swal.fire({
                icon: 'error',
                title: 'Request failed',
                text: 'Could not reach the backup service.',
            });
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (row) => {
        const confirm = await Swal.fire({
            title: 'Delete this backup?',
            text: row.filename,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            confirmButtonColor: '#dc2626',
        });
        if (!confirm.isConfirmed) return;

        setBusyFile(row.filename);
        try {
            const res = await fetch(`/admin/backup-recovery/${encodeURIComponent(row.filename)}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
                credentials: 'same-origin',
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) {
                await Swal.fire({ icon: 'error', title: 'Delete failed', text: data.message || 'Could not delete.' });
                return;
            }
            applyPayload(data);
            await Swal.fire({ icon: 'success', title: 'Deleted', timer: 1500, showConfirmButton: false });
        } catch (err) {
            console.error(err);
            await Swal.fire({ icon: 'error', title: 'Request failed', text: 'Could not delete backup.' });
        } finally {
            setBusyFile(null);
        }
    };

    const handleRestore = async (row) => {
        const confirm = await Swal.fire({
            title: 'Restore database?',
            html: `<p class="text-sm text-slate-600 mb-2">This will overwrite current application data with <strong>${row.filename}</strong>.</p>
                   <p class="text-xs text-amber-700">A safety backup is created first. Type <strong>RESTORE</strong> to confirm.</p>`,
            input: 'text',
            inputPlaceholder: 'Type RESTORE',
            showCancelButton: true,
            confirmButtonText: 'Restore now',
            confirmButtonColor: '#dc2626',
            inputValidator: (value) => {
                if (String(value || '').toUpperCase().trim() !== 'RESTORE') {
                    return 'You must type RESTORE to continue';
                }
                return null;
            },
        });
        if (!confirm.isConfirmed) return;

        setBusyFile(row.filename);
        try {
            const res = await fetch(`/admin/backup-recovery/${encodeURIComponent(row.filename)}/restore`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
                credentials: 'same-origin',
                body: JSON.stringify({ confirmation: 'RESTORE', _token: csrf }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) {
                applyPayload(data);
                await Swal.fire({ icon: 'error', title: 'Restore failed', text: data.message || 'Could not restore.' });
                return;
            }
            applyPayload(data);
            await Swal.fire({
                icon: 'success',
                title: 'Database restored',
                text: data.message || 'Restore completed. Refresh other open tabs.',
            });
        } catch (err) {
            console.error(err);
            await Swal.fire({ icon: 'error', title: 'Request failed', text: 'Could not restore backup.' });
        } finally {
            setBusyFile(null);
        }
    };

    const handleSaveSettings = async () => {
        setSavingSettings(true);
        try {
            const res = await fetch('/admin/backup-recovery/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    keep_latest: Number(keepLatest) || 20,
                    daily_enabled: dailyEnabled,
                    _token: csrf,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) {
                await Swal.fire({ icon: 'error', title: 'Save failed', text: data.message || 'Could not save settings.' });
                return;
            }
            applyPayload(data);
            await Swal.fire({ icon: 'success', title: 'Settings saved', timer: 1500, showConfirmButton: false });
        } catch (err) {
            console.error(err);
            await Swal.fire({ icon: 'error', title: 'Request failed', text: 'Could not save settings.' });
        } finally {
            setSavingSettings(false);
        }
    };

    return (
        <AdminPageShell className="space-y-4">
            <AdminPageHeader
                icon={DatabaseBackup}
                title="Backup & Recovery"
                description="Create, download, restore, and manage application database backups. Full server restore remains on CyberPanel."
                actions={
                    <AdminPrimaryButton type="button" onClick={handleCreateBackup} disabled={creating}>
                        {creating ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <HardDrive className="w-4 h-4" />
                        )}
                        {creating ? 'Creating…' : 'Create backup now'}
                    </AdminPrimaryButton>
                }
            />

            <div className="grid gap-4 md:grid-cols-2">
                <AdminContentCard className="p-5">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-emerald-700">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="text-sm text-slate-600 space-y-1">
                            <p className="font-semibold text-slate-800">Last successful backup</p>
                            <p>{formatWhen(status.last_success_at)}</p>
                            <p className="font-mono text-xs text-slate-500">{status.last_success_file || '—'}</p>
                            <p className="text-xs text-slate-500">{status.backup_count ?? backups.length} file(s) on server</p>
                        </div>
                    </div>
                </AdminContentCard>
                <AdminContentCard className="p-5">
                    <div className="flex items-start gap-3">
                        <div className={`mt-0.5 rounded-xl border p-2 ${status.last_failure_at ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                            <XCircle className="w-5 h-5" />
                        </div>
                        <div className="text-sm text-slate-600 space-y-1 min-w-0">
                            <p className="font-semibold text-slate-800">Last failure</p>
                            <p>{status.last_failure_at ? formatWhen(status.last_failure_at) : 'None recorded'}</p>
                            <p className="text-xs text-slate-500 break-words">{status.last_failure_message || '—'}</p>
                        </div>
                    </div>
                </AdminContentCard>
            </div>

            <AdminContentCard className="p-5">
                <div className="flex items-start gap-3 mb-4">
                    <div className="mt-0.5 rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600">
                        <Settings2 className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800 text-sm">Retention & schedule</p>
                        <p className="text-xs text-slate-500">Daily job runs at 02:00 when enabled (requires scheduler / cron).</p>
                    </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 items-end">
                    <AdminFilterInput
                        label="Keep latest backups"
                        type="number"
                        min="5"
                        max="50"
                        value={keepLatest}
                        onChange={(e) => setKeepLatest(e.target.value)}
                    />
                    <label className="flex items-center gap-2 text-sm text-slate-700 pb-2">
                        <input
                            type="checkbox"
                            checked={dailyEnabled}
                            onChange={(e) => setDailyEnabled(e.target.checked)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        Enable daily auto-backup
                    </label>
                    <AdminSecondaryButton type="button" onClick={handleSaveSettings} disabled={savingSettings}>
                        {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                        Save settings
                    </AdminSecondaryButton>
                </div>
            </AdminContentCard>

            <AdminContentCard className="p-5">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl border border-amber-200 bg-amber-50 p-2 text-amber-700">
                        <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 text-sm text-slate-600">
                        <p className="font-semibold text-slate-800">How recovery works</p>
                        <p>
                            In-app backups are <span className="font-medium text-slate-800">.sql dumps</span> of the
                            application database. Restore overwrites current data (with a safety backup first).
                            Download copies off-server for safekeeping.
                        </p>
                        <p>
                            For full VPS / site disaster recovery (files, SSL, MySQL user), use{' '}
                            <span className="font-medium text-slate-800">CyberPanel / Hostinger</span> host backups.
                        </p>
                    </div>
                </div>
            </AdminContentCard>

            <AdminDataTable
                columns={[
                    {
                        key: 'filename',
                        label: 'Backup file',
                        render: (row) => (
                            <div className="min-w-[180px]">
                                <span className="text-sm font-medium text-slate-900 font-mono">{row.filename}</span>
                            </div>
                        ),
                    },
                    {
                        key: 'size_human',
                        label: 'Size',
                        render: (row) => (
                            <span className="text-sm text-slate-700">{row.size_human || '—'}</span>
                        ),
                    },
                    {
                        key: 'modified_at',
                        label: 'Created',
                        render: (row) => (
                            <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                {formatWhen(row.modified_at)}
                            </span>
                        ),
                    },
                ]}
                data={pageBackups}
                rowKey="filename"
                emptyTitle="No backups yet"
                emptyDescription="Create a manual backup, or enable daily auto-backup."
                pagination={pagination}
                onPageChange={setCurrentPage}
                renderActions={(row) => (
                    <>
                        <AdminTableActionButton
                            href={`/admin/backup-recovery/download/${encodeURIComponent(row.filename)}`}
                            icon={Download}
                            title={`Download ${row.filename}`}
                            variant="view"
                        />
                        <AdminTableActionButton
                            onClick={() => handleRestore(row)}
                            icon={RotateCcw}
                            title={`Restore ${row.filename}`}
                            variant="warning"
                            disabled={busyFile === row.filename}
                        />
                        <AdminTableActionButton
                            onClick={() => handleDelete(row)}
                            icon={Trash2}
                            title={`Delete ${row.filename}`}
                            variant="danger"
                            disabled={busyFile === row.filename}
                        />
                    </>
                )}
            />
        </AdminPageShell>
    );
}
