<?php

namespace App\Http\Controllers;

use App\Services\AuditLogger;
use App\Services\DatabaseBackupService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BackupRecoveryController extends Controller
{
    public function __construct(
        private readonly DatabaseBackupService $backupService,
    ) {}

    private function authorizeBackupAccess(): void
    {
        $user = portal_user();
        $role = $user?->role;

        if (! $user || ! in_array($role, ['LGU_ADMIN', 'SUPER_ADMIN'], true)) {
            abort(403, 'Only LGU Admin can access Backup & Recovery.');
        }
    }

    private function validateAccountPassword(Request $request): ?string
    {
        $request->validate([
            'password' => ['required', 'string'],
        ]);

        $user = portal_user() ?? $request->user();
        if (! $user || ! Hash::check((string) $request->input('password'), (string) $user->password)) {
            return 'Incorrect account password.';
        }

        return null;
    }

    public function index()
    {
        $this->authorizeBackupAccess();

        return view('app', [
            'section' => 'backup_recovery',
            'backups' => $this->backupService->listBackups(),
            'backupStatus' => $this->backupService->status(),
        ]);
    }

    public function create(Request $request)
    {
        $this->authorizeBackupAccess();

        if ($passwordError = $this->validateAccountPassword($request)) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $passwordError,
                    'status' => $this->backupService->status(),
                ], 422);
            }

            return redirect()
                ->route('admin.backup-recovery.index')
                ->with('error', $passwordError);
        }

        $path = $this->backupService->backup('manual');

        if ($path) {
            AuditLogger::log([
                'action' => 'Manual database backup created',
                'module' => 'Backup & Recovery',
                'status' => 'success',
                'description' => 'Created backup file: '.basename($path),
                'new_values' => ['path' => $path],
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Backup saved successfully.',
                    'path' => $path,
                    'backups' => $this->backupService->listBackups(),
                    'status' => $this->backupService->status(),
                ]);
            }

            return redirect()
                ->route('admin.backup-recovery.index')
                ->with('status', 'Database backup created successfully.');
        }

        $detail = $this->backupService->lastError()
            ?: 'Ensure mysqldump is installed (or set MYSQLDUMP_PATH) and DB credentials are correct.';

        AuditLogger::log([
            'action' => 'Manual database backup failed',
            'module' => 'Backup & Recovery',
            'status' => 'failed',
            'description' => $detail,
            'failure_reason' => 'backup_failed',
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => $detail,
                'status' => $this->backupService->status(),
            ], 422);
        }

        return redirect()
            ->route('admin.backup-recovery.index')
            ->with('error', $detail);
    }

    public function download(string $filename): BinaryFileResponse
    {
        $this->authorizeBackupAccess();

        $absolute = $this->backupService->absolutePathFor($filename);
        if (! $absolute) {
            abort(404, 'Backup file not found.');
        }

        AuditLogger::log([
            'action' => 'Database backup downloaded',
            'module' => 'Backup & Recovery',
            'status' => 'success',
            'description' => 'Downloaded backup: '.$filename,
        ]);

        return response()->download($absolute, basename($absolute), [
            'Content-Type' => 'application/sql',
        ]);
    }

    public function destroy(Request $request, string $filename)
    {
        $this->authorizeBackupAccess();

        if (! $this->backupService->deleteBackup($filename)) {
            $message = $this->backupService->lastError() ?: 'Could not delete backup.';
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => $message], 422);
            }

            return redirect()->route('admin.backup-recovery.index')->with('error', $message);
        }

        AuditLogger::log([
            'action' => 'Database backup deleted',
            'module' => 'Backup & Recovery',
            'status' => 'success',
            'description' => 'Deleted backup: '.$filename,
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Backup deleted.',
                'backups' => $this->backupService->listBackups(),
                'status' => $this->backupService->status(),
            ]);
        }

        return redirect()->route('admin.backup-recovery.index')->with('status', 'Backup deleted.');
    }

    public function restore(Request $request, string $filename)
    {
        $this->authorizeBackupAccess();

        $data = $request->validate([
            'confirmation' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        if ($passwordError = $this->validateAccountPassword($request)) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => $passwordError], 422);
            }

            return redirect()->route('admin.backup-recovery.index')->with('error', $passwordError);
        }

        if (strtoupper(trim($data['confirmation'])) !== 'RESTORE') {
            $message = 'Type RESTORE exactly to confirm. Restore was cancelled.';
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => $message], 422);
            }

            return redirect()->route('admin.backup-recovery.index')->with('error', $message);
        }

        if (! $this->backupService->restoreFromBackup($filename)) {
            $message = $this->backupService->lastError() ?: 'Restore failed.';
            AuditLogger::log([
                'action' => 'Database restore failed',
                'module' => 'Backup & Recovery',
                'status' => 'failed',
                'description' => $message,
                'failure_reason' => 'restore_failed',
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $message,
                    'status' => $this->backupService->status(),
                ], 422);
            }

            return redirect()->route('admin.backup-recovery.index')->with('error', $message);
        }

        AuditLogger::log([
            'action' => 'Database restored from backup',
            'module' => 'Backup & Recovery',
            'status' => 'success',
            'description' => 'Restored database from: '.$filename.' (safety backup created first)',
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Database restored. A safety backup was created before restore.',
                'backups' => $this->backupService->listBackups(),
                'status' => $this->backupService->status(),
            ]);
        }

        return redirect()->route('admin.backup-recovery.index')->with('status', 'Database restored successfully.');
    }

    public function updateSettings(Request $request)
    {
        $this->authorizeBackupAccess();

        $data = $request->validate([
            'keep_latest' => ['nullable', 'integer', 'min:5', 'max:50'],
            'daily_enabled' => ['nullable', 'boolean'],
        ]);

        $status = $this->backupService->updateSettings([
            'keep_latest' => $data['keep_latest'] ?? $this->backupService->keepLatest(),
            'daily_enabled' => array_key_exists('daily_enabled', $data)
                ? (bool) $data['daily_enabled']
                : $this->backupService->dailyEnabled(),
        ]);

        AuditLogger::log([
            'action' => 'Backup settings updated',
            'module' => 'Backup & Recovery',
            'status' => 'success',
            'description' => sprintf(
                'keep_latest=%d, daily_enabled=%s',
                $status['keep_latest'],
                $status['daily_enabled'] ? 'yes' : 'no'
            ),
            'new_values' => $status,
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Settings saved.',
                'status' => $status,
                'backups' => $this->backupService->listBackups(),
            ]);
        }

        return redirect()->route('admin.backup-recovery.index')->with('status', 'Backup settings saved.');
    }
}
