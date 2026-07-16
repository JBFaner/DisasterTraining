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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Seeds 5 realistic Simulation Events that start "now" (today's schedule window).
 *
 * Run: php artisan db:seed --class=SimulationEventsStartingNowSeeder
 */
class SimulationEventsStartingNowSeeder extends Seeder
{
    public const TITLE_PREFIX = '[Live Now]';

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
                ->limit(40)
                ->get();

            $now = now();
            // Round start to the current half-hour so the window feels "live".
            $startMinute = $now->minute < 30 ? 0 : 30;
            $startAt = $now->copy()->minute($startMinute)->second(0)->subMinutes(15);
            $endAt = $startAt->copy()->addHours(4);

            $definitions = $this->eventDefinitions();

            $created = 0;

            foreach ($definitions as $index => $definition) {
                $module = $modules[$index % $modules->count()];
                $template = $templates->isNotEmpty() ? $templates[$index % $templates->count()] : null;
                $campaign = $this->resolveCampaign($campaigns, $module, $index);
                $trainer = $trainers->isNotEmpty() ? $trainers[$index % $trainers->count()] : null;
                $scenario = $scenarios->firstWhere('training_module_id', $module->id)
                    ?? ($scenarios->isNotEmpty() ? $scenarios[$index % $scenarios->count()] : null);

                $title = self::TITLE_PREFIX.' '.$definition['title'];

                $event = SimulationEvent::query()->updateOrCreate(
                    ['title' => $title],
                    [
                        'disaster_type' => $definition['disaster_type'],
                        'description' => $definition['description'],
                        'event_category' => $definition['event_category'],
                        'status' => $definition['status'],
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
                        'published_at' => $definition['status'] !== 'draft' ? $now->copy()->subHours(2) : null,
                        'actual_start_time' => $definition['status'] === 'ongoing' ? $startAt : null,
                        'started_by' => $definition['status'] === 'ongoing' ? $admin->id : null,
                        'readiness_confirmations' => [
                            'venue_confirmed' => true,
                            'schedule_confirmed' => true,
                        ],
                        'execution_progress' => $this->initialExecutionProgress($definition['status']),
                        'timeline_entries' => $definition['status'] === 'ongoing'
                            ? [
                                [
                                    'label' => 'Simulation started',
                                    'time' => $startAt->format('H:i'),
                                    'recorded_at' => $startAt->toIso8601String(),
                                ],
                                [
                                    'label' => 'Pre-briefing in progress',
                                    'time' => $startAt->copy()->addMinutes(10)->format('H:i'),
                                    'recorded_at' => $startAt->copy()->addMinutes(10)->toIso8601String(),
                                ],
                            ]
                            : [],
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

            $this->command?->info("Seeded {$created} live simulation events starting now.");
            $this->command?->line('Open: /admin/simulation-events (Simulation Events tab)');
            $this->command?->line('Window: '.$startAt->format('M j, Y g:i A').' – '.$endAt->format('g:i A'));
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
        if ($matching) {
            return $matching;
        }

        return $campaigns[$index % $campaigns->count()];
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
    private function initialExecutionProgress(string $status): array
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

        if ($status === 'ongoing' && isset($steps[0])) {
            $steps[0]['completed'] = true;
            $steps[0]['completed_at'] = now()->subMinutes(5)->toIso8601String();
        }

        return $steps;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function eventDefinitions(): array
    {
        return [
            [
                'title' => 'Fire Extinguisher Hands-on Drill — Quezon City Hall',
                'disaster_type' => 'Fire',
                'event_category' => 'Drill',
                'status' => 'ongoing',
                'location' => 'Quezon City Hall Annex',
                'building' => 'Annex Building A',
                'room_zone' => 'Ground Floor Lobby & Courtyard',
                'location_notes' => 'Muster at the east courtyard after alarm.',
                'assembly_points' => 'East courtyard flagpole area',
                'exits' => 'Main lobby exits and south stairwell',
                'is_high_risk_location' => true,
                'target_audience' => 'LGU staff, barangay responders',
                'max_participants' => 40,
                'participant_count' => 12,
                'description' => 'Live fire extinguisher deployment drill with staged Class A fire simulation and floor warden accountability.',
                'safety_guidelines' => 'Wear closed shoes. Stay upwind of simulated smoke. Follow marshal instructions.',
                'hazard_warnings' => 'Simulated smoke and loud alarms may affect sensitive participants.',
                'required_ppe' => 'Closed shoes; gloves for extinguisher operators',
                'facilitator_instructions' => 'Confirm extinguisher staging before alarm. Complete headcount before releasing participants.',
            ],
            [
                'title' => 'Earthquake Drop-Cover-Hold Functional Exercise',
                'disaster_type' => 'Earthquake',
                'event_category' => 'Full-scale Exercise',
                'status' => 'ongoing',
                'location' => 'Bestlink College Main Campus',
                'building' => 'Academic Building 2',
                'room_zone' => 'Floors 2–4 classrooms',
                'location_notes' => 'Evacuate to open field after shaking simulation ends.',
                'assembly_points' => 'Open field beside gymnasium',
                'exits' => 'North and west stairwells only',
                'is_high_risk_location' => true,
                'target_audience' => 'Students, faculty, campus safety team',
                'max_participants' => 80,
                'participant_count' => 15,
                'description' => 'Functional earthquake exercise covering classroom response, corridor marshaling, and outdoor accountability.',
                'safety_guidelines' => 'No running on stairs. Assist PWDs. Wait for all-clear before re-entry.',
                'hazard_warnings' => 'Falling-object simulation props in designated rooms.',
                'required_ppe' => 'Closed shoes; hard hats for safety marshals',
                'facilitator_instructions' => 'Trigger inject after 90 seconds of drop-cover-hold. Track missing persons at assembly.',
            ],
            [
                'title' => 'Flood Evacuation Tabletop — Barangay Bagong Silangan',
                'disaster_type' => 'Flood',
                'event_category' => 'Tabletop',
                'status' => 'published',
                'location' => 'Bagong Silangan Barangay Hall',
                'building' => 'Barangay Hall Session Room',
                'room_zone' => 'Multi-purpose hall',
                'location_notes' => 'Map boards and radio check before scenario injects.',
                'assembly_points' => 'N/A — tabletop command post',
                'exits' => 'Main entrance and side door',
                'is_high_risk_location' => false,
                'target_audience' => 'Barangay officials, BDRRMC, rescue volunteers',
                'max_participants' => 25,
                'participant_count' => 10,
                'description' => 'Decision-making tabletop for rising floodwater, evacuation timing, and relief staging coordination.',
                'safety_guidelines' => 'Keep radios charged. Document decisions on the inject log.',
                'hazard_warnings' => 'None physical — scenario stress injects only.',
                'required_ppe' => 'None',
                'facilitator_instructions' => 'Introduce rainfall inject every 20 minutes. Capture resource gaps in debrief.',
            ],
            [
                'title' => 'Fire Safety Functional Exercise — BGC Corporate Cluster',
                'disaster_type' => 'Fire',
                'event_category' => 'Full-scale Exercise',
                'status' => 'ongoing',
                'location' => 'BGC High Street Event Deck',
                'building' => 'Outdoor staging + nearby office lobby',
                'room_zone' => 'Lobby Level & Plaza',
                'location_notes' => 'Coordinate with building security for alarm simulation window.',
                'assembly_points' => 'Central plaza near the amphitheater',
                'exits' => 'Lobby revolving doors and fire exits A/B',
                'is_high_risk_location' => true,
                'target_audience' => 'Building fire wardens, security, safety officers',
                'max_participants' => 50,
                'participant_count' => 14,
                'description' => 'Functional fire response exercise focusing on alarm recognition, evacuation flow, and extinguisher team deployment.',
                'safety_guidelines' => 'Do not block driveway. Use assigned lanes for marshals.',
                'hazard_warnings' => 'Vehicle traffic around plaza; assign traffic controllers.',
                'required_ppe' => 'High-visibility vests; closed shoes',
                'facilitator_instructions' => 'Start with pre-brief, then staged alarm. Mark attendance before equipment deployment.',
            ],
            [
                'title' => 'Emergency Medical Response Drill — Commonwealth',
                'disaster_type' => 'Mass Casualty',
                'event_category' => 'Drill',
                'status' => 'published',
                'location' => 'Commonwealth Avenue Staging Area',
                'building' => 'Mobile command tent',
                'room_zone' => 'Open lot beside barangay covered court',
                'location_notes' => 'Triage lanes marked with color cones before start.',
                'assembly_points' => 'Covered court triage zone',
                'exits' => 'Lot egress toward Commonwealth service road',
                'is_high_risk_location' => true,
                'target_audience' => 'First responders, barangay health workers, volunteers',
                'max_participants' => 35,
                'participant_count' => 11,
                'description' => 'Mass-casualty medical response drill with triage tagging, ambulance handoff, and radio net discipline.',
                'safety_guidelines' => 'No real patients. Keep hydration station open. Pause if heat index is extreme.',
                'hazard_warnings' => 'Heat exposure and uneven lot surface.',
                'required_ppe' => 'Gloves, masks, high-visibility vests',
                'facilitator_instructions' => 'Release casualty injects in waves. Track time-to-triage for evaluation scoring.',
            ],
        ];
    }
}
