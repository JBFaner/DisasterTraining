<?php

namespace Database\Seeders;

use App\Models\EventRegistration;
use App\Models\SimulationEvent;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Restores representative event registrations from the Inventory.sql backup.
 */
class InventoryEventRegistrationSeeder extends Seeder
{
    public function run(): void
    {
        $fireDrill = SimulationEvent::where('title', 'Quarterly Fire Drill - Barangay Hall')->first();
        $earthquakeDrill = SimulationEvent::where('title', 'Completed Earthquake Drill - Municipal Hall')->first();

        if (! $fireDrill || ! $earthquakeDrill) {
            $this->command?->warn('Simulation events not found; run SimulationEventSeeder first.');

            return;
        }

        $admin = User::where('email', 'jbcursor@gmail.com')->first();

        $evalParticipant = User::where('participant_id', 'PART-5ZXVN6Q2')->first()
            ?? User::where('email', 'like', 'eval.participant+%@example.com')->first();

        if ($evalParticipant) {
            EventRegistration::updateOrCreate(
                [
                    'user_id' => $evalParticipant->id,
                    'simulation_event_id' => $fireDrill->id,
                ],
                [
                    'status' => 'approved',
                    'registered_at' => now()->subDays(12),
                    'approved_at' => now()->subDays(12),
                ]
            );
        }

        $earthquakeRegistrations = [
            ['name' => 'Demo Participant Present Passed', 'status' => 'approved'],
            ['name' => 'Demo Participant Present Failed', 'status' => 'approved'],
            ['name' => 'Demo Participant Late Passed', 'status' => 'approved'],
            ['name' => 'Demo Participant Absent', 'status' => 'approved'],
            ['name' => 'Demo Participant Inactive Approved', 'status' => 'approved'],
            ['name' => 'Demo Participant Pending', 'status' => 'pending'],
            ['name' => 'Demo Participant Rejected', 'status' => 'rejected', 'rejection_reason' => 'Did not meet participation criteria.'],
        ];

        foreach ($earthquakeRegistrations as $entry) {
            $user = User::where('name', $entry['name'])->where('role', 'PARTICIPANT')->first();
            if (! $user) {
                continue;
            }

            EventRegistration::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'simulation_event_id' => $earthquakeDrill->id,
                ],
                [
                    'status' => $entry['status'],
                    'rejection_reason' => $entry['rejection_reason'] ?? null,
                    'registered_at' => now()->subDays(15),
                    'approved_at' => $entry['status'] === 'approved' ? now()->subDays(13) : null,
                    'rejected_at' => $entry['status'] === 'rejected' ? now()->subDays(13) : null,
                    'approved_by' => $entry['status'] === 'approved' ? $admin?->id : null,
                ]
            );
        }

        $participantEmails = User::query()
            ->where('role', 'PARTICIPANT')
            ->where('email', 'like', 'participant.%@example.com')
            ->pluck('email');

        foreach ($participantEmails as $email) {
            $user = User::where('email', $email)->first();
            if (! $user) {
                continue;
            }

            $status = match (true) {
                str_contains($email, 'inactive') => 'pending',
                default => 'approved',
            };

            EventRegistration::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'simulation_event_id' => $earthquakeDrill->id,
                ],
                [
                    'status' => $status,
                    'registered_at' => now()->subDays(rand(10, 18)),
                    'approved_at' => $status === 'approved' ? now()->subDays(rand(8, 12)) : null,
                ]
            );
        }

        $this->command?->info('Inventory event registrations seeded.');
    }
}
