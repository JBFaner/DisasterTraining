<?php

namespace App\Services\Group6;

use App\Contracts\Group6\Group6ApiClientInterface;
use App\Models\Group6InboundRecord;
use App\Models\QualifiedTrainer;
use Illuminate\Support\Arr;

class QualifiedTrainerSyncService
{
    public function __construct(
        private readonly Group6ApiClientInterface $apiClient,
    ) {}

    /**
     * Pull trainers from the Community Engagement System API and upsert into the local directory.
     *
     * @return array{success: bool, synced: int, message: ?string}
     */
    public function syncFromApi(): array
    {
        $result = $this->apiClient->fetchTrainers();

        if (! $result['success']) {
            return [
                'success' => false,
                'synced' => 0,
                'message' => $result['error'] ?? 'Failed to fetch trainers from the Community Engagement System.',
            ];
        }

        $synced = $this->upsertTrainers($result['records'] ?? []);

        return [
            'success' => true,
            'synced' => $synced,
            'message' => "Synced {$synced} trainer record(s) from the Community Engagement System.",
        ];
    }

    /**
     * Process a staged inbound trainer payload from Group 6 webhook.
     *
     * @return array{success: bool, synced: int, message: string}
     */
    public function processInboundRecord(Group6InboundRecord $record): array
    {
        if ($record->record_type !== Group6InboundRecord::TYPE_TRAINERS) {
            return [
                'success' => false,
                'synced' => 0,
                'message' => 'Inbound record is not a trainer payload.',
            ];
        }

        try {
            $trainers = $record->payload['trainers'] ?? $record->payload ?? [];
            $synced = $this->upsertTrainers(is_array($trainers) ? $trainers : []);

            $record->update([
                'status' => Group6InboundRecord::STATUS_PROCESSED,
                'processed_at' => now(),
                'error_message' => null,
            ]);

            return [
                'success' => true,
                'synced' => $synced,
                'message' => "Processed {$synced} trainer record(s) from inbound payload.",
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
    public function upsertTrainers(array $records): int
    {
        $synced = 0;
        $now = now();

        foreach ($records as $record) {
            if (! is_array($record)) {
                continue;
            }

            $externalId = $this->stringValue($record, ['external_id', 'id', 'trainer_id', 'group6_id']);
            $name = $this->stringValue($record, ['name', 'full_name', 'trainer_name']);

            if ($name === null && $externalId === null) {
                continue;
            }

            $attributes = [
                'name' => $name ?? 'Unnamed Trainer',
                'email' => $this->stringValue($record, ['email']),
                'phone' => $this->stringValue($record, ['phone', 'contact_number', 'mobile']),
                'specialization' => $this->stringValue($record, ['specialization', 'specialty', 'expertise']),
                'barangay' => $this->stringValue($record, ['barangay', 'barangay_name']),
                'certifications' => $this->arrayValue($record, ['certifications', 'qualifications']),
                'qualified_at' => $this->dateValue($record, ['qualified_at', 'certified_at']),
                'last_synced_at' => $now,
                'metadata' => Arr::except($record, [
                    'external_id', 'id', 'trainer_id', 'group6_id',
                    'name', 'full_name', 'trainer_name',
                    'email', 'phone', 'contact_number', 'mobile',
                    'specialization', 'specialty', 'expertise',
                    'barangay', 'barangay_name',
                    'certifications', 'qualifications',
                    'qualified_at', 'certified_at', 'status',
                ]),
            ];

            $status = $this->stringValue($record, ['status']);
            if ($status !== null) {
                $attributes['status'] = in_array($status, ['active', 'inactive'], true) ? $status : QualifiedTrainer::STATUS_ACTIVE;
            }

            if ($externalId !== null) {
                QualifiedTrainer::updateOrCreate(
                    ['group6_external_id' => $externalId],
                    $attributes,
                );
            } else {
                QualifiedTrainer::create(array_merge($attributes, [
                    'status' => $attributes['status'] ?? QualifiedTrainer::STATUS_ACTIVE,
                ]));
            }

            $synced++;
        }

        return $synced;
    }

    /**
     * @param  array<string, mixed>  $record
     * @param  array<int, string>  $keys
     */
    private function stringValue(array $record, array $keys): ?string
    {
        foreach ($keys as $key) {
            $value = $record[$key] ?? null;
            if ($value !== null && $value !== '') {
                return (string) $value;
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $record
     * @param  array<int, string>  $keys
     * @return array<int, mixed>|null
     */
    private function arrayValue(array $record, array $keys): ?array
    {
        foreach ($keys as $key) {
            $value = $record[$key] ?? null;
            if (is_array($value)) {
                return $value;
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $record
     * @param  array<int, string>  $keys
     */
    private function dateValue(array $record, array $keys): ?\Illuminate\Support\Carbon
    {
        foreach ($keys as $key) {
            $value = $record[$key] ?? null;
            if ($value) {
                return \Illuminate\Support\Carbon::parse($value);
            }
        }

        return null;
    }
}
