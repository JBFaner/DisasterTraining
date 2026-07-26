<?php

namespace Database\Seeders;

use App\Models\AiScenarioAttempt;
use App\Models\Attendance;
use App\Models\CampaignRegistration;
use App\Models\CampaignRequest;
use App\Models\EvaluationResult;
use App\Models\EventRegistration;
use App\Models\LessonCompletion;
use App\Models\LessonQuizAttempt;
use App\Models\LessonQuizConfig;
use App\Models\QualifiedTrainer;
use App\Models\Scenario;
use App\Models\SimulationEvent;
use App\Models\SimulationExerciseTemplate;
use App\Models\TrainingContent;
use App\Models\TrainingModule;
use App\Models\User;
use App\Services\SimulationEventLifecycleService;
use App\Services\SimulationEventPlanningService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Presentation-ready Ongoing simulation (5:20 PM – 9:00 PM) with realistic
 * Barangay San Agustin / Novaliches participants, training completions, and module scores.
 *
 * Run: php artisan db:seed --class=PresentationOngoingSimulationSeeder
 *
 * Participant password: password
 */
class PresentationOngoingSimulationSeeder extends Seeder
{
    public const TITLE = '[Demo] Fire Extinguisher Hands-on Drill — San Agustin';

    public function run(): void
    {
        DB::transaction(function () {
            $admin = User::query()
                ->whereIn('role', ['LGU_ADMIN', 'LGU_TRAINER'])
                ->orderBy('id')
                ->first();

            if (! $admin) {
                $this->command?->warn('No admin/trainer found. Run AdminUserSeeder first.');

                return;
            }

            $module = TrainingModule::query()
                ->with(['contents' => fn ($q) => $q->orderBy('sort_order')])
                ->where('status', 'published')
                ->where(function ($q) {
                    $q->where('title', 'like', '%Fire%')
                        ->orWhere('title', 'like', '%Emergency%');
                })
                ->orderBy('id')
                ->first()
                ?? TrainingModule::query()
                    ->with(['contents' => fn ($q) => $q->orderBy('sort_order')])
                    ->where('status', 'published')
                    ->orderBy('id')
                    ->first();

            if (! $module) {
                $this->command?->warn('No published training module. Run TrainingModuleSeeder first.');

                return;
            }

            $template = SimulationExerciseTemplate::query()
                ->where('status', 'published')
                ->where(function ($q) {
                    $q->where('title', 'like', '%Fire Extinguisher%')
                        ->orWhere('title', 'like', '%Fire%');
                })
                ->orderBy('id')
                ->first()
                ?? SimulationExerciseTemplate::query()->where('status', 'published')->orderBy('id')->first();

            $trainer = QualifiedTrainer::query()->orderBy('id')->first();
            $scenario = Scenario::query()
                ->where('status', 'published')
                ->where('training_module_id', $module->id)
                ->orderBy('id')
                ->first()
                ?? Scenario::query()->where('status', 'published')->orderBy('id')->first();

            $campaign = CampaignRequest::query()
                ->whereIn('status', ['approved', 'scheduled'])
                ->where('training_module_id', $module->id)
                ->orderByDesc('id')
                ->first()
                ?? CampaignRequest::query()
                    ->whereIn('status', ['approved', 'scheduled'])
                    ->orderByDesc('id')
                    ->first();

            $medicalStaff = User::query()
                ->where('role', 'STAFF')
                ->where('position', 'Medical Team')
                ->where('status', 'active')
                ->orderBy('id')
                ->limit(2)
                ->get();

            $startAt = now()->copy()->setTime(17, 20, 0);
            $endAt = now()->copy()->setTime(21, 0, 0);
            if (now()->gt($endAt)) {
                $startAt = now()->copy()->subMinutes(10)->second(0);
                $endAt = $startAt->copy()->addHours(3);
            }

            $personnelAssignments = [];
            if ($trainer) {
                $personnelAssignments[] = [
                    'role' => 'Lead Trainer',
                    'source_group' => 'group6_trainers',
                    'person_name' => $trainer->name,
                    'person_external_id' => (string) $trainer->id,
                    'qualified_trainer_id' => $trainer->id,
                    'notes' => 'Lead trainer for San Agustin fire drill demo',
                ];
            }
            foreach ($medicalStaff as $staff) {
                $personnelAssignments[] = [
                    'role' => 'Medical Team',
                    'source_group' => 'lgu_staff',
                    'person_name' => $staff->name,
                    'person_external_id' => (string) $staff->id,
                    'notes' => 'Medical standby — San Agustin drill',
                ];
            }

            $lifecycle = app(SimulationEventLifecycleService::class);
            $planning = app(SimulationEventPlanningService::class);

            $event = SimulationEvent::query()->updateOrCreate(
                ['title' => self::TITLE],
                [
                    'disaster_type' => 'Fire',
                    'description' => 'Hands-on fire extinguisher drill for Barangay San Agustin (Novaliches, Quezon City). Participants completed the linked fire-safety training module before the drill.',
                    'event_category' => 'Drill',
                    'status' => 'ongoing',
                    'event_date' => $startAt->toDateString(),
                    'start_time' => $startAt->format('H:i'),
                    'end_time' => $endAt->format('H:i'),
                    'is_recurring' => false,
                    'location' => 'Barangay San Agustin Hall, Novaliches, Quezon City',
                    'venue' => 'Barangay San Agustin Hall',
                    'building' => 'Covered Court / Open Area',
                    'room_zone' => 'Drill lane A',
                    'location_notes' => 'Demo window 5:20 PM – 9:00 PM. Marshals optional if CPSQC pool empty.',
                    'assembly_points' => 'Open court assembly area near the barangay flagpole',
                    'exits' => 'Main gate / side alley egress toward Quirino Highway side',
                    'is_high_risk_location' => false,
                    'scenario_id' => $scenario?->id,
                    'scenario_is_required' => (bool) $scenario,
                    'training_module_id' => $module->id,
                    'campaign_request_id' => $campaign?->id,
                    'simulation_exercise_template_id' => $template?->id,
                    'assigned_trainer_id' => $trainer?->id,
                    'facilitators' => array_values(array_filter([$trainer?->name, $admin->name])),
                    'allowed_participant_types' => ['PARTICIPANT', 'LGU_TRAINER'],
                    'target_audience' => 'Barangay San Agustin community volunteers & purok responders',
                    'max_participants' => 30,
                    'registration_deadline' => $startAt->copy()->subDays(3),
                    'self_registration_enabled' => false,
                    'approval_required' => false,
                    'qr_code_enabled' => true,
                    'attendance_code' => strtoupper(Str::random(8)),
                    'safety_guidelines' => 'Closed shoes required. Stay upwind of demo discharge. Follow trainer and safety officer instructions.',
                    'hazard_warnings' => 'Simulated extinguisher discharge only — no live fire.',
                    'required_ppe' => 'Closed shoes; gloves for extinguisher operators',
                    'event_phases' => [
                        'Pre-Briefing',
                        'Attendance Verification',
                        'Equipment Deployment',
                        'Drill Started',
                        'Evacuation Completed',
                        'Debriefing',
                    ],
                    'facilitator_instructions' => 'Score present participants individually after PASS method practice turns.',
                    'email_notifications_enabled' => false,
                    'sms_notifications_enabled' => false,
                    'created_by' => $admin->id,
                    'updated_by' => $admin->id,
                    'published_at' => $startAt->copy()->subHours(2),
                    'actual_start_time' => $startAt,
                    'started_by' => $admin->id,
                    'readiness_confirmations' => [
                        'venue_confirmed' => true,
                        'schedule_confirmed' => true,
                    ],
                    'event_personnel_assignments' => $personnelAssignments,
                    'timeline_entries' => [
                        [
                            'label' => 'Simulation Started (Presentation Demo)',
                            'time' => $startAt->format('H:i'),
                            'recorded_at' => $startAt->toIso8601String(),
                        ],
                    ],
                ],
            );

            $lifecycle->initializeExecutionProgress($event->fresh());

            if ($campaign) {
                $campaign->update([
                    'simulation_event_id' => $event->id,
                    'status' => 'scheduled',
                    'training_module_id' => $campaign->training_module_id ?: $module->id,
                    'minimum_qualified_participants' => max(
                        (int) ($campaign->minimum_qualified_participants ?? 0),
                        12,
                    ),
                ]);
            }

            $seededPeople = $this->seedRealisticParticipants(
                $event,
                $module,
                $campaign,
                $admin,
            );

            if ($campaign) {
                $planning->syncQualifiedParticipantsToEvent($event->fresh(), $admin->id);
            }

            $this->command?->info('Presentation ongoing simulation ready (realistic San Agustin roster + scores).');
            $this->command?->line('Title: '.self::TITLE);
            $this->command?->line('ID: '.$event->id);
            $this->command?->line('Module: '.$module->title);
            $this->command?->line('Participants seeded: '.$seededPeople);
            $this->command?->line('Window: '.$startAt->format('M j, Y g:i A').' – '.$endAt->format('g:i A'));
            $this->command?->line('Open: /admin/simulation-events/'.$event->id.'?tab=monitoring');
            $this->command?->line('Participant login password: password');
        });
    }

    /**
     * Realistic Filipino names from San Agustin / nearby Novaliches barangays,
     * each with varied training-module assessment scores.
     *
     * @return list<array{name: string, email: string, phone: string, barangay: string, organization: string, percentage: int, present: bool}>
     */
    private function rosterDefinitions(): array
    {
        return [
            [
                'name' => 'Ana Marie Villanueva',
                'email' => 'ana.villanueva.sanagustin@demo.local',
                'phone' => '09171234501',
                'barangay' => 'Barangay San Agustin',
                'organization' => 'Purok 1 Homeowners Association',
                'percentage' => 92,
                'present' => true,
            ],
            [
                'name' => 'Carlo James Mendoza',
                'email' => 'carlo.mendoza.sanagustin@demo.local',
                'phone' => '09181234502',
                'barangay' => 'Barangay San Agustin',
                'organization' => 'Barangay San Agustin BPSO Auxiliary',
                'percentage' => 88,
                'present' => true,
            ],
            [
                'name' => 'Jessa Mae Rivera',
                'email' => 'jessa.rivera.sanagustin@demo.local',
                'phone' => '09191234503',
                'barangay' => 'Barangay San Agustin',
                'organization' => 'San Agustin Youth Council',
                'percentage' => 85,
                'present' => true,
            ],
            [
                'name' => 'Roberto Obet Santos',
                'email' => 'roberto.santos.sanagustin@demo.local',
                'phone' => '09201234504',
                'barangay' => 'Barangay San Agustin',
                'organization' => 'Purok 3 Fire Watch Volunteers',
                'percentage' => 81,
                'present' => true,
            ],
            [
                'name' => 'Maricel Dela Cruz',
                'email' => 'maricel.delacruz.sanagustin@demo.local',
                'phone' => '09211234505',
                'barangay' => 'Barangay San Agustin',
                'organization' => 'Barangay Health Worker Network',
                'percentage' => 90,
                'present' => true,
            ],
            [
                'name' => 'Paolo Enriquez',
                'email' => 'paolo.enriquez.novaliches@demo.local',
                'phone' => '09221234506',
                'barangay' => 'Barangay Novaliches Proper',
                'organization' => 'District 5 Volunteer Responders',
                'percentage' => 78,
                'present' => true,
            ],
            [
                'name' => 'Kristine Joy Alonzo',
                'email' => 'kristine.alonzo.sanagustin@demo.local',
                'phone' => '09231234507',
                'barangay' => 'Barangay San Agustin',
                'organization' => 'San Agustin Women’s Desk Volunteers',
                'percentage' => 86,
                'present' => false,
            ],
            [
                'name' => 'Miguel Angel Navarro',
                'email' => 'miguel.navarro.fairview@demo.local',
                'phone' => '09241234508',
                'barangay' => 'Barangay Fairview',
                'organization' => 'Fairview–San Agustin Mutual Aid Group',
                'percentage' => 74,
                'present' => false,
            ],
            [
                'name' => 'Liza Camille Torres',
                'email' => 'liza.torres.sanagustin@demo.local',
                'phone' => '09251234509',
                'barangay' => 'Barangay San Agustin',
                'organization' => 'Purok 2 Neighborhood Watch',
                'percentage' => 83,
                'present' => true,
            ],
            [
                'name' => 'Junmark Reyes',
                'email' => 'junmark.reyes.sauyo@demo.local',
                'phone' => '09261234510',
                'barangay' => 'Barangay Sauyo',
                'organization' => 'Sauyo DRRM Volunteers',
                'percentage' => 79,
                'present' => false,
            ],
            [
                'name' => 'Rowena Grace Castillo',
                'email' => 'rowena.castillo.sanagustin@demo.local',
                'phone' => '09271234511',
                'barangay' => 'Barangay San Agustin',
                'organization' => 'Barangay San Agustin Day Care Parents Group',
                'percentage' => 87,
                'present' => true,
            ],
            [
                'name' => 'Erwin Win Garcia',
                'email' => 'erwin.garcia.sanagustin@demo.local',
                'phone' => '09281234512',
                'barangay' => 'Barangay San Agustin',
                'organization' => 'Tricycle Operators & Drivers Association (TODA) — San Agustin',
                'percentage' => 76,
                'present' => true,
            ],
            [
                'name' => 'Sheila Mae Dominguez',
                'email' => 'sheila.dominguez.capri@demo.local',
                'phone' => '09291234513',
                'barangay' => 'Barangay Capri',
                'organization' => 'Capri Community First Aiders',
                'percentage' => 91,
                'present' => false,
            ],
            [
                'name' => 'Anthony Ton Villamor',
                'email' => 'anthony.villamor.sanagustin@demo.local',
                'phone' => '09301234514',
                'barangay' => 'Barangay San Agustin',
                'organization' => 'Purok 4 Evacuation Marshals (volunteer)',
                'percentage' => 84,
                'present' => true,
            ],
            [
                'name' => 'Bea Francesca Lim',
                'email' => 'bea.lim.santa.monica@demo.local',
                'phone' => '09311234515',
                'barangay' => 'Barangay Santa Monica',
                'organization' => 'Novaliches Inter-Barangay Fire Safety Circle',
                'percentage' => 89,
                'present' => false,
            ],
        ];
    }

    private function seedRealisticParticipants(
        SimulationEvent $event,
        TrainingModule $module,
        ?CampaignRequest $campaign,
        User $admin,
    ): int {
        $contents = $module->relationLoaded('contents')
            ? $module->contents
            : TrainingContent::query()
                ->where('training_module_id', $module->id)
                ->orderBy('sort_order')
                ->get();

        $count = 0;

        foreach ($this->rosterDefinitions() as $index => $person) {
            $user = User::updateOrCreate(
                ['email' => $person['email']],
                [
                    'name' => $person['name'],
                    'password' => 'password',
                    'role' => 'PARTICIPANT',
                    'status' => 'active',
                    'phone' => $person['phone'],
                    'barangay' => $person['barangay'],
                    'organization' => $person['organization'],
                    'participant_id' => 'SA-'.str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT),
                    'registered_at' => now()->subDays(14 - ($index % 5)),
                    'email_verified_at' => now()->subDays(10),
                    'registration_source' => 'campaign_planning_scheduling',
                    'registration_campaign_title' => $module->title,
                    'registration_campaign_registered_at' => now()->subDays(12),
                ],
            );

            if ($campaign) {
                CampaignRegistration::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'campaign_request_id' => $campaign->id,
                    ],
                    [
                        'training_module_id' => $module->id,
                        'registration_status' => CampaignRegistration::STATUS_REGISTERED,
                        'registered_at' => now()->subDays(12),
                        'attendance_status' => CampaignRegistration::ATTENDANCE_NOT_STARTED,
                        'evaluation_status' => 'completed',
                        'certificate_status' => CampaignRegistration::CERTIFICATE_NOT_ISSUED,
                    ],
                );
            }

            $this->seedTrainingCompletionAndScores($user, $module, $contents, (int) $person['percentage'], $index);

            $registration = EventRegistration::updateOrCreate(
                [
                    'simulation_event_id' => $event->id,
                    'user_id' => $user->id,
                ],
                [
                    'status' => 'approved',
                    'registered_at' => now()->subDays(2),
                    'approved_at' => now()->subDay(),
                    'approved_by' => $admin->id,
                ],
            );

            if ($person['present']) {
                Attendance::updateOrCreate(
                    [
                        'simulation_event_id' => $event->id,
                        'user_id' => $user->id,
                    ],
                    [
                        'event_registration_id' => $registration->id,
                        'status' => 'present',
                        'check_in_method' => 'manual',
                        'checked_in_at' => $event->actual_start_time?->copy()->addMinutes(5 + $index)
                            ?? now()->subMinutes(20),
                        'marked_by' => $admin->id,
                    ],
                );
            }

            $count++;
        }

        return $count;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, TrainingContent>|iterable<TrainingContent>  $contents
     */
    private function seedTrainingCompletionAndScores(
        User $user,
        TrainingModule $module,
        $contents,
        int $percentage,
        int $index,
    ): void {
        $completedAt = now()->subDays(max(2, 9 - ($index % 6)));

        foreach ($contents as $content) {
            LessonCompletion::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'training_module_id' => $module->id,
                    'training_content_id' => $content->id,
                ],
                [
                    'completed_at' => $completedAt->copy()->addHours((int) ($content->sort_order ?? 0)),
                ],
            );
        }

        $totalQuestions = 10;
        $correct = (int) round(($percentage / 100) * $totalQuestions);
        $correct = max(5, min($totalQuestions, $correct));
        $actualPercentage = ($correct / $totalQuestions) * 100;
        $passed = $actualPercentage >= 75;

        $attempt = AiScenarioAttempt::updateOrCreate(
            [
                'user_id' => $user->id,
                'training_module_id' => $module->id,
                'attempt_number' => 1,
            ],
            [
                'status' => AiScenarioAttempt::STATUS_COMPLETED,
                'scenario_title' => $module->title.' — Fire Safety Scenario (San Agustin)',
                'generated_scenario' => 'A kitchen fire starts in a dense residential block near Barangay San Agustin Hall. Neighbors must apply PASS with a portable extinguisher and evacuate calmly.',
                'difficulty' => $actualPercentage >= 85 ? 'hard' : 'medium',
                'number_of_questions' => $totalQuestions,
                'generated_questions' => $this->fireSafetyQuestions($totalQuestions),
                'participant_answers' => [],
                'score' => $correct,
                'percentage' => $actualPercentage,
                'passed' => $passed,
                'started_at' => $completedAt->copy()->subMinutes(22),
                'completed_at' => $completedAt,
                'submitted_at' => $completedAt,
            ],
        );

        EvaluationResult::updateOrCreate(
            [
                'participant_id' => $user->id,
                'training_module_id' => $module->id,
                'attempt_number' => 1,
            ],
            [
                'ai_scenario_attempt_id' => $attempt->id,
                'scenario_title' => $attempt->scenario_title,
                'difficulty' => $attempt->difficulty,
                'score' => $correct,
                'correct_answers' => $correct,
                'wrong_answers' => $totalQuestions - $correct,
                'total_questions' => $totalQuestions,
                'percentage' => $actualPercentage,
                'rating' => $passed ? ($actualPercentage >= 90 ? 5 : 4) : 2,
                'status' => $passed ? EvaluationResult::STATUS_PASSED : EvaluationResult::STATUS_NEEDS_IMPROVEMENT,
                'knowledge_score' => min(100, $actualPercentage + 2),
                'decision_making_score' => max(50, $actualPercentage - 3),
                'emergency_response_score' => min(100, $actualPercentage + 1),
                'safety_awareness_score' => min(100, $actualPercentage + 4),
                'feedback' => $passed
                    ? 'Solid grasp of PASS, evacuation priorities, and early warning steps for residential fire response.'
                    : 'Needs review of extinguisher PASS method and when to evacuate instead of fighting the fire.',
                'recommendations' => $passed
                    ? ['Proceed to hands-on fire extinguisher drill.', 'Support purok fire-watch orientation.']
                    : ['Retake module assessment.', 'Attend refresher on PASS and evacuation.'],
                'eligible_for_simulation' => $passed,
                'completed_at' => $completedAt,
                'duration_seconds' => 1100 + ($index * 15),
            ],
        );

        $firstContent = collect($contents)->first();
        if ($firstContent) {
            $config = LessonQuizConfig::query()
                ->where('training_content_id', $firstContent->id)
                ->where('is_enabled', true)
                ->first();

            if ($config) {
                $quizTotal = 5;
                $quizScore = max(3, (int) round(($percentage / 100) * $quizTotal));
                LessonQuizAttempt::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'training_content_id' => $firstContent->id,
                        'attempt_number' => 1,
                    ],
                    [
                        'training_module_id' => $module->id,
                        'lesson_quiz_config_id' => $config->id,
                        'status' => LessonQuizAttempt::STATUS_COMPLETED,
                        'generated_questions' => $this->fireSafetyQuestions($quizTotal),
                        'score' => $quizScore,
                        'percentage' => ($quizScore / $quizTotal) * 100,
                        'passed' => ($quizScore / $quizTotal) * 100 >= 75,
                        'started_at' => $completedAt->copy()->subDays(1)->subMinutes(10),
                        'completed_at' => $completedAt->copy()->subDays(1),
                        'submitted_at' => $completedAt->copy()->subDays(1),
                    ],
                );
            }
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function fireSafetyQuestions(int $count): array
    {
        $bank = [
            [
                'question' => 'What does the letter P stand for in the PASS method?',
                'choices' => ['Pull the pin', 'Point the nozzle', 'Press the handle', 'Pause before aiming'],
                'correct_index' => 0,
            ],
            [
                'question' => 'Where should you aim a portable extinguisher on a small Class A fire?',
                'choices' => ['At the base of the fire', 'At the top of the flames', 'At the ceiling', 'At smoke only'],
                'correct_index' => 0,
            ],
            [
                'question' => 'When should you evacuate instead of using an extinguisher?',
                'choices' => [
                    'Fire is spreading fast or exit path is threatened',
                    'You have never used an extinguisher before',
                    'The alarm has not yet sounded',
                    'Only when instructed by neighbors',
                ],
                'correct_index' => 0,
            ],
            [
                'question' => 'Best immediate action when you smell smoke in a kitchen?',
                'choices' => [
                    'Alert others, size up safely, then decide fight or evacuate',
                    'Open all windows first',
                    'Wait for the barangay siren',
                    'Throw water without checking the fuel source',
                ],
                'correct_index' => 0,
            ],
            [
                'question' => 'Which PPE is most basic for a community extinguisher drill?',
                'choices' => ['Closed shoes and gloves', 'Only a hard hat', 'Raincoat only', 'No PPE needed outdoors'],
                'correct_index' => 0,
            ],
            [
                'question' => 'After discharging an extinguisher, you should:',
                'choices' => [
                    'Watch for reflash and keep an exit path clear',
                    'Leave the area immediately without reporting',
                    'Shake the can and store it upside down',
                    'Fill it with water for reuse',
                ],
                'correct_index' => 0,
            ],
            [
                'question' => 'A good assembly point practice is to:',
                'choices' => [
                    'Account for household members at the designated area',
                    'Return inside to retrieve valuables first',
                    'Block the main gate for better viewing',
                    'Wait beside the fire for photos',
                ],
                'correct_index' => 0,
            ],
            [
                'question' => 'Class B fires typically involve:',
                'choices' => ['Flammable liquids', 'Ordinary combustibles only', 'Energized electrical only', 'Cooking oils only in deep fryers'],
                'correct_index' => 0,
            ],
            [
                'question' => 'Who should you notify first for a barangay structural fire after ensuring personal safety?',
                'choices' => [
                    'BFP / emergency hotline and barangay responders',
                    'Social media followers only',
                    'Nearby sari-sari store only',
                    'No one until the fire is out',
                ],
                'correct_index' => 0,
            ],
            [
                'question' => 'Sweeping the extinguisher nozzle side to side helps to:',
                'choices' => [
                    'Cover the burning surface evenly',
                    'Cool the operator’s hands',
                    'Create more smoke for visibility',
                    'Empty the extinguisher faster only',
                ],
                'correct_index' => 0,
            ],
        ];

        $items = [];
        for ($i = 0; $i < $count; $i++) {
            $q = $bank[$i % count($bank)];
            $items[] = [
                'id' => 'sa-fire-q'.($i + 1),
                'question' => $q['question'],
                'choices' => $q['choices'],
                'correct_index' => $q['correct_index'],
            ];
        }

        return $items;
    }
}
