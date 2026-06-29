<?php

namespace App\Services;

use App\Models\AiScenarioAttempt;
use App\Models\AiScenarioConfig;
use App\Models\EvaluationResult;
use App\Models\TrainingModule;
use App\Models\User;

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

        if ($quizMeta['all_lessons_completed'] ?? false) {
            return false;
        }

        if (($quizMeta['attempts_used'] ?? 0) === 0) {
            return false;
        }

        if (($quizMeta['in_progress_attempt'] ?? null) !== null) {
            return false;
        }

        return ($quizMeta['attempts_remaining'] ?? 0) > 0;
    }

    protected function attemptsRemainingAfter(AiScenarioAttempt $attempt): int
    {
        $config = $attempt->config;
        $maxAttempts = (int) ($config?->max_attempts ?? 3);

        $attemptsUsed = AiScenarioAttempt::query()
            ->where('user_id', $attempt->user_id)
            ->where('training_module_id', $attempt->training_module_id)
            ->whereIn('status', [
                AiScenarioAttempt::STATUS_COMPLETED,
                AiScenarioAttempt::STATUS_EXPIRED,
            ])
            ->count();

        return max(0, $maxAttempts - $attemptsUsed);
    }
}
