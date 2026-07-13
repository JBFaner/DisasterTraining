<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CampaignRequest;
use App\Services\SimulationEventPlanningService;
use App\Support\SimulationPlanningCampaignImport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Outbound-facing API for Simulation Event Planning consumers.
 *
 * Exposes approved campaigns imported from Campaign Planning with training readiness data.
 */
class Group6SimulationPlanningController extends Controller
{
    public function __construct(
        private readonly SimulationEventPlanningService $planningService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        if (! config('group6.enabled')) {
            return $this->integrationDisabled();
        }

        $campaigns = CampaignRequest::query()
            ->with(['trainingModule', 'simulationPlan', 'simulationEvent'])
            ->where('status', 'approved')
            ->orderByDesc('approved_at')
            ->orderByDesc('id')
            ->get()
            ->map(fn (CampaignRequest $item) => $this->serializeApprovedCampaign($item));

        return response()->json([
            'success' => true,
            'approved_campaigns' => $campaigns->values(),
        ]);
    }

    public function show(CampaignRequest $campaignRequest): JsonResponse
    {
        if (! config('group6.enabled')) {
            return $this->integrationDisabled();
        }

        abort_unless($campaignRequest->status === 'approved', 404, 'Approved campaign not found.');

        $campaignRequest->load(['trainingModule', 'simulationPlan', 'simulationEvent']);

        return response()->json([
            'success' => true,
            'approved_campaign' => $this->serializeApprovedCampaign($campaignRequest, includeWorkspace: true),
        ]);
    }

    public function trainingSummary(CampaignRequest $campaignRequest): JsonResponse
    {
        if (! config('group6.enabled')) {
            return $this->integrationDisabled();
        }

        abort_unless($campaignRequest->status === 'approved', 404, 'Approved campaign not found.');

        $schedule = $this->planningService->serializeSchedule($campaignRequest);
        $summary = $this->planningService->buildTrainingSummaryForCampaign($campaignRequest);
        $readiness = $this->planningService->buildReadiness(
            $schedule,
            $summary,
            $this->planningService->serializePlan($campaignRequest->simulationPlan),
        );

        return response()->json([
            'success' => true,
            'campaign_id' => $campaignRequest->id,
            'training_module_id' => $campaignRequest->training_module_id,
            'training_summary' => $summary,
            'readiness' => [
                'registration_deadline_passed' => $readiness['registration_deadline_passed'] ?? false,
                'qualified_participants' => $readiness['qualified_participants'] ?? 0,
                'minimum_qualified_participants' => $readiness['minimum_qualified_participants'] ?? 0,
                'can_generate' => $readiness['can_generate'] ?? false,
                'validation_messages' => $readiness['validation_messages'] ?? [],
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeApprovedCampaign(CampaignRequest $campaignRequest, bool $includeWorkspace = false): array
    {
        $import = SimulationPlanningCampaignImport::fromCampaignRequest($campaignRequest);
        $summary = $this->planningService->buildTrainingSummaryForCampaign($campaignRequest);
        $readiness = $this->planningService->buildReadiness(
            $import,
            $summary,
            $this->planningService->serializePlan($campaignRequest->simulationPlan),
        );

        $payload = [
            'campaign' => $import,
            'training_summary' => $summary,
            'readiness' => [
                'registration_deadline_passed' => $readiness['registration_deadline_passed'] ?? false,
                'qualified_participants' => $readiness['qualified_participants'] ?? 0,
                'minimum_qualified_participants' => $readiness['minimum_qualified_participants'] ?? 0,
                'can_generate' => $readiness['can_generate'] ?? false,
                'validation_messages' => $readiness['validation_messages'] ?? [],
            ],
        ];

        if ($includeWorkspace) {
            $payload['planning_workspace'] = $this->planningService->serializePlanningWorkspace($campaignRequest);
        }

        return $payload;
    }

    protected function integrationDisabled(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Group 6 integration is not enabled on this server.',
        ], 503);
    }
}
