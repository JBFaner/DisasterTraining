<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

class DatabaseBackupService
{
    private const BACKUP_DIR = 'backups';

    private const META_FILE = 'backups/_meta.json';

    private const KEEP_LATEST_DEFAULT = 20;

    /**
     * Prevent multiple backups being queued within the same request lifecycle.
     */
    private static bool $queued = false;

    /**
     * Last failure detail for UI / logs (cleared on success).
     */
    private ?string $lastError = null;

    public function lastError(): ?string
    {
        return $this->lastError;
    }

    public function keepLatest(): int
    {
        $meta = $this->readMeta();
        $keep = (int) ($meta['keep_latest'] ?? self::KEEP_LATEST_DEFAULT);

        return max(5, min(50, $keep > 0 ? $keep : self::KEEP_LATEST_DEFAULT));
    }

    public function dailyEnabled(): bool
    {
        return (bool) ($this->readMeta()['daily_enabled'] ?? false);
    }

    /**
     * @return array{last_success_at: ?string, last_success_file: ?string, last_failure_at: ?string, last_failure_message: ?string, keep_latest: int, daily_enabled: bool}
     */
    public function status(): array
    {
        $meta = $this->readMeta();
        $backups = $this->listBackups();
        $latest = $backups[0] ?? null;

        return [
            'last_success_at' => $meta['last_success_at'] ?? ($latest['modified_at'] ?? null),
            'last_success_file' => $meta['last_success_file'] ?? ($latest['filename'] ?? null),
            'last_failure_at' => $meta['last_failure_at'] ?? null,
            'last_failure_message' => $meta['last_failure_message'] ?? null,
            'keep_latest' => $this->keepLatest(),
            'daily_enabled' => $this->dailyEnabled(),
            'backup_count' => count($backups),
        ];
    }

    /**
     * @param  array{keep_latest?: int, daily_enabled?: bool}  $settings
     */
    public function updateSettings(array $settings): array
    {
        $meta = $this->readMeta();
        if (array_key_exists('keep_latest', $settings)) {
            $meta['keep_latest'] = max(5, min(50, (int) $settings['keep_latest']));
        }
        if (array_key_exists('daily_enabled', $settings)) {
            $meta['daily_enabled'] = (bool) $settings['daily_enabled'];
        }
        $this->writeMeta($meta);

        $database = (string) (config('database.connections.'.config('database.default').'.database') ?: 'disaster_training');
        $this->pruneOldBackups($database);

        return $this->status();
    }

    public function deleteBackup(string $filename): bool
    {
        $this->lastError = null;
        $absolute = $this->absolutePathFor($filename);
        if (! $absolute) {
            $this->lastError = 'Backup file not found.';

            return false;
        }

        $relative = self::BACKUP_DIR.'/'.basename($filename);
        if (! Storage::disk('local')->delete($relative)) {
            $this->lastError = 'Could not delete backup file.';

            return false;
        }

        return true;
    }

    /**
     * Restore database from a stored .sql backup.
     * Creates a safety backup first. Requires confirmation phrase handled by controller.
     */
    public function restoreFromBackup(string $filename): bool
    {
        $this->lastError = null;
        $absolute = $this->absolutePathFor($filename);
        if (! $absolute) {
            $this->lastError = 'Backup file not found.';

            return false;
        }

        // Safety snapshot before destructive restore
        $safety = $this->backup('pre_restore');
        if (! $safety) {
            $this->lastError = 'Could not create a safety backup before restore. Restore aborted. '
                .($this->lastError ?: '');

            return false;
        }

        try {
            $sql = file_get_contents($absolute);
            if ($sql === false || trim($sql) === '') {
                $this->lastError = 'Backup file is empty or unreadable.';

                return false;
            }

            $pdo = DB::connection()->getPdo();
            $pdo->exec('SET FOREIGN_KEY_CHECKS=0');

            foreach ($this->splitSqlStatements($sql) as $statement) {
                $trimmed = trim($statement);
                if ($trimmed === '') {
                    continue;
                }
                // Skip DB create/use — restore into the currently configured database
                if (preg_match('/^(CREATE\s+DATABASE|USE)\b/i', $trimmed)) {
                    continue;
                }
                $pdo->exec($trimmed);
            }

            $pdo->exec('SET FOREIGN_KEY_CHECKS=1');

            $this->recordSuccess(basename($filename), 'restore');

            return true;
        } catch (\Throwable $e) {
            $this->lastError = 'Restore failed: '.$e->getMessage();
            $this->recordFailure($this->lastError);
            Log::error('Database restore failed.', [
                'filename' => $filename,
                'error' => $e->getMessage(),
                'safety_backup' => $safety,
            ]);

            return false;
        }
    }

    /**
     * @return list<string>
     */
    private function splitSqlStatements(string $sql): array
    {
        $sql = preg_replace('/^\s*--.*$/m', '', $sql) ?? $sql;
        $sql = preg_replace('/\/\*.*?\*\//s', '', $sql) ?? $sql;
        $parts = preg_split('/;\s*\n/', $sql) ?: [];

        return array_values(array_filter(array_map('trim', $parts)));
    }

    /**
     * @return array<string, mixed>
     */
    private function readMeta(): array
    {
        try {
            if (! Storage::disk('local')->exists(self::META_FILE)) {
                return [];
            }
            $raw = Storage::disk('local')->get(self::META_FILE);
            $decoded = json_decode($raw ?: '{}', true);

            return is_array($decoded) ? $decoded : [];
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    private function writeMeta(array $meta): void
    {
        try {
            Storage::disk('local')->makeDirectory(self::BACKUP_DIR);
            Storage::disk('local')->put(self::META_FILE, json_encode($meta, JSON_PRETTY_PRINT));
        } catch (\Throwable $e) {
            Log::warning('Failed to write backup meta.', ['error' => $e->getMessage()]);
        }
    }

    private function recordSuccess(string $filename, string $reason = 'manual'): void
    {
        $meta = $this->readMeta();
        $meta['last_success_at'] = now()->toIso8601String();
        $meta['last_success_file'] = $filename;
        $meta['last_success_reason'] = $reason;
        $this->writeMeta($meta);
    }

    private function recordFailure(string $message): void
    {
        $meta = $this->readMeta();
        $meta['last_failure_at'] = now()->toIso8601String();
        $meta['last_failure_message'] = $message;
        $this->writeMeta($meta);
    }

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
     * Generate a .sql backup (mysqldump when possible; PHP fallback for Windows/XAMPP socket issues).
     *
     * Never throws to callers; errors are logged.
     *
     * @return string|null relative path (local disk) on success
     */
    public function backup(string $reason = 'manual'): ?string
    {
        $this->lastError = null;

        try {
            $connectionName = config('database.default', 'mysql');
            $connection = config("database.connections.{$connectionName}", []);

            $database = (string) ($connection['database'] ?? DB::connection($connectionName)->getDatabaseName());
            $database = $database !== '' ? $database : 'disaster_training';

            Storage::disk('local')->makeDirectory(self::BACKUP_DIR);

            $timestamp = now()->format('Y-m-d_H-i-s');
            $filename = "{$database}_{$timestamp}.sql";
            $relativePath = self::BACKUP_DIR.'/'.$filename;
            $absolutePath = Storage::disk('local')->path($relativePath);

            $dir = dirname($absolutePath);
            if (! is_dir($dir)) {
                mkdir($dir, 0755, true);
            }

            $mysqldumpErrors = [];
            $preferPhpFirst = PHP_OS_FAMILY === 'Windows';

            if ($preferPhpFirst) {
                if ($this->backupWithPhp($database, $absolutePath)) {
                    $this->pruneOldBackups($database);
                    $this->recordSuccess($filename, $reason);
                    Log::info('Database backup created (PHP).', [
                        'reason' => $reason,
                        'path' => $relativePath,
                    ]);

                    return $relativePath;
                }
            }

            $mysqldump = $this->resolveMysqlDumpBinary();
            if ($mysqldump !== null) {
                $path = $this->backupWithMysqlDump(
                    $mysqldump,
                    $connection,
                    $database,
                    $absolutePath,
                    $mysqldumpErrors
                );
                if ($path) {
                    $this->pruneOldBackups($database);
                    $this->recordSuccess($filename, $reason);
                    Log::info('Database backup created (mysqldump).', [
                        'reason' => $reason,
                        'path' => $relativePath,
                    ]);

                    return $relativePath;
                }
            } else {
                $mysqldumpErrors[] = 'mysqldump binary not found';
            }

            // Non-Windows: PHP fallback after mysqldump failure
            if (! $preferPhpFirst && $this->backupWithPhp($database, $absolutePath)) {
                $this->pruneOldBackups($database);
                $this->recordSuccess($filename, $reason);
                Log::info('Database backup created (PHP fallback).', [
                    'reason' => $reason,
                    'path' => $relativePath,
                    'mysqldump_errors' => $mysqldumpErrors,
                ]);

                return $relativePath;
            }

            $this->lastError = $this->lastError
                ?: ('Backup failed. '.implode(' | ', array_filter($mysqldumpErrors)));
            $this->recordFailure($this->lastError);

            Log::error('Database backup failed (all methods).', [
                'reason' => $reason,
                'error' => $this->lastError,
                'mysqldump_errors' => $mysqldumpErrors,
            ]);

            return null;
        } catch (\Throwable $e) {
            $this->lastError = $e->getMessage();
            $this->recordFailure($this->lastError);
            Log::error('Database backup failed (exception).', [
                'reason' => $reason,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * @param  array<string, mixed>  $connection
     * @param  list<string>  $errors
     */
    private function backupWithMysqlDump(
        string $mysqldump,
        array $connection,
        string $database,
        string $absolutePath,
        array &$errors,
    ): ?string {
        $host = (string) ($connection['host'] ?? '127.0.0.1');
        $port = (string) ($connection['port'] ?? '3306');
        $username = (string) ($connection['username'] ?? 'root');
        $password = (string) ($connection['password'] ?? '');

        $attempts = [
            ['host' => $host, 'protocol' => null],
            ['host' => $host === '127.0.0.1' ? 'localhost' : '127.0.0.1', 'protocol' => null],
            ['host' => '127.0.0.1', 'protocol' => 'TCP'],
            ['host' => 'localhost', 'protocol' => 'PIPE'],
        ];

        foreach ($attempts as $attempt) {
            if (is_file($absolutePath)) {
                @unlink($absolutePath);
            }

            $command = [
                $mysqldump,
                '--host='.$attempt['host'],
                '--port='.$port,
                '--user='.$username,
                '--single-transaction',
                '--quick',
                '--routines',
                '--triggers',
                '--databases',
                $database,
                '--result-file='.$absolutePath,
            ];

            if ($attempt['protocol']) {
                $command[] = '--protocol='.$attempt['protocol'];
            }

            $process = new Process($command);
            $process->setTimeout(120);
            // Do not merge full $_SERVER — on Windows that can break child TCP (error 10106).
            $env = [
                'MYSQL_PWD' => $password,
            ];
            foreach (['PATH', 'SystemRoot', 'windir', 'TEMP', 'TMP', 'USERPROFILE', 'HOMEDRIVE', 'HOMEPATH'] as $key) {
                $value = getenv($key);
                if ($value !== false && $value !== '') {
                    $env[$key] = $value;
                }
            }
            $process->setEnv($env);
            $process->run();

            if ($process->isSuccessful() && is_file($absolutePath) && filesize($absolutePath) > 0) {
                return $absolutePath;
            }

            $stderr = trim($process->getErrorOutput() ?: $process->getOutput());
            $stderr = preg_replace('/^.*Using a password on the command line.*$/mi', '', $stderr) ?? $stderr;
            $stderr = trim($stderr);
            $errors[] = trim(($attempt['protocol'] ?? 'default').'@'.$attempt['host'].': '.($stderr !== '' ? $stderr : 'exit '.$process->getExitCode()));

            if (is_file($absolutePath) && filesize($absolutePath) === 0) {
                @unlink($absolutePath);
            }
        }

        return null;
    }

    /**
     * Dump schema + data via Laravel PDO (works when subprocess TCP sockets fail).
     */
    private function backupWithPhp(string $database, string $absolutePath): bool
    {
        try {
            $pdo = DB::connection()->getPdo();
            $handle = fopen($absolutePath, 'wb');
            if ($handle === false) {
                $this->lastError = 'Could not open backup file for writing.';

                return false;
            }

            $write = function (string $line) use ($handle): void {
                fwrite($handle, $line);
            };

            $write("-- Disaster Training PHP backup\n");
            $write('-- Generated: '.now()->toDateTimeString()."\n");
            $write("-- Database: {$database}\n\n");
            $write("SET NAMES utf8mb4;\n");
            $write("SET FOREIGN_KEY_CHECKS=0;\n");
            $write("CREATE DATABASE IF NOT EXISTS `{$database}` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n");
            $write("USE `{$database}`;\n\n");

            $tables = DB::select('SHOW FULL TABLES WHERE Table_type = ?', ['BASE TABLE']);
            $tableKey = 'Tables_in_'.$database;

            foreach ($tables as $row) {
                $rowArr = (array) $row;
                $table = $rowArr[$tableKey] ?? $rowArr[array_key_first($rowArr)] ?? null;
                if (! is_string($table) || $table === '') {
                    continue;
                }

                $createRow = DB::selectOne("SHOW CREATE TABLE `{$table}`");
                $createSql = ((array) $createRow)['Create Table'] ?? null;
                if (! is_string($createSql) || $createSql === '') {
                    continue;
                }

                $write("DROP TABLE IF EXISTS `{$table}`;\n");
                $write($createSql.";\n\n");

                $columnMeta = DB::select("SHOW COLUMNS FROM `{$table}`");
                $columns = array_map(fn ($col) => (string) ((array) $col)['Field'], $columnMeta);
                if ($columns === []) {
                    continue;
                }

                $columnList = implode(', ', array_map(fn ($c) => '`'.$c.'`', $columns));
                $offset = 0;
                $chunk = 200;

                while (true) {
                    $rows = DB::table($table)->offset($offset)->limit($chunk)->get();
                    if ($rows->isEmpty()) {
                        break;
                    }

                    foreach ($rows as $dataRow) {
                        $values = [];
                        foreach ($columns as $column) {
                            $value = $dataRow->{$column} ?? null;
                            if ($value === null) {
                                $values[] = 'NULL';
                            } elseif (is_bool($value)) {
                                $values[] = $value ? '1' : '0';
                            } elseif (is_int($value) || is_float($value)) {
                                $values[] = (string) $value;
                            } else {
                                $values[] = $pdo->quote((string) $value);
                            }
                        }
                        $write("INSERT INTO `{$table}` ({$columnList}) VALUES (".implode(', ', $values).");\n");
                    }

                    $offset += $chunk;
                    if ($rows->count() < $chunk) {
                        break;
                    }
                }

                $write("\n");
            }

            $write("SET FOREIGN_KEY_CHECKS=1;\n");
            fclose($handle);

            if (! is_file($absolutePath) || filesize($absolutePath) === 0) {
                $this->lastError = 'PHP backup produced an empty file.';

                return false;
            }

            return true;
        } catch (\Throwable $e) {
            $this->lastError = 'PHP backup failed: '.$e->getMessage();
            if (is_file($absolutePath)) {
                @unlink($absolutePath);
            }

            return false;
        }
    }

    /**
     * Locate mysqldump on PATH or common local install locations.
     */
    public function resolveMysqlDumpBinary(): ?string
    {
        $configured = env('MYSQLDUMP_PATH') ?: config('database.mysqldump_path');
        if (is_string($configured) && $configured !== '') {
            $configured = trim($configured, "\"'");
            if (is_file($configured)) {
                return $configured;
            }
        }

        $candidates = [
            'C:\\xampp\\mysql\\bin\\mysqldump.exe',
            'C:\\laragon\\bin\\mysql\\mysql-8.0.30-winx64\\bin\\mysqldump.exe',
            'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
            'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysqldump.exe',
            'C:\\Program Files\\MariaDB 10.11\\bin\\mysqldump.exe',
            '/usr/bin/mysqldump',
            '/usr/local/bin/mysqldump',
            '/opt/homebrew/bin/mysqldump',
        ];

        $laragonMysql = 'C:\\laragon\\bin\\mysql';
        if (is_dir($laragonMysql)) {
            foreach (glob($laragonMysql.'\\*\\bin\\mysqldump.exe') ?: [] as $path) {
                array_unshift($candidates, $path);
            }
        }

        foreach ($candidates as $path) {
            if (is_file($path)) {
                return $path;
            }
        }

        $which = Process::fromShellCommandline(
            PHP_OS_FAMILY === 'Windows' ? 'where mysqldump' : 'command -v mysqldump'
        );
        $which->run();
        if ($which->isSuccessful()) {
            $line = trim(explode("\n", str_replace("\r", '', $which->getOutput()))[0] ?? '');
            if ($line !== '' && is_file($line)) {
                return $line;
            }
            if ($line !== '' && ! str_contains($line, ' ')) {
                return 'mysqldump';
            }
        }

        return null;
    }

    /**
     * List available .sql backups (newest first).
     *
     * @return list<array{filename: string, path: string, size: int, size_human: string, modified_at: string|null}>
     */
    public function listBackups(): array
    {
        try {
            Storage::disk('local')->makeDirectory(self::BACKUP_DIR);

            return collect(Storage::disk('local')->files(self::BACKUP_DIR))
                ->filter(fn (string $path) => str_ends_with(strtolower($path), '.sql'))
                ->map(function (string $path) {
                    $size = (int) Storage::disk('local')->size($path);
                    $modified = Storage::disk('local')->lastModified($path);

                    return [
                        'filename' => basename($path),
                        'path' => $path,
                        'size' => $size,
                        'size_human' => $this->formatBytes($size),
                        'modified_at' => $modified ? date('c', $modified) : null,
                    ];
                })
                ->sortByDesc('modified_at')
                ->values()
                ->all();
        } catch (\Throwable $e) {
            Log::warning('Failed to list database backups.', [
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * Resolve a backup file by basename only (prevents path traversal).
     */
    public function absolutePathFor(string $filename): ?string
    {
        $safe = basename($filename);
        if ($safe === '' || $safe !== $filename || ! str_ends_with(strtolower($safe), '.sql')) {
            return null;
        }

        $relative = self::BACKUP_DIR.'/'.$safe;
        if (! Storage::disk('local')->exists($relative)) {
            return null;
        }

        return Storage::disk('local')->path($relative);
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes < 1024) {
            return $bytes.' B';
        }
        if ($bytes < 1024 * 1024) {
            return round($bytes / 1024, 1).' KB';
        }

        return round($bytes / (1024 * 1024), 2).' MB';
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

            $toDelete = $files->slice($this->keepLatest())->pluck('path')->values();

            foreach ($toDelete as $path) {
                Storage::disk('local')->delete($path);
            }
        } catch (\Throwable $e) {
            Log::warning('Database backup pruning failed.', [
                'database' => $database,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
