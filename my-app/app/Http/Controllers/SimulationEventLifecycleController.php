<?php

namespace App\Http\Controllers;

use App\Models\SimulationEvent;
use App\Services\AuditLogger;
use App\Services\SimulationEventLifecycleService;
use Illuminate\Http\Request;

class SimulationEventLifecycleController extends Controller
{
    public function __construct(
        protected SimulationEventLifecycleService $lifecycle,
        protected \App\Services\Cpsqc\CpsqcPatrolApiClient $cpsqcClient,
    ) {}

    public function show(SimulationEvent $simulationEvent)
    {
        $this->authorizeEventAccess();

        return response()->json([
            'lifecycle' => $this->lifecycle->buildPayload($simulationEvent),
        ]);
    }

    public function updateReadiness(Request $request, SimulationEvent $simulationEvent)
    {
        $this->authorizeEventAccess();

        $data = $request->validate([
            'venue_confirmed' => ['nullable', 'boolean'],
            'schedule_confirmed' => ['nullable', 'boolean'],
        ]);

        $confirmations = $simulationEvent->readiness_confirmations ?? [];

        foreach (['venue_confirmed', 'schedule_confirmed'] as $field) {
            if (array_key_exists($field, $data)) {
                $confirmations[$field] = (bool) $data[$field];
            }
        }

        $simulationEvent->update([
            'readiness_confirmations' => $confirmations,
            'updated_by' => portal_id(),
        ]);

        return response()->json([
            'success' => true,
            'lifecycle' => $this->lifecycle->buildPayload($simulationEvent->fresh()),
        ]);
    }

    public function requestCpsqcPatrol(Request $request, SimulationEvent $simulationEvent)
    {
        $this->authorizeEventAccess();

        $defaults = $this->lifecycle->buildCpsqcPayload($simulationEvent)['request_defaults'] ?? [];

        $data = $request->validate([
            'event_name' => ['nullable', 'string', 'max:255'],
            'event_date' => ['nullable', 'date_format:Y-m-d'],
            'event_start_time' => ['nullable', 'string', 'max:8'],
            'event_end_time' => ['nullable', 'string', 'max:8'],
            'event_location' => ['nullable', 'string', 'max:500'],
            'patrols_needed' => ['nullable', 'integer', 'min:1', 'max:50'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:50'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'special_instructions' => ['nullable', 'string', 'max:2000'],
        ]);

        $payload = $this->cpsqcClient->buildRequestPayload([
            ...$defaults,
            ...array_filter($data, fn ($value) => $value !== null && $value !== ''),
            'source_reference_id' => $this->lifecycle->cpsqcSourceReference($simulationEvent),
        ]);

        $result = $this->cpsqcClient->submitPatrolRequest($payload);
        if (! $result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['error'] ?? 'Failed to submit patrol request to CPSQC.',
                'response' => $result['response'],
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Patrol request sent to CPSQC.',
            'request_id' => $result['request_id'],
            'lifecycle' => $this->lifecycle->buildPayload($simulationEvent->fresh()),
        ]);
    }

    public function listCpsqcPatrolRequests(SimulationEvent $simulationEvent)
    {
        $this->authorizeEventAccess();

        return response()->json([
            'success' => true,
            'lifecycle' => $this->lifecycle->buildPayload($simulationEvent),
            'cpsqc' => $this->lifecycle->buildCpsqcPayload($simulationEvent),
        ]);
    }

    public function refreshCpsqcMarshals(SimulationEvent $simulationEvent)
    {
        $this->authorizeEventAccess();

        if (! $this->cpsqcClient->isConfigured()) {
            return response()->json([
                'success' => false,
                'message' => 'CPSQC integration is not configured.',
                'lifecycle' => $this->lifecycle->buildPayload($simulationEvent),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'lifecycle' => $this->lifecycle->buildPayload($simulationEvent->fresh()),
            'cpsqc' => $this->lifecycle->buildCpsqcPayload($simulationEvent->fresh()),
        ]);
    }

    public function saveEventPersonnelAssignments(Request $request, SimulationEvent $simulationEvent)
    {
        $this->authorizeEventAccess();

        $data = $request->validate([
            'assignments' => ['required', 'array'],
            'assignments.*.role' => ['required', 'string', 'max:255'],
            'assignments.*.source_group' => ['nullable', 'string', 'max:255'],
            'assignments.*.person_name' => ['required', 'string', 'max:255'],
            'assignments.*.person_external_id' => ['nullable', 'string', 'max:255'],
            'assignments.*.bpso_personnel_id' => ['nullable', 'string', 'max:255'],
            'assignments.*.patrol_request_id' => ['nullable', 'string', 'max:255'],
            'assignments.*.notes' => ['nullable', 'string'],
        ]);

        $event = $this->lifecycle->syncEventPersonnelAssignments($simulationEvent, $data['assignments']);

        return response()->json([
            'success' => true,
            'message' => 'Event personnel assignments saved.',
            'lifecycle' => $this->lifecycle->buildPayload($event),
        ]);
    }

    public function completeStep(Request $request, SimulationEvent $simulationEvent, string $step)
    {
        $this->authorizeEventAccess();

        if ($simulationEvent->status !== 'ongoing') {
            return response()->json([
                'success' => false,
                'message' => 'Execution steps can only be updated while the simulation is ongoing.',
            ], 422);
        }

        $progress = $this->lifecycle->completeExecutionStep($simulationEvent->fresh(), $step);

        AuditLogger::log([
            'action' => 'Completed simulation execution step',
            'module' => 'Simulation Events',
            'status' => 'success',
            'description' => "Event: {$simulationEvent->title}; Step: {$step}",
        ]);

        return response()->json([
            'success' => true,
            'execution_progress' => $progress,
            'lifecycle' => $this->lifecycle->buildPayload($simulationEvent->fresh()),
        ]);
    }

    public function storePostEvaluation(Request $request, SimulationEvent $simulationEvent)
    {
        $this->authorizeEventAccess();

        if (! in_array($simulationEvent->status, ['completed', 'ended', 'archived'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Post-simulation evaluation is available after the event is completed.',
            ], 422);
        }

        $data = $request->validate([
            'overall_remarks' => ['nullable', 'string'],
            'success_level' => ['nullable', 'string', 'in:Excellent,Good,Fair,Poor'],
            'problems_encountered' => ['nullable', 'string'],
            'recommendations' => ['nullable', 'string'],
            'lessons_learned' => ['nullable', 'string'],
        ]);

        $payload = array_merge($this->lifecycle->normalizePostEvaluation($simulationEvent), $data, [
            'submitted_at' => now()->toIso8601String(),
        ]);

        $simulationEvent->update([
            'post_evaluation' => $payload,
            'updated_by' => portal_id(),
        ]);

        AuditLogger::log([
            'action' => 'Saved post-simulation evaluation',
            'module' => 'Simulation Events',
            'status' => 'success',
            'description' => "Event: {$simulationEvent->title}",
        ]);

        return response()->json([
            'success' => true,
            'post_evaluation' => $payload,
            'lifecycle' => $this->lifecycle->buildPayload($simulationEvent->fresh()),
        ]);
    }

    protected function authorizeEventAccess(): void
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
