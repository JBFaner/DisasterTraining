<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\EventRegistration;
use App\Models\LessonCompletion;
use App\Models\SimulationEvent;
use App\Models\TrainingContent;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Seeds realistic Filipino participants:
 * - some with completed training modules only
 * - some registered/attended on simulation events
 * - some with both training complete + event participation
 */
class RealisticParticipantProgressSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $password = Hash::make('user@123');

            $people = [
                // Training complete only
                ['name' => 'Angela Mae Soriano', 'email' => 'angela.soriano@barangay.qc.local', 'barangay' => 'San Agustin', 'track' => 'training'],
                ['name' => 'Francis Lloyd Villanueva', 'email' => 'francis.villanueva@barangay.qc.local', 'barangay' => 'San Agustin', 'track' => 'training'],
                ['name' => 'Camille Joy Pascual', 'email' => 'camille.pascual@barangay.qc.local', 'barangay' => 'Fairview', 'track' => 'training'],
                ['name' => 'Daniel Joseph Mercado', 'email' => 'daniel.mercado@barangay.qc.local', 'barangay' => 'Novaliches', 'track' => 'training'],
                ['name' => 'Patricia Anne Gomez', 'email' => 'patricia.gomez@barangay.qc.local', 'barangay' => 'Batasan Hills', 'track' => 'training'],
                ['name' => 'Mark Anthony Salazar', 'email' => 'mark.salazar@barangay.qc.local', 'barangay' => 'Commonwealth', 'track' => 'training'],
                ['name' => 'Jennifer Rose Aguilar', 'email' => 'jennifer.aguilar@barangay.qc.local', 'barangay' => 'Payatas', 'track' => 'training'],
                ['name' => 'Christian Paul Dizon', 'email' => 'christian.dizon@barangay.qc.local', 'barangay' => 'Sauyo', 'track' => 'training'],
                ['name' => 'Michelle Ann Bernardo', 'email' => 'michelle.bernardo@barangay.qc.local', 'barangay' => 'Holy Spirit', 'track' => 'training'],
                ['name' => 'Ryan Christopher Lopez', 'email' => 'ryan.lopez@barangay.qc.local', 'barangay' => 'Culiat', 'track' => 'training'],

                // Simulation event only (registered + present)
                ['name' => 'Stephanie Mae Javier', 'email' => 'stephanie.javier@barangay.qc.local', 'barangay' => 'San Agustin', 'track' => 'event'],
                ['name' => 'Jonathan Cruz Villamor', 'email' => 'jonathan.villamor@barangay.qc.local', 'barangay' => 'San Agustin', 'track' => 'event'],
                ['name' => 'Katrina Isabel Ramos', 'email' => 'katrina.ramos@barangay.qc.local', 'barangay' => 'Fairview', 'track' => 'event'],
                ['name' => 'Erick John Manalo', 'email' => 'erick.manalo@barangay.qc.local', 'barangay' => 'Novaliches', 'track' => 'event'],
                ['name' => 'Princess Diane Cortez', 'email' => 'princess.cortez@barangay.qc.local', 'barangay' => 'Commonwealth', 'track' => 'event'],
                ['name' => 'Allan Jay Mendoza', 'email' => 'allan.mendoza@barangay.qc.local', 'barangay' => 'Batasan Hills', 'track' => 'event'],
                ['name' => 'Grace Ann Villar', 'email' => 'grace.villar@barangay.qc.local', 'barangay' => 'Payatas', 'track' => 'event'],
                ['name' => 'Kevin Mark Ocampo', 'email' => 'kevin.ocampo@barangay.qc.local', 'barangay' => 'Culiat', 'track' => 'event'],

                // Both training complete + simulation event
                ['name' => 'Marianne Joy Escalante', 'email' => 'marianne.escalante@barangay.qc.local', 'barangay' => 'San Agustin', 'track' => 'both'],
                ['name' => 'Jerome Andrei Padilla', 'email' => 'jerome.padilla@barangay.qc.local', 'barangay' => 'San Agustin', 'track' => 'both'],
                ['name' => 'Hannah Marie Tolentino', 'email' => 'hannah.tolentino@barangay.qc.local', 'barangay' => 'Fairview', 'track' => 'both'],
                ['name' => 'Samuel David Ignacio', 'email' => 'samuel.ignacio@barangay.qc.local', 'barangay' => 'Novaliches', 'track' => 'both'],
                ['name' => 'Claire Denise Abad', 'email' => 'claire.abad@barangay.qc.local', 'barangay' => 'Commonwealth', 'track' => 'both'],
                ['name' => 'Patrick James Romero', 'email' => 'patrick.romero@barangay.qc.local', 'barangay' => 'Holy Spirit', 'track' => 'both'],
                ['name' => 'Alyssa Nicole David', 'email' => 'alyssa.david@barangay.qc.local', 'barangay' => 'Sauyo', 'track' => 'both'],
                ['name' => 'Bryan Joseph Enriquez', 'email' => 'bryan.enriquez@barangay.qc.local', 'barangay' => 'Bagong Silangan', 'track' => 'both'],
            ];

            $moduleIds = [5, 6, 7, 8];
            $lessonsByModule = [];
            foreach ($moduleIds as $moduleId) {
                $lessonsByModule[$moduleId] = TrainingContent::where('training_module_id', $moduleId)
                    ->orderBy('sort_order')
                    ->get();
            }

            $eventIds = SimulationEvent::query()
                ->whereIn('status', ['completed', 'ended', 'published', 'ongoing'])
                ->orderByDesc('event_date')
                ->pluck('id')
                ->take(8)
                ->values()
                ->all();

            if ($eventIds === []) {
                $this->command?->warn('No simulation events found.');
                return;
            }

            $created = 0;
            $trainingDone = 0;
            $eventAssigned = 0;

            foreach ($people as $i => $person) {
                $user = User::updateOrCreate(
                    ['email' => $person['email']],
                    [
                        'name' => $person['name'],
                        'password' => $password,
                        'role' => 'PARTICIPANT',
                        'status' => 'active',
                        'barangay' => $person['barangay'],
                        'city' => 'Quezon City',
                        'province' => 'Metro Manila',
                        'participant_id' => 'PART-'.strtoupper(Str::random(8)),
                        'registered_at' => now()->subDays(rand(10, 60)),
                        'email_verified_at' => now()->subDays(rand(5, 40)),
                    ]
                );
                $created++;

                $track = $person['track'];

                if (in_array($track, ['training', 'both'], true)) {
                    // Complete Fire Safety (5) fully; optionally one more module
                    $modulesToComplete = $track === 'both'
                        ? [5, $moduleIds[($i % 3) + 1]]
                        : [5];

                    foreach ($modulesToComplete as $moduleId) {
                        foreach ($lessonsByModule[$moduleId] as $lesson) {
                            LessonCompletion::updateOrCreate(
                                [
                                    'user_id' => $user->id,
                                    'training_content_id' => $lesson->id,
                                ],
                                [
                                    'training_module_id' => $moduleId,
                                    'training_lesson_id' => null,
                                    'completed_at' => now()->subDays(rand(2, 25)),
                                ]
                            );
                        }
                    }
                    $trainingDone++;
                }

                if (in_array($track, ['event', 'both'], true)) {
                    // Assign to 1–2 events
                    $assignCount = $track === 'both' ? 2 : 1;
                    $chosen = collect($eventIds)->shuffle()->take($assignCount);

                    foreach ($chosen as $eventId) {
                        $registration = EventRegistration::updateOrCreate(
                            [
                                'user_id' => $user->id,
                                'simulation_event_id' => $eventId,
                            ],
                            [
                                'status' => 'approved',
                                'registered_at' => now()->subDays(rand(3, 20)),
                                'approved_at' => now()->subDays(rand(1, 15)),
                            ]
                        );

                        Attendance::updateOrCreate(
                            [
                                'user_id' => $user->id,
                                'simulation_event_id' => $eventId,
                            ],
                            [
                                'event_registration_id' => $registration->id,
                                'check_in_method' => 'manual',
                                'status' => 'present',
                                'checked_in_at' => now()->subDays(rand(0, 10))->setTime(rand(8, 10), rand(0, 59)),
                                'is_locked' => false,
                            ]
                        );
                    }
                    $eventAssigned++;
                }
            }

            // Also put some existing realistic participants onto events if missing
            $existing = User::query()
                ->where('role', 'PARTICIPANT')
                ->where('status', 'active')
                ->where(function ($q) {
                    $q->where('email', 'like', '%@gmail.com')
                        ->orWhere('email', 'like', '%@demo.local')
                        ->orWhere('email', 'like', '%@example.com');
                })
                ->whereDoesntHave('eventRegistrations')
                ->limit(12)
                ->get();

            // Fallback if relation method missing
            if ($existing->isEmpty()) {
                $existingIds = User::where('role', 'PARTICIPANT')
                    ->where('status', 'active')
                    ->pluck('id');
                $alreadyRegistered = EventRegistration::whereIn('user_id', $existingIds)->pluck('user_id')->unique();
                $existing = User::where('role', 'PARTICIPANT')
                    ->where('status', 'active')
                    ->whereNotIn('id', $alreadyRegistered)
                    ->whereIn('id', [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 56, 334, 360, 361, 362, 363, 364])
                    ->get();
            }

            foreach ($existing as $idx => $user) {
                $eventId = $eventIds[$idx % count($eventIds)];
                $registration = EventRegistration::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'simulation_event_id' => $eventId,
                    ],
                    [
                        'status' => 'approved',
                        'registered_at' => now()->subDays(rand(5, 30)),
                        'approved_at' => now()->subDays(rand(2, 20)),
                    ]
                );

                Attendance::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'simulation_event_id' => $eventId,
                    ],
                    [
                        'event_registration_id' => $registration->id,
                        'check_in_method' => 'manual',
                        'status' => 'present',
                        'checked_in_at' => now()->subDays(rand(1, 12))->setTime(rand(8, 11), rand(0, 59)),
                        'is_locked' => false,
                    ]
                );

                // Give a few existing users completed Fire Safety training too
                if ($idx < 6 && isset($lessonsByModule[5])) {
                    foreach ($lessonsByModule[5] as $lesson) {
                        LessonCompletion::updateOrCreate(
                            [
                                'user_id' => $user->id,
                                'training_content_id' => $lesson->id,
                            ],
                            [
                                'training_module_id' => 5,
                                'training_lesson_id' => null,
                                'completed_at' => now()->subDays(rand(5, 30)),
                            ]
                        );
                    }
                }
            }

            $this->command?->info("Realistic participants upserted: {$created}");
            $this->command?->info("With completed training: {$trainingDone}");
            $this->command?->info("Assigned to simulation events: {$eventAssigned}");
            $this->command?->info('Total participants now: '.User::where('role', 'PARTICIPANT')->count());
        });
    }
}
