import React from 'react';
import {
    DatabaseBackup,
    Download,
    RefreshCw,
    HardDrive,
    Clock,
    Trash2,
    RotateCcw,
    CheckCircle2,
    XCircle,
    Settings2,
    CircleHelp,
    Printer,
    ChevronDown,
    ChevronUp,
    Timer,
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
import { buildPrintTableDocument, printHtmlDocument } from '../utils/printHtml';

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

/** Strip timestamp from backup filenames (date lives in Created column). */
function displayBackupName(filename) {
    const name = String(filename || '');
    const stripped = name.replace(/_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}(?=\.sql$)/i, '');
    return stripped || name;
}

/**
 * Rough restore ETA from dump size (includes safety-backup overhead).
 * Conservative ~400 KB/s import + 25s base.
 */
function estimateRestoreLabel(sizeBytes) {
    const bytes = Number(sizeBytes) || 0;
    const seconds = Math.max(45, Math.round(25 + bytes / (400 * 1024)));
    if (seconds < 60) return `≈ ${seconds} sec`;
    const minutes = Math.max(1, Math.round(seconds / 60));
    if (minutes < 60) return `≈ ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem > 0 ? `≈ ${hours} hr ${rem} min` : `≈ ${hours} hr`;
}

const RECOVERY_HELP = [
    'In-app backups are .sql dumps of the application database.',
    'Restore overwrites current data (a safety backup is created first).',
    'Download copies off-server for safekeeping.',
    'For full VPS / site recovery (files, SSL, MySQL user), use CyberPanel / Hostinger host backups.',
].join(' ');

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
    const [showRetention, setShowRetention] = React.useState(false);
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
            html: `<p class="text-sm text-slate-600 mb-3">Stores a .sql dump on the server (keeps latest ${status.keep_latest || 20}).</p>
                   <p class="text-xs text-slate-500 mb-2">Enter your account password to continue.</p>`,
            input: 'password',
            inputPlaceholder: 'Account password',
            inputAttributes: { autocomplete: 'current-password' },
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Create backup',
            confirmButtonColor: '#059669',
            inputValidator: (value) => {
                if (!String(value || '').trim()) return 'Password is required';
                return null;
            },
        });
        if (!confirm.isConfirmed) return;
        const password = String(confirm.value || '');

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
                body: JSON.stringify({ _token: csrf, password }),
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
            text: `${displayBackupName(row.filename)} — ${formatWhen(row.modified_at)}`,
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
            html: `<p class="text-sm text-slate-600 mb-2">This will overwrite current application data with <strong>${displayBackupName(row.filename)}</strong> (${formatWhen(row.modified_at)}).</p>
                   <p class="text-xs text-slate-500 mb-2">Estimated restore time: <strong>${estimateRestoreLabel(row.size)}</strong></p>
                   <p class="text-xs text-amber-700 mb-3">A safety backup is created first. Type <strong>RESTORE</strong> to confirm.</p>`,
            input: 'text',
            inputPlaceholder: 'Type RESTORE',
            showCancelButton: true,
            confirmButtonText: 'Continue',
            confirmButtonColor: '#dc2626',
            inputValidator: (value) => {
                if (String(value || '').toUpperCase().trim() !== 'RESTORE') {
                    return 'You must type RESTORE to continue';
                }
                return null;
            },
        });
        if (!confirm.isConfirmed) return;

        const passwordPrompt = await Swal.fire({
            title: 'Confirm with password',
            text: 'Enter your account password to restore.',
            input: 'password',
            inputPlaceholder: 'Account password',
            inputAttributes: { autocomplete: 'current-password' },
            showCancelButton: true,
            confirmButtonText: 'Restore now',
            confirmButtonColor: '#dc2626',
            inputValidator: (value) => {
                if (!String(value || '').trim()) return 'Password is required';
                return null;
            },
        });
        if (!passwordPrompt.isConfirmed) return;
        const password = String(passwordPrompt.value || '');

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
                body: JSON.stringify({ confirmation: 'RESTORE', password, _token: csrf }),
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

    const handlePrintList = () => {
        const html = buildPrintTableDocument({
            title: 'Backup & Recovery — file list',
            subtitle: `Printed ${formatWhen(new Date().toISOString())} · ${backups.length} file(s)`,
            headers: ['Backup file', 'Size', 'Est. restore', 'Created'],
            rows: backups.map((row) => [
                displayBackupName(row.filename),
                row.size_human || '—',
                estimateRestoreLabel(row.size),
                formatWhen(row.modified_at),
            ]),
            emptyMessage: 'No backups yet.',
        });
        printHtmlDocument(html, 'Backup list');
    };

    return (
        <AdminPageShell className="space-y-4">
            <AdminPageHeader
                icon={DatabaseBackup}
                title="Backup & Recovery"
                description="Create, download, restore, and manage application database backups."
                actions={
                    <div className="flex items-center gap-2">
                        <div className="relative group">
                            <button
                                type="button"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
                                aria-label="How recovery works"
                                title={RECOVERY_HELP}
                            >
                                <CircleHelp className="w-5 h-5" strokeWidth={2.25} />
                            </button>
                            <div
                                role="tooltip"
                                className="pointer-events-none absolute right-0 top-full z-30 mt-2 hidden w-72 rounded-lg border border-rose-100 bg-white p-3 text-left text-xs leading-relaxed text-slate-600 shadow-lg group-hover:block group-focus-within:block"
                            >
                                <p className="mb-1 font-semibold text-rose-700">How recovery works</p>
                                <p>{RECOVERY_HELP}</p>
                            </div>
                        </div>
                        <AdminSecondaryButton type="button" onClick={handlePrintList} disabled={backups.length === 0}>
                            <Printer className="w-4 h-4" />
                            Print list
                        </AdminSecondaryButton>
                        <AdminPrimaryButton type="button" onClick={handleCreateBackup} disabled={creating}>
                            {creating ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <HardDrive className="w-4 h-4" />
                            )}
                            {creating ? 'Creating…' : 'Create backup now'}
                        </AdminPrimaryButton>
                    </div>
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
                            <p className="font-mono text-xs text-slate-500">
                                {status.last_success_file ? displayBackupName(status.last_success_file) : '—'}
                            </p>
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

            <AdminContentCard className="p-0 overflow-hidden">
                <button
                    type="button"
                    onClick={() => setShowRetention((v) => !v)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50/80"
                    aria-expanded={showRetention}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600">
                            <Settings2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-slate-800 text-sm">Retention & schedule</p>
                            <p className="text-xs text-slate-500 truncate">
                                {showRetention
                                    ? 'Daily job runs at 02:00 when enabled (requires scheduler / cron).'
                                    : `Hidden · keep ${status.keep_latest ?? keepLatest} · daily ${dailyEnabled ? 'on' : 'off'}`}
                            </p>
                        </div>
                    </div>
                    {showRetention ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                </button>
                {showRetention ? (
                    <div className="border-t border-slate-100 px-5 pb-5 pt-4">
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
                    </div>
                ) : null}
            </AdminContentCard>

            <AdminDataTable
                columns={[
                    {
                        key: 'filename',
                        label: 'Backup file',
                        render: (row) => (
                            <div className="min-w-[120px]">
                                <span className="text-sm font-medium text-slate-900 font-mono" title={row.filename}>
                                    {displayBackupName(row.filename)}
                                </span>
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
                        key: 'est_restore',
                        label: 'Est. restore',
                        render: (row) => (
                            <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                                <Timer className="w-3.5 h-3.5 text-slate-400" />
                                {estimateRestoreLabel(row.size)}
                            </span>
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
                            title={`Restore ${row.filename} (${estimateRestoreLabel(row.size)})`}
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
