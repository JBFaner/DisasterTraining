<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ResourceApiController;
use App\Http\Controllers\Api\Group6SimulationPlanningController;
use App\Http\Controllers\Api\Group6InboundController;
use App\Http\Controllers\Api\Group6CampaignPlanningController;
use App\Http\Controllers\Api\ResourceAllocationInventoryController;
use App\Models\Resource;

// Public API endpoints
Route::get('/resources', [ResourceApiController::class, 'index']);
Route::get('/resources/available', function () {
    $resources = Resource::where('status', 'Available')
        ->orWhere('status', 'Partially Assigned')
        ->where('available', '>', 0)
        ->get(['id', 'name', 'category', 'quantity', 'available', 'status', 'condition', 'location']);

    return response()->json(['resources' => $resources]);
});
Route::get('/simulation-events', [ResourceApiController::class, 'getEvents']);
Route::get('/simulation-events/completed-with-resources', [ResourceApiController::class, 'getCompletedEventResources']);
Route::get('/resources/{resource}/history', function (Resource $resource) {
    return response()->json([
        'resource' => $resource->load(['maintenanceLogs']),
        'history' => $resource->maintenanceLogs()->orderBy('created_at', 'desc')->get(),
    ]);
});

/*
|--------------------------------------------------------------------------
| Resource Allocation — inbound integration
|--------------------------------------------------------------------------
| Inventory is the source of truth. Resource Allocation can reserve / mark in-use / return.
| Auth: X-Resource-Allocation-Api-Key header (or Bearer token).
*/
Route::prefix('integrations/resource-allocation')
    ->middleware('resource_allocation.api')
    ->name('api.integrations.resource-allocation.')
    ->group(function () {
        Route::post('/reserve', [ResourceAllocationInventoryController::class, 'reserve'])->name('reserve');
        Route::post('/mark-in-use', [ResourceAllocationInventoryController::class, 'markInUse'])->name('mark-in-use');
        Route::post('/return', [ResourceAllocationInventoryController::class, 'returnItems'])->name('return');
    });

/*
|--------------------------------------------------------------------------
| Group 6 — inbound integration (external team's system pushes data to us)
|--------------------------------------------------------------------------
| Auth: X-Group6-Api-Key header. Payloads are staged, not processed yet.
| Campaign Planning approval endpoints are also aliased under
| /api/integrations/campaign-planning (same controller + auth).
*/
Route::prefix('integrations/group6')
    ->middleware('group6.api')
    ->name('api.integrations.group6.')
    ->group(function () {
        Route::post('/participants', [Group6InboundController::class, 'receiveParticipants'])->name('participants');
        Route::post('/trainers', [Group6InboundController::class, 'receiveTrainers'])->name('trainers');
        Route::get('/event-references', [Group6InboundController::class, 'listEventReferences'])->name('event-references');

        Route::get('/campaign-requests', [Group6CampaignPlanningController::class, 'index'])->name('campaign-requests.index');
        Route::get('/campaign-requests/{campaignRequest}', [Group6CampaignPlanningController::class, 'show'])->name('campaign-requests.show');
        Route::patch('/campaign-requests/{campaignRequest}/status', [Group6CampaignPlanningController::class, 'updateStatus'])->name('campaign-requests.update-status');

        Route::get('/simulation-planning/approved-campaigns', [Group6SimulationPlanningController::class, 'index'])->name('simulation-planning.approved-campaigns.index');
        Route::get('/simulation-planning/approved-campaigns/{campaignRequest}', [Group6SimulationPlanningController::class, 'show'])->name('simulation-planning.approved-campaigns.show');
        Route::get('/simulation-planning/approved-campaigns/{campaignRequest}/training-summary', [Group6SimulationPlanningController::class, 'trainingSummary'])->name('simulation-planning.approved-campaigns.training-summary');
    });

/*
|--------------------------------------------------------------------------
| Campaign Planning partner API (preferred alias for Training Intelligence)
|--------------------------------------------------------------------------
| Same auth and handlers as integrations/group6 campaign-request routes.
| Doc: docs/PARTNER_CAMPAIGN_PLANNING_API.md
*/
Route::prefix('integrations/campaign-planning')
    ->middleware('group6.api')
    ->name('api.integrations.campaign-planning.')
    ->group(function () {
        Route::get('/campaign-requests', [Group6CampaignPlanningController::class, 'index'])->name('campaign-requests.index');
        Route::get('/campaign-requests/{campaignRequest}', [Group6CampaignPlanningController::class, 'show'])->name('campaign-requests.show');
        Route::patch('/campaign-requests/{campaignRequest}/status', [Group6CampaignPlanningController::class, 'updateStatus'])->name('campaign-requests.update-status');
    });

// Public Philippine location master data (cascading dropdowns)
Route::prefix('locations')->group(function () {
    Route::get('/regions', [App\Http\Controllers\PhilippinesLocationController::class, 'regions']);
    Route::get('/provinces', [App\Http\Controllers\PhilippinesLocationController::class, 'provinces']);
    Route::get('/cities', [App\Http\Controllers\PhilippinesLocationController::class, 'cities']);
    Route::get('/barangays', [App\Http\Controllers\PhilippinesLocationController::class, 'barangays']);
    Route::get('/resolve', [App\Http\Controllers\PhilippinesLocationController::class, 'resolve']);
});

// Note: Audit log API routes are defined in web.php with auth middleware
