<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonQuizGenerationJob extends Model
{
    public const STATUS_QUEUED = 'queued';

    public const STATUS_PROCESSING = 'processing';

    public const STATUS_EXTRACTING = 'extracting_lesson_content';

    public const STATUS_GENERATING = 'generating_question_bank';

    public const STATUS_TRANSLATING = 'translating_questions';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_FAILED = 'failed';

    public const ACTIVE_STATUSES = [
        self::STATUS_QUEUED,
        self::STATUS_PROCESSING,
        self::STATUS_EXTRACTING,
        self::STATUS_GENERATING,
        self::STATUS_TRANSLATING,
    ];

    protected $fillable = [
        'lesson_quiz_config_id',
        'requested_by',
        'status',
        'auto_translate_fil',
        'error_message',
        'lesson_quiz_version_id',
        'started_at',
        'completed_at',
        'failed_at',
    ];

    protected $casts = [
        'auto_translate_fil' => 'boolean',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'failed_at' => 'datetime',
    ];

    public function config(): BelongsTo
    {
        return $this->belongsTo(LessonQuizConfig::class, 'lesson_quiz_config_id');
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function version(): BelongsTo
    {
        return $this->belongsTo(LessonQuizVersion::class, 'lesson_quiz_version_id');
    }

    public function isActive(): bool
    {
        return in_array($this->status, self::ACTIVE_STATUSES, true);
    }

    public function markStatus(string $status): void
    {
        $updates = ['status' => $status];

        if ($status === self::STATUS_PROCESSING && $this->started_at === null) {
            $updates['started_at'] = now();
        }

        $this->update($updates);
    }

    public function markCompleted(LessonQuizVersion $version): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'lesson_quiz_version_id' => $version->id,
            'completed_at' => now(),
            'error_message' => null,
        ]);
    }

    public function markFailed(string $message): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'error_message' => $message,
            'failed_at' => now(),
        ]);
    }

    public static function statusLabel(string $status): string
    {
        return match ($status) {
            self::STATUS_QUEUED => 'Queued',
            self::STATUS_PROCESSING => 'Processing',
            self::STATUS_EXTRACTING => 'Extracting Lesson Content',
            self::STATUS_GENERATING => 'Generating Question Bank',
            self::STATUS_TRANSLATING => 'Translating Questions',
            self::STATUS_COMPLETED => 'Completed',
            self::STATUS_FAILED => 'Failed',
            default => ucfirst(str_replace('_', ' ', $status)),
        };
    }
}
