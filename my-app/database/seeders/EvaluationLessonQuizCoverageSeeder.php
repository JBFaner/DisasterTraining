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
                    $quizQuestions = $this->demoQuestions($quizTotal, 'Lesson');
                    $displayLanguage = ($i % 3 === 0) ? 'fil' : 'en';

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
                            'generated_questions' => $quizQuestions,
                            'participant_answers' => $this->buildParticipantAnswers($quizQuestions, $quizScore),
                            'display_language' => $displayLanguage,
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
        $bank = $this->fireSafetyQuestionBank();
        $items = [];

        for ($i = 0; $i < $count; $i++) {
            $source = $bank[$i % count($bank)];
            $number = $i + 1;
            $items[] = [
                'number' => $number,
                'question_en' => $source['question_en'],
                'question_fil' => $source['question_fil'],
                'choice_a_en' => $source['choice_a_en'],
                'choice_b_en' => $source['choice_b_en'],
                'choice_c_en' => $source['choice_c_en'],
                'choice_d_en' => $source['choice_d_en'],
                'choice_a_fil' => $source['choice_a_fil'],
                'choice_b_fil' => $source['choice_b_fil'],
                'choice_c_fil' => $source['choice_c_fil'],
                'choice_d_fil' => $source['choice_d_fil'],
                'correct_answer' => $source['correct_answer'],
                'explanation_en' => $source['explanation_en'],
                'explanation_fil' => $source['explanation_fil'],
                'competency' => $prefix === 'Lesson' ? 'fire_safety' : 'emergency_response',
            ];
        }

        return $items;
    }

    /**
     * @param  list<array<string, mixed>>  $questions
     * @return array<string, string>
     */
    private function buildParticipantAnswers(array $questions, int $targetScore): array
    {
        $numbers = array_map(
            fn (array $question) => (string) ($question['number'] ?? ''),
            $questions,
        );
        $numbers = array_values(array_filter($numbers, fn (string $num) => $num !== ''));
        shuffle($numbers);

        $wrongCount = max(0, count($numbers) - $targetScore);
        $wrongNumbers = array_flip(array_slice($numbers, 0, $wrongCount));
        $answers = [];

        foreach ($questions as $question) {
            $num = (string) ($question['number'] ?? '');
            if ($num === '') {
                continue;
            }

            $correct = strtoupper((string) ($question['correct_answer'] ?? 'A'));
            if (isset($wrongNumbers[$num])) {
                $wrong = collect(['A', 'B', 'C', 'D'])->first(fn (string $letter) => $letter !== $correct) ?? 'B';
                $answers[$num] = $wrong;
            } else {
                $answers[$num] = $correct;
            }
        }

        return $answers;
    }

    /**
     * @return list<array<string, string>>
     */
    private function fireSafetyQuestionBank(): array
    {
        return [
            [
                'question_en' => 'What does the letter P stand for in the PASS method?',
                'question_fil' => 'Ano ang ibig sabihin ng letrang P sa PASS method?',
                'choice_a_en' => 'Pull the pin',
                'choice_b_en' => 'Point the nozzle',
                'choice_c_en' => 'Press the handle',
                'choice_d_en' => 'Pause before aiming',
                'choice_a_fil' => 'Hilahin ang pin',
                'choice_b_fil' => 'Ituro ang nozzle',
                'choice_c_fil' => 'Pindutin ang handle',
                'choice_d_fil' => 'Huminto bago mag-aim',
                'correct_answer' => 'A',
                'explanation_en' => 'PASS starts with Pull — remove the safety pin before aiming.',
                'explanation_fil' => 'Ang PASS ay nagsisimula sa Pull — tanggalin muna ang safety pin bago mag-aim.',
            ],
            [
                'question_en' => 'Where should you aim a portable extinguisher on a small Class A fire?',
                'question_fil' => 'Saan dapat itutok ang portable extinguisher sa maliit na Class A fire?',
                'choice_a_en' => 'At the base of the fire',
                'choice_b_en' => 'At the top of the flames',
                'choice_c_en' => 'At the ceiling',
                'choice_d_en' => 'At smoke only',
                'choice_a_fil' => 'Sa base ng apoy',
                'choice_b_fil' => 'Sa tuktok ng apoy',
                'choice_c_fil' => 'Sa kisame',
                'choice_d_fil' => 'Sa usok lamang',
                'correct_answer' => 'A',
                'explanation_en' => 'Aim at the base to cut off the fuel source.',
                'explanation_fil' => 'Itutok sa base para maputol ang pinagkukunan ng apoy.',
            ],
            [
                'question_en' => 'When should you evacuate instead of using an extinguisher?',
                'question_fil' => 'Kailan ka dapat lumikas imbes na gumamit ng extinguisher?',
                'choice_a_en' => 'Fire is spreading fast or exit path is threatened',
                'choice_b_en' => 'You have never used an extinguisher before',
                'choice_c_en' => 'The alarm has not yet sounded',
                'choice_d_en' => 'Only when instructed by neighbors',
                'choice_a_fil' => 'Mabilis kumalat ang apoy o nanganganib ang daan palabas',
                'choice_b_fil' => 'Hindi ka pa nakagamit ng extinguisher',
                'choice_c_fil' => 'Hindi pa tumutunog ang alarm',
                'choice_d_fil' => 'Kapag inutos lamang ng kapitbahay',
                'correct_answer' => 'A',
                'explanation_en' => 'Life safety comes first when the fire or smoke blocks your exit.',
                'explanation_fil' => 'Unahin ang kaligtasan ng buhay kapag nanganganib ang daan palabas.',
            ],
            [
                'question_en' => 'Best immediate action when you smell smoke in a kitchen?',
                'question_fil' => 'Pinakamahusay na agarang aksyon kapag may amoy usok sa kusina?',
                'choice_a_en' => 'Alert others, size up safely, then decide fight or evacuate',
                'choice_b_en' => 'Open all windows first',
                'choice_c_en' => 'Wait for the barangay siren',
                'choice_d_en' => 'Throw water without checking the fuel source',
                'choice_a_fil' => 'Alertuhan ang iba, suriin nang ligtas, pagkatapos magdesisyon kung lalaban o lalikas',
                'choice_b_fil' => 'Buksan muna lahat ng bintana',
                'choice_c_fil' => 'Maghintay sa sirena ng barangay',
                'choice_d_fil' => 'Magbuhos ng tubig nang hindi sinusuri ang pinagmulan ng apoy',
                'correct_answer' => 'A',
                'explanation_en' => 'Size-up before action prevents unsafe decisions.',
                'explanation_fil' => 'Suriin muna bago kumilos upang maiwasan ang delikadong desisyon.',
            ],
            [
                'question_en' => 'Which PPE is most basic for a community extinguisher drill?',
                'question_fil' => 'Aling PPE ang pinaka-basic sa community extinguisher drill?',
                'choice_a_en' => 'Closed shoes and gloves',
                'choice_b_en' => 'Only a hard hat',
                'choice_c_en' => 'Raincoat only',
                'choice_d_en' => 'No PPE needed outdoors',
                'choice_a_fil' => 'Saradong sapatos at guwantes',
                'choice_b_fil' => 'Hard hat lamang',
                'choice_c_fil' => 'Raincoat lamang',
                'choice_d_fil' => 'Hindi kailangan ng PPE sa labas',
                'correct_answer' => 'A',
                'explanation_en' => 'Foot and hand protection reduce burn and puncture risk during drills.',
                'explanation_fil' => 'Proteksyon sa paa at kamay ang nagbabawas ng panganib sa drill.',
            ],
            [
                'question_en' => 'After discharging an extinguisher, you should:',
                'question_fil' => 'Pagkatapos gamitin ang extinguisher, dapat mong:',
                'choice_a_en' => 'Watch for reflash and keep an exit path clear',
                'choice_b_en' => 'Leave the area immediately without reporting',
                'choice_c_en' => 'Shake the can and store it upside down',
                'choice_d_en' => 'Fill it with water for reuse',
                'choice_a_fil' => 'Bantayan ang reflash at panatilihing malinis ang daan palabas',
                'choice_b_fil' => 'Umalis agad nang hindi nag-uulat',
                'choice_c_fil' => 'Iling ang lata at itago nang baligtad',
                'choice_d_fil' => 'Punuin ng tubig para gamitin muli',
                'correct_answer' => 'A',
                'explanation_en' => 'Fires can re-ignite; stay ready to evacuate.',
                'explanation_fil' => 'Maaaring mag-reignite ang apoy; maging handang lumikas.',
            ],
            [
                'question_en' => 'A good assembly point practice is to:',
                'question_fil' => 'Magandang gawain sa assembly point ang:',
                'choice_a_en' => 'Account for household members at the designated area',
                'choice_b_en' => 'Return inside to retrieve valuables first',
                'choice_c_en' => 'Block the main gate for better viewing',
                'choice_d_en' => 'Wait beside the fire for photos',
                'choice_a_fil' => 'Ilista ang miyembro ng pamilya sa itinakdang lugar',
                'choice_b_fil' => 'Bumalik sa loob para kunin ang mahalagang gamit',
                'choice_c_fil' => 'Harangan ang gate para mas makita',
                'choice_d_fil' => 'Maghintay sa tabi ng apoy para sa litrato',
                'correct_answer' => 'A',
                'explanation_en' => 'Head counts confirm everyone is out safely.',
                'explanation_fil' => 'Ang head count ay nagpapatunay na ligtas ang lahat.',
            ],
            [
                'question_en' => 'Class B fires typically involve:',
                'question_fil' => 'Karaniwang sangkot sa Class B fires ang:',
                'choice_a_en' => 'Flammable liquids',
                'choice_b_en' => 'Ordinary combustibles only',
                'choice_c_en' => 'Energized electrical only',
                'choice_d_en' => 'Cooking oils only in deep fryers',
                'choice_a_fil' => 'Mga flammable liquid',
                'choice_b_fil' => 'Ordinary combustibles lamang',
                'choice_c_fil' => 'Energized electrical lamang',
                'choice_d_fil' => 'Langis sa deep fryer lamang',
                'correct_answer' => 'A',
                'explanation_en' => 'Class B covers flammable liquids such as gasoline or solvents.',
                'explanation_fil' => 'Saklaw ng Class B ang mga flammable liquid tulad ng gasolina.',
            ],
            [
                'question_en' => 'Who should you notify first for a barangay structural fire after ensuring personal safety?',
                'question_fil' => 'Sino ang unang dapat ipaalam sa structural fire sa barangay pagkatapos masiguro ang kaligtasan?',
                'choice_a_en' => 'BFP / emergency hotline and barangay responders',
                'choice_b_en' => 'Social media followers only',
                'choice_c_en' => 'Nearby sari-sari store only',
                'choice_d_en' => 'No one until the fire is out',
                'choice_a_fil' => 'BFP / emergency hotline at barangay responders',
                'choice_b_fil' => 'Mga follower sa social media lamang',
                'choice_c_fil' => 'Tindahan lang sa tabi',
                'choice_d_fil' => 'Walang sinuman hanggang matapos ang apoy',
                'correct_answer' => 'A',
                'explanation_en' => 'Official responders need early notice to deploy quickly.',
                'explanation_fil' => 'Kailangan ng maagang abiso ang opisyal na responders.',
            ],
            [
                'question_en' => 'Sweeping the extinguisher nozzle side to side helps to:',
                'question_fil' => 'Ang pag-sweep ng nozzle mula kaliwa pakanan ay nakakatulong para:',
                'choice_a_en' => 'Cover the burning area evenly (the S in PASS)',
                'choice_b_en' => 'Cool the ceiling tiles only',
                'choice_c_en' => 'Empty the tank in one second',
                'choice_d_en' => 'Aim only at smoke',
                'choice_a_fil' => 'Takpan nang pantay ang nasusunog na area (ang S sa PASS)',
                'choice_b_fil' => 'Palamigin ang kisame lamang',
                'choice_c_fil' => 'Ubusin ang laman sa isang segundo',
                'choice_d_fil' => 'Itutok lamang sa usok',
                'correct_answer' => 'A',
                'explanation_en' => 'Sweeping completes the PASS sequence after aim and squeeze.',
                'explanation_fil' => 'Ang sweeping ang huling hakbang sa PASS pagkatapos ng aim at squeeze.',
            ],
        ];
    }
}
