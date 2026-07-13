<?php

namespace App\Support;

use App\Http\Controllers\Admin\CampaignRequestController;
use App\Models\CampaignRequest;
use App\Models\TrainingModule;

/**
 * Finalized import contract from Campaign Planning into Simulation Event Planning.
 */
class SimulationPlanningCampaignImport
{
    /**
     * @return array<string, mixed>
     */
    public static function fromCampaignRequest(CampaignRequest $request): array
    {
        $planning = CampaignRequestController::campaignPlanningFieldsFromPayload($request->payload);
        $module = $request->trainingModule;
        $targetAudience = $planning['target_audience'] ?? [];
        if (! is_array($targetAudience)) {
            $targetAudience = [];
        }

        $expectedParticipants = (int) ($request->expected_participants ?? $planning['expected_participants'] ?? 0);
        $minimumQualified = (int) ($request->minimum_qualified_participants ?? 0);
        if ($minimumQualified <= 0 && $expectedParticipants > 0) {
            $minimumQualified = (int) max(1, round($expectedParticipants * 0.67));
        }

        return [
            'campaign_id' => $request->id,
            'campaign_request_id' => $request->id,
            'campaign_title' => (string) ($planning['training_title'] ?? $module?->title ?? '—'),
            'training_module_id' => (int) $request->training_module_id,
            'training_title' => (string) ($module?->title ?? $planning['training_title'] ?? '—'),
            'recommended_community' => self::resolveRecommendedCommunity($planning),
            'target_audience' => array_values($targetAudience),
            'target_audience_label' => $targetAudience !== []
                ? implode(', ', $targetAudience)
                : '—',
            'expected_participants' => $expectedParticipants > 0 ? $expectedParticipants : null,
            'minimum_qualified_participants' => $minimumQualified > 0 ? $minimumQualified : null,
            'registration_deadline' => $planning['registration_deadline'] ?? null,
            'training_completion_deadline' => $planning['training_completion_deadline'] ?? null,
            'maximum_participants' => self::resolveMaximumParticipants($planning, $expectedParticipants),
            'campaign_status' => 'Approved',
            'approved_at' => $request->approved_at?->toIso8601String(),
            'disaster_type' => self::resolveDisasterType($module, $planning),
            'simulation_plan_status' => self::resolvePlanStatus($request),
            'simulation_event_id' => $request->simulation_event_id,
        ];
    }

    /**
     * @param  array<string, mixed>  $planning
     */
    public static function resolveRecommendedCommunity(array $planning): string
    {
        $recommended = $planning['recommended_communities'] ?? null;
        if (is_array($recommended) && is_array($recommended['communities'] ?? null)) {
            $first = $recommended['communities'][0] ?? null;
            if (is_array($first)) {
                return (string) ($first['barangay_name'] ?? '—');
            }
        }

        return '—';
    }

    /**
     * @param  array<string, mixed>  $planning
     */
    protected static function resolveDisasterType(?TrainingModule $module, array $planning): string
    {
        $hazard = $module?->related_hazard ?? $module?->category ?? null;
        if (is_string($hazard) && trim($hazard) !== '') {
            return trim($hazard);
        }

        $recommended = $planning['recommended_communities'] ?? null;
        if (is_array($recommended) && is_array($recommended['communities'][0] ?? null)) {
            $related = $recommended['communities'][0]['related_hazard'] ?? null;
            if (is_string($related) && trim($related) !== '') {
                return trim($related);
            }
        }

        return '—';
    }

    /**
     * @param  array<string, mixed>  $planning
     */
    protected static function resolveMaximumParticipants(array $planning, int $expectedParticipants): ?int
    {
        $maximum = (int) ($planning['maximum_participants'] ?? 0);

        if ($maximum > 0) {
            return $maximum;
        }

        return $expectedParticipants > 0 ? $expectedParticipants : null;
    }

    protected static function resolvePlanStatus(CampaignRequest $request): string
    {
        if ($request->simulation_event_id) {
            return 'Generated';
        }

        $status = $request->simulationPlan?->status ?? 'not_created';

        return match ($status) {
            'saved' => 'Saved',
            'generated' => 'Generated',
            'not_created' => 'Not Yet Created',
            default => ucfirst((string) $status),
        };
    }
}
