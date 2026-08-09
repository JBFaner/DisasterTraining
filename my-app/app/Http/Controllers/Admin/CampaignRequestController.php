<?php

namespace App\Http\Controllers\Admin;

use App\Contracts\Group6\Group6ApiClientInterface;
use App\Http\Controllers\Concerns\ManagesTrainingModuleAssets;
use App\Http\Controllers\Controller;
use App\Models\CampaignRequest;
use App\Models\TrainingModule;
use App\Services\HazardAssessment\HazardTrainingRecommendationService;
use App\Support\CampaignPlanningPayload;
use App\Support\CampaignRegistrationLink;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class CampaignRequestController extends Controller
{
    use ManagesTrainingModuleAssets;

    private function serializeCampaignRequest(CampaignRequest $campaignRequest): array
    {
        $trainingModule = $campaignRequest->trainingModule;
        $planning = self::campaignPlanningFieldsFromPayload($campaignRequest->payload);
        $registeredParticipantsCount = $campaignRequest->registeredParticipantsCount();
        $maximumParticipants = (int) ($planning['maximum_participants'] ?? 0);
        $isApproved = (string) $campaignRequest->status === 'approved';
        $registrationEnabled = $maximumParticipants > 0
            ? $registeredParticipantsCount < $maximumParticipants
            : true;
        $registrationWindowOpen = app(\App\Services\CampaignRegistrationService::class)
            ->isWithinOpenRegistrationWindow($planning);
        $registrationLinkActive = $isApproved && $registrationEnabled && $registrationWindowOpen;
        $registrationLink = $registrationLinkActive
            ? ($campaignRequest->payload['registration_link'] ?? CampaignRegistrationLink::forCampaignRequest($campaignRequest))
            : null;

        return [
            'id' => $campaignRequest->id,
            'training_module' => $trainingModule ? [
                'id' => $trainingModule->id,
                'title' => $trainingModule->title,
            ] : null,
            'registration_period_label' => $this->normalizeRegistrationPeriodLabel($planning),
            'submitted_to' => $campaignRequest->submitted_to,
            'submitted_at' => $campaignRequest->submitted_at?->toIso8601String(),
            'status' => $campaignRequest->status,
            'payload' => $campaignRequest->payload,
            'campaign_planning' => array_merge($planning, [
                'registered_participants_count' => $registeredParticipantsCount,
                'registration_enabled' => $registrationEnabled,
            ]),
            'registration_link_active' => $registrationLinkActive,
            'registration_link' => $registrationLink,
            'remarks' => $campaignRequest->remarks,
            'created_at' => $campaignRequest->created_at?->toIso8601String(),
            'updated_at' => $campaignRequest->updated_at?->toIso8601String(),
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

    private function buildPayload(TrainingModule $trainingModule): array
    {
        $recommendedCommunities = app(HazardTrainingRecommendationService::class)
            ->recommendCommunitiesForTraining($trainingModule);

        return array_merge(
            [
                'submitted_at' => now()->toIso8601String(),
            ],
            $trainingModule->toCampaignPlanningPayload($recommendedCommunities),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public static function campaignPlanningFieldsFromPayload(?array $payload): array
    {
        return CampaignPlanningPayload::fieldsFromStoredPayload($payload);
    }

    public function index(Request $request, TrainingModule $trainingModule)
    {
        $this->authorizeOwner($trainingModule);

        $campaignRequests = CampaignRequest::query()
            ->with('trainingModule', 'submittedBy')
            ->where('training_module_id', $trainingModule->id)
            ->orderByDesc('submitted_at')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'requests' => $campaignRequests->map(function (CampaignRequest $item) {
                return $this->serializeCampaignRequest($item);
            })->values(),
        ]);
    }

    public function store(Request $request, TrainingModule $trainingModule)
    {
        $this->authorizeOwner($trainingModule);

        if ($trainingModule->status !== 'published') {
            return response()->json([
                'success' => false,
                'message' => 'Only published training modules can be submitted to Campaign Planning.',
            ], 422);
        }

        $payload = $this->buildPayload($trainingModule);
        $planning = self::campaignPlanningFieldsFromPayload($payload);
        $maximumParticipants = (int) ($planning['maximum_participants'] ?? 0);
        $expectedParticipants = (int) ($planning['expected_participants'] ?? 0);
        if ($expectedParticipants <= 0) {
            $expectedParticipants = $maximumParticipants > 0 ? $maximumParticipants : 0;
        }
        if ($maximumParticipants > 0 && $expectedParticipants > $maximumParticipants) {
            $expectedParticipants = $maximumParticipants;
        }
        $expectedParticipants = $expectedParticipants > 0 ? $expectedParticipants : null;
        $minimumQualified = $expectedParticipants
            ? (int) max(1, round($expectedParticipants * 0.67))
            : null;

        $campaignRequest = CampaignRequest::create([
            'training_module_id' => $trainingModule->id,
            'submitted_to' => 'Public Safety Campaign Management System',
            'proposed_session_label' => $this->normalizeRegistrationPeriodLabel($planning),
            'submitted_at' => now(),
            'status' => 'waiting_for_approval',
            'expected_participants' => $expectedParticipants,
            'minimum_qualified_participants' => $minimumQualified,
            'session_index' => 0,
            'payload' => $payload,
            'remarks' => null,
            'submitted_by_id' => $request->user()?->id,
        ]);

        $registrationLink = CampaignRegistrationLink::forCampaignRequest($campaignRequest);
        $payload = array_merge($payload, [
            'registration_link' => $registrationLink,
            'registration_form_path' => '/campaigns/'.$campaignRequest->id.'/register',
        ]);
        $campaignRequest->update(['payload' => $payload]);
        $campaignRequest->refresh();

        // Push Training Intelligence to the external Campaign Planning system.
        $outbound = app(Group6ApiClientInterface::class)->submitTrainingIntelligence($campaignRequest);
        if ($outbound['success'] ?? false) {
            $payload['external_campaign_id'] = $outbound['external_campaign_id'] ?? null;
            $payload['external_campaign_synced_at'] = now()->toIso8601String();
            $campaignRequest->update([
                'payload' => $payload,
                'remarks' => array_merge(
                    is_array($campaignRequest->remarks) ? $campaignRequest->remarks : [],
                    [
                        'campaign_system_outbound' => [
                            'success' => true,
                            'external_campaign_id' => $outbound['external_campaign_id'] ?? null,
                            'synced_at' => now()->toIso8601String(),
                        ],
                    ],
                ),
            ]);
        } else {
            Log::warning('Training Intelligence outbound sync failed', [
                'campaign_request_id' => $campaignRequest->id,
                'error' => $outbound['error'] ?? 'Unknown error',
            ]);
            $campaignRequest->update([
                'remarks' => array_merge(
                    is_array($campaignRequest->remarks) ? $campaignRequest->remarks : [],
                    [
                        'campaign_system_outbound' => [
                            'success' => false,
                            'error' => $outbound['error'] ?? 'Unknown error',
                            'attempted_at' => now()->toIso8601String(),
                        ],
                    ],
                ),
            ]);
        }

        return response()->json([
            'success' => true,
            'campaign_request' => [
                'id' => $campaignRequest->id,
                'status' => $campaignRequest->status,
                'registration_link' => $registrationLink,
                'external_campaign_id' => $outbound['external_campaign_id'] ?? null,
                'external_sync_success' => (bool) ($outbound['success'] ?? false),
                'external_sync_error' => $outbound['error'] ?? null,
            ],
        ]);
    }

    public function show(Request $request, CampaignRequest $campaignRequest)
    {
        $campaignRequest->load('trainingModule', 'submittedBy');
        $this->authorizeOwner($campaignRequest->trainingModule);

        $serialized = $this->serializeCampaignRequest($campaignRequest);

        if ($request->expectsJson() || $request->ajax()) {
            return response()->json([
                'request' => $serialized,
            ]);
        }

        return view('app', [
            'section' => 'campaign_request_show',
            'campaign_request' => $serialized,
        ]);
    }

    /**
     * Presentation helper: locally approve a waiting campaign request when Demo tools are on.
     */
    public function demoForceApprove(Request $request, CampaignRequest $campaignRequest)
    {
        $campaignRequest->load('trainingModule');
        $this->authorizeOwner($campaignRequest->trainingModule);

        $user = portal_user() ?: $request->user();
        abort_unless($user && in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER', 'LEAD_TRAINER', 'SUPER_ADMIN'], true), 403);

        if (! \App\Models\Setting::get('demo_tools_enabled', true)) {
            return response()->json([
                'success' => false,
                'message' => 'Demo tools are currently disabled. Turn Demo tools On first.',
            ], 422);
        }

        if ($campaignRequest->status === 'approved') {
            return response()->json([
                'success' => true,
                'message' => 'Campaign request is already approved.',
                'request' => $this->serializeCampaignRequest($campaignRequest->fresh(['trainingModule', 'submittedBy'])),
            ]);
        }

        if ($campaignRequest->status !== 'waiting_for_approval') {
            return response()->json([
                'success' => false,
                'message' => 'Only requests waiting for approval can be force-approved.',
                'current_status' => $campaignRequest->status,
            ], 422);
        }

        $payload = is_array($campaignRequest->payload) ? $campaignRequest->payload : [];
        $payload['demo_force_approved'] = true;
        $payload['demo_force_approved_at'] = now()->toIso8601String();
        $payload['demo_force_approved_by'] = $user->id;

        $campaignRequest->update([
            'status' => 'approved',
            'approved_at' => now(),
            'payload' => $payload,
            'remarks' => array_merge(
                is_array($campaignRequest->remarks) ? $campaignRequest->remarks : [],
                [
                    'demo_force_approve' => [
                        'by' => $user->id,
                        'at' => now()->toIso8601String(),
                        'note' => 'Approved locally for presentation demo (Demo tools).',
                    ],
                ],
            ),
        ]);

        $registrationLink = CampaignRegistrationLink::forCampaignRequest($campaignRequest);
        $freshPayload = is_array($campaignRequest->payload) ? $campaignRequest->payload : [];
        $freshPayload['registration_link'] = $registrationLink;
        $freshPayload['registration_form_path'] = '/campaigns/'.$campaignRequest->id.'/register';
        $campaignRequest->update(['payload' => $freshPayload]);

        return response()->json([
            'success' => true,
            'message' => 'Campaign request approved (Demo). Registration link is now active when the window is open.',
            'request' => $this->serializeCampaignRequest($campaignRequest->fresh(['trainingModule', 'submittedBy'])),
        ]);
    }
}
