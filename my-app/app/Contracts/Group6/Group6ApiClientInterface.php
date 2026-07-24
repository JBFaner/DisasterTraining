<?php

namespace App\Contracts\Group6;

use App\Models\CampaignRequest;

/**
 * HTTP client for calling the external Campaign Planning system.
 */
interface Group6ApiClientInterface
{
    public function isConfigured(): bool;

    /**
     * Fetch participant registrations from Group 6's system.
     *
     * @return array{success: bool, records: array<int, array<string, mixed>>, error: ?string}
     */
    public function fetchParticipants(?int $simulationEventId = null): array;

    /**
     * Fetch trainer records from Group 6's system.
     *
     * @return array{success: bool, records: array<int, array<string, mixed>>, error: ?string}
     */
    public function fetchTrainers(): array;

    /**
     * Push Training Intelligence (campaign request) to their campaigns API.
     *
     * @return array{success: bool, external_campaign_id: ?int, response: ?array<string, mixed>, error: ?string}
     */
    public function submitTrainingIntelligence(CampaignRequest $campaignRequest): array;
}
