<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Admin\CampaignRequestController;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateGroup6CampaignRequestStatusRequest;
use App\Models\CampaignRequest;
use App\Support\CampaignRegistrationLink;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Outbound-facing API for Group 6 Campaign Planning & Scheduling.
 *
 * They pull submitted training intelligence profiles (campaign requests) from here.
 */
class Group6CampaignPlanningController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (! config('group6.enabled')) {
            return $this->integrationDisabled();
        }

        $status = $request->string('status')->toString();
        $allowedStatuses = ['waiting_for_approval', 'approved', 'rejected'];

        $requests = CampaignRequest::query()
            ->with(['trainingModule', 'submittedBy'])
            ->when(
                $status !== '' && in_array($status, $allowedStatuses, true),
                fn ($query) => $query->where('status', $status),
            )
            ->orderByDesc('submitted_at')
            ->orderByDesc('id')
            ->get()
            ->map(fn (CampaignRequest $item) => $this->serializeForGroup6($item));

        return response()->json([
            'success' => true,
            'campaign_requests' => $requests->values(),
        ]);
    }

    public function show(CampaignRequest $campaignRequest): JsonResponse
    {
        if (! config('group6.enabled')) {
            return $this->integrationDisabled();
        }

        $campaignRequest->load(['trainingModule', 'submittedBy']);

        return response()->json([
            'success' => true,
            'campaign_request' => $this->serializeForGroup6($campaignRequest),
        ]);
    }

    /**
     * Group 6 approves or rejects a submitted campaign request.
     *
     * PATCH /api/integrations/group6/campaign-requests/{campaignRequest}/status
     */
    public function updateStatus(
        UpdateGroup6CampaignRequestStatusRequest $request,
        CampaignRequest $campaignRequest,
    ): JsonResponse {
        if (! config('group6.enabled')) {
            return $this->integrationDisabled();
        }

        if ($campaignRequest->status !== 'waiting_for_approval') {
            return response()->json([
                'success' => false,
                'message' => 'Only campaign requests waiting for approval can be updated.',
                'current_status' => $campaignRequest->status,
            ], 422);
        }

        $data = $request->validated();
        $newStatus = (string) $data['status'];

        $updateData = [
            'status' => $newStatus,
        ];

        if ($newStatus === 'approved') {
            $updateData['approved_at'] = now();
        }

        if (! empty($data['note'])) {
            $updateData['remarks'] = array_merge(
                is_array($campaignRequest->remarks) ? $campaignRequest->remarks : [],
                [
                    'group6_decision' => [
                        'status' => $newStatus,
                        'note' => $data['note'],
                        'decided_at' => now()->toIso8601String(),
                    ],
                ],
            );
        }

        $campaignRequest->update($updateData);
        $campaignRequest->load(['trainingModule', 'submittedBy']);

        return response()->json([
            'success' => true,
            'message' => $newStatus === 'approved'
                ? 'Campaign request approved. Registration link is now active.'
                : 'Campaign request rejected.',
            'campaign_request' => $this->serializeForGroup6($campaignRequest),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeForGroup6(CampaignRequest $campaignRequest): array
    {
        $planning = CampaignRequestController::campaignPlanningFieldsFromPayload($campaignRequest->payload);
        $registeredParticipantsCount = $campaignRequest->registeredParticipantsCount();
        $maximumParticipants = (int) ($planning['maximum_participants'] ?? 0);
        $isApproved = (string) $campaignRequest->status === 'approved';
        $registrationEnabled = $maximumParticipants > 0
            ? $registeredParticipantsCount < $maximumParticipants
            : true;
        $registrationLinkActive = $isApproved && $registrationEnabled;
        $registrationLink = $registrationLinkActive
            ? ($campaignRequest->payload['registration_link'] ?? CampaignRegistrationLink::forCampaignRequest($campaignRequest))
            : null;

        return [
            'campaign_request_id' => $campaignRequest->id,
            'status' => $campaignRequest->status,
            'submitted_to' => $campaignRequest->submitted_to,
            'submitted_at' => $campaignRequest->submitted_at?->toIso8601String(),
            'campaign_planning' => array_merge($planning, [
                'registered_participants_count' => $registeredParticipantsCount,
                'registration_enabled' => $registrationEnabled,
                'registration_link_active' => $registrationLinkActive,
                'registration_link' => $registrationLink,
            ]),
            'legacy' => [
                'proposed_session_label' => $campaignRequest->proposed_session_label,
                'expected_participants' => $campaignRequest->expected_participants,
                'minimum_qualified_participants' => $campaignRequest->minimum_qualified_participants,
            ],
            'submitted_by' => $campaignRequest->submittedBy ? [
                'id' => $campaignRequest->submittedBy->id,
                'name' => $campaignRequest->submittedBy->name,
            ] : null,
        ];
    }

    /**
     * @param  array<string, mixed>  $planning
     */
    private function normalizeRegistrationPeriodLabel(array $planning): ?string
    {
        $opens = $planning['registration_opens'] ?? null;
        $deadline = $planning['registration_deadline'] ?? null;

        if (! $opens && ! $deadline) {
            return $planning['training_title'] ?? null;
        }

        $openLabel = $opens ? Carbon::parse($opens)->format('M j, Y') : '—';
        $deadlineLabel = $deadline ? Carbon::parse($deadline)->format('M j, Y') : '—';

        return "Registration: {$openLabel} – {$deadlineLabel}";
    }

    protected function integrationDisabled(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Group 6 integration is not enabled on this server.',
        ], 503);
    }
}
