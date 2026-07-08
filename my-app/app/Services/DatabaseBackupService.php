<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

class DatabaseBackupService
{
    private const BACKUP_DIR = 'backups';
    private const KEEP_LATEST = 20;

    /**
     * Prevent multiple backups being queued within the same request lifecycle.
     */
    private static bool $queued = false;

    /**
     * Queue a backup to run only after the current DB transaction commits.
     * If no transaction is active, it runs immediately (Laravel behavior).
     */
    public function queueAfterCommit(string $reason): void
    {
        if (self::$queued) {
            return;
        }

        self::$queued = true;

        DB::afterCommit(function () use ($reason) {
            $this->backup($reason);
        });
    }

    /**
     * Generate a mysqldump .sql backup.
     *
     * Never throws to callers; errors are logged.
     *
     * @return string|null relative path (local disk) on success
     */
    public function backup(string $reason = 'manual'): ?string
    {
        try {
            $connectionName = config('database.default', 'mysql');
            $connection = config("database.connections.{$connectionName}", []);

            $database = (string) ($connection['database'] ?? DB::connection($connectionName)->getDatabaseName());
            $database = $database !== '' ? $database : 'disaster_training';

            // Requirement is specific to this DB.
            $database = 'disaster_training';

            $host = (string) ($connection['host'] ?? '127.0.0.1');
            $port = (string) ($connection['port'] ?? '3306');
            $username = (string) ($connection['username'] ?? 'root');
            $password = (string) ($connection['password'] ?? '');

            Storage::disk('local')->makeDirectory(self::BACKUP_DIR);

            $timestamp = now()->format('Y-m-d_H-i-s');
            $filename = "{$database}_{$timestamp}.sql";
            $relativePath = self::BACKUP_DIR.'/'.$filename;
            $absolutePath = Storage::disk('local')->path($relativePath);

            $command = [
                'mysqldump',
                '--host='.$host,
                '--port='.$port,
                '--user='.$username,
                // Keep password as an argument so it won't prompt (non-interactive).
                '--password='.$password,
                '--single-transaction',
                '--quick',
                '--routines',
                '--triggers',
                '--databases',
                $database,
                '--result-file='.$absolutePath,
            ];

            $process = new Process($command);
            $process->setTimeout(120);
            $process->run();

            if (! $process->isSuccessful()) {
                Log::error('Database backup failed (mysqldump error).', [
                    'reason' => $reason,
                    'database' => $database,
                    'exit_code' => $process->getExitCode(),
                    'error_output' => trim($process->getErrorOutput()),
                ]);

                return null;
            }

            $this->pruneOldBackups($database);

            Log::info('Database backup created.', [
                'reason' => $reason,
                'path' => $relativePath,
            ]);

            return $relativePath;
        } catch (\Throwable $e) {
            Log::error('Database backup failed (exception).', [
                'reason' => $reason,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    private function pruneOldBackups(string $database): void
    {
        try {
            $files = collect(Storage::disk('local')->files(self::BACKUP_DIR))
                ->filter(fn (string $path) => str_starts_with(basename($path), "{$database}_") && str_ends_with($path, '.sql'))
                ->map(function (string $path) {
                    return [
                        'path' => $path,
                        'modified' => Storage::disk('local')->lastModified($path),
                    ];
                })
                ->sortByDesc('modified')
                ->values();

            $toDelete = $files->slice(self::KEEP_LATEST)->pluck('path')->values();

            foreach ($toDelete as $path) {
                Storage::disk('local')->delete($path);
            }
        } catch (\Throwable $e) {
            // Pruning should never affect user flows.
            Log::warning('Database backup pruning failed.', [
                'database' => $database,
                'error' => $e->getMessage(),
            ]);
        }
    }
}

