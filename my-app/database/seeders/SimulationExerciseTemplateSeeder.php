<?php

namespace Database\Seeders;

use App\Models\Resource;
use App\Models\SimulationExerciseTemplate;
use App\Services\SimulationExerciseTemplateService;
use Illuminate\Database\Seeder;

class SimulationExerciseTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $service = app(SimulationExerciseTemplateService::class);

        $resources = Resource::query()->orderBy('name')->get()->keyBy(fn ($item) => strtolower($item->name));

        $resolveResourceId = function (string $name) use ($resources): ?int {
            $needle = strtolower($name);
            foreach ($resources as $key => $resource) {
                if (str_contains($key, $needle) || str_contains($needle, $key)) {
                    return (int) $resource->id;
                }
            }

            return $resources->first()?->id;
        };

        $template = SimulationExerciseTemplate::query()
            ->where('title', 'Fire Safety Practical Training')
            ->first();

        $payload = [
            'title' => 'Fire Safety Practical Training',
            'category' => 'Fire Safety',
            'exercise_type' => 'Drill',
            'difficulty_level' => 'Intermediate',
            'estimated_duration_minutes' => 125,
            'objectives' => 'Develop practical fire safety response skills through orientation, extinguisher use, LPG suppression, first aid, evacuation, and debriefing.',
            'scenario_summary' => 'A community fire safety practical training exercise covering prevention, suppression, first aid, and evacuation for barangay responders and volunteers.',
            'expected_hazards' => "Open flame\nSmoke inhalation\nLPG leak ignition\nPanic during evacuation",
            'learning_objectives' => "Identify common fire hazards\nDemonstrate proper extinguisher use\nApply basic first aid\nExecute orderly evacuation",
            'safety_reminders' => "Wear PPE at all times\nMaintain safe distance from live fire demo\nFollow marshal instructions\nNo running in evacuation routes",
            'status' => SimulationExerciseTemplate::STATUS_PUBLISHED,
            'activities' => [
                ['title' => 'Fire Safety Orientation', 'description' => 'Introduction to fire hazards and response priorities.', 'duration_minutes' => 15, 'equipment' => []],
                ['title' => 'Fire Extinguisher Demonstration', 'description' => 'Hands-on PASS technique demonstration.', 'duration_minutes' => 20, 'equipment' => [
                    ['resource_id' => $resolveResourceId('fire extinguisher'), 'required_quantity' => 4],
                    ['resource_id' => $resolveResourceId('fire blanket'), 'required_quantity' => 2],
                ]],
                ['title' => 'LPG Fire Suppression Demonstration', 'description' => 'Controlled LPG fire suppression drill.', 'duration_minutes' => 25, 'equipment' => [
                    ['resource_id' => $resolveResourceId('fire extinguisher'), 'required_quantity' => 2],
                    ['resource_id' => $resolveResourceId('ppe'), 'required_quantity' => 10],
                ]],
                ['title' => 'Basic First Aid Demonstration', 'description' => 'Burns, bleeding, and CPR basics.', 'duration_minutes' => 30, 'equipment' => [
                    ['resource_id' => $resolveResourceId('first aid'), 'required_quantity' => 5],
                    ['resource_id' => $resolveResourceId('gloves'), 'required_quantity' => 20],
                ]],
                ['title' => 'Emergency Evacuation Drill', 'description' => 'Timed evacuation to assembly area.', 'duration_minutes' => 20, 'equipment' => [
                    ['resource_id' => $resolveResourceId('megaphone'), 'required_quantity' => 2],
                    ['resource_id' => $resolveResourceId('cone'), 'required_quantity' => 10],
                ]],
                ['title' => 'Debriefing', 'description' => 'After-action review and lessons learned.', 'duration_minutes' => 15, 'equipment' => []],
            ],
            'personnel' => [
                ['role' => 'Lead Trainer', 'recommended_count' => 1, 'notes' => 'Oversees exercise flow'],
                ['role' => 'Safety Officer', 'recommended_count' => 1, 'notes' => 'Monitors hazards during live demos'],
                ['role' => 'Medical Team', 'recommended_count' => 2, 'notes' => 'Standby for first aid incidents'],
                ['role' => 'Marshal', 'recommended_count' => 3, 'notes' => 'Guides evacuation routes'],
                ['role' => 'Evaluator', 'recommended_count' => 2, 'notes' => 'Scores participant performance'],
            ],
            'timeline_items' => [
                ['start_time' => '08:00', 'label' => 'Registration', 'description' => 'Participant check-in'],
                ['start_time' => '08:20', 'label' => 'Orientation', 'description' => 'Fire safety briefing'],
                ['start_time' => '08:40', 'label' => 'Activity 1', 'description' => 'Fire Extinguisher Demonstration'],
                ['start_time' => '09:10', 'label' => 'Activity 2', 'description' => 'LPG Fire Suppression'],
                ['start_time' => '09:40', 'label' => 'Activity 3', 'description' => 'Basic First Aid'],
                ['start_time' => '10:20', 'label' => 'Debriefing', 'description' => 'Review and closing'],
            ],
            'evaluation_objectives' => [
                ['heading' => 'Fire Extinguisher Demonstration', 'objective_text' => 'Correctly pulled the safety pin'],
                ['heading' => 'Fire Extinguisher Demonstration', 'objective_text' => 'Proper aiming technique'],
                ['heading' => 'Fire Extinguisher Demonstration', 'objective_text' => 'Controlled sweeping motion'],
                ['heading' => 'Basic First Aid', 'objective_text' => 'Scene safety assessment'],
                ['heading' => 'Basic First Aid', 'objective_text' => 'Proper PPE usage'],
                ['heading' => 'Emergency Evacuation', 'objective_text' => 'Followed evacuation route'],
                ['heading' => 'Emergency Evacuation', 'objective_text' => 'Reached assembly area on time'],
            ],
        ];

        $service->saveTemplate($template, $payload, null);

        $this->command?->info('Seeded Simulation Exercise Template: Fire Safety Practical Training');
    }
}
