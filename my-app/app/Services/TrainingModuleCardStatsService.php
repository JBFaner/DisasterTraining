<?php

namespace App\Services;

use App\Models\LessonCompletion;
use App\Models\LessonQuizAttempt;
use App\Models\AiScenarioAttempt;
use App\Models\EvaluationResult;
use App\Models\Certificate;
use App\Models\TrainingModule;
use Illuminate\Support\Collection;

class TrainingModuleCardStatsService
{
    public function __construct(
        private readonly LessonQuizProgressionService $progression,
    ) {}

    /**
     * @param  Collection<int, TrainingModule>|array<int, TrainingModule>  $modules
     */
    public function enrichAdminModules(Collection|array $modules): void
    {
        $collection = $modules instanceof Collection ? $modules : collect($modules);

        if ($collection->isEmpty()) {
            return;
        }

        $moduleIds = $collection->pluck('id')->map(fn ($id) => (int) $id)->all();
        $participantMap = $this->participantIdsByModule($moduleIds);
        $moduleIdsWithRecords = $this->moduleIdsWithParticipantRecords($moduleIds);

        foreach ($collection as $module) {
            $lessonCount = (int) ($module->lesson_count ?? $module->contents_count ?? 0);
            $participantIds = $participantMap[(int) $module->id] ?? [];

            $module->lesson_count = $lessonCount;
            $module->participant_count = count($participantIds);
            $module->has_participant_records = in_array((int) $module->id, $moduleIdsWithRecords, true);
            $module->completion_percentage = $this->averageCompletionPercentage(
                $module,
                $participantIds,
                $lessonCount,
            );
        }
    }

    /**
     * @param  Collection<int, TrainingModule>|array<int, TrainingModule>  $modules
     */
    public function enrichParticipantModules(Collection|array $modules, int $userId): void
    {
        $collection = $modules instanceof Collection ? $modules : collect($modules);

        if ($collection->isEmpty()) {
            return;
        }

        $moduleIds = $collection->pluck('id')->map(fn ($id) => (int) $id)->all();
        $contentsByModule = TrainingModule::query()
            ->with('contents')
            ->whereIn('id', $moduleIds)
            ->get()
            ->keyBy('id');

        foreach ($collection as $module) {
            $lessonCount = (int) ($module->lesson_count ?? $module->contents_count ?? 0);
            $module->lesson_count = $lessonCount;

            $moduleWithContents = $contentsByModule->get((int) $module->id);
            $module->completion_percentage = $this->participantCompletionPercentage(
                $moduleWithContents,
                $userId,
                $lessonCount,
            );
        }
    }

    /**
     * @param  list<int>  $moduleIds
     * @return array<int, list<int>>
     */
    private function participantIdsByModule(array $moduleIds): array
    {
        if ($moduleIds === []) {
            return [];
        }

        $completionIds = LessonCompletion::query()
            ->whereIn('training_module_id', $moduleIds)
            ->select('training_module_id', 'user_id')
            ->distinct()
            ->get();

        $quizIds = LessonQuizAttempt::query()
            ->whereIn('training_module_id', $moduleIds)
            ->select('training_module_id', 'user_id')
            ->distinct()
            ->get();

        $map = [];
        foreach ($completionIds->concat($quizIds) as $row) {
            $moduleId = (int) $row->training_module_id;
            $userId = (int) $row->user_id;
            $map[$moduleId] ??= [];
            $map[$moduleId][$userId] = $userId;
        }

        foreach ($map as $moduleId => $users) {
            $map[$moduleId] = array_values($users);
        }

        return $map;
    }

    /**
     * @param  list<int>  $moduleIds
     * @return list<int>
     */
    private function moduleIdsWithParticipantRecords(array $moduleIds): array
    {
        if ($moduleIds === []) {
            return [];
        }

        $recordModuleIds = collect();

        $recordModuleIds = $recordModuleIds->merge(
            LessonCompletion::query()
                ->whereIn('training_module_id', $moduleIds)
                ->distinct()
                ->pluck('training_module_id'),
        );

        $recordModuleIds = $recordModuleIds->merge(
            LessonQuizAttempt::query()
                ->whereIn('training_module_id', $moduleIds)
                ->distinct()
                ->pluck('training_module_id'),
        );

        $recordModuleIds = $recordModuleIds->merge(
            AiScenarioAttempt::query()
                ->whereIn('training_module_id', $moduleIds)
                ->distinct()
                ->pluck('training_module_id'),
        );

        $recordModuleIds = $recordModuleIds->merge(
            EvaluationResult::query()
                ->whereIn('training_module_id', $moduleIds)
                ->distinct()
                ->pluck('training_module_id'),
        );

        $recordModuleIds = $recordModuleIds->merge(
            Certificate::query()
                ->whereIn('training_module_id', $moduleIds)
                ->distinct()
                ->pluck('training_module_id'),
        );

        return $recordModuleIds
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @param  list<int>  $participantIds
     */
    private function averageCompletionPercentage(
        TrainingModule $module,
        array $participantIds,
        int $lessonCount,
    ): int {
        if ($lessonCount === 0 || $participantIds === []) {
            return 0;
        }

        if (! $module->relationLoaded('contents')) {
            $module->load('contents');
        }

        $total = 0;
        foreach ($participantIds as $userId) {
            $total += $this->participantCompletionPercentage($module, (int) $userId, $lessonCount);
        }

        return (int) round($total / count($participantIds));
    }

    private function participantCompletionPercentage(
        ?TrainingModule $module,
        int $userId,
        int $lessonCount,
    ): int {
        if (! $module || $lessonCount === 0) {
            return 0;
        }

        if (! $module->relationLoaded('contents')) {
            $module->load('contents');
        }

        $completed = 0;
        foreach ($module->contents as $content) {
            if ($this->progression->participantHasCompletedLesson($module, $userId, $content)) {
                $completed++;
            }
        }

        return (int) round(($completed / $lessonCount) * 100);
    }
}
