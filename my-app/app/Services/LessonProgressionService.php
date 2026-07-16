<?php

namespace App\Services;

use App\Models\LessonCompletion;
use App\Models\TrainingModule;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class LessonProgressionService
{
    public function resetParticipantProgress(User $user, TrainingModule $module): int
    {
        return DB::transaction(function () use ($user, $module) {
            return LessonCompletion::query()
                ->where('user_id', $user->id)
                ->where('training_module_id', $module->id)
                ->delete();
        });
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function buildLessonProgressMeta(
        TrainingModule $module,
        int $userId,
        bool $contentReviewMode = false,
    ): array {
        $module->loadMissing('contents');
        $module->applyParticipantProgression($userId);

        $reviewedIds = [];
        if ($contentReviewMode) {
            $reviewedIds = array_flip(
                LessonCompletion::query()
                    ->where('user_id', $userId)
                    ->where('training_module_id', $module->id)
                    ->pluck('training_content_id')
                    ->map(fn ($id) => (int) $id)
                    ->all()
            );
        }

        return $module->contents
            ->map(function ($content, $index) use ($contentReviewMode, $reviewedIds, $module) {
                if ($contentReviewMode) {
                    $isReviewed = isset($reviewedIds[(int) $content->id]);
                    $previousReviewed = $index === 0
                        || isset($reviewedIds[(int) $module->contents[$index - 1]->id]);

                    return [
                        'id' => $content->id,
                        'title' => $content->title,
                        'sequence_number' => $content->sequence_number,
                        'is_completed' => $isReviewed,
                        'is_unlocked' => $previousReviewed || $isReviewed,
                        'is_locked' => ! ($previousReviewed || $isReviewed),
                        'status' => $isReviewed
                            ? 'reviewed'
                            : ($previousReviewed || $index === 0 ? 'needs_review' : 'locked'),
                        'review_required' => true,
                    ];
                }

                return [
                    'id' => $content->id,
                    'title' => $content->title,
                    'sequence_number' => $content->sequence_number,
                    'is_completed' => (bool) $content->is_completed,
                    'is_unlocked' => (bool) $content->is_unlocked,
                    'is_locked' => (bool) $content->is_locked,
                    'status' => $content->is_completed
                        ? 'completed'
                        : ($content->is_unlocked ? 'available' : 'locked'),
                    'review_required' => false,
                ];
            })
            ->values()
            ->all();
    }
}
