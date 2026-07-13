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
 * Seeds 3 approved campaigns that have NOT met the simulation planning quota yet.
 *
 * Run: php artisan db:seed --class=SimulationPlanningUnderQuotaCampaignsSeeder
 */
class SimulationPlanningUnderQuotaCampaignsSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $modules = TrainingModule::query()
                ->where('status', 'published')
                ->with(['contents' => fn ($query) => $query->orderBy('sort_order')])
                ->orderBy('id')
                ->get()
                ->filter(fn (TrainingModule $module) => $module->contents->isNotEmpty())
                ->values();

            if ($modules->isEmpty()) {
                $this->command?->warn('No published training module with lessons found. Run TrainingModuleSeeder first.');

                return;
            }

            $admin = User::query()
                ->whereIn('role', ['LGU_ADMIN', 'LGU_TRAINER'])
                ->orderBy('id')
                ->first();

            $scenarios = [
                [
                    'label' => 'SEEDER: Under Quota - Registration Open',
                    'slug' => 'under-quota-open',
                    'description' => 'Approved, registration still open, only 4 qualified vs 15 minimum.',
                    'expected_participants' => 20,
                    'minimum_qualified' => 15,
                    'registration_deadline_offset_days' => 7,
                    'completed' => 4,
                    'in_progress' => 2,
                    'not_started' => 3,
                ],
                [
                    'label' => 'SEEDER: Under Quota - Low Completion',
                    'slug' => 'under-quota-low',
                    'description' => 'Approved, registration closed, only 6 qualified vs 18 minimum.',
                    'expected_participants' => 24,
                    'minimum_qualified' => 18,
                    'registration_deadline_offset_days' => -3,
                    'completed' => 6,
                    'in_progress' => 4,
                    'not_started' => 5,
                ],
                [
                    'label' => 'SEEDER: Under Quota - Almost Ready',
                    'slug' => 'under-quota-close',
                    'description' => 'Approved, registration closed, 13 qualified vs 15 minimum (2 short).',
                    'expected_participants' => 22,
                    'minimum_qualified' => 15,
                    'registration_deadline_offset_days' => -1,
                    'completed' => 13,
                    'in_progress' => 3,
                    'not_started' => 2,
                ],
            ];

            foreach ($scenarios as $index => $scenario) {
                $module = $modules[$index % $modules->count()];
                $campaignRequest = $this->seedScenario($module, $scenario, $admin);

                $this->command?->info($scenario['label']);
                $this->command?->line("  ID: {$campaignRequest->id} | {$scenario['description']}");
                $this->command?->line('  Planning: /admin/simulation-planning/'.$campaignRequest->id);
            }

            $this->command?->line('Participant password for all seeded accounts: password');
        });
    }

    /**
     * @param  array<string, mixed>  $scenario
     */
    private function seedScenario(TrainingModule $module, array $scenario, ?User $admin): CampaignRequest
    {
        $registrationOpens = now()->subDays(14);
        $registrationDeadline = now()->addDays((int) $scenario['registration_deadline_offset_days']);
        $trainingCompletionDeadline = $registrationDeadline->copy()->addDays(10);

        $module->update([
            'target_audience' => ['Barangay Officials', 'Community Volunteers'],
            'campaign_registration_opens' => $registrationOpens,
            'campaign_registration_deadline' => $registrationDeadline,
            'campaign_training_completion_deadline' => $trainingCompletionDeadline,
            'campaign_expected_participants' => (int) $scenario['expected_participants'],
            'campaign_maximum_participants' => (int) $scenario['expected_participants'] + 10,
        ]);

        $recommendedCommunities = app(HazardTrainingRecommendationService::class)
            ->recommendCommunitiesForTraining($module->fresh());

        $payload = array_merge(
            [
                'submitted_at' => $registrationOpens->copy()->addDay()->toIso8601String(),
                '_test_seeder' => 'simulation_planning_under_quota',
                '_test_seeder_slug' => $scenario['slug'],
            ],
            $module->fresh()->toCampaignPlanningPayload($recommendedCommunities),
        );

        $campaignRequest = CampaignRequest::query()
            ->where('proposed_session_label', $scenario['label'])
            ->first();

        $attributes = [
            'training_module_id' => $module->id,
            'submitted_to' => 'Public Safety Campaign Management System',
            'submitted_at' => $registrationOpens->copy()->addDay(),
            'approved_at' => now()->subDay(),
            'status' => 'approved',
            'expected_participants' => (int) $scenario['expected_participants'],
            'minimum_qualified_participants' => (int) $scenario['minimum_qualified'],
            'simulation_event_id' => null,
            'payload' => $payload,
            'submitted_by_id' => $admin?->id,
        ];

        if ($campaignRequest) {
            $campaignRequest->update($attributes);
        } else {
            $campaignRequest = CampaignRequest::create(array_merge($attributes, [
                'proposed_session_label' => $scenario['label'],
                'session_index' => 0,
                'remarks' => null,
            ]));
        }

        $campaignRequest->update([
            'payload' => array_merge($payload, [
                'registration_link' => CampaignRegistrationLink::forCampaignRequest($campaignRequest),
                'registration_form_path' => '/participant/register',
            ]),
        ]);

        $this->seedParticipants(
            $campaignRequest,
            $module,
            (string) $scenario['slug'],
            (int) $scenario['completed'],
            (int) $scenario['in_progress'],
            (int) $scenario['not_started'],
        );

        return $campaignRequest->fresh();
    }

    private function seedParticipants(
        CampaignRequest $campaignRequest,
        TrainingModule $module,
        string $slug,
        int $completedCount,
        int $inProgressCount,
        int $notStartedCount,
    ): void {
        $campaignKey = 'campaign-request:'.$campaignRequest->id;
        $contents = TrainingContent::query()
            ->where('training_module_id', $module->id)
            ->orderBy('sort_order')
            ->get();

        $seedCompletions = function (User $user, int $lessonCount) use ($module, $contents): void {
            foreach ($contents->take($lessonCount) as $content) {
                LessonCompletion::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'training_module_id' => $module->id,
                        'training_content_id' => $content->id,
                    ],
                    [
                        'completed_at' => now()->subDays(random_int(1, 6)),
                    ],
                );
            }
        };

        $createParticipant = function (string $bucket, int $index) use ($slug, $campaignKey, $module): User {
            $email = "sim-underquota.{$slug}.{$bucket}.{$index}@example.com";
            $existing = User::query()->where('email', $email)->first();

            return User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => 'Under Quota '.str_replace('-', ' ', $slug).' '.ucfirst(str_replace('_', ' ', $bucket))." {$index}",
                    'password' => bcrypt('password'),
                    'role' => 'PARTICIPANT',
                    'status' => 'active',
                    'participant_id' => $existing?->participant_id ?? $this->uniqueParticipantId(),
                    'registered_at' => now()->subDays(8),
                    'registration_source' => 'campaign_planning_scheduling',
                    'registration_campaign_id' => $campaignKey,
                    'registration_campaign_title' => $module->title,
                    'registration_campaign_registered_at' => now()->subDays(8),
                ],
            );
        };

        for ($i = 1; $i <= $completedCount; $i++) {
            $seedCompletions($createParticipant('completed', $i), $contents->count());
        }

        for ($i = 1; $i <= $inProgressCount; $i++) {
            $seedCompletions($createParticipant('in_progress', $i), max(1, (int) floor($contents->count() / 2)));
        }

        for ($i = 1; $i <= $notStartedCount; $i++) {
            $createParticipant('not_started', $i);
        }
    }

    private function uniqueParticipantId(): string
    {
        do {
            $id = 'PART-'.strtoupper(Str::random(8));
        } while (User::where('participant_id', $id)->exists());

        return $id;
    }
}
