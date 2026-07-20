<?php

namespace App\Services;

use App\Models\CampaignRequest;
use App\Models\TrainingModule;
use App\Models\User;
use App\Support\CampaignRegistrationLink;
use Illuminate\Database\Eloquent\Builder;

class ParticipantTrainingAccessService
{
    public function __construct(
        private readonly CampaignRegistrationService $registrationService,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function buildContext(User $user): array
    {
        $registeredModuleIds = $this->registrationService->registeredModuleIdsFor($user);
        $enrollments = $this->registrationService->trainingHistoryFor($user)->take(5)->values()->all();
        $openCampaigns = $this->registrationService->listOpenForRegistration();
        $hasCampaignEnrollment = $registeredModuleIds !== [];

        return [
            'access_mode' => $hasCampaignEnrollment ? 'campaign' : 'self_paced',
            'has_campaign_enrollment' => $hasCampaignEnrollment,
            'registered_module_ids' => $registeredModuleIds,
            'enrollments' => $enrollments,
            'open_campaigns' => $openCampaigns,
            'list_banner' => $hasCampaignEnrollment
                ? [
                    'title' => 'Campaign enrollment view',
                    'body' => 'You joined through a campaign registration link. Only modules assigned to your campaign appear here. Self-paced modules outside your enrollment are hidden.',
                    'action_label' => 'View My Trainings',
                    'action_href' => route('participant.my-trainings.index'),
                ]
                : null,
            'self_paced_hint' => ! $hasCampaignEnrollment
                ? 'Browse self-paced modules below. Modules marked “Campaign enrollment required” need a registration link from your barangay or LGU.'
                : null,
        ];
    }

    /**
     * @return Builder<TrainingModule>
     */
    public function participantModulesQuery(User $user): Builder
    {
        $query = TrainingModule::query()
            ->withCount('contents as lesson_count')
            ->where('status', 'published')
            ->orderByDesc('updated_at');

        $registeredModuleIds = $this->registrationService->registeredModuleIdsFor($user);

        if ($registeredModuleIds !== []) {
            $query->whereIn('id', $registeredModuleIds);

            return $query;
        }

        return $query;
    }

    /**
     * @return array<string, mixed>|null Null when access is allowed.
     */
    public function moduleAccessBlock(User $user, TrainingModule $module): ?array
    {
        if ($module->status !== 'published') {
            return $this->denyPayload(
                reason: 'unpublished',
                title: 'Module unavailable',
                body: 'This training module is not published yet.',
                actionLabel: 'Browse modules',
                actionHref: route('participant.training-modules.index'),
            );
        }

        $registeredModuleIds = $this->registrationService->registeredModuleIdsFor($user);

        if ($registeredModuleIds !== [] && ! in_array((int) $module->id, $registeredModuleIds, true)) {
            $enrollment = collect($this->registrationService->trainingHistoryFor($user))
                ->first(fn (array $row) => (int) ($row['training_module_id'] ?? 0) > 0);

            return $this->denyPayload(
                reason: 'campaign_enrollment',
                title: 'Not included in your campaign',
                body: 'This module is outside your campaign enrollment. Open a module from your assigned campaign list, or check My Trainings for your registration details.',
                actionLabel: 'My Trainings',
                actionHref: route('participant.my-trainings.index'),
                secondaryActionLabel: 'Assigned modules',
                secondaryActionHref: route('participant.training-modules.index'),
                module: $module,
                enrollment: $enrollment,
            );
        }

        if ($registeredModuleIds === [] && $this->moduleRequiresCampaignEnrollment($module)) {
            $openCampaign = collect($this->registrationService->listOpenForRegistration())
                ->first(fn (array $campaign) => (int) ($campaign['training_module_id'] ?? 0) === (int) $module->id);

            $body = $openCampaign
                ? 'This module is offered through a scheduled campaign. Register using the campaign link shared by your organizer before you can start lessons.'
                : 'This module is offered through a campaign batch. Ask your barangay or LGU coordinator for the registration link, or browse self-paced modules instead.';

            return $this->denyPayload(
                reason: 'campaign_required',
                title: 'Campaign enrollment required',
                body: $body,
                actionLabel: $openCampaign ? 'Register for campaign' : 'Browse self-paced modules',
                actionHref: $openCampaign
                    ? CampaignRegistrationLink::forCampaignRequest((int) $openCampaign['campaign_request_id'])
                    : route('participant.training-modules.index'),
                secondaryActionLabel: 'My Trainings',
                secondaryActionHref: route('participant.my-trainings.index'),
                module: $module,
                open_campaign: $openCampaign,
            );
        }

        return null;
    }

    public function moduleRequiresCampaignEnrollment(TrainingModule $module): bool
    {
        return CampaignRequest::query()
            ->where('training_module_id', $module->id)
            ->where('status', 'approved')
            ->exists();
    }

    /**
     * @return array<string, mixed>
     */
    public function enrichModuleForParticipant(User $user, TrainingModule $module): array
    {
        $data = $module->toArray();
        $registeredModuleIds = $this->registrationService->registeredModuleIdsFor($user);
        $requiresCampaign = $this->moduleRequiresCampaignEnrollment($module);
        $isRegistered = in_array((int) $module->id, $registeredModuleIds, true);
        $accessBlocked = $this->moduleAccessBlock($user, $module);

        $data['requires_campaign_enrollment'] = $requiresCampaign;
        $data['is_campaign_assigned'] = $isRegistered;
        $data['is_accessible'] = $accessBlocked === null;
        $data['access_lock_reason'] = $accessBlocked['reason'] ?? null;
        $data['access_lock_message'] = $accessBlocked['body'] ?? null;

        if ($accessBlocked && $accessBlocked['reason'] === 'campaign_required') {
            $data['open_campaign'] = $accessBlocked['open_campaign'] ?? null;
        }

        return $data;
    }

    /**
     * @param  array<string, mixed>|null  $enrollment
     * @param  array<string, mixed>|null  $openCampaign
     * @return array<string, mixed>
     */
    private function denyPayload(
        string $reason,
        string $title,
        string $body,
        string $actionLabel,
        string $actionHref,
        ?string $secondaryActionLabel = null,
        ?string $secondaryActionHref = null,
        ?TrainingModule $module = null,
        ?array $enrollment = null,
        ?array $openCampaign = null,
    ): array {
        return [
            'reason' => $reason,
            'title' => $title,
            'body' => $body,
            'action_label' => $actionLabel,
            'action_href' => $actionHref,
            'secondary_action_label' => $secondaryActionLabel,
            'secondary_action_href' => $secondaryActionHref,
            'module' => $module ? [
                'id' => $module->id,
                'title' => $module->title,
                'category' => $module->category,
            ] : null,
            'enrollment' => $enrollment,
            'open_campaign' => $openCampaign,
        ];
    }
}
