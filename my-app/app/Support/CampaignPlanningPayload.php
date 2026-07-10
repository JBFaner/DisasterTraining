<?php

namespace App\Support;

use App\Models\TrainingModule;
use Illuminate\Support\Carbon;

/**
 * Data contract sent to the external Campaign Planning & Scheduling module.
 */
class CampaignPlanningPayload
{
    /**
     * @param  array<string, mixed>|null  $recommendedCommunities
     * @param  list<string>  $targetAudience
     */
    public function __construct(
        public int $trainingModuleId,
        public string $trainingTitle,
        public ?string $shortDescription,
        public ?array $recommendedCommunities,
        public array $targetAudience,
        public ?string $registrationOpens,
        public ?string $registrationDeadline,
        public ?string $trainingCompletionDeadline,
        public ?int $expectedParticipants,
        public ?int $maximumParticipants,
        public ?string $registrationLink,
        public string $publishedStatus,
        public bool $registrationEnabled,
    ) {}

    public static function fromTrainingModule(
        TrainingModule $module,
        ?array $recommendedCommunities = null,
        ?string $registrationLink = null,
    ): self {
        return new self(
            trainingModuleId: (int) $module->id,
            trainingTitle: (string) $module->title,
            shortDescription: self::resolveShortDescription($module),
            recommendedCommunities: $recommendedCommunities ?? self::emptyRecommendedCommunities(),
            targetAudience: array_values($module->target_audience ?? []),
            registrationOpens: self::formatDateTime($module->campaign_registration_opens),
            registrationDeadline: self::formatDateTime($module->campaign_registration_deadline),
            trainingCompletionDeadline: self::formatDateTime($module->campaign_training_completion_deadline),
            expectedParticipants: self::resolveExpectedParticipants($module),
            maximumParticipants: self::resolveMaximumParticipants($module),
            registrationLink: $registrationLink,
            publishedStatus: (string) ($module->status ?? 'draft'),
            registrationEnabled: self::resolveRegistrationEnabled($module),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return array_filter([
            'training_module_id' => $this->trainingModuleId,
            'training_title' => $this->trainingTitle,
            'short_description' => $this->shortDescription,
            'recommended_communities' => $this->recommendedCommunities,
            'target_audience' => $this->targetAudience,
            'registration_opens' => $this->registrationOpens,
            'registration_deadline' => $this->registrationDeadline,
            'training_completion_deadline' => $this->trainingCompletionDeadline,
            'expected_participants' => $this->expectedParticipants,
            'maximum_participants' => $this->maximumParticipants,
            'registration_link' => $this->registrationLink,
            'registration_form_path' => $this->registrationLink ? '/participant/register' : null,
            'published_status' => $this->publishedStatus,
            'registration_enabled' => $this->registrationEnabled,
        ], fn ($value) => $value !== null);
    }

    /**
     * Normalize stored campaign request payloads for API consumers.
     * Legacy trainer/session fields are intentionally omitted.
     *
     * @return array<string, mixed>
     */
    public static function fieldsFromStoredPayload(?array $payload): array
    {
        if (! is_array($payload)) {
            return [];
        }

        $modernKeys = [
            'training_module_id',
            'training_title',
            'short_description',
            'recommended_communities',
            'target_audience',
            'registration_opens',
            'registration_deadline',
            'training_completion_deadline',
            'expected_participants',
            'maximum_participants',
            'registration_link',
            'registration_form_path',
            'published_status',
            'registration_enabled',
        ];

        $extracted = [];
        foreach ($modernKeys as $key) {
            if (array_key_exists($key, $payload)) {
                $extracted[$key] = $payload[$key];
            }
        }

        if ($extracted !== []) {
            return self::normalizeLegacyAliases($extracted, $payload);
        }

        return self::normalizeLegacyAliases([
            'training_module_id' => $payload['training_module_id'] ?? null,
            'training_title' => $payload['training_title'] ?? null,
            'short_description' => $payload['short_description'] ?? null,
            'recommended_communities' => $payload['recommended_communities'] ?? null,
            'target_audience' => $payload['target_audience']
                ?? $payload['recommended_audience']
                ?? [],
            'registration_opens' => $payload['registration_opens'] ?? null,
            'registration_deadline' => $payload['registration_deadline'] ?? null,
            'training_completion_deadline' => $payload['training_completion_deadline'] ?? null,
            'expected_participants' => self::resolveLegacyExpectedParticipants($payload),
            'maximum_participants' => self::resolveLegacyMaximumParticipants($payload),
            'registration_link' => $payload['registration_link'] ?? null,
            'registration_form_path' => $payload['registration_form_path'] ?? null,
            'published_status' => $payload['published_status'] ?? null,
            'registration_enabled' => $payload['registration_enabled'] ?? null,
        ], $payload);
    }

    /**
     * @param  array<string, mixed>  $extracted
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private static function normalizeLegacyAliases(array $extracted, array $payload): array
    {
        if (empty($extracted['recommended_communities']) && isset($payload['recommended_communities'])) {
            $extracted['recommended_communities'] = $payload['recommended_communities'];
        }

        if (($extracted['expected_participants'] ?? null) === null) {
            $extracted['expected_participants'] = self::resolveLegacyExpectedParticipants($payload);
        }

        if (($extracted['maximum_participants'] ?? null) === null) {
            $extracted['maximum_participants'] = self::resolveLegacyMaximumParticipants($payload);
        }

        if (empty($extracted['target_audience'])) {
            $extracted['target_audience'] = $payload['target_audience']
                ?? $payload['recommended_audience']
                ?? [];
        }

        return array_filter($extracted, fn ($value) => $value !== null);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private static function resolveLegacyMaximumParticipants(array $payload): ?int
    {
        $value = $payload['maximum_participants'] ?? null;

        if (is_int($value)) {
            return $value > 0 ? $value : null;
        }

        if (is_array($value)) {
            $numbers = collect($value)
                ->map(fn ($item) => (int) $item)
                ->filter(fn ($item) => $item > 0)
                ->values();

            return $numbers->isNotEmpty() ? (int) $numbers->max() : null;
        }

        $sessions = $payload['available_schedule'] ?? $payload['available_training_sessions'] ?? [];
        if (! is_array($sessions) || $sessions === []) {
            return null;
        }

        $first = is_array($sessions[0] ?? null) ? $sessions[0] : [];
        $sessionMax = (int) ($first['maximum_participants'] ?? 0);

        return $sessionMax > 0 ? $sessionMax : null;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private static function resolveLegacyExpectedParticipants(array $payload): ?int
    {
        $value = $payload['expected_participants'] ?? null;

        if (is_int($value)) {
            return $value > 0 ? $value : null;
        }

        if (is_string($value) && is_numeric($value)) {
            $number = (int) $value;
            return $number > 0 ? $number : null;
        }

        return self::resolveLegacyMaximumParticipants($payload);
    }

    private static function resolveShortDescription(TrainingModule $module): ?string
    {
        $short = trim((string) ($module->short_description ?? ''));
        if ($short !== '') {
            return $short;
        }

        $description = trim((string) ($module->description ?? ''));

        return $description !== '' ? mb_substr($description, 0, 500) : null;
    }

    private static function resolveMaximumParticipants(TrainingModule $module): ?int
    {
        $value = (int) ($module->campaign_maximum_participants ?? 0);

        return $value > 0 ? $value : null;
    }

    private static function resolveExpectedParticipants(TrainingModule $module): ?int
    {
        $value = (int) ($module->campaign_expected_participants ?? 0);

        return $value > 0 ? $value : null;
    }

    private static function resolveRegistrationEnabled(TrainingModule $module): bool
    {
        $maximum = self::resolveMaximumParticipants($module);
        $expected = self::resolveExpectedParticipants($module);

        if ($maximum !== null && $expected !== null && $expected >= $maximum) {
            return false;
        }

        return true;
    }

    private static function formatDateTime(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if ($value instanceof Carbon) {
            return $value->toIso8601String();
        }

        try {
            return Carbon::parse((string) $value)->toIso8601String();
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * @return array<string, mixed>
     */
    private static function emptyRecommendedCommunities(): array
    {
        return [
            'summary' => [
                'total_communities' => 0,
                'high_priority' => 0,
                'medium_priority' => 0,
                'low_priority' => 0,
            ],
            'communities' => [],
        ];
    }
}
