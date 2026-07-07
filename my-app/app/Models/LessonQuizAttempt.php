<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonQuizAttempt extends Model
{
    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_EXPIRED = 'expired';

    protected $fillable = [
        'user_id',
        'training_module_id',
        'training_content_id',
        'lesson_quiz_config_id',
        'attempt_number',
        'status',
        'current_question',
        'generated_questions',
        'question_order',
        'shuffled_choices',
        'participant_answers',
        'score',
        'percentage',
        'passed',
        'time_limit_minutes',
        'time_remaining_seconds',
        'display_language',
        'started_at',
        'expires_at',
        'last_activity_at',
        'completed_at',
        'submitted_at',
    ];

    protected $casts = [
        'generated_questions' => 'array',
        'question_order' => 'array',
        'shuffled_choices' => 'array',
        'participant_answers' => 'array',
        'passed' => 'boolean',
        'started_at' => 'datetime',
        'expires_at' => 'datetime',
        'last_activity_at' => 'datetime',
        'completed_at' => 'datetime',
        'submitted_at' => 'datetime',
        'percentage' => 'float',
        'attempt_number' => 'integer',
        'current_question' => 'integer',
        'score' => 'integer',
        'time_limit_minutes' => 'integer',
        'time_remaining_seconds' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function trainingModule(): BelongsTo
    {
        return $this->belongsTo(TrainingModule::class);
    }

    public function trainingContent(): BelongsTo
    {
        return $this->belongsTo(TrainingContent::class);
    }

    public function config(): BelongsTo
    {
        return $this->belongsTo(LessonQuizConfig::class, 'lesson_quiz_config_id');
    }

    public function isInProgress(): bool
    {
        return $this->status === self::STATUS_IN_PROGRESS;
    }

    public function isCompleted(): bool
    {
        return in_array($this->status, [self::STATUS_COMPLETED, self::STATUS_EXPIRED], true);
    }

    public function passingScore(): int
    {
        return (int) ($this->config?->passing_score ?? 75);
    }

    /**
     * @return array<string, mixed>
     */
    public function toParticipantArray(): array
    {
        return [
            'id' => $this->id,
            'training_module_id' => $this->training_module_id,
            'training_content_id' => $this->training_content_id,
            'status' => $this->status,
            'current_question' => $this->current_question,
            'generated_questions' => $this->generated_questions ?? [],
            'question_order' => $this->question_order ?? [],
            'shuffled_choices' => $this->shuffled_choices ?? [],
            'participant_answers' => $this->participant_answers ?? [],
            'score' => $this->score,
            'percentage' => $this->percentage,
            'passed' => $this->passed,
            'time_limit_minutes' => $this->time_limit_minutes,
            'time_remaining_seconds' => $this->time_remaining_seconds,
            'display_language' => $this->display_language,
            'started_at' => $this->started_at?->toIso8601String(),
            'expires_at' => $this->expires_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'passing_score' => $this->passingScore(),
            'lesson_title' => $this->trainingContent?->title,
        ];
    }
}
