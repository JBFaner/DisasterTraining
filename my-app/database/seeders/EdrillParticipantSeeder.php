<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\EventRegistration;
use App\Models\SimulationEvent;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EdrillParticipantSeeder extends Seeder
{
    /**
     * Seed a sample approved participant for Simulation Event ID 18 (Edrill).
     */
    public function run(): void
    {
        // Wrap in transaction so it either fully succeeds or does nothing
        DB::transaction(function () {
            // Ensure the event exists
            $event = SimulationEvent::find(18);
            if (!$event) {
                $this->command?->warn('SimulationEvent with ID 18 not found. Skipping EdrillParticipantSeeder.');
                return;
            }

            // ALWAYS create a NEW participant user so you can test with multiple participants
            $timestamp = now()->format('YmdHis');
            $user = User::create([
                'name' => "Edrill Participant {$timestamp}",
                'email' => "edrill.participant+{$timestamp}@example.com",
                'password' => bcrypt('password'),
                'role' => 'PARTICIPANT',
                'status' => 'active',
            ]);

            // Create or update an approved registration for this event & user
            $registration = EventRegistration::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'simulation_event_id' => $event->id,
                ],
                [
                    'status' => 'approved',
                    'registered_at' => now(),
                    'approved_at' => now(),
                    'approved_by' => null,
                ]
            );

            // Ensure attendance is marked as present so they are ready for evaluation
            Attendance::updateOrCreate(
                [
                    'event_registration_id' => $registration->id,
                    'user_id' => $user->id,
                    'simulation_event_id' => $event->id,
                ],
                [
                    'check_in_method' => 'manual',
                    'status' => 'present',
                    'checked_in_at' => now(),
                    'is_locked' => false,
                    'marked_by' => null,
                ]
            );

            $this->command?->info("NEW approved & present participant seeded for Edrill (event ID 18) with user ID {$user->id} and email {$user->email}.");
        });
    }
}

