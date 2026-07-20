<?php

namespace Database\Seeders;

use Illuminate\Support\Carbon;

/**
 * Seeds 5 realistic ongoing Simulation Events today, 4:00 PM – 7:00 PM.
 *
 * Run: php artisan db:seed --class=SimulationEventsAfternoonOngoingSeeder
 */
class SimulationEventsAfternoonOngoingSeeder extends AbstractOngoingSimulationEventsSeeder
{
    public const TITLE_PREFIX = '[Afternoon Live]';

    protected function titlePrefix(): string
    {
        return self::TITLE_PREFIX;
    }

    protected function startTimeToday(): Carbon
    {
        return now()->copy()->setTime(16, 0, 0);
    }

    protected function endTimeToday(): Carbon
    {
        return now()->copy()->setTime(19, 0, 0);
    }

    protected function eventDefinitions(): array
    {
        return [
            [
                'title' => 'Fire Extinguisher PASS Drill — QC Hall Courtyard',
                'disaster_type' => 'Fire',
                'event_category' => 'Drill',
                'location' => 'Quezon City Hall East Courtyard',
                'building' => 'City Hall Annex',
                'room_zone' => 'Courtyard staging lane A',
                'location_notes' => 'Muster near the east flagpole. Keep driveway clear for EMS.',
                'assembly_points' => 'East courtyard flagpole',
                'exits' => 'Lobby exits and south service gate',
                'is_high_risk_location' => true,
                'target_audience' => 'LGU staff, floor wardens, barangay responders',
                'max_participants' => 40,
                'participant_count' => 14,
                'description' => 'Hands-on PASS technique drill with staged Class A props, warden accountability, and radio net check.',
                'safety_guidelines' => 'Closed shoes required. Stay upwind of simulated smoke. Follow marshal lane markers.',
                'hazard_warnings' => 'Simulated smoke and loud alarms may affect sensitive participants.',
                'required_ppe' => 'Closed shoes; gloves for extinguisher operators; high-visibility vests for marshals',
                'facilitator_instructions' => 'Confirm extinguisher staging before alarm. Complete headcount before releasing participants.',
            ],
            [
                'title' => 'Earthquake Drop-Cover-Hold — Bestlink Campus',
                'disaster_type' => 'Earthquake',
                'event_category' => 'Full-scale Exercise',
                'location' => 'Bestlink College Main Campus',
                'building' => 'Academic Building 2',
                'room_zone' => 'Floors 2–4 classrooms',
                'location_notes' => 'Evacuate to open field after shaking simulation ends. No elevator use.',
                'assembly_points' => 'Open field beside gymnasium',
                'exits' => 'North and west stairwells only',
                'is_high_risk_location' => true,
                'target_audience' => 'Students, faculty, campus safety team',
                'max_participants' => 80,
                'participant_count' => 16,
                'description' => 'Functional earthquake exercise covering classroom response, corridor marshaling, and outdoor accountability.',
                'safety_guidelines' => 'No running on stairs. Assist PWDs. Wait for all-clear before re-entry.',
                'hazard_warnings' => 'Falling-object simulation props in designated rooms.',
                'required_ppe' => 'Closed shoes; hard hats for safety marshals',
                'facilitator_instructions' => 'Trigger inject after 90 seconds of drop-cover-hold. Track missing persons at assembly.',
            ],
            [
                'title' => 'Flood Evacuation Functional Exercise — Bagong Silangan',
                'disaster_type' => 'Flood',
                'event_category' => 'Full-scale Exercise',
                'location' => 'Barangay Bagong Silangan Covered Court',
                'building' => 'Covered court & barangay command post',
                'room_zone' => 'Court floor + radio desk',
                'location_notes' => 'Mark high-ground assembly with cones before start.',
                'assembly_points' => 'Covered court high side',
                'exits' => 'North gate and barangay hall side door',
                'is_high_risk_location' => true,
                'target_audience' => 'BDRRMC, rescue volunteers, barangay officials',
                'max_participants' => 45,
                'participant_count' => 13,
                'description' => 'Rising-water injects, family accountability, and relief staging coordination for flood-prone zones.',
                'safety_guidelines' => 'Keep hydration station open. Document decisions on the inject log.',
                'hazard_warnings' => 'Uneven wet surfaces around court perimeter.',
                'required_ppe' => 'Closed shoes; rain jackets for outdoor marshals',
                'facilitator_instructions' => 'Introduce rainfall inject every 20 minutes. Capture resource gaps in debrief.',
            ],
            [
                'title' => 'Fire Safety Functional Exercise — BGC Plaza',
                'disaster_type' => 'Fire',
                'event_category' => 'Full-scale Exercise',
                'location' => 'BGC High Street Event Deck',
                'building' => 'Outdoor staging + nearby office lobby',
                'room_zone' => 'Lobby Level & Plaza',
                'location_notes' => 'Coordinate with building security for alarm simulation window.',
                'assembly_points' => 'Central plaza near the amphitheater',
                'exits' => 'Lobby revolving doors and fire exits A/B',
                'is_high_risk_location' => true,
                'target_audience' => 'Building fire wardens, security, safety officers',
                'max_participants' => 50,
                'participant_count' => 15,
                'description' => 'Alarm recognition, evacuation flow, and extinguisher team deployment for mixed-use commercial cluster.',
                'safety_guidelines' => 'Do not block driveway. Use assigned lanes for marshals.',
                'hazard_warnings' => 'Vehicle traffic around plaza; assign traffic controllers.',
                'required_ppe' => 'High-visibility vests; closed shoes',
                'facilitator_instructions' => 'Start with pre-brief, then staged alarm. Mark attendance before equipment deployment.',
            ],
            [
                'title' => 'Mass Casualty Medical Response — Commonwealth',
                'disaster_type' => 'Mass Casualty',
                'event_category' => 'Drill',
                'location' => 'Commonwealth Avenue Staging Area',
                'building' => 'Mobile command tent',
                'room_zone' => 'Open lot beside barangay covered court',
                'location_notes' => 'Triage lanes marked with color cones before start.',
                'assembly_points' => 'Covered court triage zone',
                'exits' => 'Lot egress toward Commonwealth service road',
                'is_high_risk_location' => true,
                'target_audience' => 'First responders, barangay health workers, volunteers',
                'max_participants' => 35,
                'participant_count' => 12,
                'description' => 'Triage tagging, ambulance handoff, and radio net discipline for multi-casualty afternoon drill.',
                'safety_guidelines' => 'No real patients. Pause if heat index is extreme.',
                'hazard_warnings' => 'Heat exposure and uneven lot surface.',
                'required_ppe' => 'Gloves, masks, high-visibility vests',
                'facilitator_instructions' => 'Release casualty injects in waves. Track time-to-triage for evaluation scoring.',
            ],
        ];
    }
}
