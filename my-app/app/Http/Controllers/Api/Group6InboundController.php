<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Group6\Group6EventReferenceProviderInterface;
use App\Contracts\Group6\Group6InboundReceiverInterface;
use App\Http\Controllers\Controller;
use App\Models\Group6InboundRecord;
use App\Models\SimulationEvent;
use App\Services\Group6\QualifiedTrainerSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Inbound integration endpoints for Group 6's external system.
 *
 * Group 6 owns campaign planning & participant registration. These routes only
 * receive and stage their data — no duplicate business logic is implemented here.
 */
class Group6InboundController extends Controller
{
    public function __construct(
        private readonly Group6InboundReceiverInterface $receiver,
        private readonly Group6EventReferenceProviderInterface $eventReference,
        private readonly QualifiedTrainerSyncService $trainerSync,
    ) {}

    /**
     * Group 6 pushes participant registration data to us.
     *
     * POST /api/integrations/group6/participants
     */
    public function receiveParticipants(Request $request): JsonResponse
    {
        if (! config('group6.enabled')) {
            return $this->integrationDisabled();
        }

        $data = $request->validate([
            'participants' => ['required', 'array'],
        ]);

        $record = $this->receiver->receive(
            Group6InboundRecord::TYPE_PARTICIPANTS,
            $data,
            $request->header('X-Group6-Batch-Id'),
        );

        return response()->json([
            'success' => true,
            'message' => 'Participant data received and staged for processing.',
            'inbound_record_id' => $record->id,
            'status' => $record->status,
        ], 202);
    }

    /**
     * Group 6 pushes trainer data to us.
     *
     * POST /api/integrations/group6/trainers
     */
    public function receiveTrainers(Request $request): JsonResponse
    {
        if (! config('group6.enabled')) {
            return $this->integrationDisabled();
        }

        $data = $request->validate([
            'trainers' => ['required', 'array'],
        ]);

        $record = $this->receiver->receive(
            Group6InboundRecord::TYPE_TRAINERS,
            $data,
            $request->header('X-Group6-Batch-Id'),
        );

        $processResult = $this->trainerSync->processInboundRecord($record);

        return response()->json([
            'success' => $processResult['success'],
            'message' => $processResult['message'],
            'inbound_record_id' => $record->id,
            'status' => $record->fresh()->status,
            'synced' => $processResult['synced'],
        ], $processResult['success'] ? 200 : 422);
    }

    /**
     * Optional: Group 6 fetches minimal event references to link registrations.
     *
     * GET /api/integrations/group6/event-references
     */
    public function listEventReferences(Request $request): JsonResponse
    {
        if (! config('group6.enabled')) {
            return $this->integrationDisabled();
        }

        $events = SimulationEvent::query()
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->orderBy('event_date')
            ->get()
            ->map(fn (SimulationEvent $event) => $this->eventReference->referenceFor($event));

        return response()->json([
            'success' => true,
            'events' => $events->values(),
        ]);
    }

    protected function integrationDisabled(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Group 6 integration is not enabled on this server.',
        ], 503);
    }
}
