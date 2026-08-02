<?php

namespace App\Console\Commands;

use App\Services\DatabaseBackupService;
use Illuminate\Console\Command;

class RunDatabaseBackupCommand extends Command
{
    protected $signature = 'backup:database {--force : Run even if daily schedule is disabled}';

    protected $description = 'Create an application database backup (.sql)';

    public function handle(DatabaseBackupService $backups): int
    {
        if (! $this->option('force') && ! $backups->dailyEnabled()) {
            $this->info('Daily backup is disabled. Use --force to run anyway.');

            return self::SUCCESS;
        }

        $path = $backups->backup($this->option('force') ? 'scheduled_force' : 'scheduled_daily');
        if (! $path) {
            $this->error($backups->lastError() ?: 'Backup failed.');

            return self::FAILURE;
        }

        $this->info('Backup created: '.$path);

        return self::SUCCESS;
    }
}
