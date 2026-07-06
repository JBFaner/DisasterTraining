<?php

namespace App\Services\Group6;

use App\Contracts\Group6\Group6ApiClientInterface;
use App\Models\Group6InboundRecord;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ParticipantSyncService
{
    public function __construct(
        private readonly Group6ApiClientInterface $apiClient,
    ) {}

    /**
     * @return array{success: bool, synced: int, message: ?string}
     */
    public function syncFromApi(): array
    {
        $result = $this->apiClient->fetchParticipants();

        if (! $result['success']) {
            return [
                'success' => false,
                'synced' => 0,
                'message' => $result['error'] ?? 'Failed to fetch participants from the Community Registration & Campaign Management System.',
            ];
        }

        $synced = $this->upsertParticipants($result['records'] ?? []);

        return [
            'success' => true,
            'synced' => $synced,
            'message' => "Synced {$synced} participant record(s) from the Community Registration & Campaign Management System.",
        ];
    }

    /**
     * @return array{success: bool, synced: int, message: string}
     */
    public function processInboundRecord(Group6InboundRecord $record): array
    {
        if ($record->record_type !== Group6InboundRecord::TYPE_PARTICIPANTS) {
            return [
                'success' => false,
                'synced' => 0,
                'message' => 'Inbound record is not a participant payload.',
            ];
        }

        try {
            $participants = $record->payload['participants'] ?? $record->payload ?? [];
            $synced = $this->upsertParticipants(is_array($participants) ? $participants : []);

            $record->update([
                'status' => Group6InboundRecord::STATUS_PROCESSED,
                'processed_at' => now(),
                'error_message' => null,
            ]);

            return [
                'success' => true,
                'synced' => $synced,
                'message' => "Processed {$synced} participant record(s) from inbound payload.",
            ];
        } catch (\Throwable $e) {
            $record->update([
                'status' => Group6InboundRecord::STATUS_FAILED,
                'error_message' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'synced' => 0,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $records
     */
    public function upsertParticipants(array $records): int
    {
        $synced = 0;
        $now = now();

        foreach ($records as $record) {
            if (! is_array($record)) {
                continue;
            }

            $externalId = $this->stringValue($record, ['external_id', 'id', 'participant_id', 'group6_id', 'registration_id']);
            $email = $this->stringValue($record, ['email', 'email_address']);
            $name = $this->stringValue($record, ['name', 'full_name', 'participant_name']);

            if (! $email && ! $externalId) {
                continue;
            }

            $attributes = [
                'name' => $name ?: 'Participant',
                'email' => $email ?: $this->placeholderEmail($externalId),
                'phone' => $this->stringValue($record, ['phone', 'contact_number', 'mobile']),
                'barangay' => $this->stringValue($record, ['barangay', 'barangay_name']),
                'city' => $this->stringValue($record, ['city', 'municipality', 'municipality_city']),
                'province' => $this->stringValue($record, ['province']),
                'status' => $this->normalizeStatus($record),
                'role' => 'PARTICIPANT',
                'group6_external_id' => $externalId,
                'last_synced_at' => $now,
                'registered_at' => $now,
            ];

            $participantId = $this->stringValue($record, ['participant_code', 'local_participant_id']);
            if ($participantId) {
                $attributes['participant_id'] = $participantId;
            }

            $user = null;
            if ($externalId) {
                $user = User::where('group6_external_id', $externalId)->first();
            }
            if (! $user && $email) {
                $user = User::where('email', $email)->where('role', 'PARTICIPANT')->first();
            }

            if ($user) {
                $user->update(Arr::except($attributes, ['email', 'role', 'registered_at']));
            } else {
                User::create(array_merge($attributes, [
                    'password' => Hash::make(Str::random(32)),
                    'participant_id' => $attributes['participant_id'] ?? $this->generateParticipantId(),
                ]));
            }

            $synced++;
        }

        return $synced;
    }

    protected function stringValue(array $record, array $keys): ?string
    {
        foreach ($keys as $key) {
            $value = $record[$key] ?? null;
            if (is_string($value) && trim($value) !== '') {
                return trim($value);
            }
        }

        return null;
    }

    protected function normalizeStatus(array $record): string
    {
        $status = strtolower((string) ($record['status'] ?? 'active'));

        return in_array($status, ['active', 'inactive'], true) ? $status : 'active';
    }

    protected function placeholderEmail(?string $externalId): string
    {
        $slug = $externalId ? preg_replace('/[^a-zA-Z0-9_-]/', '', $externalId) : Str::random(8);

        return "participant.{$slug}@group6.local";
    }

    protected function generateParticipantId(): string
    {
        do {
            $id = 'PART-'.strtoupper(Str::random(8));
        } while (User::where('participant_id', $id)->exists());

        return $id;
    }
}
