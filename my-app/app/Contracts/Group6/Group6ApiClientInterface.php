<?php

namespace App\Contracts\Group6;

/**
 * HTTP client for calling Group 6's external API (when available).
 *
 * Placeholder implementation returns "not configured" until their API is ready.
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
}
