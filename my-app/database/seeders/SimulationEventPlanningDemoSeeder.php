<?php

namespace Database\Seeders;

use App\Models\CampaignRequest;
use App\Models\LessonCompletion;
use App\Models\SimulationExerciseTemplate;
use App\Models\TrainingContent;
use App\Models\TrainingModule;
use App\Models\User;
use App\Services\SimulationExerciseTemplateService;
use App\Support\CampaignRegistrationLink;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Seeds demo data for the Simulation Event Planning module:
 * - 10 published exercise plans (reusable templates)
 * - 10 approved campaigns ready for simulation (Use Template enabled)
 *
 * Run: php artisan db:seed --class=SimulationEventPlanningDemoSeeder
 */
class SimulationEventPlanningDemoSeeder extends Seeder
{
    public const SEEDER_TAG = 'simulation_event_planning_demo';

    /** @var list<string> */
    private const COMMUNITIES = [
        'Bagong Silangan',
        'Commonwealth',
        'Holy Spirit',
        'Batasan Hills',
        'Payatas',
        'Fairview',
        'Novaliches Proper',
        'Pasong Tamo',
        'Greater Lagro',
        'Gulod',
    ];

    public function run(): void
    {
        DB::transaction(function () {
            $admin = User::query()
                ->whereIn('role', ['LGU_ADMIN', 'LGU_TRAINER'])
                ->orderBy('id')
                ->first();

            $modules = TrainingModule::query()
                ->where('status', 'published')
                ->with(['contents' => fn ($query) => $query->orderBy('sort_order')])
                ->orderBy('id')
                ->get()
                ->filter(fn (TrainingModule $module) => $module->contents->isNotEmpty())
                ->values();

            if ($modules->isEmpty()) {
                $this->command?->warn('No published training modules found. Run TrainingModuleSeeder first.');

                return;
            }

            $templateService = app(SimulationExerciseTemplateService::class);
            $exercisePlans = $this->exercisePlanDefinitions();

            foreach ($exercisePlans as $definition) {
                $existing = SimulationExerciseTemplate::query()
                    ->where('title', $definition['title'])
                    ->first();

                $templateService->saveTemplate($existing, $definition, $admin?->id);
            }

            $campaignScenarios = $this->campaignScenarios();
            $seededCampaigns = 0;

            foreach ($campaignScenarios as $index => $scenario) {
                $module = $modules[$index % $modules->count()];
                $this->ensureMinimumLessons($module);

                $community = self::COMMUNITIES[$index % count(self::COMMUNITIES)];
                $campaignRequest = $this->seedReadyCampaign($module, $scenario, $community, $admin);
                $seededCampaigns++;

                $this->command?->line(sprintf(
                    '  [%02d] Campaign #%d — %s (%s)',
                    $index + 1,
                    $campaignRequest->id,
                    $scenario['title'],
                    $community,
                ));
            }

            $this->command?->info('Simulation Event Planning demo data seeded successfully.');
            $this->command?->line('Published exercise plans: '.count($exercisePlans));
            $this->command?->line("Ready campaigns: {$seededCampaigns}");
            $this->command?->line('Open: /admin/simulation-events');
            $this->command?->line('Participant password: password');
        });
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function exercisePlanDefinitions(): array
    {
        $basePersonnel = [
            ['role' => 'Lead Trainer', 'recommended_count' => 1, 'notes' => 'Oversees exercise flow'],
            ['role' => 'Safety Officer', 'recommended_count' => 1, 'notes' => 'Monitors hazards and PPE compliance'],
            ['role' => 'Medical Team', 'recommended_count' => 2, 'notes' => 'Standby for casualties'],
            ['role' => 'Marshal', 'recommended_count' => 2, 'notes' => 'Guides routes and assembly areas'],
            ['role' => 'Evaluator', 'recommended_count' => 2, 'notes' => 'Records performance observations'],
        ];

        $baseEvaluation = [
            ['heading' => 'Response Performance', 'objective_text' => 'Followed safety briefing instructions'],
            ['heading' => 'Response Performance', 'objective_text' => 'Executed assigned role within time limits'],
            ['heading' => 'Coordination', 'objective_text' => 'Communicated clearly with team members'],
        ];

        $plans = [
            ['title' => 'Fire Safety Practical Training', 'category' => 'Fire Safety', 'exercise_type' => 'Drill', 'minutes' => 125],
            ['title' => 'Fire Extinguisher Hands-on Drill', 'category' => 'Fire Safety', 'exercise_type' => 'Drill', 'minutes' => 90],
            ['title' => 'Earthquake Drop-Cover-Hold Drill', 'category' => 'Earthquake', 'exercise_type' => 'Drill', 'minutes' => 75],
            ['title' => 'Earthquake Evacuation Functional Exercise', 'category' => 'Earthquake', 'exercise_type' => 'Functional Exercise', 'minutes' => 120],
            ['title' => 'Flood Early Warning Drill', 'category' => 'Flood', 'exercise_type' => 'Drill', 'minutes' => 100],
            ['title' => 'Flood Rescue Boat Deployment Exercise', 'category' => 'Flood', 'exercise_type' => 'Functional Exercise', 'minutes' => 150],
            ['title' => 'Typhoon Pre-Landfall Evacuation Drill', 'category' => 'Typhoon', 'exercise_type' => 'Drill', 'minutes' => 110],
            ['title' => 'Landslide Community Evacuation Drill', 'category' => 'Landslide', 'exercise_type' => 'Drill', 'minutes' => 95],
            ['title' => 'Barangay First Aid Response Drill', 'category' => 'First Aid', 'exercise_type' => 'Drill', 'minutes' => 85],
            ['title' => 'Multi-Hazard Barangay Coordination Exercise', 'category' => 'Multi-Hazard', 'exercise_type' => 'Full Scale Exercise', 'minutes' => 180],
        ];

        return array_map(function (array $plan) use ($basePersonnel, $baseEvaluation) {
            $category = $plan['category'];
            $title = $plan['title'];
            $minutes = (int) $plan['minutes'];

            return [
                'title' => $title,
                'category' => $category,
                'exercise_type' => $plan['exercise_type'],
                'difficulty_level' => 'Intermediate',
                'estimated_duration_minutes' => $minutes,
                'status' => SimulationExerciseTemplate::STATUS_PUBLISHED,
                'objectives' => "Equip barangay responders and volunteers with practical {$category} skills through structured drills, coordination, and after-action review.",
                'scenario_summary' => "A {$category} simulation exercise for community disaster volunteers covering briefing, hands-on response stations, evacuation or rescue coordination, and debrief.",
                'expected_hazards' => "Secondary hazards during {$category} response\nCrowd panic\nCommunication delays\nIncomplete PPE usage",
                'learning_objectives' => "Apply {$category} response procedures\nCoordinate with assigned roles\nExecute evacuation or rescue protocols\nParticipate in structured debrief",
                'safety_reminders' => "Wear required PPE at all times\nFollow marshal and safety officer instructions\nNo unauthorized entry to hazard zones\nReport injuries immediately",
                'activities' => [
                    ['title' => 'Registration and Safety Briefing', 'description' => 'Check-in, hazard review, and exercise rules.', 'duration_minutes' => 15, 'start_time' => '08:00'],
                    ['title' => 'Skills Station Rotation', 'description' => "Hands-on {$category} response practice.", 'duration_minutes' => (int) max(30, round($minutes * 0.35)), 'start_time' => '08:15'],
                    ['title' => 'Scenario Activation', 'description' => 'Timed scenario with role-based tasks.', 'duration_minutes' => (int) max(25, round($minutes * 0.3)), 'start_time' => '09:30'],
                    ['title' => 'Evacuation or Recovery Phase', 'description' => 'Movement to assembly area and status reporting.', 'duration_minutes' => (int) max(20, round($minutes * 0.2)), 'start_time' => '10:30'],
                    ['title' => 'Debrief and Evaluation', 'description' => 'After-action review and lessons learned.', 'duration_minutes' => (int) max(15, round($minutes * 0.15)), 'start_time' => '11:15'],
                ],
                'personnel' => $basePersonnel,
                'evaluation_objectives' => array_merge($baseEvaluation, [
                    ['heading' => $title, 'objective_text' => 'Completed assigned tasks within the exercise timeline'],
                ]),
            ];
        }, $plans);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function campaignScenarios(): array
    {
        return [
            ['title' => 'Earthquake Drill and Evacuation', 'expected' => 22, 'minimum' => 15, 'registered' => 18, 'qualified' => 16],
            ['title' => 'Flood Preparedness and Early Warning', 'expected' => 24, 'minimum' => 16, 'registered' => 20, 'qualified' => 18],
            ['title' => 'Fire Safety and Emergency Response', 'expected' => 20, 'minimum' => 14, 'registered' => 19, 'qualified' => 17],
            ['title' => 'Typhoon Readiness Community Drill', 'expected' => 25, 'minimum' => 17, 'registered' => 23, 'qualified' => 20],
            ['title' => 'Landslide Watch and Evacuation', 'expected' => 21, 'minimum' => 14, 'registered' => 17, 'qualified' => 15],
            ['title' => 'Barangay First Aid Certification Drive', 'expected' => 30, 'minimum' => 20, 'registered' => 28, 'qualified' => 24],
            ['title' => 'Urban Search and Rescue Orientation', 'expected' => 18, 'minimum' => 12, 'registered' => 16, 'qualified' => 14],
            ['title' => 'Multi-Hazard Community Resilience Week', 'expected' => 32, 'minimum' => 22, 'registered' => 30, 'qualified' => 26],
            ['title' => 'Fire Extinguisher Practical for Volunteers', 'expected' => 19, 'minimum' => 13, 'registered' => 17, 'qualified' => 15],
            ['title' => 'Flood Rescue Coordination Exercise', 'expected' => 23, 'minimum' => 16, 'registered' => 21, 'qualified' => 18],
        ];
    }

    /**
     * @param  array<string, mixed>  $scenario
     */
    private function seedReadyCampaign(
        TrainingModule $module,
        array $scenario,
        string $community,
        ?User $admin,
    ): CampaignRequest {
        $label = 'SEEDER: Demo Ready — '.$scenario['title'];
        $registrationOpens = now()->subDays(21);
        $registrationDeadline = now()->subDays(3);
        $trainingCompletionDeadline = now()->subDays(1);
        $expectedParticipants = (int) $scenario['expected'];
        $minimumQualified = (int) $scenario['minimum'];

        $module->update([
            'target_audience' => ['Barangay Officials', 'Community Volunteers', 'Emergency Responders'],
            'campaign_registration_opens' => $registrationOpens,
            'campaign_registration_deadline' => $registrationDeadline,
            'campaign_training_completion_deadline' => $trainingCompletionDeadline,
            'campaign_expected_participants' => $expectedParticipants,
            'campaign_maximum_participants' => $expectedParticipants + 10,
        ]);

        $recommendedCommunities = [
            'summary' => [
                'total_communities' => 1,
                'high_priority' => 1,
                'medium_priority' => 0,
                'low_priority' => 0,
            ],
            'communities' => [
                [
                    'barangay_name' => $community,
                    'priority' => 'high',
                    'hazard_score' => 82,
                ],
            ],
        ];

        $payload = array_merge(
            [
                'submitted_at' => $registrationOpens->copy()->addDay()->toIso8601String(),
                'training_title' => $scenario['title'],
                '_test_seeder' => self::SEEDER_TAG,
            ],
            $module->fresh()->toCampaignPlanningPayload($recommendedCommunities),
        );

        $campaignRequest = CampaignRequest::query()
            ->where('proposed_session_label', $label)
            ->first();

        $attributes = [
            'training_module_id' => $module->id,
            'submitted_to' => 'Public Safety Campaign Management System',
            'submitted_at' => $registrationOpens->copy()->addDay(),
            'approved_at' => now()->subDays(2),
            'status' => 'approved',
            'expected_participants' => $expectedParticipants,
            'minimum_qualified_participants' => $minimumQualified,
            'simulation_event_id' => null,
            'payload' => $payload,
            'submitted_by_id' => $admin?->id,
        ];

        if ($campaignRequest) {
            $campaignRequest->update($attributes);
        } else {
            $campaignRequest = CampaignRequest::create(array_merge($attributes, [
                'proposed_session_label' => $label,
                'session_index' => 0,
                'remarks' => null,
            ]));
        }

        $registrationLink = CampaignRegistrationLink::forCampaignRequest($campaignRequest);
        $campaignRequest->update([
            'payload' => array_merge($payload, [
                'registration_link' => $registrationLink,
                'registration_form_path' => '/participant/register',
                'registration_deadline' => $registrationDeadline->toIso8601String(),
                'training_completion_deadline' => $trainingCompletionDeadline->toIso8601String(),
            ]),
        ]);

        $this->seedParticipants(
            $campaignRequest,
            $module,
            $community,
            (int) $scenario['registered'],
            (int) $scenario['qualified'],
        );

        return $campaignRequest->fresh();
    }

    private function seedParticipants(
        CampaignRequest $campaignRequest,
        TrainingModule $module,
        string $community,
        int $registeredTarget,
        int $qualifiedTarget,
    ): void {
        $campaignKey = 'campaign-request:'.$campaignRequest->id;
        $contents = TrainingContent::query()
            ->where('training_module_id', $module->id)
            ->orderBy('sort_order')
            ->get();

        $lessonCount = max(1, $contents->count());
        $qualifiedTarget = min($qualifiedTarget, $registeredTarget);
        $inProgressCount = max(0, min(3, $registeredTarget - $qualifiedTarget));
        $notStartedCount = max(0, $registeredTarget - $qualifiedTarget - $inProgressCount);
        $slug = Str::slug(Str::limit($campaignRequest->proposed_session_label, 40, ''));

        $createParticipant = function (string $bucket, int $index) use ($campaignKey, $module, $community, $slug): User {
            $email = "sim-demo.{$slug}.{$bucket}.{$index}@example.com";
            $existing = User::query()->where('email', $email)->first();

            return User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => 'Demo '.ucfirst(str_replace('_', ' ', $bucket))." {$index}",
                    'password' => bcrypt('password'),
                    'role' => 'PARTICIPANT',
                    'status' => 'active',
                    'participant_id' => $existing?->participant_id ?? $this->uniqueParticipantId(),
                    'registered_at' => now()->subDays(10),
                    'registration_source' => 'campaign_planning_scheduling',
                    'registration_campaign_id' => $campaignKey,
                    'registration_campaign_title' => $module->title,
                    'registration_campaign_registered_at' => now()->subDays(10),
                    'barangay' => $community,
                ],
            );
        };

        $seedCompletions = function (User $user, int $completedLessons) use ($module, $contents): void {
            foreach ($contents->take($completedLessons) as $content) {
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

        for ($i = 1; $i <= $qualifiedTarget; $i++) {
            $user = $createParticipant('qualified', $i);
            $seedCompletions($user, $lessonCount);
        }

        for ($i = 1; $i <= $inProgressCount; $i++) {
            $user = $createParticipant('in_progress', $i);
            $seedCompletions($user, max(1, (int) floor($lessonCount / 2)));
        }

        for ($i = 1; $i <= $notStartedCount; $i++) {
            $createParticipant('registered', $i);
        }
    }

    private function ensureMinimumLessons(TrainingModule $module): void
    {
        if ($module->contents()->count() >= 1) {
            return;
        }

        TrainingContent::create([
            'training_module_id' => $module->id,
            'title' => 'Seeder Supplemental Lesson',
            'description' => 'Auto-added for simulation planning demo data.',
            'sort_order' => 1,
        ]);
    }

    private function uniqueParticipantId(): string
    {
        do {
            $id = 'PART-'.strtoupper(Str::random(8));
        } while (User::where('participant_id', $id)->exists());

        return $id;
    }
}
