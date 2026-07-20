<?php

namespace Database\Seeders;

use App\Models\AiScenarioAttempt;
use App\Models\Attendance;
use App\Models\CampaignRegistration;
use App\Models\CampaignRequest;
use App\Models\Certificate;
use App\Models\CertificateTemplate;
use App\Models\Evaluation;
use App\Models\EvaluationResult;
use App\Models\EvaluationScore;
use App\Models\EventRegistration;
use App\Models\LessonCompletion;
use App\Models\LessonQuizAttempt;
use App\Models\LessonQuizConfig;
use App\Models\ParticipantEvaluation;
use App\Models\PortalNotification;
use App\Models\Scenario;
use App\Models\SimulationEvent;
use App\Models\TrainingContent;
use App\Models\TrainingModule;
use App\Models\User;
use App\Support\CampaignRegistrationLink;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Populates participant portal modules with demo data.
 *
 * Run JB:    php artisan db:seed --class=ParticipantJbDemoSeeder
 * Run Faner: php artisan db:seed --class=ParticipantFanerDemoSeeder
 */
class ParticipantJbDemoSeeder extends Seeder
{
    protected int $targetUserId = 1;

    protected string $targetEmail = 'jbcursor@gmail.com';

    protected string $seedMarker = 'participant_jb_demo';

    protected string $campaignLabel = '[JB Demo] Barangay Preparedness Campaign';

    protected string $defaultParticipantId = 'PART-JB001';

    protected string $defaultDisplayName = 'Faner, John Benedict S.';

    protected string $eventTitlePrefix = '[JB Demo]';

    protected string $certificatePrefix = 'JB';

    public function run(): void
    {
        DB::transaction(function () {
            $participant = $this->resolveParticipant();
            if (! $participant) {
                $this->command?->error("User id {$this->targetUserId} / {$this->targetEmail} not found. Create the account first.");

                return;
            }

            $admin = User::query()
                ->whereIn('role', ['LGU_ADMIN', 'LGU_TRAINER'])
                ->where('id', '!=', $participant->id)
                ->orderBy('id')
                ->first();

            if (! $admin) {
                $this->command?->warn('No LGU admin/trainer found; some approvals will be null.');
            }

            $scenario = Scenario::query()->orderBy('id')->first();
            if (! $scenario) {
                $this->command?->warn('No scenario found. Run ScenarioSeeder first.');

                return;
            }

            $this->enrichParticipantProfile($participant);

            $primaryModule = TrainingModule::query()
                ->where('status', 'published')
                ->with(['contents' => fn ($q) => $q->orderBy('sort_order')])
                ->orderBy('id')
                ->get()
                ->first(fn (TrainingModule $m) => $m->contents->isNotEmpty());

            if (! $primaryModule) {
                $this->command?->warn('No published training module with lessons. Run TrainingModuleSeeder first.');

                return;
            }

            $secondaryModule = TrainingModule::query()
                ->where('status', 'published')
                ->where('id', '!=', $primaryModule->id)
                ->with(['contents' => fn ($q) => $q->orderBy('sort_order')])
                ->orderBy('id')
                ->get()
                ->first(fn (TrainingModule $m) => $m->contents->isNotEmpty());

            $campaign = $this->ensureCampaign($primaryModule, $admin);
            $this->seedCampaignEnrollment($participant, $campaign, $primaryModule, $secondaryModule);
            $this->seedModuleProgressAndEvaluations($participant, $primaryModule, $secondaryModule);

            [$upcomingEvent, $pendingEvent, $completedEvent] = $this->seedSimulationEvents($participant, $admin, $scenario);
            $this->seedEventRegistrationsAndAttendance($participant, $admin, $upcomingEvent, $pendingEvent, $completedEvent);
            $participantEvaluation = $this->seedEventDrillEvaluation($participant, $admin, $completedEvent, $scenario);
            $this->seedCertificates($participant, $admin, $completedEvent, $participantEvaluation, $primaryModule);
            $this->seedPortalNotifications($participant, $upcomingEvent, $completedEvent);

            $this->command?->info("Participant demo data seeded for user #{$participant->id} ({$participant->email}).");
            $this->command?->info('Log in as this participant and check Dashboard, Training Modules, Simulation Events, Evaluations, Certificates, My Trainings, and My Attendance.');
        });
    }

    protected function resolveParticipant(): ?User
    {
        $byId = User::find($this->targetUserId);
        if ($byId && $byId->email === $this->targetEmail) {
            return $byId;
        }

        return User::query()->where('email', $this->targetEmail)->first()
            ?? ($byId?->id === $this->targetUserId ? $byId : null);
    }

    protected function enrichParticipantProfile(User $participant): void
    {
        $participant->update([
            'role' => 'PARTICIPANT',
            'name' => blank($participant->name) ? $this->defaultDisplayName : $participant->name,
            'participant_id' => $participant->participant_id ?: $this->defaultParticipantId,
            'status' => 'active',
            'phone' => $participant->phone ?: '+63 917 000 0001',
            'barangay' => $participant->barangay ?: 'Barangay Commonwealth',
            'city' => $participant->city ?: 'Quezon City',
            'province' => $participant->province ?: 'Metro Manila',
            'street' => $participant->street ?: 'Demo Street, Commonwealth',
            'email_verified_at' => $participant->email_verified_at ?? now(),
            'registered_at' => $participant->registered_at ?? now()->subMonths(2),
            'last_dashboard_visit_at' => now()->subDays(4),
        ]);
    }

    private function ensureCampaign(TrainingModule $module, ?User $admin): CampaignRequest
    {
        $existing = CampaignRequest::query()
            ->where('proposed_session_label', $this->campaignLabel)
            ->first();

        $opens = now()->subDays(14);
        $deadline = now()->addDays(30);
        $payload = array_merge(
            $module->fresh()->toCampaignPlanningPayload([]),
            [
                '_test_seeder' => $this->seedMarker,
                'training_title' => $module->title,
                'registration_deadline' => $deadline->toDateString(),
                'scheduled_date' => now()->addDays(45)->toDateString(),
                'venue' => 'Barangay Hall — Covered Court',
            ],
        );

        if ($existing) {
            $existing->update([
                'training_module_id' => $module->id,
                'status' => 'approved',
                'approved_at' => $existing->approved_at ?? now()->subDay(),
                'expected_participants' => 40,
                'minimum_qualified_participants' => 25,
                'payload' => $payload,
                'submitted_by_id' => $admin?->id,
            ]);
            $campaign = $existing->fresh();
        } else {
            $campaign = CampaignRequest::create([
                'training_module_id' => $module->id,
                'submitted_to' => 'Public Safety Campaign Management System',
                'proposed_session_label' => $this->campaignLabel,
                'submitted_at' => $opens,
                'approved_at' => now()->subDay(),
                'status' => 'approved',
                'expected_participants' => 40,
                'minimum_qualified_participants' => 25,
                'session_index' => 0,
                'payload' => $payload,
                'submitted_by_id' => $admin?->id,
            ]);
        }

        $link = CampaignRegistrationLink::forCampaignRequest($campaign);
        $campaign->update([
            'payload' => array_merge($campaign->payload ?? [], [
                'registration_link' => $link,
                'registration_form_path' => '/campaigns/'.$campaign->id.'/register',
            ]),
        ]);

        return $campaign->fresh();
    }

    private function seedCampaignEnrollment(
        User $participant,
        CampaignRequest $campaign,
        TrainingModule $primaryModule,
        ?TrainingModule $secondaryModule,
    ): void {
        $campaignKey = 'campaign-request:'.$campaign->id;

        $participant->update([
            'registration_source' => 'campaign_registration',
            'registration_campaign_id' => $campaignKey,
            'registration_campaign_title' => $primaryModule->title,
            'registration_campaign_registered_at' => now()->subDays(12),
        ]);

        CampaignRegistration::updateOrCreate(
            [
                'user_id' => $participant->id,
                'campaign_request_id' => $campaign->id,
            ],
            [
                'training_module_id' => $primaryModule->id,
                'registration_status' => CampaignRegistration::STATUS_REGISTERED,
                'registered_at' => now()->subDays(12),
                'attendance_status' => 'present',
                'evaluation_status' => 'completed',
                'certificate_status' => 'issued',
            ],
        );

        if ($secondaryModule) {
            $secondaryCampaign = CampaignRequest::query()
                ->where('training_module_id', $secondaryModule->id)
                ->where('status', 'approved')
                ->where('id', '!=', $campaign->id)
                ->orderByDesc('id')
                ->first();

            if ($secondaryCampaign) {
                CampaignRegistration::updateOrCreate(
                    [
                        'user_id' => $participant->id,
                        'campaign_request_id' => $secondaryCampaign->id,
                    ],
                    [
                        'training_module_id' => $secondaryModule->id,
                        'registration_status' => CampaignRegistration::STATUS_REGISTERED,
                        'registered_at' => now()->subDays(5),
                        'attendance_status' => CampaignRegistration::ATTENDANCE_NOT_STARTED,
                        'evaluation_status' => CampaignRegistration::EVALUATION_NOT_STARTED,
                        'certificate_status' => CampaignRegistration::CERTIFICATE_NOT_ISSUED,
                    ],
                );
            }
        }
    }

    private function seedModuleProgressAndEvaluations(
        User $participant,
        TrainingModule $primaryModule,
        ?TrainingModule $secondaryModule,
    ): void {
        foreach ($primaryModule->contents as $content) {
            LessonCompletion::updateOrCreate(
                [
                    'user_id' => $participant->id,
                    'training_module_id' => $primaryModule->id,
                    'training_content_id' => $content->id,
                ],
                ['completed_at' => now()->subDays(8)->addHours($content->sort_order)],
            );
        }

        if ($secondaryModule && $secondaryModule->contents->isNotEmpty()) {
            foreach ($secondaryModule->contents->take(1) as $content) {
                LessonCompletion::updateOrCreate(
                    [
                        'user_id' => $participant->id,
                        'training_module_id' => $secondaryModule->id,
                        'training_content_id' => $content->id,
                    ],
                    ['completed_at' => now()->subDays(2)],
                );
            }
        }

        $this->seedAiModuleEvaluation($participant, $primaryModule, passed: false, attemptNumber: 1);
        $this->seedAiModuleEvaluation($participant, $primaryModule, passed: true, attemptNumber: 2);
        if ($secondaryModule) {
            $this->seedAiModuleEvaluation($participant, $secondaryModule, passed: false, attemptNumber: 1);
        }

        $lessonContent = $primaryModule->contents->first();
        if ($lessonContent) {
            $this->seedLessonQuizAttempt($participant, $primaryModule, $lessonContent);
        }
    }

    private function seedAiModuleEvaluation(
        User $participant,
        TrainingModule $module,
        bool $passed,
        int $attemptNumber,
    ): void {
        $total = 10;
        $correct = $passed ? 8 : 5;
        $percentage = ($correct / $total) * 100;
        $completedAt = now()->subDays(max(1, 8 - ($attemptNumber * 2)));

        $attempt = AiScenarioAttempt::updateOrCreate(
            [
                'user_id' => $participant->id,
                'training_module_id' => $module->id,
                'attempt_number' => $attemptNumber,
            ],
            [
                'status' => AiScenarioAttempt::STATUS_COMPLETED,
                'scenario_title' => $module->title.' — Practice Scenario',
                'generated_scenario' => 'Demo scenario narrative for '.$module->title.'.',
                'difficulty' => 'medium',
                'number_of_questions' => $total,
                'generated_questions' => $this->demoQuestions($total),
                'participant_answers' => [],
                'score' => $correct,
                'percentage' => $percentage,
                'passed' => $passed,
                'started_at' => $completedAt->copy()->subMinutes(18),
                'completed_at' => $completedAt,
                'submitted_at' => $completedAt,
            ],
        );

        EvaluationResult::updateOrCreate(
            [
                'participant_id' => $participant->id,
                'training_module_id' => $module->id,
                'attempt_number' => $attemptNumber,
            ],
            [
                'ai_scenario_attempt_id' => $attempt->id,
                'scenario_title' => $attempt->scenario_title,
                'difficulty' => 'medium',
                'score' => $correct,
                'correct_answers' => $correct,
                'wrong_answers' => $total - $correct,
                'total_questions' => $total,
                'percentage' => $percentage,
                'rating' => $passed ? 4 : 2,
                'status' => $passed ? EvaluationResult::STATUS_PASSED : EvaluationResult::STATUS_NEEDS_IMPROVEMENT,
                'knowledge_score' => $passed ? 85 : 55,
                'decision_making_score' => $passed ? 80 : 50,
                'emergency_response_score' => $passed ? 82 : 58,
                'safety_awareness_score' => $passed ? 88 : 60,
                'feedback' => $passed
                    ? 'Strong performance on core preparedness concepts.'
                    : 'Review evacuation priorities and early warning steps.',
                'recommendations' => $passed ? ['Schedule simulation drill participation.'] : ['Retake the AI scenario assessment.'],
                'eligible_for_simulation' => $passed,
                'completed_at' => $completedAt,
                'duration_seconds' => 1080,
            ],
        );
    }

    private function seedLessonQuizAttempt(
        User $participant,
        TrainingModule $module,
        TrainingContent $content,
    ): void {
        $config = LessonQuizConfig::query()
            ->where('training_content_id', $content->id)
            ->where('is_enabled', true)
            ->first();

        if (! $config) {
            return;
        }

        $questions = $this->demoQuestions(5);
        $score = 4;
        $completedAt = now()->subDays(7);

        LessonQuizAttempt::updateOrCreate(
            [
                'user_id' => $participant->id,
                'training_content_id' => $content->id,
                'attempt_number' => 1,
            ],
            [
                'training_module_id' => $module->id,
                'lesson_quiz_config_id' => $config->id,
                'status' => LessonQuizAttempt::STATUS_COMPLETED,
                'generated_questions' => $questions,
                'score' => $score,
                'percentage' => 80,
                'passed' => true,
                'started_at' => $completedAt->copy()->subMinutes(12),
                'completed_at' => $completedAt,
                'submitted_at' => $completedAt,
            ],
        );
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function demoQuestions(int $count): array
    {
        $items = [];
        for ($i = 1; $i <= $count; $i++) {
            $items[] = [
                'id' => "demo-q{$i}",
                'question' => "Demo preparedness question {$i}",
                'choices' => ['Option A', 'Option B', 'Option C', 'Option D'],
                'correct_index' => 0,
            ];
        }

        return $items;
    }

    /**
     * @return array{0: SimulationEvent, 1: SimulationEvent, 2: SimulationEvent}
     */
    private function seedSimulationEvents(User $participant, ?User $admin, Scenario $scenario): array
    {
        $base = [
            'disaster_type' => 'Multi-hazard',
            'event_category' => 'Drill',
            'is_recurring' => false,
            'scenario_id' => $scenario->id,
            'scenario_is_required' => true,
            'facilitators' => [$admin?->name ?? 'LGU Trainer'],
            'allowed_participant_types' => ['PARTICIPANT', 'LGU_TRAINER', 'LGU_ADMIN'],
            'max_participants' => 100,
            'self_registration_enabled' => true,
            'approval_required' => true,
            'qr_code_enabled' => true,
            'reserved_resources' => [],
            'event_phases' => ['Briefing', 'Exercise', 'Debrief'],
            'inject_triggers' => [],
            'email_notifications_enabled' => true,
            'sms_notifications_enabled' => false,
            'notification_schedule' => [],
            'created_by' => $admin?->id,
            'updated_by' => $admin?->id,
            'location' => 'Barangay Covered Court',
            'building' => 'Main',
            'room_zone' => 'Assembly area',
        ];

        $upcoming = SimulationEvent::updateOrCreate(
            ['title' => $this->eventTitlePrefix.' Upcoming Flood Response Drill'],
            array_merge($base, [
                'description' => $this->seedMarker.' — registered upcoming drill.',
                'status' => 'published',
                'event_date' => now()->addDays(5)->toDateString(),
                'start_time' => '08:30',
                'end_time' => '11:30',
                'location_notes' => 'Bring ID for check-in.',
                'attendance_code' => 'JBFLOOD5',
            ]),
        );

        $pending = SimulationEvent::updateOrCreate(
            ['title' => $this->eventTitlePrefix.' Typhoon Tabletop Exercise'],
            array_merge($base, [
                'description' => $this->seedMarker.' — pending registration.',
                'status' => 'published',
                'event_date' => now()->addDays(12)->toDateString(),
                'start_time' => '13:00',
                'end_time' => '16:00',
                'attendance_code' => 'JBTYPH12',
            ]),
        );

        $completed = SimulationEvent::updateOrCreate(
            ['title' => $this->eventTitlePrefix.' Recent Earthquake Drill'],
            array_merge($base, [
                'description' => $this->seedMarker.' — completed with evaluation.',
                'disaster_type' => 'Earthquake',
                'status' => 'completed',
                'event_date' => now()->subDays(3)->toDateString(),
                'start_time' => '09:00',
                'end_time' => '12:00',
                'completed_at' => now()->subDays(3)->setTime(12, 0),
                'attendance_code' => 'JBEQ3',
            ]),
        );

        SimulationEvent::query()
            ->where('title', 'Quarterly Fire Drill - Barangay Hall')
            ->update(['event_date' => now()->addDays(6)->toDateString()]);

        $fireDrill = SimulationEvent::query()
            ->where('title', 'Quarterly Fire Drill - Barangay Hall')
            ->first();

        if ($fireDrill) {
            EventRegistration::updateOrCreate(
                [
                    'user_id' => $participant->id,
                    'simulation_event_id' => $fireDrill->id,
                ],
                [
                    'status' => 'approved',
                    'registered_at' => now()->subDays(2),
                    'approved_at' => now()->subDay(),
                    'approved_by' => $admin?->id,
                ],
            );
        }

        return [$upcoming, $pending, $completed];
    }

    private function seedEventRegistrationsAndAttendance(
        User $participant,
        ?User $admin,
        SimulationEvent $upcoming,
        SimulationEvent $pending,
        SimulationEvent $completed,
    ): void {
        $approvedUpcoming = EventRegistration::updateOrCreate(
            [
                'user_id' => $participant->id,
                'simulation_event_id' => $upcoming->id,
            ],
            [
                'status' => 'approved',
                'registered_at' => now()->subDays(4),
                'approved_at' => now()->subDays(3),
                'approved_by' => $admin?->id,
            ],
        );

        EventRegistration::updateOrCreate(
            [
                'user_id' => $participant->id,
                'simulation_event_id' => $pending->id,
            ],
            [
                'status' => 'pending',
                'registered_at' => now()->subDay(),
            ],
        );

        $approvedCompleted = EventRegistration::updateOrCreate(
            [
                'user_id' => $participant->id,
                'simulation_event_id' => $completed->id,
            ],
            [
                'status' => 'approved',
                'registered_at' => now()->subDays(10),
                'approved_at' => now()->subDays(9),
                'approved_by' => $admin?->id,
            ],
        );

        Attendance::updateOrCreate(
            [
                'user_id' => $participant->id,
                'simulation_event_id' => $completed->id,
            ],
            [
                'event_registration_id' => $approvedCompleted->id,
                'check_in_method' => 'self_qr',
                'status' => 'present',
                'checked_in_at' => $completed->event_date?->copy()->setTime(9, 15) ?? now()->subDays(3),
                'checked_out_at' => $completed->event_date?->copy()->setTime(11, 45) ?? now()->subDays(3),
                'is_locked' => true,
                'marked_by' => $admin?->id,
            ],
        );

        Attendance::updateOrCreate(
            [
                'user_id' => $participant->id,
                'simulation_event_id' => $upcoming->id,
            ],
            [
                'event_registration_id' => $approvedUpcoming->id,
                'check_in_method' => 'manual',
                'status' => 'absent',
                'notes' => 'Not yet held — placeholder for upcoming event.',
                'is_locked' => false,
            ],
        );
    }

    private function seedEventDrillEvaluation(
        User $participant,
        ?User $admin,
        SimulationEvent $completedEvent,
        Scenario $scenario,
    ): ?ParticipantEvaluation {
        if (! $scenario->criteria) {
            $scenario->criteria = [
                'Preparedness & Planning',
                'Coordination & Communication',
                'Response Execution',
            ];
            $scenario->save();
        }

        if (is_array($scenario->criteria) && $scenario->criteria !== []) {
            $criteria = $scenario->criteria;
        } else {
            $raw = $scenario->criteria;
            $decodedCriteria = is_string($raw) ? json_decode($raw, true) : null;
            $criteria = is_array($decodedCriteria) && $decodedCriteria !== []
                ? $decodedCriteria
                : ['Response Execution'];
        }

        $evaluation = Evaluation::updateOrCreate(
            ['simulation_event_id' => $completedEvent->id],
            [
                'status' => 'completed',
                'pass_threshold' => 75.00,
                'overall_notes' => 'JB demo evaluation.',
                'created_by' => $admin?->id,
                'updated_by' => $admin?->id,
                'started_at' => now()->subDays(4),
                'completed_at' => now()->subDays(3),
            ],
        );

        $attendance = Attendance::query()
            ->where('user_id', $participant->id)
            ->where('simulation_event_id', $completedEvent->id)
            ->first();

        if (! $attendance) {
            return null;
        }

        $participantEvaluation = ParticipantEvaluation::updateOrCreate(
            [
                'evaluation_id' => $evaluation->id,
                'user_id' => $participant->id,
            ],
            [
                'attendance_id' => $attendance->id,
                'attendance_status' => 'present',
                'status' => 'submitted',
                'overall_feedback' => 'Calm evacuation and clear communication during the drill.',
                'is_eligible_for_certification' => true,
                'evaluated_by' => $admin?->id,
                'submitted_at' => now()->subDays(2),
            ],
        );

        $participantEvaluation->scores()->delete();

        $order = 0;
        foreach ($criteria as $criterion) {
            $name = is_array($criterion) ? ($criterion['name'] ?? 'Criterion') : (string) $criterion;
            EvaluationScore::create([
                'participant_evaluation_id' => $participantEvaluation->id,
                'criterion_name' => $name,
                'score' => [8.5, 9.0, 8.0][min($order, 2)] ?? 8.5,
                'max_score' => 10.00,
                'comment' => 'Met expectations.',
                'order' => $order++,
            ]);
        }

        $participantEvaluation->calculateScores();

        return $participantEvaluation->fresh();
    }

    private function seedCertificates(
        User $participant,
        ?User $admin,
        SimulationEvent $completedEvent,
        ?ParticipantEvaluation $participantEvaluation,
        TrainingModule $primaryModule,
    ): void {
        $template = CertificateTemplate::query()->where('status', 'active')->first();
        if (! $template) {
            return;
        }

        if ($participantEvaluation && $participantEvaluation->result === 'passed') {
            Certificate::updateOrCreate(
                [
                    'user_id' => $participant->id,
                    'simulation_event_id' => $completedEvent->id,
                    'participant_evaluation_id' => $participantEvaluation->id,
                ],
                [
                    'certificate_template_id' => $template->id,
                        'certificate_number' => $this->uniqueCertNumber($this->certificatePrefix.'-EVT'),
                    'type' => 'completion',
                    'training_type' => $completedEvent->title,
                    'completion_date' => $completedEvent->event_date ?? now()->subDays(3),
                    'final_score' => $participantEvaluation->average_score,
                    'issued_at' => now()->subDays(1),
                    'issued_by' => $admin?->id,
                    'revoked_at' => null,
                ],
            );
        }

        $moduleResult = EvaluationResult::query()
            ->where('participant_id', $participant->id)
            ->where('training_module_id', $primaryModule->id)
            ->where('status', EvaluationResult::STATUS_PASSED)
            ->first();

        if ($moduleResult) {
            Certificate::updateOrCreate(
                [
                    'user_id' => $participant->id,
                    'training_module_id' => $primaryModule->id,
                    'evaluation_result_id' => $moduleResult->id,
                ],
                [
                    'certificate_template_id' => $template->id,
                    'certificate_number' => $this->uniqueCertNumber($this->certificatePrefix.'-MOD'),
                    'type' => 'completion',
                    'training_type' => $primaryModule->title,
                    'completion_date' => now()->subDays(5),
                    'final_score' => $moduleResult->percentage,
                    'issued_at' => now()->subDays(4),
                    'issued_by' => $admin?->id,
                    'revoked_at' => null,
                ],
            );
        }
    }

    private function uniqueCertNumber(string $prefix): string
    {
        do {
            $number = sprintf('%s-%s-%s', $prefix, date('Y'), strtoupper(Str::random(6)));
        } while (Certificate::where('certificate_number', $number)->exists());

        return $number;
    }

    private function seedPortalNotifications(
        User $participant,
        SimulationEvent $upcoming,
        SimulationEvent $completed,
    ): void {
        $items = [
            [
                'type' => PortalNotification::TYPE_REGISTRATION_APPROVED,
                'title' => 'Registration approved',
                'body' => "You are approved for {$upcoming->title}.",
                'action_label' => 'View event',
                'action_url' => '/participant/simulation-events/'.$upcoming->id,
                'metadata' => ['seed' => $this->seedMarker],
            ],
            [
                'type' => PortalNotification::TYPE_ATTENDANCE_MARKED,
                'title' => 'Attendance recorded',
                'body' => "Present at {$completed->title}.",
                'action_label' => 'My attendance',
                'action_url' => '/participant/my-attendance',
                'metadata' => ['seed' => $this->seedMarker],
            ],
            [
                'type' => PortalNotification::TYPE_EVALUATION_RECORDED,
                'title' => 'Drill evaluation posted',
                'body' => 'Your simulation event scores are available.',
                'action_label' => 'View evaluations',
                'action_url' => '/participant/evaluations?tab=events',
                'metadata' => ['seed' => $this->seedMarker],
            ],
            [
                'type' => PortalNotification::TYPE_CERTIFICATE_ISSUED,
                'title' => 'Certificate issued',
                'body' => 'A completion certificate was added to your profile.',
                'action_label' => 'My certificates',
                'action_url' => '/participant/certification',
                'metadata' => ['seed' => $this->seedMarker],
            ],
            [
                'type' => PortalNotification::TYPE_ASSESSMENT_COMPLETED,
                'title' => 'Module assessment complete',
                'body' => 'You passed an AI scenario assessment.',
                'action_label' => 'Evaluation results',
                'action_url' => '/participant/evaluations?tab=modules',
                'metadata' => ['seed' => $this->seedMarker],
                'read_at' => now()->subDays(2),
            ],
        ];

        foreach ($items as $index => $payload) {
            PortalNotification::updateOrCreate(
                [
                    'user_id' => $participant->id,
                    'type' => $payload['type'],
                    'title' => $payload['title'],
                ],
                array_merge($payload, [
                    'created_at' => now()->subDays(5 - $index),
                    'updated_at' => now()->subDays(5 - $index),
                ]),
            );
        }
    }
}
