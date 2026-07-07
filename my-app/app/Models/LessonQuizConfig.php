<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class LessonQuizConfig extends Model
{
    public const DIFFICULTIES = ['easy', 'medium', 'hard'];

    public const BANK_QUESTION_COUNTS = [10, 20, 30];

    public const QUIZ_QUESTION_COUNTS = [5, 10, 15, 20];

    public const LANGUAGES = ['en', 'fil'];

    public const DEFAULT_GENERATION_LANGUAGE = 'en';

    protected $fillable = [
        'training_content_id',
        'difficulty',
        'bank_question_count',
        'quiz_question_count',
        'generation_language',
        'is_enabled',
        'time_limit_minutes',
        'max_attempts',
        'passing_score',
        'shuffle_questions',
        'shuffle_answer_choices',
        'current_version_id',
        'published_version_id',
        'created_by',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'shuffle_questions' => 'boolean',
        'shuffle_answer_choices' => 'boolean',
        'bank_question_count' => 'integer',
        'quiz_question_count' => 'integer',
        'time_limit_minutes' => 'integer',
        'max_attempts' => 'integer',
        'passing_score' => 'integer',
    ];

    public function trainingContent(): BelongsTo
    {
        return $this->belongsTo(TrainingContent::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function currentVersion(): BelongsTo
    {
        return $this->belongsTo(LessonQuizVersion::class, 'current_version_id');
    }

    public function publishedVersion(): BelongsTo
    {
        return $this->belongsTo(LessonQuizVersion::class, 'published_version_id');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(LessonQuizVersion::class)->orderByDesc('version_number');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(LessonQuizAttempt::class);
    }

    public function generationJobs(): HasMany
    {
        return $this->hasMany(LessonQuizGenerationJob::class)->orderByDesc('created_at');
    }

    public function latestGenerationJob(): HasOne
    {
        return $this->hasOne(LessonQuizGenerationJob::class)->latestOfMany();
    }

    public function isReady(): bool
    {
        if (! $this->is_enabled) {
            return false;
        }

        $published = $this->publishedVersion;

        if ($published === null
            || $published->status !== LessonQuizVersion::STATUS_PUBLISHED
            || ! is_array($published->generated_questions)
            || count($published->generated_questions) === 0) {
            return false;
        }

        $workflow = app(\App\Services\LessonQuizWorkflowService::class);
        $sourceLocale = $published->generated_language ?? self::DEFAULT_GENERATION_LANGUAGE;

        return $workflow->isLanguagePublished($published, $sourceLocale);
    }

    /**
     * @return array<int, array<string, mixed>>|null
     */
    public function publishedQuestionBank(): ?array
    {
        $published = $this->publishedVersion;

        if (! $published || $published->status !== LessonQuizVersion::STATUS_PUBLISHED) {
            return null;
        }

        return $published->generated_questions ?? [];
    }
}
