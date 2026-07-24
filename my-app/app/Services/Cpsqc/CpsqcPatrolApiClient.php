<?php

namespace App\Services\Cpsqc;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * HTTP client for CPSQC patrol request APIs.
 *
 * @see cpsqc/api/API_INTEGRATION.md
 */
class CpsqcPatrolApiClient
{
    public function isConfigured(): bool
    {
        if (! config('cpsqc.enabled')) {
            return false;
        }

        return config('cpsqc.api.base_url') !== '';
    }

    /**
     * Submit a patrol request to CPSQC.
     *
     * @param  array<string, mixed>  $payload
     * @return array{success: bool, request_id: ?string, response: ?array<string, mixed>, error: ?string}
     */
    public function submitPatrolRequest(array $payload): array
    {
        if (! $this->isConfigured()) {
            return $this->fail('CPSQC integration is not configured. Set CPSQC_INTEGRATION_ENABLED and CPSQC_API_BASE_URL.');
        }

        $url = $this->url((string) config('cpsqc.api.endpoints.receive'));

        try {
            $response = $this->http()->post($url, $payload);
            $body = $this->decodeBody($response->body(), $response->json());

            if (! $response->successful() || ! ($body['success'] ?? false)) {
                $error = is_string($body['error'] ?? null)
                    ? $body['error']
                    : (is_string($body['message'] ?? null) ? $body['message'] : 'CPSQC patrol request failed (HTTP '.$response->status().').');

                Log::warning('CPSQC patrol request failed', [
                    'status' => $response->status(),
                    'body' => $body,
                ]);

                return [
                    'success' => false,
                    'request_id' => null,
                    'response' => $body,
                    'error' => $error,
                ];
            }

            $requestId = $body['data']['request_id'] ?? $body['request_id'] ?? null;

            return [
                'success' => true,
                'request_id' => is_string($requestId) ? $requestId : (is_numeric($requestId) ? (string) $requestId : null),
                'response' => $body,
                'error' => null,
            ];
        } catch (\Throwable $e) {
            Log::error('CPSQC patrol request exception', ['message' => $e->getMessage()]);

            return $this->fail('Unable to reach CPSQC: '.$e->getMessage());
        }
    }

    /**
     * List patrol requests (optionally filtered).
     *
     * @param  array{status?: string, source_group?: string, source_reference_id?: string, request_id?: string}  $filters
     * @return array{success: bool, data: list<array<string, mixed>>, error: ?string}
     */
    public function listPatrolRequests(array $filters = []): array
    {
        if (! $this->isConfigured()) {
            return [
                'success' => false,
                'data' => [],
                'error' => 'CPSQC integration is not configured.',
            ];
        }

        $query = array_filter([
            'status' => $filters['status'] ?? null,
            'source_group' => $filters['source_group'] ?? null,
            'source_reference_id' => $filters['source_reference_id'] ?? null,
            'request_id' => $filters['request_id'] ?? null,
        ], fn ($value) => $value !== null && $value !== '');

        $url = $this->url((string) config('cpsqc.api.endpoints.list'));

        try {
            $response = $this->http()->get($url, $query);
            $body = $this->decodeBody($response->body(), $response->json());

            if (! $response->successful()) {
                $error = is_string($body['error'] ?? null)
                    ? $body['error']
                    : 'CPSQC list failed (HTTP '.$response->status().').';

                return [
                    'success' => false,
                    'data' => [],
                    'error' => $error,
                ];
            }

            $rows = $body['data'] ?? [];
            if (! is_array($rows)) {
                $rows = [];
            }

            return [
                'success' => true,
                'data' => array_values($rows),
                'error' => null,
            ];
        } catch (\Throwable $e) {
            Log::error('CPSQC list patrol requests exception', ['message' => $e->getMessage()]);

            return [
                'success' => false,
                'data' => [],
                'error' => 'Unable to reach CPSQC: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Flatten approved assigned_personnel into Exercise Plan pool members.
     *
     * @param  list<array<string, mixed>>|null  $requests
     * @return list<array<string, mixed>>
     */
    public function marshalPoolMembers(?array $requests = null): array
    {
        if ($requests === null) {
            $result = $this->listPatrolRequests([
                'status' => 'Approved',
                'source_group' => (string) config('cpsqc.defaults.source_group', 'group_6'),
            ]);

            if (! $result['success']) {
                return [];
            }

            $requests = $result['data'];
        }

        $members = [];
        $seen = [];

        foreach ($requests as $request) {
            $personnel = $request['assigned_personnel'] ?? [];
            if (! is_array($personnel)) {
                continue;
            }

            $requestId = (string) ($request['request_id'] ?? '');
            $eventName = (string) ($request['event_name'] ?? '');

            foreach ($personnel as $person) {
                if (! is_array($person)) {
                    continue;
                }

                $id = $person['id'] ?? null;
                if ($id === null || $id === '') {
                    continue;
                }

                $key = (string) $id;
                if (isset($seen[$key])) {
                    continue;
                }
                $seen[$key] = true;

                $name = trim((string) ($person['personnel_name'] ?? ''));
                if ($name === '') {
                    continue;
                }

                $bpsoId = trim((string) ($person['bpso_personnel_id'] ?? ''));
                $status = trim((string) ($person['status'] ?? ''));

                $members[] = [
                    'id' => is_numeric($id) ? (int) $id : $id,
                    'name' => $name,
                    'specialization' => $bpsoId !== '' ? $bpsoId : 'CPSQC Patrol',
                    'position' => $status !== '' ? $status : 'Patrol Marshal',
                    'barangay' => null,
                    'source_group' => 'cpsqc_patrol',
                    'member_kind' => 'cpsqc_patrol',
                    'bpso_personnel_id' => $bpsoId !== '' ? $bpsoId : null,
                    'patrol_request_id' => $requestId !== '' ? $requestId : null,
                    'event_name' => $eventName !== '' ? $eventName : null,
                ];
            }
        }

        usort($members, fn ($a, $b) => strcasecmp((string) $a['name'], (string) $b['name']));

        return $members;
    }

    /**
     * Build a patrol request payload from exercise-plan form input + config defaults.
     *
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    public function buildRequestPayload(array $input): array
    {
        $defaults = config('cpsqc.defaults', []);

        return array_filter([
            'source' => $input['source'] ?? ($defaults['source'] ?? 'partner_api'),
            'source_group' => $input['source_group'] ?? ($defaults['source_group'] ?? 'group_6'),
            'source_reference_id' => $input['source_reference_id'] ?? null,
            'requesting_unit' => $input['requesting_unit'] ?? ($defaults['requesting_unit'] ?? 'Disaster Preparedness Training'),
            'contact_person' => $input['contact_person'] ?? ($defaults['contact_person'] ?? 'LGU Training Admin'),
            'contact_position' => $input['contact_position'] ?? ($defaults['contact_position'] ?? null),
            'contact_number' => $input['contact_number'] ?? ($defaults['contact_number'] ?? ''),
            'contact_email' => $input['contact_email'] ?? ($defaults['contact_email'] ?? null),
            'event_name' => $input['event_name'] ?? '',
            'event_date' => $input['event_date'] ?? '',
            'event_start_time' => $input['event_start_time'] ?? '',
            'event_end_time' => $input['event_end_time'] ?? null,
            'event_location' => $input['event_location'] ?? '',
            'patrols_needed' => (int) ($input['patrols_needed'] ?? 1),
            'event_description' => $input['event_description'] ?? null,
            'special_instructions' => $input['special_instructions'] ?? null,
        ], fn ($value) => $value !== null && $value !== '');
    }

    private function http()
    {
        $request = Http::timeout((int) config('cpsqc.api.timeout', 30))
            ->acceptJson()
            ->asJson();

        $key = trim((string) config('cpsqc.api.key', ''));
        if ($key !== '') {
            $request = $request
                ->withHeaders(['X-API-Key' => $key])
                ->withToken($key);
        }

        return $request;
    }

    private function url(string $path): string
    {
        $base = rtrim((string) config('cpsqc.api.base_url'), '/');
        $path = '/'.ltrim($path, '/');

        return $base.$path;
    }

    /**
     * @param  mixed  $json
     * @return array<string, mixed>
     */
    private function decodeBody(string $raw, mixed $json): array
    {
        if (is_array($json)) {
            return $json;
        }

        $decoded = json_decode($raw, true);

        return is_array($decoded) ? $decoded : ['raw' => $raw];
    }

    /**
     * @return array{success: bool, request_id: ?string, response: ?array<string, mixed>, error: ?string}
     */
    private function fail(string $error): array
    {
        return [
            'success' => false,
            'request_id' => null,
            'response' => null,
            'error' => $error,
        ];
    }
}
