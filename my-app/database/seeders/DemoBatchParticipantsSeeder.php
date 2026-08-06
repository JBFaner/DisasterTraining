<?php

namespace Database\Seeders;

use App\Models\AiScenarioAttempt;
use App\Models\AiScenarioConfig;
use App\Models\LessonCompletion;
use App\Models\LessonQuizAttempt;
use App\Models\LessonQuizConfig;
use App\Models\TrainingContent;
use App\Models\TrainingModule;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Wipe PARTICIPANT accounts (not admins/trainers) and seed ~200 realistic QC participants
 * with varied lesson / lesson-quiz / final-scenario progress. Does NOT touch training modules.
 *
 * Usage:
 *   php artisan db:seed --class=DemoBatchParticipantsSeeder --force
 */
class DemoBatchParticipantsSeeder extends Seeder
{
    private const TARGET_COUNT = 200;

    private const BATCH_SIZE = 50;

    private const PASSWORD = 'user@123';

    /** @var list<string> */
    private array $firstNames = [
        'Angela', 'Francis', 'Camille', 'Daniel', 'Patricia', 'Mark', 'Jennifer', 'Christian',
        'Michelle', 'Ryan', 'Stephanie', 'Jonathan', 'Katrina', 'Erick', 'Princess', 'Allan',
        'Grace', 'Kevin', 'Marianne', 'Jerome', 'Hannah', 'Samuel', 'Claire', 'Patrick',
        'Alyssa', 'Bryan', 'Nicole', 'Joshua', 'Bea', 'Carlo', 'Diana', 'Ethan',
        'Fiona', 'Gabriel', 'Helen', 'Ivan', 'Joyce', 'Kyle', 'Lara', 'Miguel',
    ];

    /** @var list<string> */
    private array $lastNames = [
        'Soriano', 'Villanueva', 'Pascual', 'Mercado', 'Gomez', 'Salazar', 'Aguilar', 'Dizon',
        'Bernardo', 'Lopez', 'Javier', 'Villamor', 'Ramos', 'Manalo', 'Cortez', 'Mendoza',
        'Villar', 'Ocampo', 'Escalante', 'Padilla', 'Tolentino', 'Ignacio', 'Abad', 'Romero',
        'David', 'Enriquez', 'Santos', 'Reyes', 'Cruz', 'Garcia', 'Torres', 'Navarro',
    ];

    /** @var list<string> */
    private array $barangays = [
        'San Agustin', 'Fairview', 'Novaliches', 'Batasan Hills', 'Commonwealth', 'Payatas',
        'Sauyo', 'Holy Spirit', 'Culiat', 'Bagong Silangan', 'Pasong Tamo', 'Tandang Sora',
    ];

    public function run(): void
    {
        $modules = TrainingModule::query()
            ->with(['contents' => fn ($q) => $q->orderBy('sort_order')])
            ->orderBy('id')
            ->get();

        if ($modules->isEmpty()) {
            $this->command?->error('No training modules found. Aborting (modules are required for progress seeding).');

            return;
        }

        $passwordHash = Hash::make(self::PASSWORD);

        DB::transaction(function () use ($modules, $passwordHash) {
            $this->wipeParticipants();

            $created = 0;
            $batches = (int) ceil(self::TARGET_COUNT / self::BATCH_SIZE);

            for ($batch = 0; $batch < $batches; $batch++) {
                $countInBatch = min(self::BATCH_SIZE, self::TARGET_COUNT - $created);
                for ($i = 0; $i < $countInBatch; $i++) {
                    $index = $created + 1;
                    $user = $this->createParticipant($index, $passwordHash);
                    $this->assignProgressProfile($user, $modules, $index);
                    $created++;
                }
                $this->command?->info("Batch ".($batch + 1)."/{$batches}: {$created}/".self::TARGET_COUNT.' participants');
            }

            $this->command?->info("Done. Participants now: ".User::where('role', 'PARTICIPANT')->count());
            $this->command?->info('Login password for demo participants: '.self::PASSWORD);
            $this->command?->warn('Training modules were NOT modified.');
        });
    }

    private function wipeParticipants(): void
    {
        $ids = User::query()->where('role', 'PARTICIPANT')->pluck('id');
        if ($ids->isEmpty()) {
            $this->command?->info('No existing participants to wipe.');

            return;
        }

        LessonCompletion::whereIn('user_id', $ids)->delete();
        LessonQuizAttempt::whereIn('user_id', $ids)->delete();
        AiScenarioAttempt::whereIn('user_id', $ids)->delete();

        // Soft-related tables that may reference users
        DB::table('event_registrations')->whereIn('user_id', $ids)->delete();
        DB::table('attendances')->whereIn('user_id', $ids)->delete();

        User::whereIn('id', $ids)->delete();
        $this->command?->info('Wiped '.$ids->count().' previous PARTICIPANT users (+ progress/attempts).');
    }

    private function createParticipant(int $index, string $passwordHash): User
    {
        $first = $this->firstNames[($index - 1) % count($this->firstNames)];
        $last = $this->lastNames[($index * 3) % count($this->lastNames)];
        $barangay = $this->barangays[($index * 5) % count($this->barangays)];
        $email = sprintf('demo.participant.%03d@barangay.qc.local', $index);

        return User::create([
            'name' => "{$first} {$last}",
            'email' => $email,
            'password' => $passwordHash,
            'role' => 'PARTICIPANT',
            'status' => 'active',
            'barangay' => $barangay,
            'city' => 'Quezon City',
            'province' => 'Metro Manila',
            'participant_id' => 'PART-'.str_pad((string) $index, 4, '0', STR_PAD_LEFT),
            'registered_at' => now()->subDays(rand(5, 90)),
            'email_verified_at' => now()->subDays(rand(1, 80)),
        ]);
    }

    /**
     * Progress profiles (by index % 10):
     * 0-1: not started
     * 2-3: mid module (lessons 1–3)
     * 4-5: deep into module (lessons 1–5 / all but last)
     * 6-7: all lessons done, no final scenario
     * 8-9: all lessons + final scenario completed
     *
     * @param  \Illuminate\Support\Collection<int, TrainingModule>  $modules
     */
    private function assignProgressProfile(User $user, $modules, int $index): void
    {
        $bucket = $index % 10;
        $module = $modules[($index - 1) % $modules->count()];
        $lessons = $module->contents ?? collect();
        if ($lessons->isEmpty()) {
            return;
        }

        $lessonCount = $lessons->count();
        $completeThrough = match (true) {
            $bucket <= 1 => 0,
            $bucket <= 3 => min(3, $lessonCount),
            $bucket <= 5 => min(max(5, (int) floor($lessonCount * 0.7)), $lessonCount),
            default => $lessonCount,
        };

        $completedLessons = $lessons->take($completeThrough)->values();
        foreach ($completedLessons as $lesson) {
            LessonCompletion::create([
                'user_id' => $user->id,
                'training_content_id' => $lesson->id,
                'training_module_id' => $module->id,
                'training_lesson_id' => null,
                'completed_at' => now()->subDays(rand(1, 40)),
            ]);

            // Some completed lessons also have a quiz attempt when a published config exists.
            if ($bucket >= 4 && rand(0, 1) === 1) {
                $this->maybeSeedLessonQuizAttempt($user, $lesson);
            }
        }

        if ($bucket >= 8) {
            try {
                $this->maybeSeedFinalScenarioAttempt($user, $module);
            } catch (\Throwable $e) {
                $this->command?->warn("Skipped final scenario for {$user->email}: ".$e->getMessage());
            }
        }
    }

    private function maybeSeedLessonQuizAttempt(User $user, TrainingContent $lesson): void
    {
        $config = LessonQuizConfig::query()
            ->where('training_content_id', $lesson->id)
            ->where('is_enabled', true)
            ->whereNotNull('published_version_id')
            ->first();

        if (! $config) {
            return;
        }

        LessonQuizAttempt::create([
            'user_id' => $user->id,
            'training_module_id' => $lesson->training_module_id,
            'training_content_id' => $lesson->id,
            'lesson_quiz_config_id' => $config->id,
            'attempt_number' => 1,
            'status' => LessonQuizAttempt::STATUS_COMPLETED,
            'score' => rand(7, 10),
            'percentage' => rand(70, 100),
            'passed' => true,
            'started_at' => now()->subDays(rand(1, 20)),
            'completed_at' => now()->subDays(rand(0, 18)),
            'submitted_at' => now()->subDays(rand(0, 18)),
        ]);
    }

    private function maybeSeedFinalScenarioAttempt(User $user, TrainingModule $module): void
    {
        $config = AiScenarioConfig::query()
            ->where('training_module_id', $module->id)
            ->where('is_enabled', true)
            ->whereNotNull('published_version_id')
            ->first();

        if (! $config) {
            return;
        }

        AiScenarioAttempt::create([
            'user_id' => $user->id,
            'training_module_id' => $module->id,
            'ai_scenario_config_id' => $config->id,
            'attempt_number' => 1,
            'status' => AiScenarioAttempt::STATUS_COMPLETED,
            'scenario_title' => $module->title.' — Final Assessment',
            'title_en' => $module->title.' — Final Assessment',
            'generated_scenario' => 'Demo completed final scenario attempt.',
            'description_en' => 'Demo completed final scenario attempt.',
            'generated_questions' => [],
            'question_order' => [],
            'participant_answers' => [],
            'score' => rand(8, 12),
            'percentage' => rand(75, 100),
            'passed' => true,
            'number_of_questions' => 10,
            'started_at' => now()->subDays(rand(1, 15)),
            'completed_at' => now()->subDays(rand(0, 12)),
            'submitted_at' => now()->subDays(rand(0, 12)),
        ]);
    }
}
