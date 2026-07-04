<?php

namespace App\Services\Group6;

use App\Contracts\Group6\Group6ApiClientInterface;

/**
 * Placeholder client — returns "not configured" until Group 6's API is available.
 *
 * Replace bindings in AppServiceProvider with a real HTTP client when ready.
 */
class PlaceholderGroup6ApiClient implements Group6ApiClientInterface
{
    public function isConfigured(): bool
    {
        return config('group6.enabled')
            && config('group6.api.base_url') !== ''
            && config('group6.api.key');
    }

    public function fetchParticipants(?int $simulationEventId = null): array
    {
        return $this->notAvailable();
    }

    public function fetchTrainers(): array
    {
        return $this->notAvailable();
    }

    /**
     * @return array{success: bool, records: array<int, array<string, mixed>>, error: ?string}
     */
    protected function notAvailable(): array
    {
        return [
            'success' => false,
            'records' => [],
            'error' => $this->isConfigured()
                ? 'Community Engagement System API client is not yet implemented. Awaiting API specification from the external team.'
                : 'Community Engagement System integration is disabled or not configured. Set GROUP6_INTEGRATION_ENABLED and GROUP6_API_BASE_URL in .env.',
        ];
    }
}
