<?php

namespace Database\Seeders;

use App\Models\LessonResource;
use App\Models\TrainingContent;
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
                'estimated_duration_minutes' => 60,
                'difficulty' => 'Beginner',
                'category' => 'Fire Safety',
                'status' => 'published',
                'visibility' => 'all',
                'owner_id' => $owner->id,
                'contents' => [
                    [
                        'title' => 'Understanding Fire Behavior',
                        'description' => 'Core concepts for community fire safety.',
                        'sort_order' => 1,
                        'resources' => [
                            [
                                'title' => 'Introduction',
                                'resource_type' => 'text',
                                'body' => 'Learn how fires start, spread, and behave in residential and community settings.',
                                'sort_order' => 1,
                            ],
                        ],
                    ],
                    [
                        'title' => 'Evacuation Procedures',
                        'sort_order' => 2,
                        'resources' => [
                            [
                                'title' => 'Evacuation Guide',
                                'resource_type' => 'text',
                                'body' => 'Step-by-step guide for safe evacuation during fire emergencies.',
                                'sort_order' => 1,
                            ],
                        ],
                    ],
                ],
            ],
            [
                'title' => 'Flood Preparedness and Early Warning',
                'description' => 'Training module focused on rainfall monitoring, flood mapping, and early warning communication.',
                'learning_objectives' => [
                    'Interpret simple weather and flood advisories.',
                    'Map flood-prone areas in the community.',
                    'Design an early warning notification flow.',
                ],
                'estimated_duration_minutes' => 90,
                'difficulty' => 'Intermediate',
                'category' => 'Flood',
                'status' => 'published',
                'visibility' => 'all',
                'owner_id' => $owner->id,
                'contents' => [
                    [
                        'title' => 'Reading Flood Advisories',
                        'sort_order' => 1,
                        'resources' => [
                            [
                                'title' => 'Flood Advisory Basics',
                                'resource_type' => 'text',
                                'body' => 'How to interpret PAGASA and local flood warning levels.',
                                'sort_order' => 1,
                            ],
                        ],
                    ],
                ],
            ],
            [
                'title' => 'Earthquake Drill and Evacuation',
                'description' => 'Scenario-based training on earthquake drills, drop-cover-hold, and evacuation to safe zones.',
                'learning_objectives' => [
                    'Perform drop-cover-hold correctly.',
                    'Identify safe evacuation routes and assembly points.',
                    'Coordinate with barangay disaster volunteers.',
                ],
                'estimated_duration_minutes' => 45,
                'difficulty' => 'Intermediate',
                'category' => 'Earthquake',
                'status' => 'published',
                'visibility' => 'all',
                'owner_id' => $owner->id,
                'contents' => [
                    [
                        'title' => 'Drop, Cover, and Hold',
                        'sort_order' => 1,
                        'resources' => [
                            [
                                'title' => 'Earthquake Drill Steps',
                                'resource_type' => 'text',
                                'body' => 'Practice the correct drop-cover-hold technique during seismic events.',
                                'sort_order' => 1,
                            ],
                        ],
                    ],
                ],
            ],
        ];

        foreach ($modules as $moduleData) {
            $contents = $moduleData['contents'] ?? [];
            unset($moduleData['contents']);

            $module = TrainingModule::firstOrCreate(
                ['title' => $moduleData['title']],
                $moduleData
            );

            if ($module->contents()->count() === 0) {
                foreach ($contents as $contentData) {
                    $resources = $contentData['resources'] ?? [];
                    unset($contentData['resources']);

                    $lesson = TrainingContent::create([
                        'training_module_id' => $module->id,
                        ...$contentData,
                    ]);

                    foreach ($resources as $resourceData) {
                        LessonResource::create([
                            'training_content_id' => $lesson->id,
                            ...$resourceData,
                        ]);
                    }
                }
            }
        }
    }
}
