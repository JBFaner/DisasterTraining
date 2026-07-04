<?php

namespace App\Services\HazardAssessment;

use App\Contracts\HazardAssessment\HazardAssessmentDataProviderInterface;
use App\Models\BarangayProfile;

/**
 * Local database provider — default until external government API is available.
 */
class LocalHazardAssessmentDataProvider implements HazardAssessmentDataProviderInterface
{
    public function isConfigured(): bool
    {
        return true;
    }

    public function syncAll(): array
    {
        $count = BarangayProfile::count();

        return [
            'success' => true,
            'synced' => $count,
            'message' => "Loaded {$count} hazard assessment profile(s) from local database.",
        ];
    }

    public function fetchProfile(int $externalOrLocalId): array
    {
        $profile = BarangayProfile::with(['hazardRecords', 'documents'])->find($externalOrLocalId);

        if (! $profile) {
            return [
                'success' => false,
                'profile' => null,
                'message' => 'Hazard assessment profile not found.',
            ];
        }

        return [
            'success' => true,
            'profile' => $profile->toHazardIntelligenceArray(),
            'message' => null,
        ];
    }
}
