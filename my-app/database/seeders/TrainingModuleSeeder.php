<?php

namespace Database\Seeders;

use App\Models\TrainingModule;
use App\Models\User;
use Illuminate\Database\Seeder;

class TrainingModuleSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::whereIn('role', ['LGU_ADMIN', 'LGU_TRAINER'])->first();
        if (! $owner) {
            $this->command?->warn('No admin/trainer user found; skipping TrainingModuleSeeder.');
            return;
        }

        $modules = [
            [
                'title' => 'Basic Fire Safety and Evacuation',
                'description' => 'Foundational concepts on fire behavior, evacuation routes, and community response.',
                'learning_objectives' => [
                    'Identify common fire hazards in barangay settings.',
                    'Execute basic evacuation procedures.',
                    'Coordinate with local fire responders.',
                ],
                'difficulty' => 'Beginner',
                'category' => 'Fire Safety',
                'status' => 'published',
                'visibility' => 'public',
                'owner_id' => $owner->id,
            ],
            [
                'title' => 'Flood Preparedness and Early Warning',
                'description' => 'Training module focused on rainfall monitoring, flood mapping, and early warning communication.',
                'learning_objectives' => [
                    'Interpret simple weather and flood advisories.',
                    'Map flood-prone areas in the community.',
                    'Design an early warning notification flow.',
                ],
                'difficulty' => 'Intermediate',
                'category' => 'Flood',
                'status' => 'published',
                'visibility' => 'public',
                'owner_id' => $owner->id,
            ],
            [
                'title' => 'Earthquake Drill and Evacuation',
                'description' => 'Scenario-based training on earthquake drills, drop-cover-hold, and evacuation to safe zones.',
                'learning_objectives' => [
                    'Perform drop-cover-hold correctly.',
                    'Identify safe evacuation routes and assembly points.',
                    'Coordinate with barangay disaster volunteers.',
                ],
                'difficulty' => 'Intermediate',
                'category' => 'Earthquake',
                'status' => 'published',
                'visibility' => 'public',
                'owner_id' => $owner->id,
            ],
        ];

        foreach ($modules as $module) {
            TrainingModule::firstOrCreate(
                ['title' => $module['title']],
                $module
            );
        }
    }
}

