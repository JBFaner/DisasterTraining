<?php

namespace Database\Seeders;

use App\Models\AiScenarioAttempt;
use App\Models\EvaluationResult;
use App\Models\LessonCompletion;
use App\Models\LessonQuizAttempt;
use App\Models\LessonQuizConfig;
use App\Models\TrainingContent;
use App\Models\TrainingModule;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Seeds ≥50 participants who passed every enabled lesson quiz (Lessons 1–5)
 * on Fire Safety and Emergency Response, plus a passed final AI scenario.
 *
 * Run: php artisan db:seed --class=EvaluationLessonQuizCoverageSeeder
 */
class EvaluationLessonQuizCoverageSeeder extends Seeder
{
    private const TARGET_COUNT = 50;

    private const EMAIL_PREFIX = 'eval.coverage.';

    /** @var list<string> */
    private const FIRST_NAMES = [
        'Ana', 'Ben', 'Carlo', 'Diana', 'Elena', 'Felix', 'Gina', 'Hugo', 'Isabel', 'Jonas',
        'Kara', 'Luis', 'Mara', 'Nico', 'Olivia', 'Paolo', 'Queen', 'Ramon', 'Sofia', 'Tomas',
        'Uma', 'Victor', 'Wendy', 'Xander', 'Yna', 'Zeke', 'Alya', 'Brett', 'Cora', 'Diego',
        'Erika', 'Francis', 'Gloria', 'Hector', 'Ivy', 'Jake', 'Kim', 'Lara', 'Miguel', 'Nora',
        'Oscar', 'Patty', 'Quinn', 'Rita', 'Sam', 'Tina', 'Uriel', 'Vera', 'Wade', 'Xenia',
        'Yuri', 'Zara', 'Andre', 'Bianca', 'Cesar', 'Dina', 'Edwin', 'Faye', 'Gino', 'Helen',
    ];

    /** @var list<string> */
    private const LAST_NAMES = [
        'Santos', 'Reyes', 'Cruz', 'Bautista', 'Garcia', 'Mendoza', 'Torres', 'Flores', 'Ramos', 'Navarro',
        'Dela Cruz', 'Gonzales', 'Castillo', 'Villanueva', 'Aquino', 'Lopez', 'Perez', 'Rivera', 'Santiago', 'Morales',
    ];

    public function run(): void
    {
        $module = TrainingModule::query()
            ->where('title', 'Fire Safety and Emergency Response')
            ->where('status', 'published')
            ->first()
            ?? TrainingModule::query()->where('status', 'published')->orderBy('id')->first();

        if (! $module) {
            $this->command?->error('No published training module found.');

            return;
        }

        $lessons = TrainingContent::query()
            ->where('training_module_id', $module->id)
            ->whereHas('lessonQuizConfig', fn ($q) => $q->where('is_enabled', true))
            ->orderBy('sort_order')
            ->orderBy('id')
            ->with(['lessonQuizConfig'])
            ->get();

        if ($lessons->isEmpty()) {
            $this->command?->error('No enabled lesson quizzes found for module: '.$module->title);

            return;
        }

        $this->command?->info(sprintf(
            'Seeding %d participants × %d lesson quizzes + final scenario on "%s".',
            self::TARGET_COUNT,
            $lessons->count(),
            $module->title,
        ));

        $createdUsers = 0;
        $quizAttempts = 0;
        $scenarioResults = 0;

        DB::transaction(function () use ($module, $lessons, &$createdUsers, &$quizAttempts, &$scenarioResults) {
            for ($i = 1; $i <= self::TARGET_COUNT; $i++) {
                $email = sprintf('%s%03d@example.com', self::EMAIL_PREFIX, $i);
                $first = self::FIRST_NAMES[($i - 1) % count(self::FIRST_NAMES)];
                $last = self::LAST_NAMES[($i - 1) % count(self::LAST_NAMES)];
                $name = trim($first.' '.$last);

                $user = User::query()->where('email', $email)->first();
                if (! $user) {
                    $user = User::create([
                        'name' => $name,
                        'email' => $email,
                        'password' => Hash::make('password'),
                        'role' => 'PARTICIPANT',
                        'status' => 'active',
                        'email_verified_at' => now(),
                        'registered_at' => now()->subDays(20 + ($i % 10)),
                        'province' => 'Metro Manila',
                        'city' => 'Quezon City',
                        'barangay' => 'Commonwealth',
                        'phone' => sprintf('+63 9%09d', 100000000 + $i),
                        'participant_id' => 'EVC-'.str_pad((string) $i, 4, '0', STR_PAD_LEFT),
                        'registration_source' => 'evaluation_coverage_seeder',
                    ]);
                    $createdUsers++;
                }

                $lessonIndex = 0;
                foreach ($lessons as $lesson) {
                    $lessonIndex++;
                    $config = $lesson->lessonQuizConfig;
                    if (! $config instanceof LessonQuizConfig) {
                        continue;
                    }

                    $completedAt = now()
                        ->subDays(14 - min(10, $lessonIndex))
                        ->subHours($i % 12)
                        ->subMinutes(($i * 3 + $lessonIndex) % 50);

                    LessonCompletion::updateOrCreate(
                        [
                            'user_id' => $user->id,
                            'training_module_id' => $module->id,
                            'training_content_id' => $lesson->id,
                        ],
                        ['completed_at' => $completedAt->copy()->subMinutes(30)],
                    );

                    $quizTotal = max(5, (int) ($config->quiz_question_count ?: 5));
                    // Always pass: score between ceil(75%) and 100%.
                    $minCorrect = (int) ceil($quizTotal * 0.75);
                    $quizScore = random_int($minCorrect, $quizTotal);
                    $quizPct = round(($quizScore / $quizTotal) * 100, 1);

                    LessonQuizAttempt::updateOrCreate(
                        [
                            'user_id' => $user->id,
                            'training_content_id' => $lesson->id,
                            'attempt_number' => 1,
                        ],
                        [
                            'training_module_id' => $module->id,
                            'lesson_quiz_config_id' => $config->id,
                            'status' => LessonQuizAttempt::STATUS_COMPLETED,
                            'generated_questions' => $this->demoQuestions($quizTotal, 'Lesson'),
                            'participant_answers' => [],
                            'score' => $quizScore,
                            'percentage' => $quizPct,
                            'passed' => true,
                            'started_at' => $completedAt->copy()->subMinutes(8 + ($lessonIndex % 5)),
                            'completed_at' => $completedAt,
                            'submitted_at' => $completedAt,
                            'last_activity_at' => $completedAt,
                        ],
                    );
                    $quizAttempts++;
                }

                $scenarioCompletedAt = now()->subDays(2)->subHours($i % 18)->subMinutes($i % 40);
                $scenarioTotal = 10;
                $scenarioMin = (int) ceil($scenarioTotal * 0.75);
                $scenarioScore = random_int($scenarioMin, $scenarioTotal);
                $scenarioPct = round(($scenarioScore / $scenarioTotal) * 100, 1);

                $attempt = AiScenarioAttempt::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'training_module_id' => $module->id,
                        'attempt_number' => 1,
                    ],
                    [
                        'status' => AiScenarioAttempt::STATUS_COMPLETED,
                        'scenario_title' => $module->title.' — Final Scenario Assessment',
                        'generated_scenario' => 'Coverage seeder scenario for '.$module->title.'.',
                        'difficulty' => $scenarioPct >= 90 ? 'hard' : 'medium',
                        'number_of_questions' => $scenarioTotal,
                        'generated_questions' => $this->demoQuestions($scenarioTotal, 'Scenario'),
                        'participant_answers' => [],
                        'score' => $scenarioScore,
                        'percentage' => $scenarioPct,
                        'passed' => true,
                        'started_at' => $scenarioCompletedAt->copy()->subMinutes(20),
                        'completed_at' => $scenarioCompletedAt,
                        'submitted_at' => $scenarioCompletedAt,
                        'last_activity_at' => $scenarioCompletedAt,
                    ],
                );

                EvaluationResult::updateOrCreate(
                    [
                        'participant_id' => $user->id,
                        'training_module_id' => $module->id,
                        'attempt_number' => 1,
                    ],
                    [
                        'ai_scenario_attempt_id' => $attempt->id,
                        'scenario_title' => $attempt->scenario_title,
                        'difficulty' => $attempt->difficulty,
                        'score' => $scenarioScore,
                        'correct_answers' => $scenarioScore,
                        'wrong_answers' => $scenarioTotal - $scenarioScore,
                        'total_questions' => $scenarioTotal,
                        'percentage' => $scenarioPct,
                        'rating' => $scenarioPct >= 90 ? 5 : 4,
                        'status' => EvaluationResult::STATUS_PASSED,
                        'knowledge_score' => random_int(78, 98),
                        'decision_making_score' => random_int(76, 96),
                        'emergency_response_score' => random_int(75, 97),
                        'safety_awareness_score' => random_int(80, 99),
                        'feedback' => 'Passed final scenario with solid preparedness decisions.',
                        'recommendations' => ['Proceed to simulation event registration.'],
                        'eligible_for_simulation' => true,
                        'completed_at' => $scenarioCompletedAt,
                        'duration_seconds' => 900 + ($i * 7),
                        'generated_questions' => $attempt->generated_questions,
                        'participant_answers' => [],
                    ],
                );
                $scenarioResults++;
            }
        });

        $this->command?->info(sprintf(
            'Done. Users created: %d | Lesson quiz attempts upserted: %d | Final scenario results: %d',
            $createdUsers,
            $quizAttempts,
            $scenarioResults,
        ));
        $this->command?->info('Login sample: '.self::EMAIL_PREFIX.'001@example.com / password');
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function demoQuestions(int $count, string $prefix): array
    {
        $items = [];
        for ($i = 1; $i <= $count; $i++) {
            $items[] = [
                'id' => Str::slug($prefix).'-q'.$i.'-'.Str::random(4),
                'question' => "{$prefix} preparedness question {$i}",
                'choices' => ['Option A', 'Option B', 'Option C', 'Option D'],
                'correct_index' => 0,
            ];
        }

        return $items;
    }
}
