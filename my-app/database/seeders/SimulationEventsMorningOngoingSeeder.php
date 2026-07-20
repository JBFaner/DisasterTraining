<?php

namespace Database\Seeders;

use Illuminate\Support\Carbon;

/**
 * Seeds 5 realistic ongoing Simulation Events today, 10:30 AM – 12:30 PM.
 *
 * Run: php artisan db:seed --class=SimulationEventsMorningOngoingSeeder
 */
class SimulationEventsMorningOngoingSeeder extends AbstractOngoingSimulationEventsSeeder
{
    public const TITLE_PREFIX = '[Morning Live]';

    protected function titlePrefix(): string
    {
        return self::TITLE_PREFIX;
    }

    protected function startTimeToday(): Carbon
    {
        return now()->copy()->setTime(10, 30, 0);
    }

    protected function endTimeToday(): Carbon
    {
        return now()->copy()->setTime(12, 30, 0);
    }

    protected function eventDefinitions(): array
    {
        return [
            [
                'title' => 'Office Fire Evacuation Walkthrough — Diliman',
                'disaster_type' => 'Fire',
                'event_category' => 'Drill',
                'location' => 'Diliman LGU Satellite Office',
                'building' => 'Wing B',
                'room_zone' => 'Floors 1–3',
                'location_notes' => 'Use stairwells only. Assembly at front parking bay 3.',
                'assembly_points' => 'Front parking bay 3',
                'exits' => 'North stairwell and lobby fire exit',
                'is_high_risk_location' => false,
                'target_audience' => 'Office staff, visitors desk, security',
                'max_participants' => 30,
                'participant_count' => 11,
                'description' => 'Morning fire evacuation drill with alarm recognition, floor sweep, and visitor accounting.',
                'safety_guidelines' => 'Walk, do not run. Assist visitors at reception.',
                'hazard_warnings' => 'Stairwell congestion during peak morning traffic.',
                'required_ppe' => 'Closed shoes; high-visibility vests for wardens',
                'facilitator_instructions' => 'Start roll call at 10:35. Release all-clear only after full headcount.',
            ],
            [
                'title' => 'School Earthquake Response — Cubao Campus',
                'disaster_type' => 'Earthquake',
                'event_category' => 'Drill',
                'location' => 'Cubao Senior High Campus',
                'building' => 'Main Academic Building',
                'room_zone' => 'Classrooms 201–210',
                'location_notes' => 'Teachers lead drop-cover-hold then evacuate to covered court.',
                'assembly_points' => 'Covered court rows A–D',
                'exits' => 'East and west stairwells',
                'is_high_risk_location' => true,
                'target_audience' => 'Students, teachers, campus DRRM team',
                'max_participants' => 60,
                'participant_count' => 18,
                'description' => 'Classroom earthquake response with corridor marshals and outdoor accountability check.',
                'safety_guidelines' => 'No backpacks on stairs. Buddy system for younger students.',
                'hazard_warnings' => 'Loose ceiling props in simulation rooms only.',
                'required_ppe' => 'Closed shoes',
                'facilitator_instructions' => 'Inject after 60 seconds. Teachers submit missing-person slips at assembly.',
            ],
            [
                'title' => 'Barangay Flood Preparedness Tabletop — Payatas',
                'disaster_type' => 'Flood',
                'event_category' => 'Tabletop',
                'location' => 'Barangay Payatas Hall',
                'building' => 'Session room',
                'room_zone' => 'Multi-purpose hall',
                'location_notes' => 'Map boards and radio check before scenario injects.',
                'assembly_points' => 'N/A — tabletop command post',
                'exits' => 'Main entrance and side door',
                'is_high_risk_location' => false,
                'target_audience' => 'Barangay officials, BDRRMC, rescue volunteers',
                'max_participants' => 24,
                'participant_count' => 10,
                'description' => 'Morning tabletop on evacuation timing, family registration, and relief staging for flood alerts.',
                'safety_guidelines' => 'Keep radios charged. Document decisions on the inject log.',
                'hazard_warnings' => 'None physical — scenario stress injects only.',
                'required_ppe' => 'None',
                'facilitator_instructions' => 'Rainfall inject every 15 minutes. Capture logistics gaps before noon debrief.',
            ],
            [
                'title' => 'First Aid & Triage Skills Drill — Commonwealth Health Station',
                'disaster_type' => 'Mass Casualty',
                'event_category' => 'Drill',
                'location' => 'Commonwealth Health Station Lot',
                'building' => 'Health station annex',
                'room_zone' => 'Triage tent rows',
                'location_notes' => 'Color-code triage lanes before 10:30 start.',
                'assembly_points' => 'Green recovery area under tent',
                'exits' => 'Lot egress to service road',
                'is_high_risk_location' => false,
                'target_audience' => 'Barangay health workers, volunteers, responders',
                'max_participants' => 28,
                'participant_count' => 12,
                'description' => 'Triage tagging, bleeding control basics, and patient handoff practice for morning responders.',
                'safety_guidelines' => 'Use manikins only. Rotate teams every 20 minutes.',
                'hazard_warnings' => 'Sun exposure — provide shade and water.',
                'required_ppe' => 'Gloves, masks',
                'facilitator_instructions' => 'Score time-to-tag and handoff quality. Pause for heat if needed.',
            ],
            [
                'title' => 'Mall Fire Warden Coordination — Fairview',
                'disaster_type' => 'Fire',
                'event_category' => 'Functional Exercise',
                'location' => 'Fairview Mall Service Corridor',
                'building' => 'Podium Level B',
                'room_zone' => 'Service corridor & tenant muster points',
                'location_notes' => 'Coordinate with mall security for controlled alarm window.',
                'assembly_points' => 'Outdoor loading bay muster',
                'exits' => 'Service exits S1–S3',
                'is_high_risk_location' => true,
                'target_audience' => 'Tenant fire wardens, mall security, safety officers',
                'max_participants' => 40,
                'participant_count' => 14,
                'description' => 'Functional exercise for tenant notification, corridor sweep, and outdoor accountability.',
                'safety_guidelines' => 'Do not block loading bays. Use assigned radio channels only.',
                'hazard_warnings' => 'Service vehicle movement in bay area.',
                'required_ppe' => 'High-visibility vests; closed shoes',
                'facilitator_instructions' => 'Staged alarm at 10:40. Confirm each tenant zone reports clear before all-clear.',
            ],
        ];
    }
}
