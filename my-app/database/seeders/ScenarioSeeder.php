<?php

namespace Database\Seeders;

use App\Models\Scenario;
use App\Models\TrainingModule;
use App\Models\User;
use Illuminate\Database\Seeder;

class ScenarioSeeder extends Seeder
{
    public function run(): void
    {
        $creator = User::whereIn('role', ['LGU_ADMIN', 'LGU_TRAINER'])->first();
        $module = TrainingModule::first();

        if (! $creator || ! $module) {
            $this->command?->warn('Missing admin/trainer user or training module; skipping ScenarioSeeder.');
            return;
        }

        $scenarios = [
            [
                'title' => 'Night-time Barangay Fire',
                'short_description' => 'Fire breaks out in a residential block during the night shift.',
                'affected_area' => 'Residential Zone 3',
                'incident_time' => '22:30',
                'incident_time_text' => '10:30 PM',
                'general_situation' => 'Multiple households are affected by a rapidly spreading fire.',
                'severity_level' => 'High',
                'disaster_type' => 'Fire',
                'difficulty' => 'Intermediate',
                'intended_participants' => 'Barangay DRRM team, fire volunteers, community leaders',
                'safety_notes' => 'Emphasize safe distance from fire perimeter; use proper PPE.',
                'weather' => 'Dry and windy',
                'location_type' => 'Urban barangay',
                'casualty_count' => 0,
                'injured_victims_count' => 2,
                'trapped_persons_count' => 1,
                'infrastructure_damage' => 'Three houses partially damaged.',
                'communication_status' => 'Intermittent mobile signal; radios available.',
                'learning_objectives' => 'Coordinate fire response and evacuation at barangay level.',
                'target_competencies' => 'Incident command, communication, evacuation management.',
                'criteria' => [
                    'Response time',
                    'Accountability of residents',
                    'Communication with responders',
                ],
                'training_module_id' => $module->id,
                'is_required_for_module' => true,
                'status' => 'published',
                'created_by' => $creator->id,
                'updated_by' => $creator->id,
            ],
            [
                'title' => 'Monsoon Flooding along Creekside',
                'short_description' => 'Continuous heavy rain causes flooding in low-lying areas.',
                'affected_area' => 'Creekside Barangay',
                'incident_time' => '15:00',
                'incident_time_text' => '3:00 PM',
                'general_situation' => 'Water levels continue to rise; some houses are partially submerged.',
                'severity_level' => 'Moderate',
                'disaster_type' => 'Flood',
                'difficulty' => 'Intermediate',
                'intended_participants' => 'Barangay DRRM team, health workers, community volunteers',
                'safety_notes' => 'Watch for open manholes and electrical hazards.',
                'weather' => 'Heavy monsoon rains',
                'location_type' => 'Flood-prone urban barangay',
                'casualty_count' => 0,
                'injured_victims_count' => 0,
                'trapped_persons_count' => 0,
                'infrastructure_damage' => 'Minor damage to roads and flood barriers.',
                'communication_status' => 'Stable mobile and radio communication.',
                'learning_objectives' => 'Coordinate early evacuation and relief site operations.',
                'target_competencies' => 'Early warning, evacuation logistics, relief planning.',
                'criteria' => [
                    'Timeliness of evacuation',
                    'Coordination with city DRRM office',
                    'Protection of vulnerable groups',
                ],
                'training_module_id' => $module->id,
                'is_required_for_module' => false,
                'status' => 'published',
                'created_by' => $creator->id,
                'updated_by' => $creator->id,
            ],
        ];

        foreach ($scenarios as $scenario) {
            Scenario::firstOrCreate(
                ['title' => $scenario['title']],
                $scenario
            );
        }
    }
}

