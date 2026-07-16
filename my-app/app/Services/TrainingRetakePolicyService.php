<?php

namespace App\Services;

use App\Models\AiScenarioAttempt;
use App\Models\AiScenarioConfig;
use App\Models\EvaluationResult;
use App\Models\LessonCompletion;
use App\Models\TrainingModule;
use App\Models\User;
use Carbon\CarbonInterface;

class TrainingRetakePolicyService
{
    public function __construct(
        private readonly LessonProgressionService $lessonProgressionService,
    ) {}

    public function handleFailedAttempt(AiScenarioAttempt $attempt): void
    {
        $attempt->loadMissing(['config', 'trainingModule', 'user']);

        $config = $attempt->config;
        if (! $config || ! $config->requiresLessonReviewOnFail()) {
            return;
        }

        $user = $attempt->user;
        $module = $attempt->trainingModule;

        if (! $user || ! $module) {
            return;
        }

        if ($this->attemptsRemainingAfter($attempt) <= 0) {
            return;
        }

        // Clear lesson review markers only. Lesson quiz passes stay intact —
        // participants re-open lessons, they do not retake lesson quizzes.
        $this->lessonProgressionService->resetParticipantProgress($user, $module);
    }

    public function issueCertificateForPassedAttempt(AiScenarioAttempt $attempt, EvaluationResult $evaluation): void
    {
        app(TrainingCertificateService::class)->issueForPassedAttempt($attempt, $evaluation);
    }

    public function lessonReviewRequired(TrainingModule $module, User $user, array $quizMeta): bool
    {
        $config = $module->aiScenarioConfig;

        if (! $config || ! $config->requiresLessonReviewOnFail()) {
            return false;
        }

        if ($quizMeta['passed'] ?? false) {
            return false;
        }

        if (($quizMeta['attempts_used'] ?? 0) === 0) {
            return false;
        }

        if (($quizMeta['in_progress_attempt'] ?? null) !== null) {
            return false;
        }

        if (($quizMeta['attempts_remaining'] ?? 0) <= 0) {
            return false;
        }

        $lastFailedAt = $this->lastFailedAttemptCompletedAt($module, $user, $quizMeta);

        if (! $lastFailedAt) {
            return false;
        }

        return ! $this->hasReviewedAllLessonsSince($module, $user, $lastFailedAt);
    }

    public function isContentReviewPending(TrainingModule $module, User $user): bool
    {
        $module->loadMissing('aiScenarioConfig');
        $config = $module->aiScenarioConfig;

        if (! $config || ! $config->requiresLessonReviewOnFail()) {
            return false;
        }

        $trainingCycle = app(TrainingResetService::class)->currentCycleNumber(
            (int) $user->id,
            (int) $module->id,
        );

        $latestFailed = AiScenarioAttempt::query()
            ->where('user_id', $user->id)
            ->where('training_module_id', $module->id)
            ->where('training_cycle', $trainingCycle)
            ->whereIn('status', [
                AiScenarioAttempt::STATUS_COMPLETED,
                AiScenarioAttempt::STATUS_EXPIRED,
            ])
            ->where(function ($query) {
                $query->where('passed', false)->orWhereNull('passed');
            })
            ->orderByDesc('id')
            ->first();

        if (! $latestFailed) {
            return false;
        }

        $passedExists = AiScenarioAttempt::query()
            ->where('user_id', $user->id)
            ->where('training_module_id', $module->id)
            ->where('training_cycle', $trainingCycle)
            ->where('passed', true)
            ->exists();

        if ($passedExists) {
            return false;
        }

        $maxAttempts = (int) ($config->max_attempts ?? 3);
        $attemptsUsed = AiScenarioAttempt::query()
            ->where('user_id', $user->id)
            ->where('training_module_id', $module->id)
            ->where('training_cycle', $trainingCycle)
            ->whereIn('status', [
                AiScenarioAttempt::STATUS_COMPLETED,
                AiScenarioAttempt::STATUS_EXPIRED,
            ])
            ->count();

        if ($attemptsUsed >= $maxAttempts) {
            return false;
        }

        $since = $latestFailed->completed_at ?? $latestFailed->updated_at;

        if (! $since) {
            return true;
        }

        return ! $this->hasReviewedAllLessonsSince($module, $user, $since);
    }

    public function hasReviewedAllLessonsSince(
        TrainingModule $module,
        User $user,
        CarbonInterface|string $since,
    ): bool {
        $module->loadMissing('contents');

        if ($module->contents->isEmpty()) {
            return false;
        }

        $reviewedIds = LessonCompletion::query()
            ->where('user_id', $user->id)
            ->where('training_module_id', $module->id)
            ->where(function ($query) use ($since) {
                $query->where('completed_at', '>=', $since)
                    ->orWhere(function ($inner) use ($since) {
                        $inner->whereNull('completed_at')
                            ->where('updated_at', '>=', $since);
                    });
            })
            ->pluck('training_content_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->all();

        $reviewedLookup = array_flip($reviewedIds);

        foreach ($module->contents as $content) {
            if (! isset($reviewedLookup[(int) $content->id])) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  array<string, mixed>  $quizMeta
     */
    protected function lastFailedAttemptCompletedAt(TrainingModule $module, User $user, array $quizMeta): ?CarbonInterface
    {
        $latest = $quizMeta['latest_completed_attempt'] ?? null;

        if (is_array($latest) && empty($latest['passed'])) {
            $completedAt = $latest['completed_at'] ?? $latest['updated_at'] ?? null;
            if ($completedAt) {
                return \Illuminate\Support\Carbon::parse($completedAt);
            }
        }

        $trainingCycle = app(TrainingResetService::class)->currentCycleNumber(
            (int) $user->id,
            (int) $module->id,
        );

        $attempt = AiScenarioAttempt::query()
            ->where('user_id', $user->id)
            ->where('training_module_id', $module->id)
            ->where('training_cycle', $trainingCycle)
            ->whereIn('status', [
                AiScenarioAttempt::STATUS_COMPLETED,
                AiScenarioAttempt::STATUS_EXPIRED,
            ])
            ->where(function ($query) {
                $query->where('passed', false)->orWhereNull('passed');
            })
            ->orderByDesc('id')
            ->first();

        return $attempt?->completed_at ?? $attempt?->updated_at;
    }

    protected function attemptsRemainingAfter(AiScenarioAttempt $attempt): int
    {
        $config = $attempt->config;
        $maxAttempts = (int) ($config?->max_attempts ?? 3);
        $cycle = app(TrainingResetService::class)->currentCycleNumber(
            (int) $attempt->user_id,
            (int) $attempt->training_module_id,
        );

        $attemptsUsed = AiScenarioAttempt::query()
            ->where('user_id', $attempt->user_id)
            ->where('training_module_id', $attempt->training_module_id)
            ->where('training_cycle', $cycle)
            ->whereIn('status', [
                AiScenarioAttempt::STATUS_COMPLETED,
                AiScenarioAttempt::STATUS_EXPIRED,
            ])
            ->count();

        return max(0, $maxAttempts - $attemptsUsed);
    }
}
