<?php

namespace App\Http\Controllers;

use App\Models\EventEquipmentRequest;
use App\Models\SimulationEvent;
use App\Services\AuditLogger;
use App\Services\EventEquipmentRequestService;
use App\Services\SimulationEventLifecycleService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class EventEquipmentRequestController extends Controller
{
    public function __construct(
        protected EventEquipmentRequestService $equipmentRequests,
        protected SimulationEventLifecycleService $lifecycle,
    ) {}

    public function index(SimulationEvent $simulationEvent)
    {
        $this->authorizeEventAccess();

        return response()->json([
            'success' => true,
            'requests' => $this->equipmentRequests->serializeForEvent($simulationEvent),
            'inventory' => $this->equipmentRequests->inventoryOptions(),
            'lifecycle' => $this->lifecycle->buildPayload($simulationEvent->fresh()),
        ]);
    }

    public function store(Request $request, SimulationEvent $simulationEvent)
    {
        $this->authorizeEventAccess();
        $this->authorizeTrainer();

        $data = $request->validate([
            'notes' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.resource_id' => ['required', 'integer', 'exists:resources,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:9999'],
            'items.*.notes' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $created = $this->equipmentRequests->submit(
                $simulationEvent,
                (int) portal_id(),
                $data['items'],
                $data['notes'] ?? null,
            );
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => collect($e->errors())->flatten()->first() ?: 'Could not submit equipment request.',
                'errors' => $e->errors(),
            ], 422);
        }

        AuditLogger::log([
            'action' => 'Submitted event equipment request',
            'module' => 'Resources',
            'status' => 'success',
            'description' => "Event #{$simulationEvent->id} request #{$created->id}",
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Equipment request submitted for admin approval.',
            'request' => $this->equipmentRequests->serializeRequest($created),
            'lifecycle' => $this->lifecycle->buildPayload($simulationEvent->fresh()),
        ], 201);
    }

    public function approve(SimulationEvent $simulationEvent, EventEquipmentRequest $equipmentRequest)
    {
        $this->authorizeEventAccess();
        $this->authorizeAdmin();
        $this->assertBelongsToEvent($simulationEvent, $equipmentRequest);

        try {
            $approved = $this->equipmentRequests->approve($equipmentRequest, (int) portal_id());
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => collect($e->errors())->flatten()->first() ?: 'Could not approve request.',
                'errors' => $e->errors(),
            ], 422);
        }

        AuditLogger::log([
            'action' => 'Approved event equipment request',
            'module' => 'Resources',
            'status' => 'success',
            'description' => "Request #{$approved->id} for event #{$simulationEvent->id}",
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Request approved. Stock reserved for this event.',
            'request' => $this->equipmentRequests->serializeRequest($approved),
            'lifecycle' => $this->lifecycle->buildPayload($simulationEvent->fresh()),
        ]);
    }

    public function reject(Request $request, SimulationEvent $simulationEvent, EventEquipmentRequest $equipmentRequest)
    {
        $this->authorizeEventAccess();
        $this->authorizeAdmin();
        $this->assertBelongsToEvent($simulationEvent, $equipmentRequest);

        $data = $request->validate([
            'rejection_reason' => ['nullable', 'string', 'max:2000'],
        ]);

        try {
            $rejected = $this->equipmentRequests->reject(
                $equipmentRequest,
                (int) portal_id(),
                $data['rejection_reason'] ?? null,
            );
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => collect($e->errors())->flatten()->first() ?: 'Could not reject request.',
                'errors' => $e->errors(),
            ], 422);
        }

        AuditLogger::log([
            'action' => 'Rejected event equipment request',
            'module' => 'Resources',
            'status' => 'success',
            'description' => "Request #{$rejected->id} for event #{$simulationEvent->id}",
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Equipment request rejected.',
            'request' => $this->equipmentRequests->serializeRequest($rejected),
            'lifecycle' => $this->lifecycle->buildPayload($simulationEvent->fresh()),
        ]);
    }

    protected function assertBelongsToEvent(SimulationEvent $event, EventEquipmentRequest $request): void
    {
        abort_unless((int) $request->simulation_event_id === (int) $event->id, 404);
    }

    protected function authorizeTrainer(): void
    {
        $user = portal_user();
        abort_unless($user && $user->role === 'LGU_TRAINER', 403, 'Only trainers can submit equipment requests.');
    }

    protected function authorizeAdmin(): void
    {
        $user = portal_user();
        abort_unless($user && $user->role === 'LGU_ADMIN', 403, 'Only LGU admins can approve or reject equipment requests.');
    }

    protected function authorizeEventAccess(): void
    {
        $user = portal_user();
        abort_unless($user && in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true), 403);
    }
}
