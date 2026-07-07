<?php

namespace App\Services;

use App\Models\AiScenarioAttempt;
use App\Models\AiScenarioConfig;
use App\Models\QuizAnswer;
use App\Models\TrainingModule;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class QuizAttemptService
{
    public const STATUS_NOT_STARTED = 'not_started';

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_EXPIRED = 'expired';

    public function __construct(
        private readonly AiScenarioTrainingService $trainingService,
        private readonly LessonProgressionService $lessonProgressionService,
        private readonly TrainingRetakePolicyService $retakePolicyService,
        private readonly TrainingResetService $trainingResetService,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function getParticipantQuizMeta(TrainingModule $module, User $user): array
    {
        $module->loadMissing('aiScenarioConfig');
        $config = $module->aiScenarioConfig;

        $base = [
            'all_lessons_completed' => $module->participantHasCompletedAllContents($user->id),
            'is_enabled' => (bool) ($config?->is_enabled),
            'is_configured' => $config?->isReady() ?? false,
            'is_unlocked' => false,
        ];
        $base['is_unlocked'] = $base['all_lessons_completed'] && $base['is_configured'];

        if (! $config) {
            return $base;
        }

        $trainingCycle = $this->trainingResetService->currentCycleNumber($user->id, $module->id);
        $attempts = $this->getCompletedAttempts($user->id, $module->id, $trainingCycle);
        $inProgress = $this->getInProgressAttempt($user->id, $module->id, $trainingCycle);
        $passedAttempt = $attempts->firstWhere('passed', true);
        $maxAttempts = (int) ($config->max_attempts ?? 3);
        $attemptsUsed = $attempts->count();
        $attemptsRemaining = max(0, $maxAttempts - $attemptsUsed);
        $adminRetrainingApproved = $this->trainingResetService->hasAdminRetrainingApproved($user, $module);
        $isLocked = $passedAttempt !== null || ($attemptsUsed >= $maxAttempts && ! $inProgress);

        if ($inProgress) {
            $inProgress = $this->syncAttemptTimer($inProgress);
            if ($inProgress->status === self::STATUS_EXPIRED) {
                $inProgress = null;
                $attempts = $this->getCompletedAttempts($user->id, $module->id, $trainingCycle);
                $attemptsUsed = $attempts->count();
                $attemptsRemaining = max(0, $maxAttempts - $attemptsUsed);
                $isLocked = $passedAttempt !== null || $attemptsUsed >= $maxAttempts;
            }
        }

        $latestCompleted = $attempts->sortByDesc('id')->first();

        $metaBeforeStatus = array_merge($base, [
            'quiz_settings' => $this->configQuizSettings($config),
            'attempts_used' => $attemptsUsed,
            'attempts_remaining' => $attemptsRemaining,
            'max_attempts' => $maxAttempts,
            'passing_score' => (int) ($config->passing_score ?? 75),
            'fail_retake_policy' => $config->fail_retake_policy ?? AiScenarioConfig::FAIL_POLICY_REQUIRE_LESSON_REVIEW,
            'is_locked' => $isLocked,
            'passed' => $passedAttempt !== null,
            'in_progress_attempt' => $inProgress ? $this->attemptSummary($inProgress) : null,
            'latest_completed_attempt' => $latestCompleted ? $this->attemptSummary($latestCompleted) : null,
            'latest_attempt' => $latestCompleted ? $this->attemptSummary($latestCompleted) : null,
            'lesson_progress' => $this->lessonProgressionService->buildLessonProgressMeta($module, $user->id),
        ]);

        $lessonReviewRequired = ! $adminRetrainingApproved
            && $this->retakePolicyService->lessonReviewRequired($module, $user, $metaBeforeStatus);
        $status = $this->resolveDashboardStatus(
            $inProgress,
            $latestCompleted,
            $isLocked,
            $attemptsRemaining,
            $passedAttempt,
            $lessonReviewRequired,
            $adminRetrainingApproved,
        );

        return array_merge($metaBeforeStatus, [
            'training_cycle' => $trainingCycle,
            'admin_retraining_approved' => $adminRetrainingApproved,
            'quiz_status' => $status,
            'training_status' => $this->resolveTrainingStatus(
                $inProgress,
                $latestCompleted,
                $isLocked,
                $attemptsRemaining,
                $passedAttempt,
                $lessonReviewRequired,
                $base['all_lessons_completed'],
                $adminRetrainingApproved,
            ),
            'lesson_review_required' => $lessonReviewRequired,
        ]);
    }

    public function startOrResume(User $user, TrainingModule $module, AiScenarioConfig $config): AiScenarioAttempt
    {
        $meta = $this->getParticipantQuizMeta($module, $user);

        if (! ($meta['is_unlocked'] ?? false)) {
            throw ValidationException::withMessages([
                'ai_scenario' => 'Complete all lesson quizzes before starting the Final AI Scenario Assessment.',
            ]);
        }

        if ($meta['is_locked'] ?? false) {
            throw ValidationException::withMessages([
                'ai_scenario' => 'This quiz is locked. No further attempts are allowed.',
            ]);
        }

        $trainingCycle = $this->trainingResetService->currentCycleNumber($user->id, $module->id);
        $inProgress = $this->getInProgressAttempt($user->id, $module->id, $trainingCycle);

        if ($inProgress) {
            if (! $config->allow_resume_attempt) {
                throw ValidationException::withMessages([
                    'ai_scenario' => 'Resume is disabled for this quiz. Please contact your administrator.',
                ]);
            }

            return $this->hydrateForParticipant($inProgress);
        }

        if (($meta['attempts_remaining'] ?? 0) <= 0) {
            throw ValidationException::withMessages([
                'ai_scenario' => 'You have used all available attempts for this quiz.',
            ]);
        }

        return $this->createAttempt($user, $module, $config);
    }

    public function createAttempt(User $user, TrainingModule $module, AiScenarioConfig $config): AiScenarioAttempt
    {
        $trainingCycle = $this->trainingResetService->currentCycleNumber($user->id, $module->id);

        if ($this->getInProgressAttempt($user->id, $module->id, $trainingCycle)) {
            throw ValidationException::withMessages([
                'ai_scenario' => 'You already have an active attempt in progress.',
            ]);
        }

        $attemptNumber = (int) AiScenarioAttempt::query()
            ->where('user_id', $user->id)
            ->where('training_module_id', $module->id)
            ->max('attempt_number') + 1;
        $timeLimit = (int) ($config->time_limit_minutes ?? 60);
        $snapshot = $config->publishedContentSnapshot();
        if (! $snapshot) {
            throw ValidationException::withMessages([
                'ai_scenario' => 'No published assessment is available for this training module.',
            ]);
        }

        $questions = $snapshot['generated_questions'] ?? [];
        $questionOrder = $this->buildQuestionOrder($questions, (bool) $config->shuffle_questions);
        $shuffledChoices = $this->buildShuffledChoices($questions, $questionOrder, (bool) $config->shuffle_answer_choices);
        $orderedQuestions = $this->applyQuestionOrder($questions, $questionOrder, $shuffledChoices);
        $firstQuestionNumber = (int) ($orderedQuestions[0]['number'] ?? 1);
        $now = now();

        return DB::transaction(function () use (
            $user,
            $module,
            $config,
            $attemptNumber,
            $trainingCycle,
            $timeLimit,
            $orderedQuestions,
            $questionOrder,
            $shuffledChoices,
            $firstQuestionNumber,
            $now,
            $snapshot,
        ) {
            return AiScenarioAttempt::create([
                'user_id' => $user->id,
                'training_module_id' => $module->id,
                'ai_scenario_config_id' => $config->id,
                'attempt_number' => $attemptNumber,
                'training_cycle' => $trainingCycle,
                'status' => self::STATUS_IN_PROGRESS,
                'current_question' => $firstQuestionNumber,
                'scenario_title' => $snapshot['scenario_title'] ?? $config->scenario_title,
                'title_en' => $snapshot['title_en'] ?? $config->title_en,
                'title_fil' => $snapshot['title_fil'] ?? $config->title_fil,
                'generated_scenario' => $snapshot['generated_scenario'] ?? $config->generated_scenario,
                'description_en' => $snapshot['description_en'] ?? $config->description_en,
                'description_fil' => $snapshot['description_fil'] ?? $config->description_fil,
                'learning_objectives_en' => $snapshot['learning_objectives_en'] ?? $config->learning_objectives_en,
                'learning_objectives_fil' => $snapshot['learning_objectives_fil'] ?? $config->learning_objectives_fil,
                'generated_language' => $snapshot['generated_language'] ?? $config->generated_language ?? 'en',
                'display_language' => $config->generated_language ?? 'en',
                'generated_questions' => $orderedQuestions,
                'question_order' => $questionOrder,
                'shuffled_choices' => $shuffledChoices,
                'difficulty' => $config->difficulty,
                'number_of_questions' => $config->number_of_questions,
                'time_limit_minutes' => $timeLimit,
                'time_remaining_seconds' => $timeLimit * 60,
                'started_at' => $now,
                'expires_at' => $now->copy()->addMinutes($timeLimit),
                'last_activity_at' => $now,
            ]);
        });
    }

    public function saveAnswer(
        AiScenarioAttempt $attempt,
        int $questionId,
        string $selectedAnswer,
        ?int $currentQuestion = null,
    ): AiScenarioAttempt {
        $this->assertAttemptActive($attempt);

        $attempt = $this->syncAttemptTimer($attempt);
        $this->assertAttemptActive($attempt);

        $selectedAnswer = strtoupper(trim($selectedAnswer));
        if (! in_array($selectedAnswer, ['A', 'B', 'C', 'D'], true)) {
            throw ValidationException::withMessages([
                'selected_answer' => 'Invalid answer choice.',
            ]);
        }

        $question = $this->findQuestion($attempt, $questionId);
        if (! $question) {
            throw ValidationException::withMessages([
                'question_id' => 'Invalid question.',
            ]);
        }

        $correct = strtoupper((string) ($question['correct_answer'] ?? ''));
        $now = now();

        return DB::transaction(function () use ($attempt, $questionId, $selectedAnswer, $correct, $currentQuestion, $now) {
            QuizAnswer::updateOrCreate(
                [
                    'ai_scenario_attempt_id' => $attempt->id,
                    'question_id' => $questionId,
                ],
                [
                    'selected_answer' => $selectedAnswer,
                    'is_correct' => $selectedAnswer === $correct,
                    'answered_at' => $now,
                ],
            );

            $answers = $attempt->participant_answers ?? [];
            $answers[(string) $questionId] = $selectedAnswer;

            $attempt->participant_answers = $answers;
            $attempt->current_question = $currentQuestion ?? $questionId;
            $attempt->last_activity_at = $now;
            $attempt->time_remaining_seconds = max(0, (int) now()->diffInSeconds($attempt->expires_at, false));
            $attempt->save();

            return $attempt->fresh(['quizAnswers']);
        });
    }

    public function updateProgress(AiScenarioAttempt $attempt, int $currentQuestion): AiScenarioAttempt
    {
        $this->assertAttemptActive($attempt);

        $attempt = $this->syncAttemptTimer($attempt);
        $this->assertAttemptActive($attempt);

        if (! $this->findQuestion($attempt, $currentQuestion)) {
            throw ValidationException::withMessages([
                'current_question' => 'Invalid question.',
            ]);
        }

        $now = now();
        $attempt->current_question = $currentQuestion;
        $attempt->last_activity_at = $now;
        $attempt->time_remaining_seconds = max(0, (int) now()->diffInSeconds($attempt->expires_at, false));
        $attempt->save();

        return $attempt->fresh(['quizAnswers']);
    }

    /**
     * Sync timer, merge quiz_answers into participant_answers for resume.
     */
    public function hydrateForParticipant(AiScenarioAttempt $attempt): AiScenarioAttempt
    {
        $attempt = $this->syncAttemptTimer($attempt);
        $attempt->loadMissing(['quizAnswers', 'config', 'trainingModule']);

        if ($attempt->isInProgress()) {
            $merged = $this->answersMapFromRecords($attempt);

            if ($merged !== ($attempt->participant_answers ?? [])) {
                $attempt->participant_answers = $merged;
                $attempt->save();
            }

            // Fix legacy attempts that stored current_question=1 instead of first display question.
            if (count($merged) === 0) {
                $firstNumber = $this->firstQuestionNumber($attempt);
                if ((int) $attempt->current_question !== $firstNumber) {
                    $attempt->current_question = $firstNumber;
                    $attempt->save();
                }
            }
        }

        return $attempt->fresh(['quizAnswers', 'config', 'trainingModule']);
    }

    public function submitAttempt(AiScenarioAttempt $attempt, ?string $displayLanguage = null, bool $autoSubmitted = false): AiScenarioAttempt
    {
        if ($attempt->status === self::STATUS_COMPLETED) {
            return $attempt;
        }

        $attempt = $this->syncAttemptTimer($attempt);

        if ($attempt->status === self::STATUS_EXPIRED && ! $autoSubmitted) {
            throw ValidationException::withMessages([
                'ai_scenario' => 'This attempt has expired.',
            ]);
        }

        $answers = $this->answersMapFromRecords($attempt);
        $attempt->participant_answers = $answers;

        if ($displayLanguage) {
            $attempt->display_language = app(AiScenarioLocaleService::class)
                ->resolveLocale($displayLanguage);
        }

        return $this->trainingService->finalizeAttempt($attempt, $autoSubmitted);
    }

    public function syncAttemptTimer(AiScenarioAttempt $attempt): AiScenarioAttempt
    {
        if ($attempt->status !== self::STATUS_IN_PROGRESS || ! $attempt->expires_at) {
            return $attempt;
        }

        $remaining = max(0, (int) now()->diffInSeconds($attempt->expires_at, false));

        if ($remaining <= 0) {
            return $this->expireAttempt($attempt);
        }

        if ($attempt->time_remaining_seconds !== $remaining) {
            $attempt->time_remaining_seconds = $remaining;
            $attempt->save();
        }

        return $attempt->fresh();
    }

    public function expireAttempt(AiScenarioAttempt $attempt): AiScenarioAttempt
    {
        if ($attempt->status !== self::STATUS_IN_PROGRESS) {
            return $attempt;
        }

        $config = $attempt->config;
        $autoSubmit = $config?->auto_submit_on_expire ?? true;

        if ($autoSubmit) {
            return $this->submitAttempt($attempt, null, true);
        }

        $attempt->status = self::STATUS_EXPIRED;
        $attempt->time_remaining_seconds = 0;
        $attempt->submitted_at = now();
        $attempt->completed_at = now();
        $attempt->save();

        return $attempt->fresh();
    }

    public function getInProgressAttempt(int $userId, int $moduleId, ?int $trainingCycle = null): ?AiScenarioAttempt
    {
        $trainingCycle ??= $this->trainingResetService->currentCycleNumber($userId, $moduleId);

        return AiScenarioAttempt::query()
            ->with('quizAnswers')
            ->where('user_id', $userId)
            ->where('training_module_id', $moduleId)
            ->where('training_cycle', $trainingCycle)
            ->where('status', self::STATUS_IN_PROGRESS)
            ->latest('id')
            ->first();
    }

    /**
     * @return \Illuminate\Support\Collection<int, AiScenarioAttempt>
     */
    public function getCompletedAttempts(int $userId, int $moduleId, ?int $trainingCycle = null)
    {
        $trainingCycle ??= $this->trainingResetService->currentCycleNumber($userId, $moduleId);

        return AiScenarioAttempt::query()
            ->where('user_id', $userId)
            ->where('training_module_id', $moduleId)
            ->where('training_cycle', $trainingCycle)
            ->whereIn('status', [self::STATUS_COMPLETED, self::STATUS_EXPIRED])
            ->orderBy('attempt_number')
            ->get();
    }

    /**
     * @return array<string, mixed>
     */
    public function attemptSummary(AiScenarioAttempt $attempt): array
    {
        $attempt = $this->syncAttemptTimer($attempt);
        $answered = $attempt->quizAnswers()->count() ?: count($attempt->participant_answers ?? []);
        $durationSeconds = null;

        if ($attempt->started_at && $attempt->completed_at) {
            $durationSeconds = max(0, (int) $attempt->started_at->diffInSeconds($attempt->completed_at));
        }

        return [
            'id' => $attempt->id,
            'attempt_number' => $attempt->attempt_number,
            'status' => $attempt->status,
            'score' => $attempt->score,
            'percentage' => $attempt->percentage,
            'passed' => (bool) $attempt->passed,
            'current_question' => $attempt->current_question,
            'questions_answered' => $answered,
            'total_questions' => $attempt->number_of_questions,
            'time_remaining_seconds' => $attempt->time_remaining_seconds,
            'time_limit_minutes' => $attempt->time_limit_minutes,
            'duration_seconds' => $durationSeconds,
            'started_at' => $attempt->started_at?->toIso8601String(),
            'completed_at' => $attempt->completed_at?->toIso8601String(),
            'expires_at' => $attempt->expires_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, string|int|bool>
     */
    public function answersMapFromRecords(AiScenarioAttempt $attempt): array
    {
        $attempt->loadMissing('quizAnswers');

        $map = [];
        foreach ($attempt->quizAnswers as $answer) {
            if ($answer->selected_answer) {
                $map[(string) $answer->question_id] = $answer->selected_answer;
            }
        }

        return $map ?: ($attempt->participant_answers ?? []);
    }

    public function questionIndexForNumber(AiScenarioAttempt $attempt, ?int $questionNumber): int
    {
        if (! $questionNumber) {
            return 0;
        }

        foreach ($attempt->generated_questions ?? [] as $index => $question) {
            if ((int) ($question['number'] ?? 0) === (int) $questionNumber) {
                return $index;
            }
        }

        return 0;
    }

    public function firstQuestionNumber(AiScenarioAttempt $attempt): int
    {
        $questions = $attempt->generated_questions ?? [];

        return (int) ($questions[0]['number'] ?? 1);
    }

    protected function assertAttemptActive(AiScenarioAttempt $attempt): void
    {
        if ($attempt->user_id !== PortalAuth::participantUser()?->id) {
            abort(403);
        }

        if ($attempt->status !== self::STATUS_IN_PROGRESS) {
            throw ValidationException::withMessages([
                'ai_scenario' => 'This attempt is no longer active.',
            ]);
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $questions
     * @return list<int>
     */
    protected function buildQuestionOrder(array $questions, bool $shuffle): array
    {
        $order = collect($questions)
            ->pluck('number')
            ->filter()
            ->map(fn ($n) => (int) $n)
            ->values()
            ->all();

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
    protected function buildShuffledChoices(array $questions, array $questionOrder, bool $shuffle): array
    {
        $choices = [];
        $byNumber = collect($questions)->keyBy('number');

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
    protected function applyQuestionOrder(array $questions, array $questionOrder, array $shuffledChoices): array
    {
        $byNumber = collect($questions)->keyBy(fn ($q) => (int) ($q['number'] ?? 0));

        return collect($questionOrder)
            ->map(function (int $number) use ($byNumber, $shuffledChoices) {
                $question = $byNumber->get($number);
                if (! is_array($question) || $question === []) {
                    return null;
                }

                $order = $shuffledChoices[(string) $number] ?? ['A', 'B', 'C', 'D'];
                $remapped = $question;
                $original = [];

                foreach (['A', 'B', 'C', 'D'] as $letter) {
                    $lower = strtolower($letter);
                    $original[$letter] = [
                        'en' => $question["choice_{$lower}_en"] ?? $question['choices'][$letter] ?? '',
                        'fil' => $question["choice_{$lower}_fil"] ?? '',
                        'explanation_en' => $question['explanation_en'] ?? $question['explanation'] ?? '',
                        'explanation_fil' => $question['explanation_fil'] ?? '',
                    ];
                }

                $correct = strtoupper((string) ($question['correct_answer'] ?? 'A'));

                foreach ($order as $index => $newLetter) {
                    $oldLetter = ['A', 'B', 'C', 'D'][$index];
                    $lowerNew = strtolower($newLetter);
                    $remapped["choice_{$lowerNew}_en"] = $original[$oldLetter]['en'];
                    $remapped["choice_{$lowerNew}_fil"] = $original[$oldLetter]['fil'];
                    if ($correct === $oldLetter) {
                        $remapped['correct_answer'] = $newLetter;
                    }
                }

                return $remapped;
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>|null
     */
    protected function findQuestion(AiScenarioAttempt $attempt, int $questionId): ?array
    {
        foreach ($attempt->generated_questions ?? [] as $question) {
            if ((int) ($question['number'] ?? 0) === $questionId) {
                return $question;
            }
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    protected function configQuizSettings(AiScenarioConfig $config): array
    {
        return [
            'time_limit_minutes' => (int) ($config->time_limit_minutes ?? 60),
            'max_attempts' => (int) ($config->max_attempts ?? 3),
            'passing_score' => (int) ($config->passing_score ?? 75),
            'fail_retake_policy' => $config->fail_retake_policy ?? AiScenarioConfig::FAIL_POLICY_REQUIRE_LESSON_REVIEW,
            'auto_submit_on_expire' => (bool) ($config->auto_submit_on_expire ?? true),
            'allow_resume_attempt' => (bool) ($config->allow_resume_attempt ?? true),
            'shuffle_questions' => (bool) ($config->shuffle_questions ?? true),
            'shuffle_answer_choices' => (bool) ($config->shuffle_answer_choices ?? true),
        ];
    }

    protected function resolveDashboardStatus(
        ?AiScenarioAttempt $inProgress,
        ?AiScenarioAttempt $latestCompleted,
        bool $isLocked,
        int $attemptsRemaining,
        ?AiScenarioAttempt $passedAttempt,
        bool $lessonReviewRequired = false,
        bool $adminRetrainingApproved = false,
    ): string {
        if ($inProgress) {
            return 'in_progress';
        }

        if ($passedAttempt) {
            return 'passed';
        }

        if ($adminRetrainingApproved) {
            return 'locked';
        }

        if ($lessonReviewRequired) {
            return 'lesson_review_required';
        }

        if ($isLocked && $attemptsRemaining <= 0) {
            return 'locked';
        }

        if ($latestCompleted && ! $latestCompleted->passed) {
            return $attemptsRemaining > 0 ? 'failed' : 'locked';
        }

        return 'not_started';
    }

    protected function resolveTrainingStatus(
        ?AiScenarioAttempt $inProgress,
        ?AiScenarioAttempt $latestCompleted,
        bool $isLocked,
        int $attemptsRemaining,
        ?AiScenarioAttempt $passedAttempt,
        bool $lessonReviewRequired,
        bool $allLessonsCompleted,
        bool $adminRetrainingApproved = false,
    ): string {
        if ($passedAttempt) {
            return 'passed';
        }

        if ($inProgress) {
            return 'in_progress';
        }

        if ($adminRetrainingApproved) {
            return 'retraining_required';
        }

        if ($lessonReviewRequired) {
            return 'lesson_review_required';
        }

        if ($latestCompleted && ! $latestCompleted->passed) {
            return $attemptsRemaining > 0 ? 'failed' : 'locked';
        }

        if (! $allLessonsCompleted) {
            return 'in_progress';
        }

        if ($isLocked) {
            return 'locked';
        }

        return 'not_started';
    }
}
