<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CampaignRequest;
use App\Services\SimulationEventPlanningService;
use Illuminate\Http\Request;

class SimulationEventPlanningController extends Controller
{
    public function __construct(
        private readonly SimulationEventPlanningService $planningService,
    ) {}

    public function show(Request $request, CampaignRequest $campaignRequest)
    {
        $this->authorizeAccess();
        $campaignRequest->load(['trainingModule', 'simulationPlan', 'simulationEvent']);

        if ($campaignRequest->status !== 'approved') {
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'message' => 'Only approved campaign schedules can be used for simulation planning.',
                ], 422);
            }

            return redirect()
                ->route('admin.simulation-events.index')
                ->with('status', 'Only approved campaign schedules can be used for simulation planning.');
        }

        $detail = $this->planningService->buildDetail($campaignRequest);

        if ($request->expectsJson() || $request->ajax()) {
            return response()->json(['planning' => $detail]);
        }

        return view('app', [
            'section' => 'simulation_planning_show',
            'simulation_planning' => $detail,
            'campaign_request_id' => $campaignRequest->id,
        ]);
    }

    public function savePlan(Request $request, CampaignRequest $campaignRequest)
    {
        $this->authorizeAccess();

        $data = $request->validate([
            'exercise_type' => ['nullable', 'string', 'in:Drill,Functional Exercise,Full-Scale Exercise'],
            'exercise_complexity' => ['nullable', 'string', 'in:Low,Medium,High'],
            'estimated_duration' => ['nullable', 'string', 'in:30 Minutes,1 Hour,2 Hours,Half Day,Whole Day'],
            'estimated_responders' => ['nullable', 'integer', 'min:0'],
            'estimated_observers' => ['nullable', 'integer', 'min:0'],
            'estimated_evaluators' => ['nullable', 'integer', 'min:0'],
            'simulation_title' => ['nullable', 'string', 'max:255'],
            'simulation_scenario' => ['nullable', 'string', 'max:255'],
            'simulation_objectives' => ['nullable', 'string'],
            'simulation_description' => ['nullable', 'string'],
            'event_date' => ['nullable', 'date'],
            'start_time' => ['nullable', 'string', 'max:20'],
            'end_time' => ['nullable', 'string', 'max:20'],
            'venue' => ['nullable', 'string', 'max:255'],
            'team_assignments' => ['nullable', 'array'],
            'lead_coordinator' => ['nullable', 'string', 'max:255'],
            'planning_officer' => ['nullable', 'string', 'max:255'],
            'medical_team' => ['nullable', 'string'],
            'rescue_team' => ['nullable', 'string'],
            'communication_team' => ['nullable', 'string'],
            'team_leader' => ['nullable', 'string', 'max:255'],
            'required_equipment' => ['nullable', 'string'],
            'required_resources' => ['nullable', 'string'],
            'safety_officer' => ['nullable', 'string', 'max:255'],
            'assembly_area' => ['nullable', 'string', 'max:255'],
            'evacuation_route' => ['nullable', 'string'],
            'evaluation_criteria' => ['nullable', 'string'],
            'emergency_contact_person' => ['nullable', 'string', 'max:255'],
            'remarks' => ['nullable', 'string'],
            'additional_notes' => ['nullable', 'string'],
        ]);

        $plan = $this->planningService->savePlan($campaignRequest, $data, portal_id());

        return response()->json([
            'success' => true,
            'message' => 'Simulation plan saved successfully.',
            'plan' => $plan->fresh(),
            'planning' => $this->planningService->buildDetail($campaignRequest->fresh(['trainingModule', 'simulationPlan', 'simulationEvent'])),
        ]);
    }

    public function generateEvent(Request $request, CampaignRequest $campaignRequest)
    {
        $this->authorizeAccess();

        try {
            $event = $this->planningService->generateSimulationEvent($campaignRequest, portal_id());
        } catch (\Throwable $exception) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Simulation event generated successfully.',
            'simulation_event_id' => $event->id,
            'redirect' => '/admin/simulation-events/'.$event->id,
            'planning' => $this->planningService->buildDetail($campaignRequest->fresh(['trainingModule', 'simulationPlan', 'simulationEvent'])),
        ]);
    }

    public function generateAiDraft(Request $request, CampaignRequest $campaignRequest)
    {
        $this->authorizeAccess();

        $data = $request->validate([
            'exercise_type' => ['required', 'string', 'in:Drill,Functional Exercise,Full-Scale Exercise'],
            'simulation_scenario' => ['required', 'string', 'max:255'],
            'objective_count' => ['nullable', 'integer', 'min:3', 'max:8'],
        ]);

        try {
            $draft = $this->planningService->generateAiPlanningDraft($campaignRequest, $data);
        } catch (\Throwable $exception) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage() ?: 'Could not generate AI draft.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'AI draft generated successfully.',
            'draft' => $draft,
        ]);
    }

    public function trainingSummary(Request $request, CampaignRequest $campaignRequest)
    {
        $this->authorizeAccess();
        abort_unless($campaignRequest->status === 'approved', 422, 'Only approved campaigns can be used for simulation planning.');

        $schedule = $this->planningService->serializeSchedule($campaignRequest);
        $summary = $this->planningService->buildTrainingSummaryForCampaign($campaignRequest);
        $readiness = $this->planningService->buildReadiness(
            $schedule,
            $summary,
            $this->planningService->serializePlan($campaignRequest->simulationPlan),
        );

        return response()->json([
            'success' => true,
            'training_summary' => $summary,
            'readiness' => $readiness,
            'planning' => $this->planningService->buildDetail($campaignRequest->fresh(['trainingModule', 'simulationPlan', 'simulationEvent'])),
        ]);
    }

    protected function authorizeAccess(): void
    {
        $user = portal_user();
        if (! $user) {
            abort(403);
        }
        if (! in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true)) {
            abort(403);
        }
    }
}
