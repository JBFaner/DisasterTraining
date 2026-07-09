<?php

namespace App\Http\Controllers\Api;

use App\Models\Resource;
use App\Models\ResourceEventAssignment;
use App\Models\ResourceMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ResourceAllocationInventoryController
{
    private function assignmentColumns(): array
    {
        static $columns = null;

        if ($columns === null) {
            $columns = Schema::getColumnListing('resource_event_assignments');
        }

        return $columns;
    }

    private function assignmentPayload(array $values): array
    {
        $columns = array_flip($this->assignmentColumns());

        return array_filter(
            $values,
            fn ($value, $key) => isset($columns[$key]),
            ARRAY_FILTER_USE_BOTH
        );
    }

    public function reserve(Request $request): JsonResponse
    {
        $data = $request->validate([
            'allocation_request_id' => ['nullable', 'string', 'max:255'],
            'simulation_event_id' => ['nullable', 'integer', 'exists:simulation_events,id'],
            'requested_by' => ['nullable', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.resource_id' => ['required', 'integer', 'exists:resources,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string'],
        ]);

        $eventId = $data['simulation_event_id'] ?? null;
        $requestedBy = $data['requested_by'] ?? 'Resource Allocation';
        $notes = $data['notes'] ?? null;

        try {
            $result = DB::transaction(function () use ($data, $eventId, $requestedBy, $notes) {
                $reserved = [];

                foreach ($data['items'] as $item) {
                    /** @var Resource $resource */
                    $resource = Resource::lockForUpdate()->findOrFail($item['resource_id']);
                    $qty = (int) $item['quantity'];

                    $available = $resource->computeAvailableQuantity();
                    if ($available < $qty) {
                        abort(422, 'Insufficient inventory available.');
                    }

                    $resource->update([
                        'reserved_quantity' => (int) ($resource->reserved_quantity ?? 0) + $qty,
                    ]);
                    $resource->refreshStockStatus();

                    if ($eventId) {
                        ResourceEventAssignment::updateOrCreate(
                            [
                                'resource_id' => $resource->id,
                                'event_id' => $eventId,
                            ],
                            $this->assignmentPayload([
                                'quantity_assigned' => $qty,
                                'status' => 'Reserved',
                                'notes' => $notes,
                                'assigned_by' => null,
                                'assigned_at' => now(),
                            ]),
                        );
                    }

                    ResourceMovement::create([
                        'resource_id' => $resource->id,
                        'simulation_event_id' => $eventId,
                        'requested_by' => $requestedBy,
                        'source_module' => 'Resource Allocation',
                        'quantity' => $qty,
                        'status' => 'Reserved',
                        'notes' => $notes,
                    ]);

                    $reserved[] = [
                        'resource_id' => $resource->id,
                        'name' => $resource->name,
                        'quantity' => $qty,
                        'status' => $resource->status,
                        'available_quantity' => $resource->available,
                        'reserved_quantity' => $resource->reserved_quantity,
                        'in_use_quantity' => $resource->in_use_quantity,
                    ];
                }

                return $reserved;
            });
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Insufficient inventory available.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Reservation successful.',
            'items' => $result ?? [],
        ]);
    }

    public function markInUse(Request $request): JsonResponse
    {
        $data = $request->validate([
            'simulation_event_id' => ['nullable', 'integer', 'exists:simulation_events,id'],
            'requested_by' => ['nullable', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.resource_id' => ['required', 'integer', 'exists:resources,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string'],
        ]);

        $eventId = $data['simulation_event_id'] ?? null;
        $requestedBy = $data['requested_by'] ?? 'Resource Allocation';
        $notes = $data['notes'] ?? null;

        try {
            $result = DB::transaction(function () use ($data, $eventId, $requestedBy, $notes) {
                $updated = [];

                foreach ($data['items'] as $item) {
                    /** @var Resource $resource */
                    $resource = Resource::lockForUpdate()->findOrFail($item['resource_id']);
                    $qty = (int) $item['quantity'];

                    if (((int) ($resource->reserved_quantity ?? 0)) < $qty) {
                        abort(422, 'Insufficient reserved quantity to mark in use.');
                    }

                    $resource->update([
                        'reserved_quantity' => (int) ($resource->reserved_quantity ?? 0) - $qty,
                        'in_use_quantity' => (int) ($resource->in_use_quantity ?? 0) + $qty,
                    ]);
                    $resource->refreshStockStatus();

                    ResourceEventAssignment::where('resource_id', $resource->id)
                        ->when($eventId, fn ($q) => $q->where('event_id', $eventId))
                        ->whereIn('status', ['Reserved', 'Active'])
                        ->latest()
                        ->first()
                        ?->update([
                            'status' => 'In Use',
                            'notes' => $notes,
                        ]);

                    ResourceMovement::create([
                        'resource_id' => $resource->id,
                        'simulation_event_id' => $eventId,
                        'requested_by' => $requestedBy,
                        'source_module' => 'Resource Allocation',
                        'quantity' => $qty,
                        'status' => 'In Use',
                        'notes' => $notes,
                    ]);

                    $updated[] = [
                        'resource_id' => $resource->id,
                        'name' => $resource->name,
                        'quantity' => $qty,
                        'status' => $resource->status,
                        'available_quantity' => $resource->available,
                        'reserved_quantity' => $resource->reserved_quantity,
                        'in_use_quantity' => $resource->in_use_quantity,
                    ];
                }

                return $updated;
            });
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Could not mark equipment in use.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Status updated to In Use.',
            'items' => $result ?? [],
        ]);
    }

    public function returnItems(Request $request): JsonResponse
    {
        $data = $request->validate([
            'simulation_event_id' => ['nullable', 'integer', 'exists:simulation_events,id'],
            'requested_by' => ['nullable', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.resource_id' => ['required', 'integer', 'exists:resources,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.damaged' => ['nullable', 'boolean'],
            'items.*.damage_notes' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $eventId = $data['simulation_event_id'] ?? null;
        $requestedBy = $data['requested_by'] ?? 'Resource Allocation';
        $notes = $data['notes'] ?? null;

        try {
            $result = DB::transaction(function () use ($data, $eventId, $requestedBy, $notes) {
                $updated = [];

                foreach ($data['items'] as $item) {
                    /** @var Resource $resource */
                    $resource = Resource::lockForUpdate()->findOrFail($item['resource_id']);
                    $qty = (int) $item['quantity'];
                    $damaged = (bool) ($item['damaged'] ?? false);
                    $damageNotes = $item['damage_notes'] ?? null;

                    $inUse = (int) ($resource->in_use_quantity ?? 0);
                    $reserved = (int) ($resource->reserved_quantity ?? 0);

                    if ($inUse >= $qty) {
                        $resource->update([
                            'in_use_quantity' => $inUse - $qty,
                        ]);
                    } elseif ($reserved >= $qty) {
                        $resource->update([
                            'reserved_quantity' => $reserved - $qty,
                        ]);
                    } else {
                        abort(422, 'Insufficient in-use/reserved quantity to return.');
                    }

                    if ($damaged) {
                        $resource->update([
                            'needs_repair_quantity' => (int) ($resource->needs_repair_quantity ?? 0) + $qty,
                        ]);
                    }

                    $resource->refreshStockStatus();

                    ResourceEventAssignment::where('resource_id', $resource->id)
                        ->when($eventId, fn ($q) => $q->where('event_id', $eventId))
                        ->whereIn('status', ['Reserved', 'In Use', 'Active'])
                        ->latest()
                        ->first()
                        ?->update([
                            'status' => 'Returned',
                            'returned_at' => now(),
                            'notes' => $damageNotes ?: ($notes ?? 'Returned'),
                        ]);

                    ResourceMovement::create([
                        'resource_id' => $resource->id,
                        'simulation_event_id' => $eventId,
                        'requested_by' => $requestedBy,
                        'source_module' => 'Resource Allocation',
                        'quantity' => $qty,
                        'status' => $damaged ? 'Needs Repair' : 'Returned',
                        'notes' => $damageNotes ?: $notes,
                    ]);

                    $updated[] = [
                        'resource_id' => $resource->id,
                        'name' => $resource->name,
                        'quantity' => $qty,
                        'status' => $resource->status,
                        'available_quantity' => $resource->available,
                        'reserved_quantity' => $resource->reserved_quantity,
                        'in_use_quantity' => $resource->in_use_quantity,
                        'needs_repair_quantity' => $resource->needs_repair_quantity,
                    ];
                }

                return $updated;
            });
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Could not return equipment.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Return processed successfully.',
            'items' => $result ?? [],
        ]);
    }
}

