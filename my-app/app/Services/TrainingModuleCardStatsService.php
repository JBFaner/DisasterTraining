<?php

namespace App\Services;

use App\Models\AiScenarioAttempt;
use App\Models\Certificate;
use App\Models\EvaluationResult;
use App\Models\LessonCompletion;
use App\Models\LessonQuizAttempt;
use App\Models\LessonQuizConfig;
use App\Models\LessonQuizVersion;
use App\Models\TrainingModule;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TrainingModuleCardStatsService
{
    public function __construct(
        private readonly LessonQuizProgressionService $progression,
    ) {}

    /**
     * Fast admin listing stats — aggregate queries only (no per-participant loops).
     *
     * @param  Collection<int, TrainingModule>|array<int, TrainingModule>  $modules
     */
    public function enrichAdminModules(Collection|array $modules): void
    {
        $collection = $modules instanceof Collection ? $modules : collect($modules);

        if ($collection->isEmpty()) {
            return;
        }

        $moduleIds = $collection->pluck('id')->map(fn ($id) => (int) $id)->all();

        $participantCounts = $this->participantCountsByModule($moduleIds);
        $moduleIdsWithRecords = $this->moduleIdsWithParticipantRecords($moduleIds);
        $completionRates = $this->approximateCompletionRatesByModule(
            $moduleIds,
            $collection,
            $participantCounts,
        );

        foreach ($collection as $module) {
            $moduleId = (int) $module->id;
            $lessonCount = (int) ($module->lesson_count ?? $module->contents_count ?? 0);
            $participantCount = (int) ($participantCounts[$moduleId] ?? 0);

            $module->lesson_count = $lessonCount;
            $module->participant_count = $participantCount;
            $module->has_participant_records = in_array($moduleId, $moduleIdsWithRecords, true)
                || $participantCount > 0;
            $module->completion_percentage = (int) ($completionRates[$moduleId] ?? 0);
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

        $allContentIds = $contentsByModule
            ->flatMap(fn (TrainingModule $module) => $module->contents->pluck('id'))
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        $completedContentIds = $this->completedContentIdsForUser($userId, $moduleIds);
        $quizEnabledContentIds = $this->publishedQuizContentIds($allContentIds);
        $passedQuizContentIds = $this->passedQuizContentIdsForUser($userId, $quizEnabledContentIds);

        foreach ($collection as $module) {
            $lessonCount = (int) ($module->lesson_count ?? $module->contents_count ?? 0);
            $module->lesson_count = $lessonCount;

            $moduleWithContents = $contentsByModule->get((int) $module->id);
            if (! $moduleWithContents || $lessonCount === 0) {
                $module->completion_percentage = 0;
                $this->applyResumeLessonMeta($module, null, null, $lessonCount);

                continue;
            }

            $completed = 0;
            $resumeContent = null;

            foreach ($moduleWithContents->contents as $content) {
                $contentId = (int) $content->id;
                $isCompleted = false;

                if (isset($quizEnabledContentIds[$contentId])) {
                    if (isset($passedQuizContentIds[$contentId])) {
                        $completed++;
                        $isCompleted = true;
                    }
                } elseif (isset($completedContentIds[$contentId])) {
                    $completed++;
                    $isCompleted = true;
                }

                if ($resumeContent === null) {
                    $previousContent = $moduleWithContents->contents
                        ->slice(0, $moduleWithContents->contents->search(fn ($item) => (int) $item->id === $contentId))
                        ->last();
                    $previousCompleted = $previousContent === null
                        || (isset($quizEnabledContentIds[(int) $previousContent->id])
                            ? isset($passedQuizContentIds[(int) $previousContent->id])
                            : isset($completedContentIds[(int) $previousContent->id]));

                    if (! $isCompleted && $previousCompleted) {
                        $resumeContent = $content;
                    }
                }
            }

            if ($resumeContent === null && $completed === 0 && $moduleWithContents->contents->isNotEmpty()) {
                $resumeContent = $moduleWithContents->contents->first();
            }

            $module->completion_percentage = (int) round(($completed / $lessonCount) * 100);
            $this->applyResumeLessonMeta(
                $module,
                $resumeContent,
                $moduleWithContents,
                $lessonCount,
                $completed,
            );
        }
    }

    private function applyResumeLessonMeta(
        TrainingModule $module,
        ?\App\Models\TrainingContent $resumeContent,
        ?TrainingModule $moduleWithContents,
        int $lessonCount,
        int $completedLessons = 0,
    ): void {
        if ($resumeContent) {
            $sequence = 1;
            if ($moduleWithContents) {
                $index = $moduleWithContents->contents->search(fn ($item) => (int) $item->id === (int) $resumeContent->id);
                $sequence = $index === false ? 1 : ((int) $index + 1);
            }

            $module->resume_content_id = (int) $resumeContent->id;
            $module->resume_lesson_title = $resumeContent->title;
            $module->resume_lesson_number = $sequence;
            $module->resume_label = $completedLessons > 0
                ? 'Resume lesson '.$sequence
                : 'Start lesson '.$sequence;

            return;
        }

        $module->resume_content_id = null;
        $module->resume_lesson_title = null;
        $module->resume_lesson_number = null;

        if ($lessonCount > 0 && $completedLessons >= $lessonCount) {
            $module->resume_label = 'Review module';
        } elseif ($lessonCount > 0) {
            $module->resume_label = 'Open module';
        } else {
            $module->resume_label = null;
        }
    }

    /**
     * @param  list<int>  $moduleIds
     * @return array<int, int>
     */
    private function participantCountsByModule(array $moduleIds): array
    {
        if ($moduleIds === []) {
            return [];
        }

        $rows = DB::query()
            ->fromSub(
                LessonCompletion::query()
                    ->whereIn('training_module_id', $moduleIds)
                    ->select('training_module_id', 'user_id')
                    ->union(
                        LessonQuizAttempt::query()
                            ->whereIn('training_module_id', $moduleIds)
                            ->select('training_module_id', 'user_id')
                    ),
                'participant_rows',
            )
            ->selectRaw('training_module_id, COUNT(DISTINCT user_id) as participant_count')
            ->groupBy('training_module_id')
            ->get();

        $map = [];
        foreach ($rows as $row) {
            $map[(int) $row->training_module_id] = (int) $row->participant_count;
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

        foreach ([
            LessonCompletion::query()->whereIn('training_module_id', $moduleIds)->distinct()->pluck('training_module_id'),
            LessonQuizAttempt::query()->whereIn('training_module_id', $moduleIds)->distinct()->pluck('training_module_id'),
            AiScenarioAttempt::query()->whereIn('training_module_id', $moduleIds)->distinct()->pluck('training_module_id'),
            EvaluationResult::query()->whereIn('training_module_id', $moduleIds)->distinct()->pluck('training_module_id'),
            Certificate::query()->whereIn('training_module_id', $moduleIds)->distinct()->pluck('training_module_id'),
        ] as $ids) {
            $recordModuleIds = $recordModuleIds->merge($ids);
        }

        return $recordModuleIds
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
    }

    /**
     * Approximate avg completion for admin cards:
     * (lesson completions + passed lesson-quiz pairs) / (participants × lessons).
     *
     * @param  list<int>  $moduleIds
     * @param  Collection<int, TrainingModule>  $modules
     * @param  array<int, int>  $participantCounts
     * @return array<int, int>
     */
    private function approximateCompletionRatesByModule(
        array $moduleIds,
        Collection $modules,
        array $participantCounts,
    ): array {
        if ($moduleIds === []) {
            return [];
        }

        $lessonCounts = [];
        foreach ($modules as $module) {
            $lessonCounts[(int) $module->id] = (int) ($module->lesson_count ?? $module->contents_count ?? 0);
        }

        $completionTotals = LessonCompletion::query()
            ->whereIn('training_module_id', $moduleIds)
            ->whereNotNull('training_content_id')
            ->selectRaw('training_module_id, COUNT(*) as total')
            ->groupBy('training_module_id')
            ->pluck('total', 'training_module_id');

        $passedQuizTotals = DB::query()
            ->fromSub(
                LessonQuizAttempt::query()
                    ->whereIn('training_module_id', $moduleIds)
                    ->where('passed', true)
                    ->select('training_module_id', 'user_id', 'training_content_id')
                    ->distinct(),
                'passed_quiz_pairs',
            )
            ->selectRaw('training_module_id, COUNT(*) as total')
            ->groupBy('training_module_id')
            ->pluck('total', 'training_module_id');

        $rates = [];
        foreach ($moduleIds as $moduleId) {
            $participants = (int) ($participantCounts[$moduleId] ?? 0);
            $lessons = (int) ($lessonCounts[$moduleId] ?? 0);
            if ($participants === 0 || $lessons === 0) {
                $rates[$moduleId] = 0;
                continue;
            }

            $completedUnits = (int) ($completionTotals[$moduleId] ?? 0)
                + (int) ($passedQuizTotals[$moduleId] ?? 0);
            $denominator = $participants * $lessons;
            $rates[$moduleId] = (int) min(100, round(($completedUnits / $denominator) * 100));
        }

        return $rates;
    }

    /**
     * @param  list<int>  $moduleIds
     * @return array<int, true>
     */
    private function completedContentIdsForUser(int $userId, array $moduleIds): array
    {
        $ids = LessonCompletion::query()
            ->where('user_id', $userId)
            ->whereIn('training_module_id', $moduleIds)
            ->whereNotNull('training_content_id')
            ->pluck('training_content_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        return array_fill_keys($ids, true);
    }

    /**
     * @param  list<int>  $contentIds
     * @return array<int, true>
     */
    private function publishedQuizContentIds(array $contentIds): array
    {
        if ($contentIds === []) {
            return [];
        }

        $ids = LessonQuizConfig::query()
            ->whereIn('training_content_id', $contentIds)
            ->where('is_enabled', true)
            ->whereNotNull('published_version_id')
            ->whereHas('publishedVersion', function ($query) {
                $query->where('status', LessonQuizVersion::STATUS_PUBLISHED);
            })
            ->pluck('training_content_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        return array_fill_keys($ids, true);
    }

    /**
     * @param  list<int>|array<int, true>  $contentIds
     * @return array<int, true>
     */
    private function passedQuizContentIdsForUser(int $userId, array $contentIds): array
    {
        $ids = array_keys($contentIds);
        if ($ids === []) {
            return [];
        }

        $passed = LessonQuizAttempt::query()
            ->where('user_id', $userId)
            ->where('passed', true)
            ->whereIn('training_content_id', $ids)
            ->pluck('training_content_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        return array_fill_keys($passed, true);
    }
}
