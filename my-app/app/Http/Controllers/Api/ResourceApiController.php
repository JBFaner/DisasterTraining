<?php

namespace App\Http\Controllers\Api;

use App\Models\Resource;
use App\Models\SimulationEvent;
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
            'resource' => $resource->load(['maintenanceLogs']),
            'history' => $resource->maintenanceLogs()->orderBy('created_at', 'desc')->get(),
        ]);
    }
}
