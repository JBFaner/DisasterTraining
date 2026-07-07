<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TrainingModule extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'learning_objectives',
        'estimated_duration_minutes',
        'thumbnail_path',
        'difficulty',
        'category',
        'status',
        'visibility',
        'owner_id',
    ];

    protected $casts = [
        'learning_objectives' => 'array',
        'estimated_duration_minutes' => 'integer',
    ];

    protected $appends = [
        'thumbnail_url',
    ];

    public function lessons()
    {
        return $this->hasMany(TrainingLesson::class)->orderBy('order');
    }

    public function contents()
    {
        return $this->hasMany(TrainingContent::class)->orderBy('sort_order');
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function aiScenarioConfig()
    {
        return $this->hasOne(AiScenarioConfig::class);
    }

    public function aiScenarioAttempts()
    {
        return $this->hasMany(AiScenarioAttempt::class);
    }

    /**
     * @return list<int>
     */
    public function contentIds(): array
    {
        return $this->contents()->pluck('id')->all();
    }

    /**
     * @return list<int>
     */
    public function participantCompletedContentIds(int $userId): array
    {
        $ids = LessonCompletion::query()
            ->where('user_id', $userId)
            ->where('training_module_id', $this->id)
            ->whereNotNull('training_content_id')
            ->pluck('training_content_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if ($ids !== []) {
            return $ids;
        }

        return LessonCompletion::query()
            ->where('user_id', $userId)
            ->where('training_module_id', $this->id)
            ->pluck('training_lesson_id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    public function participantCanAccessContent(int $userId, int $contentId): bool
    {
        $contents = $this->relationLoaded('contents')
            ? $this->contents
            : $this->contents()->get();

        if ($contents->isEmpty()) {
            return false;
        }

        $completedIds = array_flip($this->participantCompletedContentIds($userId));

        foreach ($contents as $index => $content) {
            if ((int) $content->id !== $contentId) {
                continue;
            }

            if ($index === 0) {
                return true;
            }

            if (isset($completedIds[$contentId])) {
                return true;
            }

            $previous = $contents[$index - 1];

            return isset($completedIds[(int) $previous->id]);
        }

        return false;
    }

    public function participantCanCompleteContent(int $userId, int $contentId): bool
    {
        $contents = $this->relationLoaded('contents')
            ? $this->contents
            : $this->contents()->get();

        foreach ($contents as $index => $content) {
            if ((int) $content->id !== $contentId) {
                continue;
            }

            if ($index === 0) {
                return true;
            }

            $completedIds = array_flip($this->participantCompletedContentIds($userId));
            $previous = $contents[$index - 1];

            return isset($completedIds[(int) $previous->id]);
        }

        return false;
    }

    public function applyParticipantProgression(int $userId): void
    {
        if (! $this->relationLoaded('contents')) {
            $this->load('contents');
        }

        $progression = app(\App\Services\LessonQuizProgressionService::class);
        $completedIds = array_flip($this->participantCompletedContentIds($userId));

        $this->contents->transform(function ($content, $index) use ($completedIds, $progression, $userId) {
            $contentId = (int) $content->id;
            $isCompleted = $progression->participantHasCompletedLesson($this, $userId, $content)
                || isset($completedIds[$contentId]);
            $isUnlocked = $index === 0
                || $isCompleted
                || ($index > 0 && (
                    $progression->participantHasCompletedLesson($this, $userId, $this->contents[$index - 1])
                    || isset($completedIds[(int) $this->contents[$index - 1]->id])
                ));

            $content->is_completed = $isCompleted;
            $content->is_unlocked = $isUnlocked;
            $content->is_locked = ! $isUnlocked;
            $content->sequence_number = $index + 1;

            return $content;
        });
    }

    public function participantHasCompletedAllContents(int $userId): bool
    {
        return app(\App\Services\LessonQuizProgressionService::class)
            ->participantHasPassedAllRequiredLessonQuizzes($this, $userId);
    }

    public function hasParticipantLearningRecords(): bool
    {
        if (LessonCompletion::query()->where('training_module_id', $this->id)->exists()) {
            return true;
        }

        if (LessonQuizAttempt::query()->where('training_module_id', $this->id)->exists()) {
            return true;
        }

        if (AiScenarioAttempt::query()->where('training_module_id', $this->id)->exists()) {
            return true;
        }

        if (EvaluationResult::query()->where('training_module_id', $this->id)->exists()) {
            return true;
        }

        return Certificate::query()->where('training_module_id', $this->id)->exists();
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        if (! $this->thumbnail_path) {
            return null;
        }

        if (str_starts_with($this->thumbnail_path, 'http://') || str_starts_with($this->thumbnail_path, 'https://')) {
            return $this->thumbnail_path;
        }

        return '/storage/'.$this->thumbnail_path;
    }
}


