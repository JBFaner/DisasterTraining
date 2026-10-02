<?php

namespace App\Services;

use App\Models\CampaignRegistration;
use App\Models\Certificate;

class CertificateRegistrationSyncService
{
    public function syncAfterIssue(Certificate $certificate): void
    {
        $certificate->loadMissing('simulationEvent:id,training_module_id');

        $moduleIds = collect([
            $certificate->training_module_id,
            $certificate->simulationEvent?->training_module_id,
        ])->filter()->unique()->values()->all();

        if ($moduleIds === []) {
            return;
        }

        CampaignRegistration::query()
            ->where('user_id', $certificate->user_id)
            ->whereIn('training_module_id', $moduleIds)
            ->where('registration_status', CampaignRegistration::STATUS_REGISTERED)
            ->update(['certificate_status' => CampaignRegistration::CERTIFICATE_ISSUED]);
    }

    public function syncAfterRevoke(Certificate $certificate): void
    {
        $certificate->loadMissing('simulationEvent:id,training_module_id');

        $moduleIds = collect([
            $certificate->training_module_id,
            $certificate->simulationEvent?->training_module_id,
        ])->filter()->unique()->values()->all();

        foreach ($moduleIds as $moduleId) {
            if ($this->participantHasActiveCertificateForModule((int) $certificate->user_id, (int) $moduleId)) {
                continue;
            }

            CampaignRegistration::query()
                ->where('user_id', $certificate->user_id)
                ->where('training_module_id', $moduleId)
                ->where('registration_status', CampaignRegistration::STATUS_REGISTERED)
                ->update(['certificate_status' => CampaignRegistration::CERTIFICATE_NOT_ISSUED]);
        }
    }

    public function backfillAll(): int
    {
        $updated = 0;

        Certificate::query()
            ->whereNull('revoked_at')
            ->orderBy('id')
            ->chunkById(100, function ($certificates) use (&$updated) {
                foreach ($certificates as $certificate) {
                    $before = CampaignRegistration::query()
                        ->where('user_id', $certificate->user_id)
                        ->where('certificate_status', CampaignRegistration::CERTIFICATE_NOT_ISSUED)
                        ->count();

                    $this->syncAfterIssue($certificate);

                    $after = CampaignRegistration::query()
                        ->where('user_id', $certificate->user_id)
                        ->where('certificate_status', CampaignRegistration::CERTIFICATE_NOT_ISSUED)
                        ->count();

                    if ($after < $before) {
                        $updated += ($before - $after);
                    }
                }
            });

        return $updated;
    }

    protected function participantHasActiveCertificateForModule(int $userId, int $moduleId): bool
    {
        return Certificate::query()
            ->where('user_id', $userId)
            ->whereNull('revoked_at')
            ->where(function ($query) use ($moduleId) {
                $query->where('training_module_id', $moduleId)
                    ->orWhereHas('simulationEvent', fn ($event) => $event->where('training_module_id', $moduleId));
            })
            ->exists();
    }
}
