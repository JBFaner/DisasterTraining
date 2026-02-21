<?php

namespace Database\Seeders;

use App\Models\EventRegistration;
use App\Models\SimulationEvent;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RegisteredParticipantForEvaluationSeeder extends Seeder
{
    /**
     * Seed a participant who is registered (approved) for a simulation event
     * so they appear in the Evaluation & Scoring participants list and can be evaluated.
     * Uses simulation event ID 1 by default (e.g. Fire Drill February 2026).
     */
    public function run(): void
    {
        DB::transaction(function () {
            $eventId = 1;
            $event = SimulationEvent::find($eventId);

            if (! $event) {
                $event = SimulationEvent::whereIn('status', ['published', 'ongoing', 'completed'])->first();
            }

            if (! $event) {
                $this->command?->warn('No simulation event found. Create an event first, then run this seeder.');
                return;
            }

            $timestamp = now()->format('YmdHis');
            $participantId = $this->generateParticipantId();

            $user = User::create([
                'name' => "Seed Participant {$timestamp}",
                'email' => "eval.participant+{$timestamp}@example.com",
                'password' => bcrypt('password'),
                'role' => 'PARTICIPANT',
                'status' => 'active',
                'participant_id' => $participantId,
                'registered_at' => now(),
            ]);

            EventRegistration::updateOrCreate(
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

            $this->command?->info(
                "Registered participant seeded for evaluation: Event \"{$event->title}\" (ID {$event->id}). " .
                "User ID: {$user->id}, Email: {$user->email}, Participant ID: {$participantId}. " .
                "Go to /simulation-events/{$event->id}/evaluation to evaluate."
            );
        });
    }

    private function generateParticipantId(): string
    {
        do {
            $id = 'PART-' . strtoupper(Str::random(8));
        } while (User::where('participant_id', $id)->exists());

        return $id;
    }
}
