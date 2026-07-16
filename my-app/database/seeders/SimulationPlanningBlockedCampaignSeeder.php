<?php

namespace Database\Seeders;

use App\Models\CampaignRequest;
use App\Models\CampaignRegistration;
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
 * Seeds an approved campaign that is NOT yet ready for simulation generation:
 * - registration deadline is still open
 * - qualified participants are below minimum
 *
 * Run: php artisan db:seed --class=SimulationPlanningBlockedCampaignSeeder
 */
class SimulationPlanningBlockedCampaignSeeder extends Seeder
{
    public const SEEDER_LABEL = 'SEEDER: Simulation Planning Blocked Test';

    public function run(): void
    {
        DB::transaction(function () {
            $module = TrainingModule::query()
                ->where('status', 'published')
                ->with(['contents' => fn ($query) => $query->orderBy('sort_order')])
                ->orderByDesc('id')
                ->get()
                ->first(fn (TrainingModule $item) => $item->contents->isNotEmpty());

            if (! $module) {
                $this->command?->warn('No published training module with lessons found. Run TrainingModuleSeeder first.');

                return;
            }

            $admin = User::query()
                ->whereIn('role', ['LGU_ADMIN', 'LGU_TRAINER'])
                ->orderBy('id')
                ->first();

            $expectedParticipants = 20;
            $minimumQualified = 15;
            $registrationOpens = now()->subDays(3);
            $registrationDeadline = now()->addDays(5);

            $module->update([
                'target_audience' => ['Barangay Officials'],
                'campaign_registration_opens' => $registrationOpens,
                'campaign_registration_deadline' => $registrationDeadline,
                'campaign_training_completion_deadline' => now()->addDays(20),
                'campaign_expected_participants' => $expectedParticipants,
                'campaign_maximum_participants' => 30,
            ]);

            $recommendedCommunities = app(HazardTrainingRecommendationService::class)
                ->recommendCommunitiesForTraining($module->fresh());

            $payload = array_merge(
                [
                    'submitted_at' => $registrationOpens->toIso8601String(),
                    '_test_seeder' => 'simulation_planning_blocked',
                ],
                $module->fresh()->toCampaignPlanningPayload($recommendedCommunities),
            );

            $campaignRequest = CampaignRequest::query()
                ->where('proposed_session_label', self::SEEDER_LABEL)
                ->first();

            if ($campaignRequest) {
                $campaignRequest->update([
                    'training_module_id' => $module->id,
                    'submitted_at' => $registrationOpens,
                    'approved_at' => now(),
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
                    'submitted_at' => $registrationOpens,
                    'approved_at' => now(),
                    'status' => 'approved',
                    'expected_participants' => $expectedParticipants,
                    'minimum_qualified_participants' => $minimumQualified,
                    'session_index' => 0,
                    'payload' => $payload,
                    'remarks' => null,
                    'submitted_by_id' => $admin?->id,
                ]);
            }

            $campaignRequest->update([
                'payload' => array_merge($payload, [
                    'registration_link' => CampaignRegistrationLink::forCampaignRequest($campaignRequest),
                    'registration_form_path' => '/campaigns/'.$campaignRequest->id.'/register',
                ]),
            ]);

            $campaignKey = 'campaign-request:'.$campaignRequest->id;
            $contents = TrainingContent::query()
                ->where('training_module_id', $module->id)
                ->orderBy('sort_order')
                ->get();

            CampaignRegistration::query()
                ->where('campaign_request_id', $campaignRequest->id)
                ->whereHas('user', fn ($q) => $q->where('email', 'like', 'sim-blocked.%@example.com'))
                ->delete();

            User::query()
                ->where('email', 'like', 'sim-blocked.%@example.com')
                ->whereDoesntHave('campaignRegistrations')
                ->delete();

            for ($i = 1; $i <= 5; $i++) {
                $user = User::updateOrCreate(
                    ['email' => "sim-blocked.completed.{$i}@example.com"],
                    [
                        'name' => "Sim Blocked Completed {$i}",
                        'password' => bcrypt('password'),
                        'role' => 'PARTICIPANT',
                        'status' => 'active',
                        'participant_id' => $this->uniqueParticipantId(),
                        'registered_at' => now()->subDay(),
                        'registration_source' => 'campaign_planning_scheduling',
                        'registration_campaign_id' => $campaignKey,
                        'registration_campaign_title' => $module->title,
                        'registration_campaign_registered_at' => now()->subDay(),
                    ],
                );

                CampaignRegistration::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'campaign_request_id' => $campaignRequest->id,
                    ],
                    [
                        'training_module_id' => $module->id,
                        'registration_status' => CampaignRegistration::STATUS_REGISTERED,
                        'registered_at' => now()->subDay(),
                        'attendance_status' => CampaignRegistration::ATTENDANCE_NOT_STARTED,
                        'evaluation_status' => CampaignRegistration::EVALUATION_NOT_STARTED,
                        'certificate_status' => CampaignRegistration::CERTIFICATE_NOT_ISSUED,
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
                            'completed_at' => now()->subHours(6),
                        ],
                    );
                }
            }

            for ($i = 1; $i <= 3; $i++) {
                $user = User::updateOrCreate(
                    ['email' => "sim-blocked.notstarted.{$i}@example.com"],
                    [
                        'name' => "Sim Blocked Not Started {$i}",
                        'password' => bcrypt('password'),
                        'role' => 'PARTICIPANT',
                        'status' => 'active',
                        'participant_id' => $this->uniqueParticipantId(),
                        'registered_at' => now()->subDay(),
                        'registration_source' => 'campaign_planning_scheduling',
                        'registration_campaign_id' => $campaignKey,
                        'registration_campaign_title' => $module->title,
                        'registration_campaign_registered_at' => now()->subDay(),
                    ],
                );

                CampaignRegistration::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'campaign_request_id' => $campaignRequest->id,
                    ],
                    [
                        'training_module_id' => $module->id,
                        'registration_status' => CampaignRegistration::STATUS_REGISTERED,
                        'registered_at' => now()->subDay(),
                        'attendance_status' => CampaignRegistration::ATTENDANCE_NOT_STARTED,
                        'evaluation_status' => CampaignRegistration::EVALUATION_NOT_STARTED,
                        'certificate_status' => CampaignRegistration::CERTIFICATE_NOT_ISSUED,
                    ],
                );
            }

            $this->command?->info('Simulation Planning BLOCKED test campaign seeded successfully.');
            $this->command?->line("Campaign Request ID: {$campaignRequest->id}");
            $this->command?->line('Registration deadline: '.$registrationDeadline->toDateTimeString().' (still open)');
            $this->command?->line("Qualified participants seeded: 5 (minimum required: {$minimumQualified})");
            $this->command?->line('Open planning: /admin/simulation-planning/'.$campaignRequest->id);
        });
    }

    private function uniqueParticipantId(): string
    {
        do {
            $id = 'PART-'.strtoupper(Str::random(8));
        } while (User::where('participant_id', $id)->exists());

        return $id;
    }
}
