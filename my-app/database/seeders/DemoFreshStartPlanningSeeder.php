<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\CampaignRegistration;
use App\Models\CampaignRequest;
use App\Models\EventRegistration;
use App\Models\LessonCompletion;
use App\Models\QualifiedTrainer;
use App\Models\Scenario;
use App\Models\SimulationEvent;
use App\Models\SimulationExerciseTemplate;
use App\Models\TrainingContent;
use App\Models\TrainingModule;
use App\Models\User;
use App\Services\HazardAssessment\HazardTrainingRecommendationService;
use App\Support\CampaignRegistrationLink;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Fresh-start demo:
 * - Wipe simulation + campaign history (keep modules / templates / demo participants)
 * - Seed approved campaigns (status stays approved — still listed under Approved Campaigns)
 * - Split registered participants into Simulation Event batches of random 20–30 (max 30)
 * - Seed realistic completed drills (including exact 20- and 30-participant batches)
 *
 * Usage:
 *   php artisan db:seed --class=DemoFreshStartPlanningSeeder --force
 */
class DemoFreshStartPlanningSeeder extends Seeder
{
    public const PRIMARY_LABEL = 'DEMO: Fresh Start — Earthquake Preparedness';

    public const SECONDARY_LABEL = 'DEMO: Fresh Start — Fire Safety';

    private const BATCH_MIN = 20;

    private const BATCH_MAX = 30;

    /** @var list<string> */
    private array $venues = [
        'Barangay San Agustin Evacuation Center',
        'San Agustin Covered Court',
        'Barangay Hall Multi-Purpose Hall',
        'Novaliches District Evacuation Site',
        'San Agustin Elementary School Grounds',
    ];

    public function run(): void
    {
        DB::transaction(function () {
            $this->wipeSimulationHistory();
            $this->wipeCampaignHistory();

            $participants = User::query()
                ->where('role', 'PARTICIPANT')
                ->where('email', 'like', 'demo.participant.%@barangay.qc.local')
                ->orderBy('id')
                ->get();

            if ($participants->isEmpty()) {
                $this->command?->warn('No demo.participant.* users found. Run DemoBatchParticipantsSeeder first.');

                return;
            }

            $admin = User::query()
                ->whereIn('role', ['LGU_ADMIN', 'LGU_TRAINER'])
                ->orderBy('id')
                ->first();

            $earthquake = $this->findPublishedModule(['Earthquake Preparedness', 'Earthquake'])
                ?? TrainingModule::query()->where('status', 'published')->orderBy('id')->first();

            $fire = $this->findPublishedModule(['Fire Safety', 'Fire Extinguisher', 'Basic Fire']);

            if (! $earthquake) {
                $this->command?->warn('No published training module found. Aborting seed.');

                return;
            }

            $primary = $this->seedApprovedCampaign(
                module: $earthquake,
                label: self::PRIMARY_LABEL,
                admin: $admin,
                participants: $participants,
                expectedParticipants: $participants->count(),
                tagUserCampaignSource: true,
            );
            $this->qualifyParticipantsForModule($earthquake, $participants);
            $primaryStats = $this->seedCampaignEventBatches(
                campaign: $primary,
                module: $earthquake,
                participants: $participants->values(),
                admin: $admin,
                titlePrefix: 'Earthquake Drill Batch',
                includeShowcaseCompleted: true,
            );

            $secondaryStats = ['events' => 0, 'completed' => 0, 'upcoming' => 0];
            if ($fire && $fire->id !== $earthquake->id) {
                $fireParticipants = $participants->take(80)->values();
                $secondary = $this->seedApprovedCampaign(
                    module: $fire,
                    label: self::SECONDARY_LABEL,
                    admin: $admin,
                    participants: $fireParticipants,
                    expectedParticipants: $fireParticipants->count(),
                    tagUserCampaignSource: false,
                );
                $this->qualifyParticipantsForModule($fire, $fireParticipants);
                $secondaryStats = $this->seedCampaignEventBatches(
                    campaign: $secondary,
                    module: $fire,
                    participants: $fireParticipants,
                    admin: $admin,
                    titlePrefix: 'Fire Safety Drill Batch',
                    includeShowcaseCompleted: true,
                );
            }

            $approvedCount = CampaignRequest::query()->where('status', 'approved')->count();

            $this->command?->info('Fresh-start planning seed complete.');
            $this->command?->line("Approved campaigns (still listed): {$approvedCount}");
            $this->command?->line('Simulation events: '.DB::table('simulation_events')->count());
            $this->command?->line(sprintf(
                'Earthquake batches: %d (completed=%d, upcoming=%d)',
                $primaryStats['events'],
                $primaryStats['completed'],
                $primaryStats['upcoming'],
            ));
            if ($secondaryStats['events'] > 0) {
                $this->command?->line(sprintf(
                    'Fire batches: %d (completed=%d, upcoming=%d)',
                    $secondaryStats['events'],
                    $secondaryStats['completed'],
                    $secondaryStats['upcoming'],
                ));
            }
            $this->command?->line('Campaign status kept as approved (not scheduled).');
        });
    }

    private function wipeSimulationHistory(): void
    {
        if (Schema::hasTable('campaign_requests') && Schema::hasColumn('campaign_requests', 'simulation_event_id')) {
            DB::table('campaign_requests')->update(['simulation_event_id' => null]);
        }

        if (Schema::hasTable('resources') && Schema::hasColumn('resources', 'assigned_to_event_id')) {
            DB::table('resources')->whereNotNull('assigned_to_event_id')->update(['assigned_to_event_id' => null]);
        }

        if (Schema::hasTable('resource_budget_proposals') && Schema::hasColumn('resource_budget_proposals', 'simulation_event_id')) {
            DB::table('resource_budget_proposals')->update(['simulation_event_id' => null]);
        }

        $this->deleteIfExists('evaluation_scores');
        $this->deleteIfExists('participant_evaluations');
        $this->deleteIfExists('evaluation_results');
        $this->deleteIfExists('evaluations');
        if (Schema::hasTable('certificates')) {
            if (Schema::hasColumn('certificates', 'simulation_event_id')) {
                DB::table('certificates')->whereNotNull('simulation_event_id')->delete();
            } else {
                DB::table('certificates')->delete();
            }
        }
        $this->deleteIfExists('attendances');
        $this->deleteIfExists('event_registrations');
        $this->deleteIfExists('event_equipment_request_items');
        $this->deleteIfExists('event_equipment_requests');
        $this->deleteIfExists('event_resource');
        $this->deleteIfExists('resource_event_assignments');
        $this->deleteIfExists('resource_movements');
        $this->deleteIfExists('simulation_events');

        $this->command?->info('Wiped simulation event history.');
    }

    private function wipeCampaignHistory(): void
    {
        $this->deleteIfExists('campaign_registrations');
        $this->deleteIfExists('simulation_plans');
        $this->deleteIfExists('campaign_requests');

        $this->command?->info('Wiped campaign request history.');
    }

    private function deleteIfExists(string $table): void
    {
        if (Schema::hasTable($table)) {
            DB::table($table)->delete();
        }
    }

    /**
     * @param  list<string>  $needles
     */
    private function findPublishedModule(array $needles): ?TrainingModule
    {
        $modules = TrainingModule::query()->where('status', 'published')->orderBy('id')->get();

        foreach ($needles as $needle) {
            $match = $modules->first(fn (TrainingModule $m) => str_contains(strtolower((string) $m->title), strtolower($needle)));
            if ($match) {
                return $match;
            }
        }

        return null;
    }

    /**
     * @param  Collection<int, User>  $participants
     */
    private function seedApprovedCampaign(
        TrainingModule $module,
        string $label,
        ?User $admin,
        Collection $participants,
        int $expectedParticipants,
        bool $tagUserCampaignSource = true,
    ): CampaignRequest {
        $minimumQualified = self::BATCH_MIN;
        $registrationOpens = now()->subDays(21);
        $registrationDeadline = now()->subDays(2);
        $trainingCompletionDeadline = now()->subDays(1);

        $module->update([
            'campaign_registration_opens' => $registrationOpens,
            'campaign_registration_deadline' => $registrationDeadline,
            'campaign_training_completion_deadline' => $trainingCompletionDeadline,
            'campaign_expected_participants' => $expectedParticipants,
            'campaign_maximum_participants' => max($expectedParticipants + 20, $participants->count()),
        ]);

        $recommendedCommunities = app(HazardTrainingRecommendationService::class)
            ->recommendCommunitiesForTraining($module->fresh());

        $payload = array_merge(
            [
                'submitted_at' => $registrationOpens->copy()->addDay()->toIso8601String(),
                '_test_seeder' => 'demo_fresh_start_planning',
                'simulation_batch_size' => self::BATCH_MAX,
            ],
            $module->fresh()->toCampaignPlanningPayload($recommendedCommunities),
        );

        $campaignRequest = CampaignRequest::create([
            'training_module_id' => $module->id,
            'submitted_to' => 'Public Safety Campaign Management System',
            'proposed_session_label' => $label,
            'submitted_at' => $registrationOpens->copy()->addDay(),
            'approved_at' => now()->subDay(),
            'status' => 'approved',
            'expected_participants' => $expectedParticipants,
            'minimum_qualified_participants' => $minimumQualified,
            'session_index' => 0,
            'payload' => $payload,
            'remarks' => null,
            'submitted_by_id' => $admin?->id,
            'simulation_event_id' => null,
        ]);

        $registrationLink = CampaignRegistrationLink::forCampaignRequest($campaignRequest);
        $campaignRequest->update([
            'payload' => array_merge($payload, [
                'registration_link' => $registrationLink,
                'registration_form_path' => '/campaigns/'.$campaignRequest->id.'/register',
            ]),
        ]);

        $campaignKey = 'campaign-request:'.$campaignRequest->id;

        foreach ($participants as $user) {
            $registeredAt = now()->subDays(rand(3, 18));

            CampaignRegistration::create([
                'user_id' => $user->id,
                'campaign_request_id' => $campaignRequest->id,
                'training_module_id' => $module->id,
                'registration_status' => CampaignRegistration::STATUS_REGISTERED,
                'registered_at' => $registeredAt,
                'attendance_status' => CampaignRegistration::ATTENDANCE_NOT_STARTED,
                'evaluation_status' => CampaignRegistration::EVALUATION_NOT_STARTED,
                'certificate_status' => CampaignRegistration::CERTIFICATE_NOT_ISSUED,
            ]);

            if ($tagUserCampaignSource) {
                $user->forceFill([
                    'registration_source' => 'campaign_planning_scheduling',
                    'registration_campaign_id' => $campaignKey,
                    'registration_campaign_title' => $module->title,
                    'registration_campaign_registered_at' => $registeredAt,
                ])->save();
            }
        }

        return $campaignRequest->fresh();
    }

    /**
     * @param  Collection<int, User>  $participants
     */
    private function qualifyParticipantsForModule(TrainingModule $module, Collection $participants): void
    {
        $contents = TrainingContent::query()
            ->where('training_module_id', $module->id)
            ->orderBy('sort_order')
            ->get();

        if ($contents->isEmpty()) {
            $this->command?->warn("Module #{$module->id} has no lessons — cannot qualify participants.");

            return;
        }

        foreach ($participants as $user) {
            foreach ($contents as $content) {
                LessonCompletion::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'training_module_id' => $module->id,
                        'training_content_id' => $content->id,
                    ],
                    ['completed_at' => now()->subDays(rand(1, 10))],
                );
            }
        }
    }

    /**
     * @param  Collection<int, User>  $participants
     * @return array{events:int,completed:int,upcoming:int}
     */
    private function seedCampaignEventBatches(
        CampaignRequest $campaign,
        TrainingModule $module,
        Collection $participants,
        ?User $admin,
        string $titlePrefix,
        bool $includeShowcaseCompleted,
    ): array {
        $sizes = $this->buildBatchSizes($participants->count(), $includeShowcaseCompleted);
        $offset = 0;
        $completedCount = 0;
        $upcomingCount = 0;
        $batchNumber = 0;

        $template = SimulationExerciseTemplate::query()->where('status', 'published')->orderBy('id')->first();
        $trainer = QualifiedTrainer::query()->orderBy('id')->first();
        $scenario = Scenario::query()
            ->where('status', 'published')
            ->where('training_module_id', $module->id)
            ->orderBy('id')
            ->first()
            ?? Scenario::query()->where('status', 'published')->orderBy('id')->first();

        foreach ($sizes as $index => $size) {
            $chunk = $participants->slice($offset, $size)->values();
            $offset += $size;
            if ($chunk->isEmpty()) {
                continue;
            }

            $batchNumber++;
            $isShowcase = $includeShowcaseCompleted && in_array($size, [20, 30], true) && $index < 2;
            $isCompleted = $isShowcase || ($index % 3 === 2); // ~1/3 completed, rest upcoming

            $event = $this->createBatchEvent(
                campaign: $campaign,
                module: $module,
                admin: $admin,
                template: $template,
                trainer: $trainer,
                scenario: $scenario,
                title: sprintf('%s %02d — %s (%d pax)', $titlePrefix, $batchNumber, $module->title, $chunk->count()),
                batchSize: $chunk->count(),
                batchIndex: $index,
                completed: $isCompleted,
            );

            $this->registerChunkOnEvent($event, $chunk, $admin, $isCompleted);

            if ($isCompleted) {
                $completedCount++;
                $this->command?->line("  Completed #{$event->id}: {$chunk->count()} pax — {$event->title}");
            } else {
                $upcomingCount++;
                $this->command?->line("  Upcoming  #{$event->id}: {$chunk->count()} pax — {$event->title}");
            }
        }

        // Keep campaign on Approved Campaigns tab: do NOT set status=scheduled / simulation_event_id.
        return [
            'events' => $batchNumber,
            'completed' => $completedCount,
            'upcoming' => $upcomingCount,
        ];
    }

    /**
     * @return list<int>
     */
    private function buildBatchSizes(int $total, bool $includeShowcaseCompleted): array
    {
        $sizes = [];
        $remaining = $total;

        if ($includeShowcaseCompleted && $remaining >= 50) {
            $sizes[] = 20;
            $sizes[] = 30;
            $remaining -= 50;
        }

        while ($remaining > 0) {
            if ($remaining <= self::BATCH_MAX) {
                if ($remaining < self::BATCH_MIN && $sizes !== []) {
                    $last = array_key_last($sizes);
                    if ($sizes[$last] + $remaining <= self::BATCH_MAX) {
                        $sizes[$last] += $remaining;
                    } else {
                        $sizes[] = $remaining;
                    }
                } else {
                    $sizes[] = $remaining;
                }
                break;
            }

            // Leave room for another valid batch when possible.
            $upper = min(self::BATCH_MAX, $remaining - self::BATCH_MIN);
            if ($upper < self::BATCH_MIN) {
                $sizes[] = $remaining;
                break;
            }

            $size = random_int(self::BATCH_MIN, $upper);
            $sizes[] = $size;
            $remaining -= $size;
        }

        return $sizes;
    }

    private function createBatchEvent(
        CampaignRequest $campaign,
        TrainingModule $module,
        ?User $admin,
        ?SimulationExerciseTemplate $template,
        ?QualifiedTrainer $trainer,
        ?Scenario $scenario,
        string $title,
        int $batchSize,
        int $batchIndex,
        bool $completed,
    ): SimulationEvent {
        $venue = $this->venues[$batchIndex % count($this->venues)];

        if ($completed) {
            $eventDate = now()->subDays(2 + $batchIndex)->startOfDay();
            $startAt = $eventDate->copy()->setTime(8, 0);
            $endAt = $startAt->copy()->addHours(4);
            $completedAt = $endAt->copy()->addMinutes(15);
        } else {
            $eventDate = now()->addDays(2 + $batchIndex)->startOfDay();
            $startAt = $eventDate->copy()->setTime(8 + ($batchIndex % 2) * 4, 0);
            $endAt = $startAt->copy()->addHours(4);
            $completedAt = null;
        }

        return SimulationEvent::create([
            'title' => $title,
            'disaster_type' => $module->category ?: $module->related_hazard ?: 'General',
            'description' => $completed
                ? 'Completed barangay drill batch with attendance locked for demo history.'
                : 'Upcoming campaign drill batch (max 30 participants).',
            'event_category' => 'Drill',
            'status' => $completed ? 'completed' : 'published',
            'event_date' => $eventDate->toDateString(),
            'start_time' => $startAt->format('H:i'),
            'end_time' => $endAt->format('H:i'),
            'location' => $venue,
            'venue' => $venue,
            'scenario_id' => $scenario?->id,
            'training_module_id' => $module->id,
            'campaign_request_id' => $campaign->id,
            'simulation_exercise_template_id' => $template?->id,
            'assigned_trainer_id' => $trainer?->id,
            'facilitators' => array_values(array_filter([$trainer?->name, $admin?->name])),
            'target_audience' => 'Campaign batch',
            'max_participants' => max($batchSize, self::BATCH_MAX),
            'registration_deadline' => $startAt->copy()->subDay(),
            'self_registration_enabled' => false,
            'approval_required' => false,
            'qr_code_enabled' => true,
            'attendance_code' => strtoupper(Str::random(8)),
            'safety_guidelines' => 'Follow facilitator instructions. Observe assembly points and PPE requirements.',
            'created_by' => $admin?->id,
            'updated_by' => $admin?->id,
            'published_at' => $completed ? $startAt->copy()->subDays(3) : now()->subHours(2),
            'actual_start_time' => $completed ? $startAt : null,
            'started_by' => $completed ? $admin?->id : null,
            'completed_at' => $completedAt,
            'readiness_confirmations' => $completed ? [
                'venue_confirmed' => true,
                'equipment_ready' => true,
                'personnel_ready' => true,
                'participants_briefed' => true,
            ] : null,
        ]);
    }

    /**
     * @param  Collection<int, User>  $chunk
     */
    private function registerChunkOnEvent(SimulationEvent $event, Collection $chunk, ?User $admin, bool $completed): void
    {
        $now = now();
        $start = $event->actual_start_time ?? $now->copy()->subDays(3)->setTime(8, 0);

        foreach ($chunk->values() as $index => $user) {
            $registration = EventRegistration::create([
                'simulation_event_id' => $event->id,
                'user_id' => $user->id,
                'status' => 'approved',
                'registered_at' => $now->copy()->subDays(rand(4, 12)),
                'approved_at' => $now->copy()->subDays(rand(2, 8)),
                'approved_by' => $admin?->id,
            ]);

            if (! $completed) {
                continue;
            }

            // ~88% present, rest absent — realistic no-shows
            $present = ($index % 9) !== 0;
            Attendance::create([
                'event_registration_id' => $registration->id,
                'user_id' => $user->id,
                'simulation_event_id' => $event->id,
                'status' => $present ? 'present' : 'absent',
                'check_in_method' => $present ? (rand(0, 1) ? 'qr' : 'manual') : 'manual',
                'checked_in_at' => $present ? $start->copy()->addMinutes(3 + $index) : null,
                'checked_out_at' => $present ? $start->copy()->addHours(4)->addMinutes(rand(0, 20)) : null,
                'is_locked' => true,
                'marked_by' => $admin?->id,
                'notes' => $present ? null : 'Did not arrive / excused absence',
            ]);
        }
    }
}
