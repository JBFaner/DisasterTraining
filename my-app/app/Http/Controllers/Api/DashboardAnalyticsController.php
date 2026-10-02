<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AdminDashboardAnalyticsService;
use Illuminate\Http\JsonResponse;

/**
 * Partner-facing operations dashboard analytics (any external group).
 *
 * GET /api/integrations/dashboard/analytics
 * Auth: X-Dashboard-Api-Key header (or Bearer token)
 */
class DashboardAnalyticsController extends Controller
{
    public function __construct(
        private readonly AdminDashboardAnalyticsService $analyticsService,
    ) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'dashboard' => $this->analyticsService->buildPayload(),
        ]);
    }
}
