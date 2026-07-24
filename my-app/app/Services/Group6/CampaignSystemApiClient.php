<?php

namespace App\Services\Group6;

use App\Contracts\Group6\Group6ApiClientInterface;
use App\Models\CampaignRequest;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * HTTP client for the deployed Public Safety Campaign Management System
 * (https://campaign.alertaraqc.com).
 *
 * Outbound: push Training Intelligence as a campaign draft via POST /api/v1/campaigns.
 * Auth: Bearer JWT (HS256) using GROUP6_JWT_SECRET + GROUP6_JWT_SUBJECT,
 *       or a pre-issued token in GROUP6_API_KEY.
 */
class CampaignSystemApiClient implements Group6ApiClientInterface
{
    public function isConfigured(): bool
    {
        if (! config('group6.enabled')) {
            return false;
        }

        if (config('group6.api.base_url') === '') {
            return false;
        }

        return filled(config('group6.api.key'))
            || (filled(config('group6.jwt.secret')) && filled(config('group6.jwt.subject')));
    }

    public function fetchParticipants(?int $simulationEventId = null): array
    {
        return $this->notImplemented('Participant sync from Campaign System is not configured yet.');
    }

    public function fetchTrainers(): array
    {
        return $this->notImplemented('Trainer sync from Campaign System is not configured yet.');
    }

    /**
     * Push a local campaign request (Training Intelligence) to their campaigns API.
     *
     * @return array{success: bool, external_campaign_id: ?int, response: ?array<string, mixed>, error: ?string}
     */
    public function submitTrainingIntelligence(CampaignRequest $campaignRequest): array
    {
        if (! $this->isConfigured()) {
            return [
                'success' => false,
                'external_campaign_id' => null,
                'response' => null,
                'error' => 'Campaign System outbound is not configured. Set GROUP6_INTEGRATION_ENABLED, GROUP6_API_BASE_URL, and JWT/API key.',
            ];
        }

        $token = $this->resolveBearerToken();
        if (! $token) {
            return [
                'success' => false,
                'external_campaign_id' => null,
                'response' => null,
                'error' => 'Unable to resolve Campaign System Bearer token.',
            ];
        }

        $payload = $this->mapCampaignRequestToRemoteCampaign($campaignRequest);
        $url = rtrim((string) config('group6.api.base_url'), '/')
            .(string) config('group6.api.endpoints.campaigns', '/api/v1/campaigns');

        try {
            $response = Http::timeout((int) config('group6.api.timeout', 30))
                ->acceptJson()
                ->withToken($token)
                ->post($url, $payload);

            $body = $response->json();
            if (! is_array($body)) {
                $body = ['raw' => $response->body()];
            }

            if (! $response->successful()) {
                $error = is_string($body['error'] ?? null)
                    ? $body['error']
                    : ('Campaign System returned HTTP '.$response->status());

                Log::warning('Campaign System submit failed', [
                    'campaign_request_id' => $campaignRequest->id,
                    'status' => $response->status(),
                    'body' => $body,
                ]);

                return [
                    'success' => false,
                    'external_campaign_id' => null,
                    'response' => $body,
                    'error' => $error,
                ];
            }

            $externalId = isset($body['id']) ? (int) $body['id'] : null;

            return [
                'success' => true,
                'external_campaign_id' => $externalId,
                'response' => $body,
                'error' => null,
            ];
        } catch (\Throwable $e) {
            Log::error('Campaign System submit exception', [
                'campaign_request_id' => $campaignRequest->id,
                'message' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'external_campaign_id' => null,
                'response' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function mapCampaignRequestToRemoteCampaign(CampaignRequest $campaignRequest): array
    {
        $campaignRequest->loadMissing('trainingModule');
        $payload = is_array($campaignRequest->payload) ? $campaignRequest->payload : [];
        $module = $campaignRequest->trainingModule;

        $title = (string) ($payload['training_title'] ?? $module?->title ?? 'Training Campaign');
        $description = (string) ($payload['short_description'] ?? $module?->short_description ?? $module?->description ?? '');
        $category = $this->mapCategory(
            (string) ($payload['related_hazards'] ?? $module?->related_hazard ?? $module?->category ?? 'general')
        );

        $communities = $payload['recommended_communities']['communities'] ?? [];
        $barangayNames = collect(is_array($communities) ? $communities : [])
            ->map(fn ($row) => is_array($row) ? ($row['barangay_name'] ?? null) : null)
            ->filter()
            ->values()
            ->all();

        $geographicScope = $barangayNames[0] ?? 'Quezon City';
        if (! str_starts_with(strtolower((string) $geographicScope), 'barangay') && $geographicScope !== 'Quezon City') {
            $geographicScope = 'Barangay '.$geographicScope;
        }

        $startDate = $this->toDateString($payload['registration_opens'] ?? null)
            ?? now()->toDateString();
        $endDate = $this->toDateString($payload['training_completion_deadline'] ?? null)
            ?? $this->toDateString($payload['registration_deadline'] ?? null)
            ?? now()->addDays(14)->toDateString();

        $expected = (int) ($payload['expected_participants']
            ?? $campaignRequest->expected_participants
            ?? 0);

        return [
            'title' => $title,
            'description' => $description !== '' ? $description : $title,
            'category' => $category,
            'geographic_scope' => $geographicScope,
            'status' => 'draft',
            'start_date' => $startDate,
            'end_date' => $endDate,
            'objectives' => $description !== '' ? $description : 'Submitted from Disaster Training Intelligence.',
            'location' => $geographicScope,
            'assigned_staff' => json_encode(
                array_values(array_filter((array) ($payload['target_audience'] ?? [])))
            ),
            'barangay_target_zones' => json_encode($barangayNames !== [] ? $barangayNames : ['Quezon City']),
            'budget' => '0',
            'staff_count' => max(1, $expected),
            // Traceability fields (ignored if their API strips unknown keys)
            'source_system' => 'disaster-training',
            'source_campaign_request_id' => $campaignRequest->id,
            'source_training_module_id' => $campaignRequest->training_module_id,
            'registration_link' => $payload['registration_link'] ?? null,
        ];
    }

    protected function resolveBearerToken(): ?string
    {
        $apiKey = trim((string) config('group6.api.key', ''));
        if ($apiKey !== '' && substr_count($apiKey, '.') === 2) {
            return $apiKey;
        }

        $secret = (string) config('group6.jwt.secret', '');
        $subject = (string) config('group6.jwt.subject', '');
        if ($secret === '' || $subject === '') {
            return $apiKey !== '' ? $apiKey : null;
        }

        return $this->issueJwt($secret, $subject);
    }

    protected function issueJwt(string $secret, string $subject): string
    {
        $now = time();
        $header = $this->base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT'], JSON_THROW_ON_ERROR));
        $payload = $this->base64UrlEncode(json_encode([
            'iss' => (string) config('group6.jwt.issuer', 'public-safety-campaign-system'),
            'aud' => (string) config('group6.jwt.audience', 'public-safety-campaign-system'),
            'sub' => $subject,
            'iat' => $now,
            'exp' => $now + (int) config('group6.jwt.expiry_seconds', 86400),
        ], JSON_THROW_ON_ERROR));

        $signature = $this->base64UrlEncode(
            hash_hmac('sha256', $header.'.'.$payload, $secret, true)
        );

        return $header.'.'.$payload.'.'.$signature;
    }

    protected function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    protected function mapCategory(string $hazardOrCategory): string
    {
        $value = strtolower(trim($hazardOrCategory));

        return match (true) {
            str_contains($value, 'fire') => 'fire',
            str_contains($value, 'flood') => 'flood',
            str_contains($value, 'earthquake') || str_contains($value, 'quake') => 'earthquake',
            str_contains($value, 'road') => 'road safety',
            default => 'general',
        };
    }

    protected function toDateString(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        try {
            return Carbon::parse((string) $value)->toDateString();
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * @return array{success: bool, records: array<int, array<string, mixed>>, error: ?string}
     */
    protected function notImplemented(string $message): array
    {
        return [
            'success' => false,
            'records' => [],
            'error' => $message,
        ];
    }
}
