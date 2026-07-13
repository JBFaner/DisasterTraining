<?php

namespace Database\Seeders;

use App\Models\CampaignRequest;
use App\Models\LessonCompletion;
use App\Models\TrainingContent;
use App\Models\TrainingModule;
use App\Models\User;
use App\Services\HazardAssessment\HazardTrainingRecommendationService;
use App\Support\CampaignRegistrationLink;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Makes specific approved campaigns eligible for "Create Plan".
 *
 * Fixes registration + training completion deadlines (both passed)
 * and tops up qualified participants when needed.
 *
 * Run: php artisan db:seed --class=SimulationPlanningMakePlanReadySeeder
 */
class SimulationPlanningMakePlanReadySeeder extends Seeder
{
    /** @var list<int> */
    private const CAMPAIGN_IDS = [5, 8];

    public function run(): void
    {
        DB::transaction(function () {
            foreach (self::CAMPAIGN_IDS as $campaignId) {
                $campaignRequest = CampaignRequest::query()
                    ->with(['trainingModule.contents'])
                    ->where('status', 'approved')
                    ->find($campaignId);

                if (! $campaignRequest) {
                    $this->command?->warn("Campaign #{$campaignId} not found or not approved. Skipping.");

                    continue;
                }

                $this->makePlanReady($campaignRequest);
            }
        });
    }

    private function makePlanReady(CampaignRequest $campaignRequest): void
    {
        $module = $campaignRequest->trainingModule;
        if (! $module) {
            $this->command?->warn("Campaign #{$campaignRequest->id} has no training module. Skipping.");

            return;
        }

        $minimumQualified = (int) ($campaignRequest->minimum_qualified_participants ?? 0);
        if ($minimumQualified <= 0) {
            $expected = (int) ($campaignRequest->expected_participants ?? 20);
            $minimumQualified = (int) max(1, round($expected * 0.67));
        }

        $targetQualified = $minimumQualified + 1;
        $registrationOpens = now()->subDays(21);
        $registrationDeadline = now()->subDays(3);
        $trainingCompletionDeadline = now()->subDays(1);

        $module->update([
            'campaign_registration_opens' => $registrationOpens,
            'campaign_registration_deadline' => $registrationDeadline,
            'campaign_training_completion_deadline' => $trainingCompletionDeadline,
        ]);

        $recommendedCommunities = app(HazardTrainingRecommendationService::class)
            ->recommendCommunitiesForTraining($module->fresh());

        $payload = array_merge(
            $campaignRequest->payload ?? [],
            $module->fresh()->toCampaignPlanningPayload($recommendedCommunities),
            [
                'registration_link' => CampaignRegistrationLink::forCampaignRequest($campaignRequest),
                'registration_form_path' => '/participant/register',
                '_test_seeder' => 'simulation_planning_make_plan_ready',
            ],
        );

        $campaignRequest->update([
            'minimum_qualified_participants' => $minimumQualified,
            'simulation_event_id' => null,
            'payload' => $payload,
        ]);

        $added = $this->topUpQualifiedParticipants(
            $campaignRequest,
            $module,
            $targetQualified,
        );

        $this->command?->info("Campaign #{$campaignRequest->id} is now ready for Create Plan.");
        $this->command?->line("  Title: {$campaignRequest->proposed_session_label}");
        $this->command?->line('  Registration deadline: '.$registrationDeadline->toDateTimeString().' (passed)');
        $this->command?->line('  Training completion deadline: '.$trainingCompletionDeadline->toDateTimeString().' (passed)');
        $this->command?->line("  Target qualified: {$targetQualified} (minimum {$minimumQualified})");
        if ($added > 0) {
            $this->command?->line("  Added {$added} qualified participant(s).");
        }
        $this->command?->line('  Planning: /admin/simulation-planning/'.$campaignRequest->id);
        $this->command?->line('  Password for new participants: password');
    }

    private function topUpQualifiedParticipants(
        CampaignRequest $campaignRequest,
        TrainingModule $module,
        int $targetQualified,
    ): int {
        $contents = TrainingContent::query()
            ->where('training_module_id', $module->id)
            ->orderBy('sort_order')
            ->get();

        if ($contents->isEmpty()) {
            return 0;
        }

        $campaignKey = 'campaign-request:'.$campaignRequest->id;
        $currentQualified = $this->countQualifiedParticipants($campaignRequest, $module, $contents->count());
        $needed = max(0, $targetQualified - $currentQualified);

        if ($needed === 0) {
            return 0;
        }

        $slug = 'plan-ready-'.$campaignRequest->id;

        for ($i = 1; $i <= $needed; $i++) {
            $email = "sim-plan-ready.{$slug}.{$i}@example.com";
            $existing = User::query()->where('email', $email)->first();

            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => "Plan Ready Participant {$campaignRequest->id}-{$i}",
                    'password' => bcrypt('password'),
                    'role' => 'PARTICIPANT',
                    'status' => 'active',
                    'participant_id' => $existing?->participant_id ?? $this->uniqueParticipantId(),
                    'registered_at' => now()->subDays(10),
                    'registration_source' => 'campaign_planning_scheduling',
                    'registration_campaign_id' => $campaignKey,
                    'registration_campaign_title' => $module->title,
                    'registration_campaign_registered_at' => now()->subDays(10),
                ],
            );

            foreach ($contents as $content) {
                LessonCompletion::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'training_module_id' => $module->id,
                        'training_content_id' => $content->id,
                    ],
                    [
                        'completed_at' => now()->subDays(random_int(1, 5)),
                    ],
                );
            }
        }

        return $needed;
    }

    private function countQualifiedParticipants(
        CampaignRequest $campaignRequest,
        TrainingModule $module,
        int $totalLessons,
    ): int {
        $participantIds = User::query()
            ->where('role', 'PARTICIPANT')
            ->where('registration_campaign_id', 'campaign-request:'.$campaignRequest->id)
            ->pluck('id');

        $qualified = 0;
        foreach ($participantIds as $userId) {
            $lessonCount = LessonCompletion::query()
                ->where('user_id', $userId)
                ->where('training_module_id', $module->id)
                ->count();

            if ($totalLessons > 0 && $lessonCount >= $totalLessons) {
                $qualified++;
            } elseif ($lessonCount >= 3) {
                $qualified++;
            }
        }

        return $qualified;
    }

    private function uniqueParticipantId(): string
    {
        do {
            $id = 'PART-'.strtoupper(Str::random(8));
        } while (User::where('participant_id', $id)->exists());

        return $id;
    }
}
