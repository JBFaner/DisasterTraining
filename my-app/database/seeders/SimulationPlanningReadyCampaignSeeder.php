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
 * Seeds an approved campaign that is ready for Simulation Event Planning:
 * - registration deadline has passed
 * - qualified participants meet minimum threshold
 *
 * Run: php artisan db:seed --class=SimulationPlanningReadyCampaignSeeder
 */
class SimulationPlanningReadyCampaignSeeder extends Seeder
{
    public const SEEDER_LABEL = 'SEEDER: Simulation Planning Ready Test';

    public function run(): void
    {
        DB::transaction(function () {
            $module = TrainingModule::query()
                ->where('status', 'published')
                ->with(['contents' => fn ($query) => $query->orderBy('sort_order')])
                ->orderBy('id')
                ->get()
                ->first(fn (TrainingModule $item) => $item->contents->isNotEmpty());

            if (! $module) {
                $this->command?->warn('No published training module with lessons found. Run TrainingModuleSeeder first.');

                return;
            }

            $this->ensureMinimumLessons($module);

            $admin = User::query()
                ->whereIn('role', ['LGU_ADMIN', 'LGU_TRAINER'])
                ->orderBy('id')
                ->first();

            $expectedParticipants = 25;
            $minimumQualified = (int) max(1, round($expectedParticipants * 0.67));
            $registrationOpens = now()->subDays(21);
            $registrationDeadline = now()->subDays(2);
            $trainingCompletionDeadline = now()->subDays(1);

            $module->update([
                'target_audience' => ['Barangay Officials', 'Community Volunteers'],
                'campaign_registration_opens' => $registrationOpens,
                'campaign_registration_deadline' => $registrationDeadline,
                'campaign_training_completion_deadline' => $trainingCompletionDeadline,
                'campaign_expected_participants' => $expectedParticipants,
                'campaign_maximum_participants' => 35,
            ]);

            $recommendedCommunities = app(HazardTrainingRecommendationService::class)
                ->recommendCommunitiesForTraining($module->fresh());

            $payload = array_merge(
                [
                    'submitted_at' => $registrationOpens->copy()->addDay()->toIso8601String(),
                    '_test_seeder' => 'simulation_planning_ready',
                ],
                $module->fresh()->toCampaignPlanningPayload($recommendedCommunities),
            );

            $campaignRequest = CampaignRequest::query()
                ->where('proposed_session_label', self::SEEDER_LABEL)
                ->first();

            if ($campaignRequest) {
                $campaignRequest->update([
                    'training_module_id' => $module->id,
                    'submitted_to' => 'Public Safety Campaign Management System',
                    'submitted_at' => $registrationOpens->copy()->addDay(),
                    'approved_at' => now()->subDay(),
                    'status' => 'approved',
                    'expected_participants' => $expectedParticipants,
                    'minimum_qualified_participants' => $minimumQualified,
                    'simulation_event_id' => null,
                    'payload' => $payload,
                    'submitted_by_id' => $admin?->id,
                ]);
            } else {
                $campaignRequest = CampaignRequest::create([
                    'training_module_id' => $module->id,
                    'submitted_to' => 'Public Safety Campaign Management System',
                    'proposed_session_label' => self::SEEDER_LABEL,
                    'submitted_at' => $registrationOpens->copy()->addDay(),
                    'approved_at' => now()->subDay(),
                    'status' => 'approved',
                    'expected_participants' => $expectedParticipants,
                    'minimum_qualified_participants' => $minimumQualified,
                    'session_index' => 0,
                    'payload' => $payload,
                    'remarks' => null,
                    'submitted_by_id' => $admin?->id,
                ]);
            }

            $registrationLink = CampaignRegistrationLink::forCampaignRequest($campaignRequest);
            $campaignRequest->update([
                'payload' => array_merge($payload, [
                    'registration_link' => $registrationLink,
                    'registration_form_path' => '/participant/register',
                ]),
            ]);

            $campaignKey = 'campaign-request:'.$campaignRequest->id;
            $contents = TrainingContent::query()
                ->where('training_module_id', $module->id)
                ->orderBy('sort_order')
                ->get();

            $completedCount = $minimumQualified + 4;
            $inProgressCount = 3;
            $notStartedCount = 2;
            $totalParticipants = $completedCount + $inProgressCount + $notStartedCount;

            $community = $this->resolveCommunityName($recommendedCommunities);
            $counts = [
                'completed' => 0,
                'in_progress' => 0,
                'not_started' => 0,
            ];

            $createParticipant = function (string $bucket, int $index) use ($campaignKey, $module, $community): User {
                $email = "sim-ready.{$bucket}.{$index}@example.com";
                $existing = User::query()->where('email', $email)->first();

                return User::updateOrCreate(
                    ['email' => $email],
                    [
                        'name' => 'Sim Ready '.ucfirst(str_replace('_', ' ', $bucket))." {$index}",
                        'password' => bcrypt('password'),
                        'role' => 'PARTICIPANT',
                        'status' => 'active',
                        'participant_id' => $existing?->participant_id ?? $this->uniqueParticipantId(),
                        'registered_at' => now()->subDays(10),
                        'registration_source' => 'campaign_planning_scheduling',
                        'registration_campaign_id' => $campaignKey,
                        'registration_campaign_title' => $module->title,
                        'registration_campaign_registered_at' => now()->subDays(10),
                        'barangay' => $community !== '—' ? $community : 'Barangay Demo',
                    ],
                );
            };

            $seedCompletions = function (User $user, int $lessonCount) use ($module, $contents): void {
                foreach ($contents->take($lessonCount) as $content) {
                    LessonCompletion::updateOrCreate(
                        [
                            'user_id' => $user->id,
                            'training_module_id' => $module->id,
                            'training_content_id' => $content->id,
                        ],
                        [
                            'completed_at' => now()->subDays(random_int(1, 8)),
                        ],
                    );
                }
            };

            for ($i = 1; $i <= $completedCount; $i++) {
                $user = $createParticipant('completed', $i);
                $seedCompletions($user, $contents->count());
                $counts['completed']++;
            }

            for ($i = 1; $i <= $inProgressCount; $i++) {
                $user = $createParticipant('in_progress', $i);
                $seedCompletions($user, max(1, (int) floor($contents->count() / 2)));
                $counts['in_progress']++;
            }

            for ($i = 1; $i <= $notStartedCount; $i++) {
                $createParticipant('not_started', $i);
                $counts['not_started']++;
            }

            $this->command?->info('Simulation Planning READY test campaign seeded successfully.');
            $this->command?->line("Campaign Request ID: {$campaignRequest->id}");
            $this->command?->line("Training Module: {$module->title} (#{$module->id})");
            $this->command?->line('Registration deadline: '.$registrationDeadline->toDateTimeString().' (passed)');
            $this->command?->line('Training completion deadline: '.$trainingCompletionDeadline->toDateTimeString().' (passed)');
            $this->command?->line("Expected participants: {$expectedParticipants}");
            $this->command?->line("Minimum qualified: {$minimumQualified}");
            $this->command?->line("Participants seeded: {$totalParticipants} (Completed={$counts['completed']}, In Progress={$counts['in_progress']}, Not Started={$counts['not_started']})");
            $this->command?->line('Open planning: /admin/simulation-planning/'.$campaignRequest->id);
            $this->command?->line('Simulation list: /admin/simulation-events');
            $this->command?->line('Test login password for seeded participants: password');
        });
    }

    private function ensureMinimumLessons(TrainingModule $module): void
    {
        if ($module->contents()->count() >= 2) {
            return;
        }

        $nextOrder = (int) ($module->contents()->max('sort_order') ?? 0) + 1;
        TrainingContent::create([
            'training_module_id' => $module->id,
            'title' => 'Seeder Supplemental Lesson',
            'description' => 'Auto-added so simulation planning completion rules can be tested.',
            'sort_order' => $nextOrder,
        ]);

        $module->load(['contents' => fn ($query) => $query->orderBy('sort_order')]);
    }

    /**
     * @param  array<string, mixed>|null  $recommendedCommunities
     */
    private function resolveCommunityName(?array $recommendedCommunities): string
    {
        if (is_array($recommendedCommunities) && is_array($recommendedCommunities['communities'][0] ?? null)) {
            return (string) ($recommendedCommunities['communities'][0]['barangay_name'] ?? '—');
        }

        return 'Barangay Demo';
    }

    private function uniqueParticipantId(): string
    {
        do {
            $id = 'PART-'.strtoupper(Str::random(8));
        } while (User::where('participant_id', $id)->exists());

        return $id;
    }
}
