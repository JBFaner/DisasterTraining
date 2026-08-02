<?php

namespace App\Services;

use App\Models\EventEquipmentRequest;
use App\Models\EventEquipmentRequestItem;
use App\Models\Resource;
use App\Models\ResourceEventAssignment;
use App\Models\ResourceMaintenanceLog;
use App\Models\ResourceMovement;
use App\Models\SimulationEvent;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class EventEquipmentRequestService
{
    /**
     * @param  list<array{resource_id:int, quantity:int, notes?:string|null}>  $items
     */
    public function submit(SimulationEvent $event, int $requestedBy, array $items, ?string $notes = null): EventEquipmentRequest
    {
        if ($items === []) {
            throw ValidationException::withMessages([
                'items' => 'Add at least one equipment item.',
            ]);
        }

        if (in_array($event->status, ['cancelled', 'archived'], true)) {
            throw ValidationException::withMessages([
                'event' => 'Cannot request equipment for a cancelled or archived event.',
            ]);
        }

        return DB::transaction(function () use ($event, $requestedBy, $items, $notes) {
            $request = EventEquipmentRequest::create([
                'simulation_event_id' => $event->id,
                'requested_by' => $requestedBy,
                'status' => 'pending',
                'notes' => $notes,
            ]);

            $merged = [];
            foreach ($items as $row) {
                $resourceId = (int) ($row['resource_id'] ?? 0);
                $qty = (int) ($row['quantity'] ?? 0);
                if ($resourceId <= 0 || $qty <= 0) {
                    continue;
                }
                if (! isset($merged[$resourceId])) {
                    $merged[$resourceId] = [
                        'quantity' => 0,
                        'notes' => $row['notes'] ?? null,
                    ];
                }
                $merged[$resourceId]['quantity'] += $qty;
                if (! empty($row['notes'])) {
                    $merged[$resourceId]['notes'] = $row['notes'];
                }
            }

            if ($merged === []) {
                throw ValidationException::withMessages([
                    'items' => 'Add at least one valid equipment item.',
                ]);
            }

            foreach ($merged as $resourceId => $data) {
                $resource = Resource::find($resourceId);
                if (! $resource) {
                    throw ValidationException::withMessages([
                        'items' => "Resource #{$resourceId} was not found.",
                    ]);
                }

                EventEquipmentRequestItem::create([
                    'event_equipment_request_id' => $request->id,
                    'resource_id' => $resourceId,
                    'quantity_requested' => $data['quantity'],
                    'quantity_approved' => 0,
                    'status' => 'pending',
                    'notes' => $data['notes'],
                ]);

                // Plan need on event_resource (does not assign stock yet).
                $existing = $event->resources()->where('resource_id', $resourceId)->first();
                $needed = (int) ($existing?->pivot?->quantity_needed ?? 0) + $data['quantity'];
                if ($existing) {
                    $event->resources()->updateExistingPivot($resourceId, [
                        'quantity_needed' => $needed,
                        'notes' => 'From equipment request #'.$request->id,
                    ]);
                } else {
                    $event->resources()->attach($resourceId, [
                        'quantity_needed' => $data['quantity'],
                        'quantity_assigned' => 0,
                        'status' => 'Requested',
                        'notes' => 'From equipment request #'.$request->id,
                    ]);
                }
            }

            return $request->load(['items.resource', 'requester']);
        });
    }

    public function approve(EventEquipmentRequest $request, int $reviewedBy): EventEquipmentRequest
    {
        if ($request->status !== 'pending') {
            throw ValidationException::withMessages([
                'request' => 'Only pending requests can be approved.',
            ]);
        }

        $request->loadMissing(['items.resource', 'event']);
        $event = $request->event;
        if (! $event) {
            throw ValidationException::withMessages([
                'request' => 'Simulation event is missing for this request.',
            ]);
        }

        return DB::transaction(function () use ($request, $reviewedBy, $event) {
            $shortfalls = [];

            foreach ($request->items as $item) {
                /** @var Resource $resource */
                $resource = Resource::lockForUpdate()->findOrFail($item->resource_id);
                $qty = (int) $item->quantity_requested;
                $available = $resource->computeAvailableQuantity();

                if ($available < $qty) {
                    $shortfalls[] = "{$resource->name}: need {$qty}, available {$available}";
                }
            }

            if ($shortfalls !== []) {
                throw ValidationException::withMessages([
                    'stock' => 'Insufficient stock to approve: '.implode('; ', $shortfalls)
                        .'. Open a Resource Budget Proposal to procure more, or reduce quantities.',
                ]);
            }

            foreach ($request->items as $item) {
                /** @var Resource $resource */
                $resource = Resource::lockForUpdate()->findOrFail($item->resource_id);
                $qty = (int) $item->quantity_requested;

                $resource->update([
                    'reserved_quantity' => (int) ($resource->reserved_quantity ?? 0) + $qty,
                ]);
                $resource->refreshStockStatus();

                ResourceEventAssignment::updateOrCreate(
                    [
                        'resource_id' => $resource->id,
                        'event_id' => $event->id,
                    ],
                    [
                        'quantity_assigned' => $qty,
                        'status' => 'Reserved',
                        'notes' => 'Approved equipment request #'.$request->id,
                        'assigned_by' => $reviewedBy,
                        'returned_by' => null,
                        'returned_at' => null,
                    ]
                );

                ResourceMovement::create([
                    'resource_id' => $resource->id,
                    'simulation_event_id' => $event->id,
                    'requested_by' => (string) $request->requested_by,
                    'source_module' => 'Event Equipment Request',
                    'quantity' => $qty,
                    'status' => 'Reserved',
                    'notes' => 'Approved request #'.$request->id,
                ]);

                ResourceMaintenanceLog::create([
                    'resource_id' => $resource->id,
                    'action' => 'reserved_for_event',
                    'notes' => "Reserved {$qty} for event #{$event->id} (request #{$request->id})",
                    'recorded_by' => $reviewedBy,
                ]);

                $item->update([
                    'quantity_approved' => $qty,
                    'status' => 'approved',
                ]);

                $this->syncEventResourcePivot($event, $resource->id, $qty, 'Reserved');
            }

            $request->update([
                'status' => 'approved',
                'reviewed_by' => $reviewedBy,
                'reviewed_at' => now(),
                'rejection_reason' => null,
            ]);

            return $request->fresh(['items.resource', 'requester', 'reviewer']);
        });
    }

    public function reject(EventEquipmentRequest $request, int $reviewedBy, ?string $reason = null): EventEquipmentRequest
    {
        if ($request->status !== 'pending') {
            throw ValidationException::withMessages([
                'request' => 'Only pending requests can be rejected.',
            ]);
        }

        return DB::transaction(function () use ($request, $reviewedBy, $reason) {
            $request->loadMissing('items');
            foreach ($request->items as $item) {
                $item->update([
                    'status' => 'rejected',
                    'quantity_approved' => 0,
                ]);
            }

            $request->update([
                'status' => 'rejected',
                'reviewed_by' => $reviewedBy,
                'reviewed_at' => now(),
                'rejection_reason' => $reason,
            ]);

            return $request->fresh(['items.resource', 'requester', 'reviewer']);
        });
    }

    /**
     * Move Reserved assignments for the event into In Use when the simulation starts.
     */
    public function activateOnEventStart(SimulationEvent $event): void
    {
        DB::transaction(function () use ($event) {
            $assignments = ResourceEventAssignment::where('event_id', $event->id)
                ->where('status', 'Reserved')
                ->lockForUpdate()
                ->get();

            foreach ($assignments as $assignment) {
                $qty = (int) $assignment->quantity_assigned;
                if ($qty <= 0) {
                    continue;
                }

                /** @var Resource $resource */
                $resource = Resource::lockForUpdate()->find($assignment->resource_id);
                if (! $resource) {
                    continue;
                }

                $reserved = (int) ($resource->reserved_quantity ?? 0);
                $move = min($reserved, $qty);

                $resource->update([
                    'reserved_quantity' => max(0, $reserved - $move),
                    'in_use_quantity' => (int) ($resource->in_use_quantity ?? 0) + $move,
                ]);
                $resource->refreshStockStatus();

                $assignment->update([
                    'status' => 'Active',
                    'notes' => trim(($assignment->notes ? $assignment->notes.' | ' : '').'Activated on event start'),
                ]);

                ResourceMovement::create([
                    'resource_id' => $resource->id,
                    'simulation_event_id' => $event->id,
                    'requested_by' => 'Event Start',
                    'source_module' => 'Event Equipment Request',
                    'quantity' => $move,
                    'status' => 'In Use',
                    'notes' => 'Reserved stock moved to In Use on start',
                ]);

                $this->syncEventResourcePivot($event, $resource->id, $qty, 'Assigned');
            }
        });
    }

    /**
     * Return Reserved / Active / In Use assignments and restore stock buckets.
     */
    public function releaseOnEventComplete(SimulationEvent $event, ?int $actorId = null): void
    {
        DB::transaction(function () use ($event, $actorId) {
            $assignments = ResourceEventAssignment::where('event_id', $event->id)
                ->whereIn('status', ['Reserved', 'Active', 'In Use'])
                ->lockForUpdate()
                ->get();

            foreach ($assignments as $assignment) {
                $qty = (int) $assignment->quantity_assigned;
                /** @var Resource|null $resource */
                $resource = Resource::lockForUpdate()->find($assignment->resource_id);
                if (! $resource || $qty <= 0) {
                    $assignment->update([
                        'status' => 'Returned',
                        'returned_by' => $actorId,
                        'returned_at' => now(),
                    ]);
                    continue;
                }

                $status = $assignment->status;
                $reserved = (int) ($resource->reserved_quantity ?? 0);
                $inUse = (int) ($resource->in_use_quantity ?? 0);

                if ($status === 'Reserved') {
                    $resource->update([
                        'reserved_quantity' => max(0, $reserved - min($reserved, $qty)),
                    ]);
                } else {
                    // Active / In Use
                    $resource->update([
                        'in_use_quantity' => max(0, $inUse - min($inUse, $qty)),
                    ]);
                }
                $resource->refreshStockStatus();

                $assignment->update([
                    'status' => 'Returned',
                    'returned_by' => $actorId,
                    'returned_at' => now(),
                ]);

                ResourceMovement::create([
                    'resource_id' => $resource->id,
                    'simulation_event_id' => $event->id,
                    'requested_by' => $actorId ? (string) $actorId : 'Event Complete',
                    'source_module' => 'Event Equipment Request',
                    'quantity' => $qty,
                    'status' => 'Returned',
                    'notes' => 'Auto-returned on event completion',
                ]);

                $event->resources()->updateExistingPivot($resource->id, [
                    'status' => 'Returned',
                ]);
            }
        });
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function serializeForEvent(SimulationEvent $event): array
    {
        return EventEquipmentRequest::query()
            ->where('simulation_event_id', $event->id)
            ->with(['items.resource', 'requester:id,name', 'reviewer:id,name'])
            ->orderByDesc('id')
            ->get()
            ->map(fn (EventEquipmentRequest $req) => $this->serializeRequest($req))
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function inventoryOptions(): array
    {
        return Resource::query()
            ->orderBy('name')
            ->get(['id', 'name', 'category', 'quantity', 'available', 'reserved_quantity', 'in_use_quantity', 'needs_repair_quantity', 'status'])
            ->map(function (Resource $resource) {
                $available = $resource->computeAvailableQuantity();

                return [
                    'id' => $resource->id,
                    'name' => $resource->name,
                    'category' => $resource->category,
                    'available' => $available,
                    'status' => $resource->status,
                    'selectable' => $available > 0 && ! in_array($resource->status, ['Pending Approval', 'Needs Repair', 'Damaged', 'Under Maintenance'], true),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function serializeRequest(EventEquipmentRequest $req): array
    {
        return [
            'id' => $req->id,
            'status' => $req->status,
            'notes' => $req->notes,
            'rejection_reason' => $req->rejection_reason,
            'requested_by' => [
                'id' => $req->requester?->id,
                'name' => $req->requester?->name,
            ],
            'reviewed_by' => $req->reviewer ? [
                'id' => $req->reviewer->id,
                'name' => $req->reviewer->name,
            ] : null,
            'reviewed_at' => optional($req->reviewed_at)?->toDateTimeString(),
            'created_at' => optional($req->created_at)?->toDateTimeString(),
            'items' => $req->items->map(fn (EventEquipmentRequestItem $item) => [
                'id' => $item->id,
                'resource_id' => $item->resource_id,
                'resource_name' => $item->resource?->name,
                'quantity_requested' => (int) $item->quantity_requested,
                'quantity_approved' => (int) $item->quantity_approved,
                'status' => $item->status,
                'available_now' => $item->resource ? $item->resource->computeAvailableQuantity() : 0,
                'notes' => $item->notes,
            ])->values()->all(),
        ];
    }

    protected function syncEventResourcePivot(SimulationEvent $event, int $resourceId, int $assignedQty, string $status): void
    {
        $existing = $event->resources()->where('resource_id', $resourceId)->first();
        if ($existing) {
            $needed = max((int) ($existing->pivot->quantity_needed ?? 0), $assignedQty);
            $event->resources()->updateExistingPivot($resourceId, [
                'quantity_needed' => $needed,
                'quantity_assigned' => $assignedQty,
                'status' => $status,
            ]);

            return;
        }

        $event->resources()->attach($resourceId, [
            'quantity_needed' => $assignedQty,
            'quantity_assigned' => $assignedQty,
            'status' => $status,
        ]);
    }
}
