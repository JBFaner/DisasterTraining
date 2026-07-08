<?php

namespace Database\Seeders;

use App\Models\LessonResource;
use App\Models\QualifiedTrainer;
use App\Models\TrainingContent;
use App\Models\TrainingModule;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Restores the Fire Safety and Emergency Response module from the Inventory.sql backup.
 */
class FireSafetyEmergencyResponseSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::where('email', 'brogada.reymon09@gmail.com')->first()
            ?? User::whereIn('role', ['LGU_ADMIN', 'LGU_TRAINER'])->first();

        if (! $owner) {
            $this->command?->warn('No admin owner found; run AdminUserSeeder first.');

            return;
        }

        $leadTrainer = QualifiedTrainer::query()
            ->where('email', 'brogada.reymon09@gmail.com')
            ->orWhere('specialization', 'like', '%Fire Safety%')
            ->orderByDesc('id')
            ->first();

        $module = TrainingModule::updateOrCreate(
            ['title' => 'Fire Safety and Emergency Response'],
            [
                'description' => 'This training module equips participants with the fundamental knowledge and practical skills needed to prevent, respond to, and safely evacuate during fire-related emergencies. Participants will learn fire prevention strategies, the proper use of fire extinguishers, emergency response procedures, and evacuation protocols applicable in homes, schools, workplaces, and government facilities.',
                'learning_objectives' => [
                    'Understand the basic principles of fire safety.',
                    'Identify the common causes of fire incidents.',
                    'Apply effective fire prevention practices.',
                    'Recognize the different types of fire extinguishers and their appropriate uses.',
                    'Demonstrate the proper PASS technique when operating a fire extinguisher.',
                    'Follow the correct emergency response and evacuation procedures during a fire incident.',
                ],
                'estimated_duration_minutes' => 60,
                'thumbnail_path' => 'training-module-thumbnails/5J7rKA7ACj0w5MUNtedpX4WTnWai5jc5vEhf2dXu.png',
                'difficulty' => 'Intermediate',
                'category' => 'Fire',
                'status' => 'published',
                'visibility' => 'all',
                'owner_id' => $owner->id,
                'lead_qualified_trainer_id' => $leadTrainer?->id,
                'assigned_qualified_trainer_ids' => $leadTrainer ? [$leadTrainer->id] : [],
            ]
        );

        $lessons = [
            [
                'title' => 'Lesson 1: Introduction to Fire Safety',
                'sort_order' => 1,
                'resource' => [
                    'title' => 'Lesson 1: Introduction to Fire Safety',
                    'resource_type' => 'text',
                    'body' => 'Fire is one of the most common hazards that can cause injuries, loss of life, and damage to property. This lesson introduces fire safety fundamentals, the Fire Triangle (heat, fuel, oxygen), and personal responsibilities for preventing fire incidents at home, work, and in the community.',
                    'sort_order' => 1,
                ],
            ],
            [
                'title' => 'Lesson 2 : Common Causes of Fire',
                'sort_order' => 2,
                'resource' => [
                    'title' => 'Lesson 2 : Common Causes of Fire',
                    'resource_type' => 'youtube',
                    'external_url' => 'https://www.youtube.com/watch?v=b6eGSTiYkgY',
                    'sort_order' => 1,
                ],
            ],
            [
                'title' => 'Lesson 3: Fire Prevention',
                'sort_order' => 3,
                'resource' => [
                    'title' => 'Lesson 3: Fire Prevention',
                    'resource_type' => 'pdf',
                    'file_path' => '/storage/training-contents/pdf/G0RJFujvtIfnXTmX9Coh7YcUXc64BRsqIT85G93M.pdf',
                    'sort_order' => 1,
                ],
            ],
        ];

        foreach ($lessons as $lessonData) {
            $resourceData = $lessonData['resource'];
            unset($lessonData['resource']);

            $content = TrainingContent::updateOrCreate(
                [
                    'training_module_id' => $module->id,
                    'title' => $lessonData['title'],
                ],
                [
                    'description' => null,
                    'sort_order' => $lessonData['sort_order'],
                ]
            );

            LessonResource::updateOrCreate(
                [
                    'training_content_id' => $content->id,
                    'title' => $resourceData['title'],
                ],
                [
                    'resource_type' => $resourceData['resource_type'],
                    'body' => $resourceData['body'] ?? null,
                    'file_path' => $resourceData['file_path'] ?? null,
                    'external_url' => $resourceData['external_url'] ?? null,
                    'sort_order' => $resourceData['sort_order'],
                ]
            );
        }

        $this->command?->info("Fire Safety and Emergency Response module seeded (ID {$module->id}).");
    }
}
