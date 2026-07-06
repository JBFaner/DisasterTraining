<?php

namespace App\Http\Controllers;

use App\Models\SimulationEvent;
use App\Services\AuditLogger;
use App\Services\SimulationEventLifecycleService;
use Illuminate\Http\Request;

class SimulationEventLifecycleController extends Controller
{
    public function __construct(
        protected SimulationEventLifecycleService $lifecycle
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
