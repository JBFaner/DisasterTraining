<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class TrainingModule extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'title',
        'short_description',
        'description',
        'learning_objectives',
        'estimated_duration_minutes',
        'thumbnail_path',
        'difficulty',
        'category',
        'related_hazard',
        'delivery_method',
        'target_audience',
        'recommended_audience',
        'lead_qualified_trainer_id',
        'assigned_qualified_trainer_ids',
        'lead_trainer_id',
        'trainer_availability',
        'available_training_sessions',
        'status',
        'visibility',
        'owner_id',
    ];

    protected $casts = [
        'learning_objectives' => 'array',
        'target_audience' => 'array',
        'assigned_qualified_trainer_ids' => 'array',
        'trainer_availability' => 'array',
        'available_training_sessions' => 'array',
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

    public function leadTrainer()
    {
        return $this->belongsTo(User::class, 'lead_trainer_id');
    }

    public function leadQualifiedTrainer()
    {
        return $this->belongsTo(QualifiedTrainer::class, 'lead_qualified_trainer_id');
    }

    /**
     * @return \Illuminate\Support\Collection<int, QualifiedTrainer>
     */
    public function assignedQualifiedTrainers()
    {
        $ids = collect($this->assigned_qualified_trainer_ids ?? [])
            ->map(fn ($id) => (int) $id)
            ->filter()
            ->values()
            ->all();

        if ($ids === [] && $this->lead_qualified_trainer_id) {
            $ids = [(int) $this->lead_qualified_trainer_id];
        }

        if ($ids === []) {
            return collect();
        }

        $trainers = QualifiedTrainer::query()
            ->whereIn('id', $ids)
            ->get(['id', 'name', 'email', 'specialization', 'status', 'certifications']);

        return collect($ids)
            ->map(fn ($id) => $trainers->firstWhere('id', $id))
            ->filter()
            ->values();
    }

    public function scopePublishedForIntegration(Builder $query): Builder
    {
        return $query->where('status', 'published');
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

    public function hasPublishedLessonQuiz(): bool
    {
        return LessonQuizConfig::query()
            ->where('is_enabled', true)
            ->whereNotNull('published_version_id')
            ->whereHas('trainingContent', function ($query) {
                $query->where('training_module_id', $this->id);
            })
            ->exists();
    }

    public function hasPublishedFinalScenarioAssessment(): bool
    {
        if (! $this->relationLoaded('aiScenarioConfig')) {
            $this->load('aiScenarioConfig');
        }

        return (bool) $this->aiScenarioConfig
            && (bool) $this->aiScenarioConfig->is_enabled
            && ! empty($this->aiScenarioConfig->published_version_id);
    }

    public function totalEstimatedLearningTimeMinutes(): int
    {
        return max(0, (int) ($this->estimated_duration_minutes ?? 0));
    }

    /**
     * @return array<string, mixed>
     */
    public function toIntegrationArray(): array
    {
        $sessions = collect($this->available_training_sessions ?? []);
        $assignedTrainers = isset($this->assigned_trainers) && is_iterable($this->assigned_trainers)
            ? collect($this->assigned_trainers)
            : $this->assignedQualifiedTrainers();

        return [
            'id' => (int) $this->id,
            'training_module_id' => (int) $this->id,
            'training_title' => $this->title,
            'short_description' => $this->short_description
                ?: Str::limit((string) ($this->description ?? ''), 220, ''),
            'related_hazards' => $this->related_hazard ?: $this->category,
            'recommended_communities' => is_array($this->recommended_communities ?? null)
                ? $this->recommended_communities
                : [
                    'summary' => [
                        'total_communities' => 0,
                        'high_priority' => 0,
                        'medium_priority' => 0,
                        'low_priority' => 0,
                    ],
                    'communities' => [],
                ],
            'recommended_audience' => $this->target_audience ?: $this->recommended_audience,
            'estimated_duration_minutes' => $this->totalEstimatedLearningTimeMinutes(),
            'total_lessons' => (int) ($this->lesson_count ?? $this->contents()->count()),
            'assigned_trainers' => $assignedTrainers
                ->map(fn ($trainer) => [
                    'id' => $trainer->id,
                    'name' => $trainer->name,
                    'role' => 'Trainer',
                    'specialization' => $trainer->specialization,
                    'contact_email' => $trainer->email,
                    'status' => $trainer->status,
                    'certifications' => $trainer->certifications ?? [],
                ])
                ->values()
                ->all(),
            'available_training_sessions' => $sessions->values()->all(),
            'maximum_participants' => $sessions
                ->pluck('maximum_participants')
                ->filter(fn ($value) => $value !== null && $value !== '')
                ->map(fn ($value) => (int) $value)
                ->values()
                ->all(),
        ];
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


