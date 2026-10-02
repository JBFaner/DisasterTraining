<?php

namespace App\Console\Commands;

use App\Services\CertificateRegistrationSyncService;
use Illuminate\Console\Command;

class SyncCertificateRegistrationStatus extends Command
{
    protected $signature = 'certificates:sync-registration-status';

    protected $description = 'Backfill campaign_registrations.certificate_status from issued certificates';

    public function handle(CertificateRegistrationSyncService $syncService): int
    {
        $updated = $syncService->backfillAll();
        $this->info("Synced {$updated} campaign registration row(s) to issued.");

        return self::SUCCESS;
    }
}
