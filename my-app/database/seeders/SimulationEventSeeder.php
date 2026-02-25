<?php

namespace Database\Seeders;

use App\Models\Scenario;
use App\Models\SimulationEvent;
use App\Models\User;
use Illuminate\Database\Seeder;

class SimulationEventSeeder extends Seeder
{
    public function run(): void
    {
        $creator = User::whereIn('role', ['LGU_ADMIN', 'LGU_TRAINER'])->first();
        $scenario = Scenario::first();

        if (! $creator || ! $scenario) {
            $this->command?->warn('Missing admin/trainer user or scenario; skipping SimulationEventSeeder.');
            return;
        }

        $events = [
            [
                'title' => 'Quarterly Fire Drill - Barangay Hall',
                'disaster_type' => 'Fire',
                'description' => 'Simulation of a fire incident in the barangay hall with full evacuation drill.',
                'event_category' => 'Drill',
                'status' => 'published',
                'event_date' => now()->addDays(7)->toDateString(),
                'start_time' => '09:00',
                'end_time' => '11:00',
                'is_recurring' => false,
                'location' => 'Barangay Hall',
                'building' => 'Main Building',
                'room_zone' => 'Ground Floor',
                'location_notes' => 'Assembly point at covered court.',
                'accessibility_notes' => 'Wheelchair access available at side entrance.',
                'exits' => 'Front main exit, side exit near records room.',
                'hazard_zones' => 'Records room, pantry area.',
                'assembly_points' => 'Covered court across the street.',
                'is_high_risk_location' => true,
                'scenario_id' => $scenario->id,
                'scenario_is_required' => true,
                'facilitators' => [$creator->name],
                'allowed_participant_types' => ['LGU_ADMIN', 'LGU_TRAINER', 'PARTICIPANT'],
                'max_participants' => 80,
                'self_registration_enabled' => true,
                'approval_required' => false,
                'qr_code_enabled' => true,
                'attendance_code' => 'FIREDRILL',
                'reserved_resources' => [],
                'safety_guidelines' => 'Wear closed shoes and follow marshal instructions.',
                'hazard_warnings' => 'Simulated smoke may affect people with respiratory conditions.',
                'required_ppe' => 'Closed shoes; optional face mask.',
                'event_phases' => ['Briefing', 'Alarm', 'Evacuation', 'Debriefing'],
                'inject_triggers' => [],
                'facilitator_instructions' => 'Ensure all zones are checked and accounted for during debrief.',
                'email_notifications_enabled' => true,
                'sms_notifications_enabled' => false,
                'notification_schedule' => [],
                'created_by' => $creator->id,
                'updated_by' => $creator->id,
            ],
            [
                'title' => 'Completed Earthquake Drill - Municipal Hall',
                'disaster_type' => 'Earthquake',
                'description' => 'Previously conducted earthquake drill to showcase completed event state.',
                'event_category' => 'Drill',
                'status' => 'completed',
                'event_date' => now()->subDays(10)->toDateString(),
                'start_time' => '10:00',
                'end_time' => '12:00',
                'is_recurring' => false,
                'location' => 'Municipal Hall',
                'building' => 'Main Building',
                'room_zone' => 'Second Floor',
                'location_notes' => 'Assembly point at open parking lot.',
                'accessibility_notes' => 'Elevator and ramp available.',
                'exits' => 'Main stairwell, emergency back exit.',
                'hazard_zones' => 'Glass-front offices, storage areas.',
                'assembly_points' => 'Open parking lot behind the building.',
                'is_high_risk_location' => true,
                'scenario_id' => $scenario->id,
                'scenario_is_required' => true,
                'facilitators' => [$creator->name],
                'allowed_participant_types' => ['LGU_ADMIN', 'LGU_TRAINER', 'PARTICIPANT'],
                'max_participants' => 120,
                'self_registration_enabled' => true,
                'approval_required' => false,
                'qr_code_enabled' => true,
                'attendance_code' => 'EQUAKE2026',
                'reserved_resources' => [],
                'safety_guidelines' => 'Follow drop-cover-hold protocol and move calmly to assembly area.',
                'hazard_warnings' => 'Falling objects during simulated shaking.',
                'required_ppe' => 'Closed shoes; optional hard hat for facilitators.',
                'event_phases' => ['Briefing', 'Shaking Simulation', 'Evacuation', 'Headcount', 'Debriefing'],
                'inject_triggers' => [],
                'facilitator_instructions' => 'Emphasize calm evacuation and account for all staff.',
                'email_notifications_enabled' => true,
                'sms_notifications_enabled' => false,
                'notification_schedule' => [],
                'created_by' => $creator->id,
                'updated_by' => $creator->id,
            ],
        ];

        foreach ($events as $event) {
            SimulationEvent::firstOrCreate(
                ['title' => $event['title']],
                $event
            );
        }
    }
}

