<?php

namespace App\Http\Controllers\Api;

use App\Models\Resource;
use App\Models\SimulationEvent;
use App\Models\ResourceEventAssignment;
use App\Models\ResourceMovement;
use App\Models\ResourceMaintenanceLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ResourceApiController
{
    /**
     * Get all resources with filtering
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Resource::query();

            if ($request->has('search')) {
                $query->where('name', 'like', "%{$request->search}%")
                      ->orWhere('serial_number', 'like', "%{$request->search}%");
            }

            if ($request->has('category') && $request->category !== 'all') {
                $query->where('category', $request->category);
            }

            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            if ($request->has('condition') && $request->condition !== 'all') {
                $query->where('condition', $request->condition);
            }

            $resources = $query->get();

            return response()->json([
                'resources' => $resources,
                'stats' => [
                    'total' => Resource::count(),
                    'available' => Resource::where('status', 'Available')->count(),
                    'reserved' => Resource::where('status', 'Reserved')->count(),
                    'inUse' => Resource::where('status', 'In Use')->count(),
                    'partiallyAssigned' => Resource::where('status', 'Partially Assigned')->count(),
                    'fullyAssigned' => Resource::where('status', 'Fully Assigned')->count(),
                    'needsRepair' => Resource::where('condition', 'Needs Repair')->orWhere('status', 'Damaged')->count(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'resources' => [],
                'stats' => [
                    'total' => 0,
                    'available' => 0,
                    'reserved' => 0,
                    'inUse' => 0,
                    'partiallyAssigned' => 0,
                    'fullyAssigned' => 0,
                    'needsRepair' => 0,
                ],
            ], 500);
        }
    }

    /**
     * Get all simulation events for assignment
     */
    public function getEvents(): JsonResponse
    {
        try {
            // Normalize statuses so stale published events are marked as ended
            SimulationEvent::autoEndPastUnstartedEvents(portal_id());

            $events = SimulationEvent::where('status', 'published')
                ->orderBy('event_date', 'desc')
                ->get(['id', 'title', 'event_date']);

            return response()->json(['events' => $events]);
        } catch (\Exception $e) {
            return response()->json(['events' => [], 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get resource history/logs
     */
    public function getHistory(Resource $resource): JsonResponse
    {
        return response()->json([
            'resource' => $resource->load(['maintenanceLogs', 'movements']),
            'history' => $resource->maintenanceLogs()->orderBy('created_at', 'desc')->get(),
            'movements' => $resource->movements()->orderBy('created_at', 'desc')->limit(100)->get(),
        ]);
    }

    public function movements(Request $request): JsonResponse
    {
        $limit = max(10, min(200, (int) $request->query('limit', 50)));

        $rows = ResourceMovement::query()
            ->with(['resource:id,name', 'simulationEvent:id,title'])
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(function (ResourceMovement $movement) {
                return [
                    'id' => $movement->id,
                    'date' => $movement->created_at?->toDateString(),
                    'created_at' => $movement->created_at?->toIso8601String(),
                    'equipment' => $movement->resource?->name,
                    'resource_id' => $movement->resource_id,
                    'simulation_event' => $movement->simulationEvent?->title,
                    'simulation_event_id' => $movement->simulation_event_id,
                    'requested_by' => $movement->requested_by,
                    'quantity' => (int) $movement->quantity,
                    'status' => $movement->status,
                    'source_module' => $movement->source_module,
                    'notes' => $movement->notes,
                ];
            })
            ->values()
            ->all();

        return response()->json(['movements' => $rows]);
    }

    public function reports(): JsonResponse
    {
        $mostUsed = ResourceMovement::query()
            ->selectRaw('resource_id, SUM(quantity) as total_allocated, COUNT(*) as movement_count')
            ->whereIn('status', ['Reserved', 'In Use', 'Returned', 'Needs Repair'])
            ->groupBy('resource_id')
            ->with('resource:id,name,category')
            ->orderByDesc('total_allocated')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'resource_id' => (int) $row->resource_id,
                'resource_name' => $row->resource?->name ?? 'Unknown Resource',
                'category' => $row->resource?->category ?? '—',
                'total_allocated' => (int) $row->total_allocated,
                'movement_count' => (int) $row->movement_count,
            ])
            ->values()
            ->all();

        $currentReservations = Resource::query()
            ->where('reserved_quantity', '>', 0)
            ->orderByDesc('reserved_quantity')
            ->get(['id', 'name', 'category', 'reserved_quantity', 'available', 'status', 'location'])
            ->map(fn (Resource $resource) => [
                'resource_id' => $resource->id,
                'resource_name' => $resource->name,
                'category' => $resource->category,
                'reserved_quantity' => (int) ($resource->reserved_quantity ?? 0),
                'available_quantity' => (int) ($resource->available ?? 0),
                'status' => $resource->status,
                'location' => $resource->location,
            ])
            ->values()
            ->all();

        $utilization = Resource::query()
            ->get(['id', 'name', 'quantity', 'reserved_quantity', 'in_use_quantity', 'needs_repair_quantity'])
            ->map(function (Resource $resource) {
                $total = max(0, (int) ($resource->quantity ?? 0));
                $reserved = max(0, (int) ($resource->reserved_quantity ?? 0));
                $inUse = max(0, (int) ($resource->in_use_quantity ?? 0));
                $needsRepair = max(0, (int) ($resource->needs_repair_quantity ?? 0));
                $used = $reserved + $inUse + $needsRepair;
                $utilizationRate = $total > 0 ? round(($used / $total) * 100, 2) : 0.0;

                return [
                    'resource_id' => $resource->id,
                    'resource_name' => $resource->name,
                    'total_quantity' => $total,
                    'active_quantity' => $used,
                    'utilization_rate' => $utilizationRate,
                ];
            })
            ->sortByDesc('utilization_rate')
            ->values()
            ->all();

        $damagedSummary = Resource::query()
            ->where(function ($query) {
                $query->where('needs_repair_quantity', '>', 0)
                    ->orWhere('condition', 'Needs Repair')
                    ->orWhere('condition', 'Damaged')
                    ->orWhere('status', 'Needs Repair')
                    ->orWhere('status', 'Damaged');
            })
            ->orderByDesc('needs_repair_quantity')
            ->get(['id', 'name', 'category', 'condition', 'status', 'needs_repair_quantity'])
            ->map(fn (Resource $resource) => [
                'resource_id' => $resource->id,
                'resource_name' => $resource->name,
                'category' => $resource->category,
                'condition' => $resource->condition,
                'status' => $resource->status,
                'needs_repair_quantity' => (int) ($resource->needs_repair_quantity ?? 0),
            ])
            ->values()
            ->all();

        $maintenanceHistory = ResourceMaintenanceLog::query()
            ->with('resource:id,name')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn (ResourceMaintenanceLog $log) => [
                'id' => $log->id,
                'date' => $log->created_at?->toDateString(),
                'resource' => $log->resource?->name ?? 'Unknown Resource',
                'action' => $log->action,
                'notes' => $log->notes,
                'technician' => $log->technician,
            ])
            ->values()
            ->all();

        return response()->json([
            'most_used_equipment' => $mostUsed,
            'current_reservations' => $currentReservations,
            'equipment_utilization' => $utilization,
            'damaged_equipment_summary' => $damagedSummary,
            'maintenance_history' => $maintenanceHistory,
        ]);
    }

    /**
     * Get resources from completed events that need to be returned
     */
    public function getCompletedEventResources(): JsonResponse
    {
        try {
            // Normalize statuses before querying so past, never-started events
            // are treated as "ended" and included in post-event flows.
            SimulationEvent::autoEndPastUnstartedEvents(portal_id());

            // Get completed events with their resource assignments
            $completedEvents = SimulationEvent::whereIn('status', ['completed', 'ended'])
                ->with(['resources' => function ($query) {
                    $query->wherePivot('quantity_assigned', '>', 0)
                          ->wherePivot('status', '!=', 'Returned');
                }])
                ->orderBy('event_date', 'desc')
                ->get();

            // Also get active resource assignments for completed events
            $activeAssignments = ResourceEventAssignment::where('status', 'Active')
                ->whereHas('event', function ($query) {
                    $query->where('status', 'completed');
                })
                ->with(['resource', 'event'])
                ->get();

            // Format the response
            $eventsWithResources = $completedEvents->filter(function ($event) use ($activeAssignments) {
                // Check if event has resources via pivot or via assignments
                $hasResources = $event->resources->isNotEmpty();
                $hasAssignments = $activeAssignments->where('event_id', $event->id)->isNotEmpty();
                return $hasResources || $hasAssignments;
            })->map(function ($event) use ($activeAssignments) {
                $eventAssignments = $activeAssignments->where('event_id', $event->id);
                
                $resources = collect();
                
                // Add resources from pivot
                foreach ($event->resources as $resource) {
                    $resources->push([
                        'id' => $resource->id,
                        'name' => $resource->name,
                        'category' => $resource->category,
                        'serial_number' => $resource->serial_number,
                        'quantity_assigned' => $resource->pivot->quantity_assigned,
                        'status' => $resource->pivot->status,
                        'condition' => $resource->condition,
                    ]);
                }
                
                // Add resources from assignments if not already added
                foreach ($eventAssignments as $assignment) {
                    if (!$resources->where('id', $assignment->resource_id)->first()) {
                        $resources->push([
                            'id' => $assignment->resource->id,
                            'name' => $assignment->resource->name,
                            'category' => $assignment->resource->category,
                            'serial_number' => $assignment->resource->serial_number,
                            'quantity_assigned' => $assignment->quantity_assigned,
                            'status' => $assignment->status,
                            'condition' => $assignment->resource->condition,
                            'assignment_id' => $assignment->id,
                        ]);
                    }
                }
                
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'event_date' => $event->event_date,
                    'completed_at' => $event->completed_at,
                    'resources' => $resources->values(),
                ];
            })->values();

            return response()->json([
                'events' => $eventsWithResources,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'events' => [],
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
