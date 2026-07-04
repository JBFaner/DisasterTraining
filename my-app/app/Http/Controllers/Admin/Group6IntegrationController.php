<?php

namespace App\Http\Controllers\Admin;

use App\Contracts\Group6\Group6ApiClientInterface;
use App\Http\Controllers\Controller;
use App\Models\Group6InboundRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Admin visibility into Group 6 integration status.
 *
 * Does not implement Group 6's functionality — only reports integration readiness
 * and staged inbound records awaiting future API implementation.
 */
class Group6IntegrationController extends Controller
{
    public function __construct(
        private readonly Group6ApiClientInterface $apiClient,
    ) {}

    public function status(): JsonResponse
    {
        $this->authorizeAdmin();

        return response()->json([
            'enabled' => (bool) config('group6.enabled'),
            'api_configured' => $this->apiClient->isConfigured(),
            'inbound_webhook_configured' => (bool) config('group6.inbound.api_key'),
            'api_base_url' => config('group6.api.base_url') ?: null,
            'pending_inbound_records' => Group6InboundRecord::where('status', Group6InboundRecord::STATUS_PENDING)->count(),
            'note' => 'Group 6 is an external system. Data consumption will be implemented when their API is available.',
        ]);
    }

    public function pendingRecords(): JsonResponse
    {
        $this->authorizeAdmin();

        $records = Group6InboundRecord::query()
            ->where('status', Group6InboundRecord::STATUS_PENDING)
            ->orderByDesc('received_at')
            ->limit(50)
            ->get(['id', 'record_type', 'external_id', 'status', 'received_at']);

        return response()->json(['records' => $records]);
    }

    /**
     * Placeholder: trigger fetch from Group 6 API (not yet implemented).
     */
    public function fetchFromGroup6(Request $request): JsonResponse
    {
        $this->authorizeAdmin();

        $type = $request->string('type', 'participants');

        $result = match ($type) {
            'trainers' => $this->apiClient->fetchTrainers(),
            default => $this->apiClient->fetchParticipants($request->integer('simulation_event_id') ?: null),
        };

        return response()->json([
            'success' => $result['success'],
            'message' => $result['error'] ?? 'Fetch completed.',
            ...$result,
        ], $result['success'] ? 200 : 501);
    }

    protected function authorizeAdmin(): void
    {
        $user = portal_user();
        abort_unless($user && in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER', 'SUPER_ADMIN'], true), 403);
    }
}
