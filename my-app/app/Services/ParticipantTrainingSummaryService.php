<?php

namespace App\Services;

use App\Models\AiScenarioAttempt;
use App\Models\CampaignRegistration;
use App\Models\EvaluationResult;
use App\Models\LessonCompletion;
use App\Models\LessonQuizAttempt;
use App\Models\TrainingContent;
use App\Models\TrainingModule;
use App\Models\User;

class ParticipantTrainingSummaryService
{
    public function __construct(
        protected LessonQuizProgressionService $quizProgression,
    ) {}

    /**
     * @return list<int>
     */
    public function moduleIdsForUser(int $userId): array
    {
        $fromRegs = CampaignRegistration::query()
            ->where('user_id', $userId)
            ->where('registration_status', CampaignRegistration::STATUS_REGISTERED)
            ->whereNotNull('training_module_id')
            ->pluck('training_module_id');

        $fromActivity = collect()
            ->merge(LessonCompletion::query()->where('user_id', $userId)->pluck('training_module_id'))
            ->merge(LessonQuizAttempt::query()->where('user_id', $userId)->pluck('training_module_id'))
            ->merge(AiScenarioAttempt::query()->where('user_id', $userId)->pluck('training_module_id'));

        return $fromRegs->merge($fromActivity)->filter()->unique()->values()->all();
    }

    public function resolveModuleStatus(TrainingModule $module, int $userId): string
    {
        $module->loadMissing('contents');

        $hasAnyActivity = LessonQuizAttempt::query()
            ->where('user_id', $userId)
            ->where('training_module_id', $module->id)
            ->exists()
            || LessonCompletion::query()
                ->where('user_id', $userId)
                ->where('training_module_id', $module->id)
                ->exists()
            || AiScenarioAttempt::query()
                ->where('user_id', $userId)
                ->where('training_module_id', $module->id)
                ->exists();

        if (! $hasAnyActivity) {
            return 'Not Started';
        }

        if ($module->contents->isEmpty()) {
            $aiDone = AiScenarioAttempt::query()
                ->where('user_id', $userId)
                ->where('training_module_id', $module->id)
                ->where('status', AiScenarioAttempt::STATUS_COMPLETED)
                ->exists();

            return $aiDone ? 'Completed' : 'In Progress';
        }

        if ($this->quizProgression->participantHasPassedAllRequiredLessonQuizzes($module, $userId)) {
            return 'Completed';
        }

        return 'In Progress';
    }

    public function resolveLessonStatus(TrainingModule $module, int $userId, TrainingContent $content): string
    {
        $statuses = $this->resolveSequentialLessonStatuses($module, $userId);

        return $statuses[(int) $content->id] ?? 'not_started';
    }

    /**
     * @return array<int, string>
     */
    public function resolveSequentialLessonStatuses(TrainingModule $module, int $userId): array
    {
        $module->loadMissing('contents');
        $statuses = [];
        $priorComplete = true;

        foreach ($module->contents as $content) {
            $contentId = (int) $content->id;

            if (! $priorComplete) {
                $statuses[$contentId] = 'not_started';

                continue;
            }

            $raw = $this->resolveLessonStatusRaw($module, $userId, $content);
            $statuses[$contentId] = $raw;

            if ($raw !== 'completed') {
                $priorComplete = false;
            }
        }

        return $statuses;
    }

    protected function resolveLessonStatusRaw(TrainingModule $module, int $userId, TrainingContent $content): string
    {
        if ($this->quizProgression->lessonHasPublishedQuiz($content->id)) {
            if ($this->quizProgression->participantHasPassedLessonQuiz($userId, $content->id)) {
                return 'completed';
            }

            $hasAttempt = LessonQuizAttempt::query()
                ->where('user_id', $userId)
                ->where('training_content_id', $content->id)
                ->exists();

            return $hasAttempt ? 'in_progress' : 'not_started';
        }

        if (in_array($content->id, $module->participantCompletedContentIds($userId), true)) {
            return 'completed';
        }

        return 'not_started';
    }

    /**
     * @return list<array{
     *   training_module_id: int,
     *   module_title: string,
     *   status: string,
     *   lessons_completed: int,
     *   lessons_total: int,
     *   lessons: list<array{id: int, title: string, status: string, score: ?float, passed: ?bool}>
     * }>
     */
    public function buildModuleProgress(int $userId): array
    {
        $moduleIds = $this->moduleIdsForUser($userId);
        if ($moduleIds === []) {
            return [];
        }

        $latestQuizAttempts = LessonQuizAttempt::query()
            ->where('user_id', $userId)
            ->orderByDesc('submitted_at')
            ->orderByDesc('id')
            ->get()
            ->unique('training_content_id')
            ->keyBy('training_content_id');

        return TrainingModule::query()
            ->with(['contents'])
            ->whereIn('id', $moduleIds)
            ->orderBy('title')
            ->get()
            ->map(function (TrainingModule $module) use ($userId, $latestQuizAttempts) {
                $sequentialStatuses = $this->resolveSequentialLessonStatuses($module, $userId);

                $lessons = $module->contents->map(function (TrainingContent $content) use ($latestQuizAttempts, $sequentialStatuses) {
                    $contentId = (int) $content->id;
                    $status = $sequentialStatuses[$contentId] ?? 'not_started';
                    $attempt = $latestQuizAttempts->get($contentId);

                    return [
                        'id' => $contentId,
                        'title' => $content->title,
                        'status' => $status,
                        'score' => $attempt?->percentage !== null ? (float) $attempt->percentage : null,
                        'passed' => $attempt?->passed,
                    ];
                })->values()->all();

                $completedCount = collect($lessons)->where('status', 'completed')->count();

                return [
                    'training_module_id' => (int) $module->id,
                    'module_title' => $module->title,
                    'status' => $this->resolveModuleStatus($module, $userId),
                    'lessons_completed' => $completedCount,
                    'lessons_total' => count($lessons),
                    'lessons' => $lessons,
                ];
            })
            ->values()
            ->all();
    }

    public function resolveTrainingStatus(int $userId): string
    {
        $moduleIds = $this->moduleIdsForUser($userId);
        if ($moduleIds === []) {
            return 'Not Started';
        }

        $statuses = TrainingModule::query()
            ->whereIn('id', $moduleIds)
            ->get()
            ->map(fn (TrainingModule $module) => $this->resolveModuleStatus($module, $userId));

        if ($statuses->every(fn (string $status) => $status === 'Not Started')) {
            return 'Not Started';
        }

        if ($statuses->every(fn (string $status) => $status === 'Completed')) {
            return 'Completed';
        }

        return 'In Progress';
    }

    public function resolveEvaluationStatus(int $userId): string
    {
        if (EvaluationResult::query()->where('participant_id', $userId)->exists()) {
            return 'Completed';
        }

        $moduleIds = $this->moduleIdsForUser($userId);
        if ($moduleIds === []) {
            return 'Not Evaluated';
        }

        $hasQuizLessons = false;
        $allPassed = true;

        foreach (TrainingModule::query()->whereIn('id', $moduleIds)->with('contents')->get() as $module) {
            foreach ($module->contents as $content) {
                if (! $this->quizProgression->lessonHasPublishedQuiz($content->id)) {
                    continue;
                }

                $hasQuizLessons = true;
                if (! $this->quizProgression->participantHasPassedLessonQuiz($userId, $content->id)) {
                    $allPassed = false;
                    break 2;
                }
            }
        }

        if ($hasQuizLessons && $allPassed) {
            return 'Completed';
        }

        if (LessonQuizAttempt::query()->where('user_id', $userId)->exists()) {
            return 'In Progress';
        }

        return 'Not Evaluated';
    }

    public function alignStaleLessonCompletions(?int $userId = null): int
    {
        $query = LessonCompletion::query();
        if ($userId !== null) {
            $query->where('user_id', $userId);
        }

        $removed = 0;
        foreach ($query->get() as $completion) {
            $contentId = (int) ($completion->training_content_id ?? 0);
            if ($contentId <= 0) {
                continue;
            }

            if (
                $this->quizProgression->lessonHasPublishedQuiz($contentId)
                && ! $this->quizProgression->participantHasPassedLessonQuiz((int) $completion->user_id, $contentId)
            ) {
                $completion->delete();
                $removed++;
            }
        }

        return $removed;
    }

    public function countStaleLessonCompletions(?int $userId = null): int
    {
        $query = LessonCompletion::query();
        if ($userId !== null) {
            $query->where('user_id', $userId);
        }

        $count = 0;
        foreach ($query->get() as $completion) {
            $contentId = (int) ($completion->training_content_id ?? 0);
            if ($contentId <= 0) {
                continue;
            }

            if (
                $this->quizProgression->lessonHasPublishedQuiz($contentId)
                && ! $this->quizProgression->participantHasPassedLessonQuiz((int) $completion->user_id, $contentId)
            ) {
                $count++;
            }
        }

        return $count;
    }

    public function alignOutOfOrderLessonProgress(?int $userId = null): int
    {
        $removed = 0;
        $userQuery = User::query()->where('role', 'PARTICIPANT');

        if ($userId !== null) {
            $userQuery->whereKey($userId);
        }

        $userQuery->orderBy('id')->chunkById(100, function ($users) use (&$removed) {
            foreach ($users as $user) {
                $removed += $this->alignOutOfOrderLessonProgressForUser((int) $user->id);
            }
        });

        return $removed;
    }

    public function countOutOfOrderLessonProgress(?int $userId = null): int
    {
        $count = 0;
        $userQuery = User::query()->where('role', 'PARTICIPANT');

        if ($userId !== null) {
            $userQuery->whereKey($userId);
        }

        $userQuery->orderBy('id')->chunkById(100, function ($users) use (&$count) {
            foreach ($users as $user) {
                $count += $this->countOutOfOrderLessonProgressForUser((int) $user->id);
            }
        });

        return $count;
    }

    protected function alignOutOfOrderLessonProgressForUser(int $userId): int
    {
        $removed = 0;
        $moduleIds = $this->moduleIdsForUser($userId);

        foreach (TrainingModule::query()->with('contents')->whereIn('id', $moduleIds)->get() as $module) {
            $canAdvance = true;

            foreach ($module->contents as $content) {
                if (! $canAdvance) {
                    $removed += $this->purgeLessonProgressRows($userId, (int) $module->id, (int) $content->id);

                    continue;
                }

                if ($this->resolveLessonStatusRaw($module, $userId, $content) !== 'completed') {
                    $canAdvance = false;
                }
            }
        }

        return $removed;
    }

    protected function countOutOfOrderLessonProgressForUser(int $userId): int
    {
        $count = 0;
        $moduleIds = $this->moduleIdsForUser($userId);

        foreach (TrainingModule::query()->with('contents')->whereIn('id', $moduleIds)->get() as $module) {
            $canAdvance = true;

            foreach ($module->contents as $content) {
                if (! $canAdvance) {
                    $count += $this->countLessonProgressRows($userId, (int) $module->id, (int) $content->id);

                    continue;
                }

                if ($this->resolveLessonStatusRaw($module, $userId, $content) !== 'completed') {
                    $canAdvance = false;
                }
            }
        }

        return $count;
    }

    protected function purgeLessonProgressRows(int $userId, int $moduleId, int $contentId): int
    {
        $completions = LessonCompletion::query()
            ->where('user_id', $userId)
            ->where('training_module_id', $moduleId)
            ->where('training_content_id', $contentId)
            ->delete();

        $attempts = LessonQuizAttempt::query()
            ->where('user_id', $userId)
            ->where('training_module_id', $moduleId)
            ->where('training_content_id', $contentId)
            ->delete();

        return (int) $completions + (int) $attempts;
    }

    protected function countLessonProgressRows(int $userId, int $moduleId, int $contentId): int
    {
        $completions = LessonCompletion::query()
            ->where('user_id', $userId)
            ->where('training_module_id', $moduleId)
            ->where('training_content_id', $contentId)
            ->count();

        $attempts = LessonQuizAttempt::query()
            ->where('user_id', $userId)
            ->where('training_module_id', $moduleId)
            ->where('training_content_id', $contentId)
            ->count();

        return $completions + $attempts;
    }

    public function alignAllParticipantTrainingData(?int $userId = null): array
    {
        return [
            'stale_completions' => $this->alignStaleLessonCompletions($userId),
            'out_of_order' => $this->alignOutOfOrderLessonProgress($userId),
        ];
    }

    public function countAllParticipantTrainingData(?int $userId = null): array
    {
        return [
            'stale_completions' => $this->countStaleLessonCompletions($userId),
            'out_of_order' => $this->countOutOfOrderLessonProgress($userId),
        ];
    }
}
