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
    public function buildLessonProgressMeta(TrainingModule $module, int $userId): array
    {
        $module->loadMissing('contents');
        $module->applyParticipantProgression($userId);

        return $module->contents
            ->map(fn ($content) => [
                'id' => $content->id,
                'title' => $content->title,
                'sequence_number' => $content->sequence_number,
                'is_completed' => (bool) $content->is_completed,
                'is_unlocked' => (bool) $content->is_unlocked,
                'is_locked' => (bool) $content->is_locked,
                'status' => $content->is_completed
                    ? 'completed'
                    : ($content->is_unlocked ? 'available' : 'locked'),
            ])
            ->values()
            ->all();
    }
}
