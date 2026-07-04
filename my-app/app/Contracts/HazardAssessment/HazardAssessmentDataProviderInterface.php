<?php

namespace App\Contracts\HazardAssessment;

/**
 * Future hook: synchronize hazard assessment data from external government APIs.
 *
 * Local database records are used until an external provider is configured.
 */
interface HazardAssessmentDataProviderInterface
{
    public function isConfigured(): bool;

    /**
     * @return array{success: bool, synced: int, message: ?string}
     */
    public function syncAll(): array;

    /**
     * @return array{success: bool, profile: ?array<string, mixed>, message: ?string}
     */
    public function fetchProfile(int $externalOrLocalId): array;
}
