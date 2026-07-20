<?php

namespace Database\Seeders;

use App\Models\CampaignRequest;
use App\Models\EventRegistration;
use App\Models\QualifiedTrainer;
use App\Models\Scenario;
use App\Models\SimulationEvent;
use App\Models\SimulationExerciseTemplate;
use App\Models\TrainingModule;
use App\Models\User;
use App\Services\SimulationEventLifecycleService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Shared helper for seeding realistic ongoing simulation events in a fixed time window today.
 */
abstract class AbstractOngoingSimulationEventsSeeder extends Seeder
{
    abstract protected function titlePrefix(): string;

    abstract protected function startTimeToday(): Carbon;

    abstract protected function endTimeToday(): Carbon;

    /**
     * @return list<array<string, mixed>>
     */
    abstract protected function eventDefinitions(): array;

    public function run(): void
    {
        DB::transaction(function () {
            $admin = User::query()
                ->whereIn('role', ['LGU_ADMIN', 'LGU_TRAINER'])
                ->orderBy('id')
                ->first();

            if (! $admin) {
                $this->command?->warn('No admin/trainer user found. Run AdminUserSeeder first.');

                return;
            }

            $modules = TrainingModule::query()
                ->where('status', 'published')
                ->orderBy('id')
                ->get();

            if ($modules->isEmpty()) {
                $this->command?->warn('No published training modules found. Run TrainingModuleSeeder first.');

                return;
            }

            $templates = SimulationExerciseTemplate::query()
                ->where('status', 'published')
                ->orderBy('id')
                ->get();

            $campaigns = CampaignRequest::query()
                ->whereIn('status', ['approved', 'scheduled'])
                ->with('trainingModule')
                ->orderByDesc('id')
                ->get();

            $trainers = QualifiedTrainer::query()->orderBy('id')->get();
            $scenarios = Scenario::query()->where('status', 'published')->orderBy('id')->get();
            $participants = User::query()
                ->where('role', 'PARTICIPANT')
                ->where('status', 'active')
                ->orderBy('id')
                ->limit(50)
                ->get();

            $startAt = $this->startTimeToday();
            $endAt = $this->endTimeToday();
            $now = now();
            $prefix = $this->titlePrefix();
            $definitions = $this->eventDefinitions();
            $created = 0;

            foreach ($definitions as $index => $definition) {
                $module = $modules[$index % $modules->count()];
                $template = $templates->isNotEmpty() ? $templates[$index % $templates->count()] : null;
                $campaign = $this->resolveCampaign($campaigns, $module, $index);
                $trainer = $trainers->isNotEmpty() ? $trainers[$index % $trainers->count()] : null;
                $scenario = $scenarios->firstWhere('training_module_id', $module->id)
                    ?? ($scenarios->isNotEmpty() ? $scenarios[$index % $scenarios->count()] : null);

                $title = $prefix.' '.$definition['title'];

                $event = SimulationEvent::query()->updateOrCreate(
                    ['title' => $title],
                    [
                        'disaster_type' => $definition['disaster_type'],
                        'description' => $definition['description'],
                        'event_category' => $definition['event_category'],
                        'status' => 'ongoing',
                        'event_date' => $startAt->toDateString(),
                        'start_time' => $startAt->format('H:i'),
                        'end_time' => $endAt->format('H:i'),
                        'is_recurring' => false,
                        'location' => $definition['location'],
                        'venue' => $definition['location'],
                        'building' => $definition['building'],
                        'room_zone' => $definition['room_zone'],
                        'location_notes' => $definition['location_notes'],
                        'assembly_points' => $definition['assembly_points'],
                        'exits' => $definition['exits'],
                        'is_high_risk_location' => $definition['is_high_risk_location'],
                        'scenario_id' => $scenario?->id,
                        'scenario_is_required' => (bool) $scenario,
                        'training_module_id' => $module->id,
                        'campaign_request_id' => $campaign?->id,
                        'simulation_exercise_template_id' => $template?->id,
                        'assigned_trainer_id' => $trainer?->id,
                        'facilitators' => array_values(array_filter([
                            $trainer?->name,
                            $admin->name,
                        ])),
                        'allowed_participant_types' => ['PARTICIPANT', 'LGU_TRAINER'],
                        'target_audience' => $definition['target_audience'],
                        'max_participants' => $definition['max_participants'],
                        'registration_deadline' => $startAt->copy()->subDay(),
                        'self_registration_enabled' => false,
                        'approval_required' => false,
                        'qr_code_enabled' => true,
                        'attendance_code' => strtoupper(Str::random(8)),
                        'safety_guidelines' => $definition['safety_guidelines'],
                        'hazard_warnings' => $definition['hazard_warnings'],
                        'required_ppe' => $definition['required_ppe'],
                        'event_phases' => [
                            'Pre-Briefing',
                            'Attendance Verification',
                            'Equipment Deployment',
                            'Drill Execution',
                            'Evacuation / Response',
                            'Debriefing',
                        ],
                        'facilitator_instructions' => $definition['facilitator_instructions'],
                        'email_notifications_enabled' => true,
                        'sms_notifications_enabled' => false,
                        'created_by' => $admin->id,
                        'updated_by' => $admin->id,
                        'published_at' => $now->copy()->subHours(3),
                        'actual_start_time' => $startAt,
                        'started_by' => $admin->id,
                        'readiness_confirmations' => [
                            'venue_confirmed' => true,
                            'schedule_confirmed' => true,
                            'personnel_confirmed' => true,
                            'equipment_confirmed' => true,
                        ],
                        'execution_progress' => $this->initialExecutionProgress(),
                        'timeline_entries' => [
                            [
                                'label' => 'Simulation started',
                                'time' => $startAt->format('H:i'),
                                'recorded_at' => $startAt->toIso8601String(),
                            ],
                            [
                                'label' => 'Pre-briefing complete',
                                'time' => $startAt->copy()->addMinutes(15)->format('H:i'),
                                'recorded_at' => $startAt->copy()->addMinutes(15)->toIso8601String(),
                            ],
                            [
                                'label' => 'Drill execution in progress',
                                'time' => $startAt->copy()->addMinutes(35)->format('H:i'),
                                'recorded_at' => $startAt->copy()->addMinutes(35)->toIso8601String(),
                            ],
                        ],
                    ],
                );

                if ($campaign) {
                    $campaign->update([
                        'simulation_event_id' => $event->id,
                        'status' => 'scheduled',
                        'training_module_id' => $campaign->training_module_id ?: $module->id,
                    ]);
                }

                $this->attachParticipants(
                    $event,
                    $participants,
                    $admin,
                    $definition['participant_count'],
                    $index,
                );

                $created++;
            }

            $this->command?->info("Seeded {$created} ongoing simulation events ({$prefix}).");
            $this->command?->line('Window: '.$startAt->format('M j, Y g:i A').' – '.$endAt->format('g:i A'));
            $this->command?->line('Open: /admin/simulation-events (Simulation Events tab)');
        });
    }

    /**
     * @param  \Illuminate\Support\Collection<int, CampaignRequest>  $campaigns
     */
    private function resolveCampaign($campaigns, TrainingModule $module, int $index): ?CampaignRequest
    {
        if ($campaigns->isEmpty()) {
            return null;
        }

        $matching = $campaigns->firstWhere('training_module_id', $module->id);

        return $matching ?: $campaigns[$index % $campaigns->count()];
    }

    /**
     * @param  \Illuminate\Support\Collection<int, User>  $participants
     */
    private function attachParticipants(
        SimulationEvent $event,
        $participants,
        User $admin,
        int $count,
        int $offset,
    ): void {
        if ($participants->isEmpty() || $count <= 0) {
            return;
        }

        $slice = $participants
            ->slice(($offset * 5) % max(1, $participants->count()), $count)
            ->values();

        if ($slice->count() < $count) {
            $slice = $participants->take($count);
        }

        foreach ($slice as $participant) {
            EventRegistration::query()->updateOrCreate(
                [
                    'user_id' => $participant->id,
                    'simulation_event_id' => $event->id,
                ],
                [
                    'status' => 'approved',
                    'registered_at' => now()->subDays(3),
                    'approved_at' => now()->subDays(2),
                    'approved_by' => $admin->id,
                ],
            );
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function initialExecutionProgress(): array
    {
        $steps = collect(SimulationEventLifecycleService::EXECUTION_STEP_DEFINITIONS)
            ->map(fn (array $step) => [
                'key' => $step['key'],
                'label' => $step['label'],
                'completed' => false,
                'completed_at' => null,
            ])
            ->values()
            ->all();

        if (isset($steps[0])) {
            $steps[0]['completed'] = true;
            $steps[0]['completed_at'] = now()->subMinutes(20)->toIso8601String();
        }
        if (isset($steps[1])) {
            $steps[1]['completed'] = true;
            $steps[1]['completed_at'] = now()->subMinutes(10)->toIso8601String();
        }

        return $steps;
    }
}
