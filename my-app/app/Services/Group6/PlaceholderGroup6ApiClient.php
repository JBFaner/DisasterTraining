<?php

namespace App\Services\Group6;

use App\Contracts\Group6\Group6ApiClientInterface;
use App\Models\CampaignRequest;

/**
 * Fallback client when Campaign System outbound is not enabled.
 */
class PlaceholderGroup6ApiClient implements Group6ApiClientInterface
{
    public function isConfigured(): bool
    {
        return false;
    }

    public function fetchParticipants(?int $simulationEventId = null): array
    {
        return $this->notAvailable();
    }

    public function fetchTrainers(): array
    {
        return $this->notAvailable();
    }

    public function submitTrainingIntelligence(CampaignRequest $campaignRequest): array
    {
        return [
            'success' => false,
            'external_campaign_id' => null,
            'response' => null,
            'error' => 'Campaign System outbound is disabled. Use CampaignSystemApiClient with GROUP6_* env settings.',
        ];
    }

    /**
     * @return array{success: bool, records: array<int, array<string, mixed>>, error: ?string}
     */
    protected function notAvailable(): array
    {
        return [
            'success' => false,
            'records' => [],
            'error' => 'Community Engagement System integration is disabled or not configured. Set GROUP6_INTEGRATION_ENABLED and GROUP6_API_BASE_URL in .env.',
        ];
    }
}
