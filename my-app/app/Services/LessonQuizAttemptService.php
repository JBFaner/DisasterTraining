<?php

namespace App\Services;

use App\Models\LessonCompletion;
use App\Models\LessonQuizAttempt;
use App\Models\LessonQuizConfig;
use App\Models\TrainingContent;
use App\Models\TrainingModule;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LessonQuizAttemptService
{
    public function __construct(
        private readonly LessonQuizProgressionService $progressionService,
        private readonly LessonQuizWorkflowService $workflowService,
        private readonly AiScenarioLocaleService $localeService,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function getParticipantMeta(TrainingModule $module, TrainingContent $content, User $user): array
    {
        $config = LessonQuizConfig::query()
            ->where('training_content_id', $content->id)
            ->with('publishedVersion')
            ->first();

        $base = [
            'has_published_quiz' => $config?->isReady() ?? false,
            'is_unlocked' => $module->participantCanAccessContent($user->id, $content->id),
            'is_completed' => $this->progressionService->participantHasPassedLessonQuiz($user->id, $content->id),
        ];

        if (! $config || ! $config->isReady()) {
            return array_merge($base, [
                'quiz_status' => 'not_configured',
                'can_start' => false,
            ]);
        }

        $inProgress = $this->getInProgressAttempt($user->id, $content->id);
        $completed = LessonQuizAttempt::query()
            ->where('user_id', $user->id)
            ->where('training_content_id', $content->id)
            ->whereIn('status', [LessonQuizAttempt::STATUS_COMPLETED, LessonQuizAttempt::STATUS_EXPIRED])
            ->orderByDesc('id')
            ->get();

        $passedAttempt = $completed->firstWhere('passed', true);
        $attemptsUsed = $completed->count();
        $maxAttempts = (int) ($config->max_attempts ?? 3);
        $attemptsRemaining = max(0, $maxAttempts - $attemptsUsed);
        $isLocked = $passedAttempt !== null || ($attemptsUsed >= $maxAttempts && ! $inProgress);

        $latest = $completed->first();

        return array_merge($base, [
            'config_id' => $config->id,
            'quiz_question_count' => $config->quiz_question_count,
            'passing_score' => $config->passing_score,
            'max_attempts' => $maxAttempts,
            'attempts_used' => $attemptsUsed,
            'attempts_remaining' => $attemptsRemaining,
            'is_locked' => $isLocked,
            'passed' => $passedAttempt !== null,
            'in_progress_attempt' => $inProgress ? ['id' => $inProgress->id] : null,
            'latest_attempt' => $latest ? [
                'id' => $latest->id,
                'passed' => $latest->passed,
                'percentage' => $latest->percentage,
            ] : null,
            'available_languages' => $this->availableLanguages($config),
            'quiz_status' => $passedAttempt
                ? 'passed'
                : ($inProgress ? 'in_progress' : ($isLocked ? 'locked' : 'available')),
            'can_start' => $base['is_unlocked'] && ! $isLocked && ! $inProgress && $attemptsRemaining > 0,
        ]);
    }

    public function startOrResume(
        User $user,
        TrainingModule $module,
        TrainingContent $content,
        ?string $displayLanguage = null,
    ): LessonQuizAttempt {
        $meta = $this->getParticipantMeta($module, $content, $user);

        if (! ($meta['is_unlocked'] ?? false)) {
            throw ValidationException::withMessages([
                'lesson_quiz' => 'Complete the previous lesson quiz to unlock this lesson.',
            ]);
        }

        if (! ($meta['has_published_quiz'] ?? false)) {
            throw ValidationException::withMessages([
                'lesson_quiz' => 'No published lesson quiz is available yet.',
            ]);
        }

        $inProgress = $this->getInProgressAttempt($user->id, $content->id);
        if ($inProgress) {
            return $this->hydrateForParticipant($inProgress);
        }

        if (! ($meta['can_start'] ?? false)) {
            throw ValidationException::withMessages([
                'lesson_quiz' => 'This lesson quiz is locked or unavailable.',
            ]);
        }

        $config = LessonQuizConfig::where('training_content_id', $content->id)->firstOrFail();
        $locale = $this->resolveParticipantLanguage($config, $displayLanguage, $meta['available_languages'] ?? []);

        return $this->createAttempt($user, $module, $content, $config, $locale);
    }

    public function createAttempt(
        User $user,
        TrainingModule $module,
        TrainingContent $content,
        LessonQuizConfig $config,
        ?string $displayLanguage = null,
    ): LessonQuizAttempt {
        $published = $config->publishedVersion;
        if (! $published) {
            throw ValidationException::withMessages([
                'lesson_quiz' => 'Published question bank is not available.',
            ]);
        }

        $locale = $this->resolveParticipantLanguage(
            $config,
            $displayLanguage,
            $this->availableLanguages($config),
        );

        if (! $this->workflowService->isLanguagePublished($published, $locale)) {
            throw ValidationException::withMessages([
                'lesson_quiz' => 'The selected quiz language is not available yet.',
            ]);
        }

        $bank = $config->publishedQuestionBank() ?? [];
        if ($bank === []) {
            throw ValidationException::withMessages([
                'lesson_quiz' => 'Published question bank is empty.',
            ]);
        }

        $quizCount = min((int) $config->quiz_question_count, count($bank));
        $selected = $this->selectRandomQuestions($bank, $quizCount);

        if ($config->shuffle_questions) {
            shuffle($selected);
        }

        if ($config->shuffle_answer_choices) {
            foreach ($selected as &$question) {
                $this->shuffleBilingualQuestionChoices($question);
            }
            unset($question);
        }

        $orderedQuestions = array_values($selected);
        $questionOrder = collect($orderedQuestions)->pluck('number')->map(fn ($n) => (int) $n)->values()->all();

        $attemptNumber = (int) LessonQuizAttempt::query()
            ->where('user_id', $user->id)
            ->where('training_content_id', $content->id)
            ->max('attempt_number') + 1;

        $timeLimit = $config->time_limit_minutes;
        $now = now();

        return LessonQuizAttempt::create([
            'user_id' => $user->id,
            'training_module_id' => $module->id,
            'training_content_id' => $content->id,
            'lesson_quiz_config_id' => $config->id,
            'attempt_number' => $attemptNumber,
            'status' => LessonQuizAttempt::STATUS_IN_PROGRESS,
            'current_question' => (int) ($orderedQuestions[0]['number'] ?? 1),
            'generated_questions' => $orderedQuestions,
            'question_order' => $questionOrder,
            'shuffled_choices' => [],
            'display_language' => $locale,
            'time_limit_minutes' => $timeLimit,
            'time_remaining_seconds' => $timeLimit ? $timeLimit * 60 : null,
            'started_at' => $now,
            'expires_at' => $timeLimit ? $now->copy()->addMinutes($timeLimit) : null,
            'last_activity_at' => $now,
        ]);
    }

    /**
     * @param  array<string, string>  $answers
     */
    public function submitAttempt(LessonQuizAttempt $attempt, array $answers): LessonQuizAttempt
    {
        if ($attempt->isCompleted()) {
            return $attempt;
        }

        $questions = $attempt->generated_questions ?? [];
        $score = 0;

        foreach ($questions as $question) {
            $number = (string) ($question['number'] ?? '');
            $correct = strtoupper((string) ($question['correct_answer'] ?? ''));
            $given = strtoupper((string) ($answers[$number] ?? ''));

            if ($number !== '' && $given !== '' && $given === $correct) {
                $score++;
            }
        }

        $total = count($questions);
        $percentage = $total > 0 ? round(($score / $total) * 100, 2) : 0;
        $passingScore = $attempt->passingScore();
        $passed = $percentage >= $passingScore;

        return DB::transaction(function () use ($attempt, $answers, $score, $percentage, $passed) {
            $attempt->update([
                'participant_answers' => $answers,
                'score' => $score,
                'percentage' => $percentage,
                'passed' => $passed,
                'status' => LessonQuizAttempt::STATUS_COMPLETED,
                'completed_at' => now(),
                'submitted_at' => now(),
                'time_remaining_seconds' => 0,
            ]);

            if ($passed) {
                LessonCompletion::firstOrCreate(
                    [
                        'user_id' => $attempt->user_id,
                        'training_module_id' => $attempt->training_module_id,
                        'training_content_id' => $attempt->training_content_id,
                    ],
                    ['completed_at' => now()],
                );

                $planningService = app(SimulationEventPlanningService::class);
                if ($planningService->isModuleTrainingCompleted((int) $attempt->user_id, (int) $attempt->training_module_id)) {
                    $planningService->syncQualifiedParticipantAcrossCampaignEvents(
                        (int) $attempt->user_id,
                        (int) $attempt->training_module_id,
                    );
                }
            }

            return $attempt->fresh();
        });
    }

    public function hydrateForParticipant(LessonQuizAttempt $attempt): LessonQuizAttempt
    {
        return $attempt->loadMissing(['trainingContent', 'trainingModule', 'config']);
    }

    private function getInProgressAttempt(int $userId, int $contentId): ?LessonQuizAttempt
    {
        return LessonQuizAttempt::query()
            ->where('user_id', $userId)
            ->where('training_content_id', $contentId)
            ->where('status', LessonQuizAttempt::STATUS_IN_PROGRESS)
            ->first();
    }

    /**
     * @param  array<int, array<string, mixed>>  $bank
     * @return array<int, array<string, mixed>>
     */
    private function selectRandomQuestions(array $bank, int $count): array
    {
        $pool = array_values($bank);
        shuffle($pool);

        return array_slice($pool, 0, min($count, count($pool)));
    }

    /**
     * @param  array<int, array<string, mixed>>  $questions
     * @return list<int>
     */
    private function buildQuestionOrder(array $questions, bool $shuffle): array
    {
        $order = collect($questions)->pluck('number')->map(fn ($n) => (int) $n)->values()->all();
        if ($shuffle) {
            shuffle($order);
        }

        return $order;
    }

    /**
     * @param  array<int, array<string, mixed>>  $questions
     * @param  list<int>  $questionOrder
     * @return array<string, list<string>>
     */
    private function buildShuffledChoices(array $questions, array $questionOrder, bool $shuffle): array
    {
        $choices = [];
        foreach ($questionOrder as $number) {
            $letters = ['A', 'B', 'C', 'D'];
            if ($shuffle) {
                shuffle($letters);
            }
            $choices[(string) $number] = $letters;
        }

        return $choices;
    }

    /**
     * @param  array<int, array<string, mixed>>  $questions
     * @param  list<int>  $questionOrder
     * @param  array<string, list<string>>  $shuffledChoices
     * @return list<array<string, mixed>>
     */
    private function applyQuestionOrder(array $questions, array $questionOrder, array $shuffledChoices): array
    {
        $byNumber = collect($questions)->keyBy(fn ($q) => (int) ($q['number'] ?? 0));

        return collect($questionOrder)
            ->map(function (int $number) use ($byNumber, $shuffledChoices) {
                $question = $byNumber->get($number);
                if (! is_array($question)) {
                    return null;
                }

                $order = $shuffledChoices[(string) $number] ?? ['A', 'B', 'C', 'D'];
                $original = $question['choices'] ?? [];
                $remapped = $question;
                $newChoices = [];
                $correct = strtoupper((string) ($question['correct_answer'] ?? 'A'));
                $newCorrect = $correct;

                foreach ($order as $newLetter => $oldLetter) {
                    $newChoices[$oldLetter] = $original[$oldLetter] ?? '';
                    if ($oldLetter === $correct) {
                        $newCorrect = ['A', 'B', 'C', 'D'][$newLetter] ?? $correct;
                    }
                }

                $finalChoices = [];
                foreach (['A', 'B', 'C', 'D'] as $idx => $letter) {
                    $finalChoices[$letter] = $newChoices[$order[$idx]] ?? '';
                }

                $remapped['choices'] = $finalChoices;
                $remapped['correct_answer'] = $newCorrect;

                return $remapped;
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @return list<string>
     */
    private function availableLanguages(LessonQuizConfig $config): array
    {
        $published = $config->publishedVersion;
        if (! $published) {
            return [];
        }

        return $this->workflowService->publishedLanguages($published);
    }

    /**
     * @param  list<string>  $availableLanguages
     */
    private function resolveParticipantLanguage(
        LessonQuizConfig $config,
        ?string $requested,
        array $availableLanguages,
    ): string {
        $requested = $this->localeService->resolveLocale($requested ?? LessonQuizConfig::DEFAULT_GENERATION_LANGUAGE);

        if ($availableLanguages !== [] && in_array($requested, $availableLanguages, true)) {
            return $requested;
        }

        if ($availableLanguages !== []) {
            return $availableLanguages[0];
        }

        return $this->localeService->resolveLocale($config->generation_language ?? LessonQuizConfig::DEFAULT_GENERATION_LANGUAGE);
    }

    /**
     * @param  array<string, mixed>  $question
     */
    private function shuffleBilingualQuestionChoices(array &$question): void
    {
        $sourceLocale = $this->localeService->resolveLocale($question['generated_language'] ?? 'en');
        $question = $this->localeService->normalizeQuestionToBilingual($question, $sourceLocale);

        $letters = ['A', 'B', 'C', 'D'];
        shuffle($letters);
        $correct = strtoupper((string) ($question['correct_answer'] ?? 'A'));
        $newCorrect = $correct;

        foreach ($this->localeService->supportedLanguages() as $locale) {
            $original = [];
            foreach (['a', 'b', 'c', 'd'] as $letter) {
                $upper = strtoupper($letter);
                $original[$upper] = (string) ($question['choice_'.$letter.'_'.$locale] ?? '');
            }

            foreach (['A', 'B', 'C', 'D'] as $idx => $newLetter) {
                $oldLetter = $letters[$idx];
                $question['choice_'.strtolower($newLetter).'_'.$locale] = $original[$oldLetter] ?? '';
                if ($oldLetter === $correct) {
                    $newCorrect = $newLetter;
                }
            }
        }

        $question['correct_answer'] = $newCorrect;
    }
}
