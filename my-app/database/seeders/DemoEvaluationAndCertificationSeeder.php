<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Certificate;
use App\Models\CertificateTemplate;
use App\Models\Evaluation;
use App\Models\EvaluationScore;
use App\Models\EventRegistration;
use App\Models\ParticipantEvaluation;
use App\Models\Scenario;
use App\Models\SimulationEvent;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoEvaluationAndCertificationSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            // Prefer event ID 3 so /simulation-events/3/evaluation shows data
            $event = SimulationEvent::find(3);
            if (! $event) {
                $event = SimulationEvent::whereIn('status', ['published', 'ongoing', 'completed'])->first();
            }

            if (! $event) {
                $this->command?->warn('No simulation event found. Run SimulationEventSeeder first.');
                return;
            }

            $admin = User::whereIn('role', ['LGU_ADMIN', 'LGU_TRAINER'])->first();
            if (! $admin) {
                $this->command?->warn('No admin/trainer user found. Run AdminUserSeeder first.');
                return;
            }

            // Ensure the event is linked to a scenario with criteria
            $scenario = $event->scenario;
            if (! $scenario) {
                $scenario = Scenario::first();
                if (! $scenario) {
                    $this->command?->warn('No scenario found. Run ScenarioSeeder first.');
                    return;
                }
                $event->scenario_id = $scenario->id;
                $event->save();
            }

            if (! $scenario->criteria) {
                $defaultCriteria = [
                    'Preparedness & Planning',
                    'Coordination & Communication',
                    'Response Execution',
                ];
                $scenario->criteria = $defaultCriteria;
                $scenario->save();
            }

            if (is_array($scenario->criteria)) {
                $criteria = $scenario->criteria;
            } else {
                $decoded = json_decode($scenario->criteria ?? '[]', true);
                $criteria = $decoded && is_array($decoded) && count($decoded) > 0
                    ? $decoded
                    : [
                        'Preparedness & Planning',
                        'Coordination & Communication',
                        'Response Execution',
                    ];
            }

            // Create demo participants with mixed statuses (active/inactive)
            $baseTimestamp = now()->format('YmdHis');
            $participantsConfig = [
                [
                    'name' => 'Demo Participant Present Passed',
                    'email_prefix' => 'demo.present.passed',
                    'user_status' => 'active',
                    'registration_status' => 'approved',
                    'attendance_status' => 'present',
                    'evaluation_result' => 'passed',
                ],
                [
                    'name' => 'Demo Participant Present Failed',
                    'email_prefix' => 'demo.present.failed',
                    'user_status' => 'active',
                    'registration_status' => 'approved',
                    'attendance_status' => 'present',
                    'evaluation_result' => 'failed',
                ],
                [
                    'name' => 'Demo Participant Late Passed',
                    'email_prefix' => 'demo.late.passed',
                    'user_status' => 'active',
                    'registration_status' => 'approved',
                    'attendance_status' => 'late',
                    'evaluation_result' => 'passed',
                ],
                [
                    'name' => 'Demo Participant Absent',
                    'email_prefix' => 'demo.absent',
                    'user_status' => 'active',
                    'registration_status' => 'approved',
                    'attendance_status' => 'absent',
                    'evaluation_result' => null,
                ],
                [
                    'name' => 'Demo Participant Inactive Approved',
                    'email_prefix' => 'demo.inactive.approved',
                    'user_status' => 'inactive',
                    'registration_status' => 'approved',
                    'attendance_status' => 'present',
                    'evaluation_result' => 'passed',
                ],
                [
                    'name' => 'Demo Participant Pending',
                    'email_prefix' => 'demo.pending',
                    'user_status' => 'active',
                    'registration_status' => 'pending',
                    'attendance_status' => null,
                    'evaluation_result' => null,
                ],
                [
                    'name' => 'Demo Participant Rejected',
                    'email_prefix' => 'demo.rejected',
                    'user_status' => 'active',
                    'registration_status' => 'rejected',
                    'attendance_status' => null,
                    'evaluation_result' => null,
                ],
            ];

            $registrations = [];

            foreach ($participantsConfig as $index => $config) {
                $timestamp = $baseTimestamp . sprintf('%02d', $index);
                $email = "{$config['email_prefix']}+{$timestamp}@example.com";

                $user = User::firstOrCreate(
                    ['email' => $email],
                    [
                        'name' => $config['name'],
                        'password' => Hash::make('password'),
                        'role' => 'PARTICIPANT',
                        'status' => $config['user_status'],
                        'participant_id' => 'DEMO-' . strtoupper(Str::random(6)),
                        'registered_at' => now()->subDays(rand(5, 30)),
                    ]
                );

                $registration = EventRegistration::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'simulation_event_id' => $event->id,
                    ],
                    [
                        'status' => $config['registration_status'],
                        'registered_at' => now()->subDays(rand(1, 5)),
                        'approved_at' => $config['registration_status'] === 'approved' ? now()->subDays(1) : null,
                        'rejected_at' => $config['registration_status'] === 'rejected' ? now()->subDays(1) : null,
                        'rejection_reason' => $config['registration_status'] === 'rejected' ? 'Did not meet participation criteria.' : null,
                        'approved_by' => $config['registration_status'] === 'approved' ? $admin->id : null,
                    ]
                );

                $registrations[] = [
                    'user' => $user,
                    'registration' => $registration,
                    'config' => $config,
                ];

                // Seed attendance for approved registrations
                if ($config['registration_status'] === 'approved' && $config['attendance_status']) {
                    Attendance::updateOrCreate(
                        [
                            'event_registration_id' => $registration->id,
                            'user_id' => $user->id,
                            'simulation_event_id' => $event->id,
                        ],
                        [
                            'check_in_method' => 'manual',
                            'status' => $config['attendance_status'],
                            'checked_in_at' => now()->subHours(rand(1, 3)),
                            'checked_out_at' => $config['attendance_status'] === 'completed' ? now() : null,
                            'notes' => $config['attendance_status'] === 'absent' ? 'Did not attend.' : null,
                            'is_locked' => false,
                            'marked_by' => $admin->id,
                        ]
                    );
                }
            }

            // Create a completed evaluation for the event
            $evaluation = Evaluation::updateOrCreate(
                ['simulation_event_id' => $event->id],
                [
                    'status' => 'completed',
                    'pass_threshold' => 75.00,
                    'overall_notes' => 'Demo evaluation data seeded for presentation.',
                    'created_by' => $admin->id,
                    'updated_by' => $admin->id,
                    'started_at' => now()->subDays(2),
                    'completed_at' => now()->subDay(),
                ]
            );

            // Create participant evaluations and scores
            $passedEvaluations = [];

            foreach ($registrations as $entry) {
                /** @var User $user */
                $user = $entry['user'];
                /** @var EventRegistration $registration */
                $registration = $entry['registration'];
                $config = $entry['config'];

                if ($config['registration_status'] !== 'approved' || ! $config['evaluation_result']) {
                    continue;
                }

                $attendance = Attendance::where('simulation_event_id', $event->id)
                    ->where('user_id', $user->id)
                    ->first();

                if (! $attendance) {
                    continue;
                }

                $participantEvaluation = ParticipantEvaluation::updateOrCreate(
                    [
                        'evaluation_id' => $evaluation->id,
                        'user_id' => $user->id,
                    ],
                    [
                        'attendance_id' => $attendance->id,
                        'status' => 'submitted',
                        'overall_feedback' => $config['evaluation_result'] === 'passed'
                            ? 'Demonstrated strong understanding of procedures.'
                            : 'Needs improvement on key response steps.',
                        'is_eligible_for_certification' => $config['evaluation_result'] === 'passed',
                        'evaluated_by' => $admin->id,
                        'submitted_at' => now()->subDay(),
                    ]
                );

                // Remove existing scores to keep seeding idempotent
                $participantEvaluation->scores()->delete();

                $order = 0;
                foreach ($criteria as $criterion) {
                    $criterionName = is_array($criterion) ? $criterion : $criterion;

                    if ($config['evaluation_result'] === 'passed') {
                        // High scores for passed participants
                        $scoreValue = [8.0, 8.5, 9.0][min($order, 2)] ?? 8.0;
                    } else {
                        // Lower scores for failed participants
                        $scoreValue = [5.0, 6.0, 5.5][min($order, 2)] ?? 5.0;
                    }

                    EvaluationScore::create([
                        'participant_evaluation_id' => $participantEvaluation->id,
                        'criterion_name' => $criterionName,
                        'criterion_description' => null,
                        'score' => $scoreValue,
                        'max_score' => 10.00,
                        'comment' => $config['evaluation_result'] === 'passed'
                            ? 'Met expectations for this criterion.'
                            : 'Below expected performance for this criterion.',
                        'order' => $order++,
                    ]);
                }

                // Calculate and persist aggregate scores + eligibility
                $participantEvaluation->calculateScores();

                if ($participantEvaluation->result === 'passed') {
                    $passedEvaluations[] = $participantEvaluation;
                }
            }

            // Issue sample certificates for some passed participants
            $template = CertificateTemplate::where('status', 'active')->first();
            if ($template && ! empty($passedEvaluations)) {
                foreach (collect($passedEvaluations)->take(2) as $pe) {
                    // Skip if a certificate for this participant + event already exists
                    $existing = Certificate::where('user_id', $pe->user_id)
                        ->where('simulation_event_id', $event->id)
                        ->whereNull('revoked_at')
                        ->first();
                    if ($existing) {
                        continue;
                    }

                    // Generate a unique demo certificate number (idempotent across re-seeds)
                    do {
                        $seq = Certificate::where('certificate_number', 'like', 'DEMO-' . date('Y') . '-%')->count() + 1;
                        $certNumber = sprintf('DEMO-%s-%04d', date('Y'), $seq);
                    } while (Certificate::where('certificate_number', $certNumber)->exists());

                    Certificate::create([
                        'user_id' => $pe->user_id,
                        'simulation_event_id' => $event->id,
                        'participant_evaluation_id' => $pe->id,
                        'certificate_template_id' => $template->id,
                        'certificate_number' => $certNumber,
                        'type' => 'completion',
                        'training_type' => $event->scenario?->title ?? 'Disaster Preparedness Training',
                        'completion_date' => $event->event_date ?? now()->subDays(1),
                        'final_score' => $pe->average_score,
                        'issued_at' => now()->subHours(rand(1, 8)),
                        'issued_by' => $admin->id,
                    ]);
                }
            }

            $this->command?->info('Demo participants, attendance, evaluations, and certificates seeded for presentation.');
            $this->command?->info("Open /simulation-events/{$event->id}/evaluation and the Certification dashboard to view seeded data.");
        });
    }
}

