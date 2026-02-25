<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\EventRegistration;
use App\Models\SimulationEvent;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class RandomParticipantAttendanceSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            // Prefer event ID 3 so /simulation-events/3/evaluation has plenty of records
            $event = SimulationEvent::find(3);
            if (! $event) {
                $event = SimulationEvent::whereIn('status', ['published', 'ongoing', 'completed'])->first();
            }

            if (! $event) {
                $this->command?->warn('No simulation event found. Run SimulationEventSeeder first.');
                return;
            }

            $timestampBase = now()->format('YmdHis');

            $firstNames = [
                'Juan', 'Maria', 'Pedro', 'Ana', 'Ramon', 'Luzviminda',
                'Carlos', 'Elena', 'Roberto', 'Josefa', 'Miguel', 'Sofia',
                'Andres', 'Isabella', 'Rey', 'Danica',
            ];

            $lastNames = [
                'Dela Cruz', 'Santos', 'Reyes', 'Ramirez', 'Bautista',
                'Garcia', 'Cruz', 'Fernandez', 'Mendoza', 'Aquino',
                'Valencia', 'Domingo', 'Alvarez', 'Gonzales',
            ];

            // Create 12 additional random participants with mixed statuses
            for ($i = 0; $i < 12; $i++) {
                $first = $firstNames[array_rand($firstNames)];
                $last = $lastNames[array_rand($lastNames)];
                $name = trim($first . ' ' . $last);

                $timestamp = $timestampBase . sprintf('%02d', $i);
                $emailSlug = Str::slug($first . '.' . $last, '.');
                $email = "participant.{$emailSlug}.{$timestamp}@example.com";

                // 70% active, 30% inactive
                $userStatus = rand(1, 10) <= 7 ? 'active' : 'inactive';

                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => Hash::make('password'),
                    'role' => 'PARTICIPANT',
                    'status' => $userStatus,
                    'participant_id' => 'SEED-' . strtoupper(Str::random(6)),
                    'registered_at' => now()->subDays(rand(5, 40)),
                ]);

                // Registration status distribution: mostly approved, some pending/rejected
                $roll = rand(1, 10);
                if ($roll <= 6) {
                    $regStatus = 'approved';
                } elseif ($roll <= 8) {
                    $regStatus = 'pending';
                } else {
                    $regStatus = 'rejected';
                }

                $registration = EventRegistration::create([
                    'user_id' => $user->id,
                    'simulation_event_id' => $event->id,
                    'status' => $regStatus,
                    'registered_at' => now()->subDays(rand(1, 5)),
                    'approved_at' => $regStatus === 'approved' ? now()->subDays(1) : null,
                    'rejected_at' => $regStatus === 'rejected' ? now()->subDays(1) : null,
                    'rejection_reason' => $regStatus === 'rejected' ? 'Capacity already full for this drill.' : null,
                    'approved_by' => null,
                ]);

                // Seed attendance only for approved registrations
                if ($regStatus === 'approved') {
                    $attendanceStatuses = ['present', 'late', 'absent', 'excused', 'completed'];
                    $attendanceStatus = $attendanceStatuses[array_rand($attendanceStatuses)];

                    Attendance::create([
                        'event_registration_id' => $registration->id,
                        'user_id' => $user->id,
                        'simulation_event_id' => $event->id,
                        'check_in_method' => 'manual',
                        'status' => $attendanceStatus,
                        'checked_in_at' => now()->subHours(rand(1, 4)),
                        'checked_out_at' => in_array($attendanceStatus, ['present', 'completed', 'late'], true)
                            ? now()->subHours(rand(0, 1))
                            : null,
                        'notes' => $attendanceStatus === 'excused' ? 'Excused by supervisor.' : null,
                        'is_locked' => false,
                        'marked_by' => null,
                    ]);
                }
            }

            $this->command?->info("RandomParticipantAttendanceSeeder: additional participants, registrations, and attendance seeded for event ID {$event->id}.");
        });
    }
}

