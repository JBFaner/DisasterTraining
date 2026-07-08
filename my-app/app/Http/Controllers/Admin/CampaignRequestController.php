<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\ManagesTrainingModuleAssets;
use App\Http\Controllers\Controller;
use App\Models\CampaignRequest;
use App\Models\TrainingModule;
use App\Services\HazardAssessment\HazardTrainingRecommendationService;
use Illuminate\Http\Request;

class CampaignRequestController extends Controller
{
    use ManagesTrainingModuleAssets;

    private function normalizeProposedSessions(array $sessions): array
    {
        return collect($sessions)
            ->values()
            ->map(function ($session, int $index) {
                if (! is_array($session)) {
                    return null;
                }

                $date = trim((string) ($session['date'] ?? ''));
                $start = trim((string) ($session['start_time'] ?? ''));
                $end = trim((string) ($session['end_time'] ?? ''));

                return [
                    'label' => 'Session '.($index + 1),
                    'date' => $date !== '' ? $date : null,
                    'time' => ($start !== '' && $end !== '') ? "{$start} - {$end}" : null,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    private function normalizeProposedSessionLabel(TrainingModule $trainingModule): ?string
    {
        $sessions = is_array($trainingModule->available_training_sessions)
            ? $trainingModule->available_training_sessions
            : [];

        $first = $sessions[0] ?? null;
        if (! is_array($first)) {
            return null;
        }

        $title = trim((string) ($first['title'] ?? ''));
        $date = trim((string) ($first['date'] ?? ''));
        $start = trim((string) ($first['start_time'] ?? ''));
        $end = trim((string) ($first['end_time'] ?? ''));

        if ($date === '' || $start === '' || $end === '') {
            return $title !== '' ? $title : null;
        }

        $parts = [];
        if ($title !== '') {
            $parts[] = $title;
        }
        $parts[] = $date;
        $parts[] = "{$start} - {$end}";

        return implode(' • ', $parts);
    }

    private function buildPayload(TrainingModule $trainingModule, array $additionalCommunities = []): array
    {
        $hazardRecommendations = app(HazardTrainingRecommendationService::class)
            ->recommendCommunitiesForTraining($trainingModule);
        $trainingModule->recommended_communities = $hazardRecommendations;

        $payload = $trainingModule->toIntegrationArray();
        $payload['additional_communities'] = $additionalCommunities;

        return $payload;
    }

    /**
     * @return array<int, array{barangay_profile_id: int, barangay_name: string, municipality_city: ?string, province: ?string}>
     */
    private function normalizeAdditionalCommunities(Request $request): array
    {
        $raw = $request->input('additional_communities', []);
        if (is_string($raw)) {
            $decoded = json_decode($raw, true);
            $raw = is_array($decoded) ? $decoded : [];
        }

        if (! is_array($raw)) {
            return [];
        }

        return collect($raw)
            ->filter(fn ($item) => is_array($item))
            ->map(function (array $item) {
                return [
                    'barangay_profile_id' => (int) ($item['barangay_profile_id'] ?? 0),
                    'barangay_name' => trim((string) ($item['barangay_name'] ?? '')),
                    'municipality_city' => isset($item['municipality_city']) ? trim((string) $item['municipality_city']) : null,
                    'province' => isset($item['province']) ? trim((string) $item['province']) : null,
                ];
            })
            ->filter(fn (array $item) => $item['barangay_profile_id'] > 0 && $item['barangay_name'] !== '')
            ->unique('barangay_profile_id')
            ->values()
            ->all();
    }

    public function index(Request $request, TrainingModule $trainingModule)
    {
        $this->authorizeOwner($trainingModule);

        $campaignRequests = CampaignRequest::query()
            ->with('submittedBy')
            ->where('training_module_id', $trainingModule->id)
            ->orderByDesc('submitted_at')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'requests' => $campaignRequests->map(function (CampaignRequest $item) use ($trainingModule) {
                return [
                    'id' => $item->id,
                    'training_module' => [
                        'id' => $trainingModule->id,
                        'title' => $trainingModule->title,
                    ],
                    'proposed_session_label' => $item->proposed_session_label,
                    'proposed_sessions' => $this->normalizeProposedSessions(
                        is_array($item->payload['available_training_sessions'] ?? null)
                            ? $item->payload['available_training_sessions']
                            : [],
                    ),
                    'submitted_to' => $item->submitted_to,
                    'submitted_at' => $item->submitted_at?->toIso8601String(),
                    'status' => $item->status,
                    'remarks' => $item->remarks,
                    'submitted_by' => $item->submittedBy ? ['id' => $item->submittedBy->id, 'name' => $item->submittedBy->name] : null,
                ];
            })->values(),
        ]);
    }

    public function store(Request $request, TrainingModule $trainingModule)
    {
        $this->authorizeOwner($trainingModule);

        $additionalCommunities = $this->normalizeAdditionalCommunities($request);
        $payload = $this->buildPayload($trainingModule, $additionalCommunities);
        $proposedSessionLabel = $this->normalizeProposedSessionLabel($trainingModule);

        $campaignRequest = CampaignRequest::create([
            'training_module_id' => $trainingModule->id,
            'submitted_to' => 'Public Safety Campaign Management System',
            'proposed_session_label' => $proposedSessionLabel,
            'submitted_at' => now(),
            'status' => 'waiting_for_approval',
            'payload' => $payload,
            'remarks' => null,
            'submitted_by_id' => $request->user()?->id,
        ]);

        return response()->json([
            'success' => true,
            'campaign_request' => [
                'id' => $campaignRequest->id,
                'status' => $campaignRequest->status,
            ],
        ]);
    }

    public function show(Request $request, CampaignRequest $campaignRequest)
    {
        $campaignRequest->load('trainingModule', 'submittedBy');
        $this->authorizeOwner($campaignRequest->trainingModule);

        return response()->json([
            'request' => [
                'id' => $campaignRequest->id,
                'training_module' => [
                    'id' => $campaignRequest->trainingModule->id,
                    'title' => $campaignRequest->trainingModule->title,
                ],
                'proposed_session_label' => $campaignRequest->proposed_session_label,
                'submitted_to' => $campaignRequest->submitted_to,
                'submitted_at' => $campaignRequest->submitted_at?->toIso8601String(),
                'status' => $campaignRequest->status,
                'payload' => $campaignRequest->payload,
                'remarks' => $campaignRequest->remarks,
                'created_at' => $campaignRequest->created_at?->toIso8601String(),
                'updated_at' => $campaignRequest->updated_at?->toIso8601String(),
                'submitted_by' => $campaignRequest->submittedBy ? ['id' => $campaignRequest->submittedBy->id, 'name' => $campaignRequest->submittedBy->name] : null,
            ],
        ]);
    }
}

