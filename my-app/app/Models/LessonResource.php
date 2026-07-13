<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class LessonResource extends Model
{
    use HasFactory;

    public const TYPE_TEXT = 'text';

    public const TYPE_PDF = 'pdf';

    public const TYPE_YOUTUBE = 'youtube';

    public const TYPE_IMAGE = 'image';

    public const TYPE_VIDEO = 'video';

    public const TYPES = [
        self::TYPE_TEXT,
        self::TYPE_PDF,
        self::TYPE_YOUTUBE,
        self::TYPE_IMAGE,
        self::TYPE_VIDEO,
    ];

    public const ADMIN_TYPES = [
        self::TYPE_TEXT,
        self::TYPE_PDF,
        self::TYPE_IMAGE,
        self::TYPE_YOUTUBE,
    ];

    public const AI_STATUS_PENDING = 'pending';

    public const AI_STATUS_PROCESSING = 'processing';

    public const AI_STATUS_READY = 'ready';

    public const AI_STATUS_FAILED = 'failed';

    public const AI_STATUS_NOT_APPLICABLE = 'not_applicable';

    protected $fillable = [
        'training_content_id',
        'title',
        'resource_type',
        'body',
        'file_path',
        'external_url',
        'sort_order',
        'ai_processed_text',
        'ai_processing_status',
        'ai_processing_error',
        'ai_processed_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'ai_processed_at' => 'datetime',
    ];

    protected $appends = [
        'display_url',
        'has_readable_content',
        'ai_processing_status_label',
    ];

    public function lesson()
    {
        return $this->belongsTo(TrainingContent::class, 'training_content_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function getDisplayUrlAttribute(): ?string
    {
        if ($this->resource_type === self::TYPE_YOUTUBE && $this->external_url) {
            return $this->external_url;
        }

        if (! $this->file_path) {
            return $this->external_url;
        }

        if (str_starts_with($this->file_path, 'http://') || str_starts_with($this->file_path, 'https://')) {
            return $this->file_path;
        }

        if (str_starts_with($this->file_path, '/storage/')) {
            return $this->file_path;
        }

        return Storage::url($this->file_path);
    }

    public function getHasReadableContentAttribute(): bool
    {
        return $this->hasReadableAiContent();
    }

    public function getAiProcessingStatusLabelAttribute(): string
    {
        return $this->aiProcessingStatusLabel();
    }

    public function supportsAiQuestionGeneration(): bool
    {
        return $this->resource_type === self::TYPE_TEXT;
    }

    public function hasReadableAiContent(): bool
    {
        return $this->ai_processing_status === self::AI_STATUS_READY
            && is_string($this->ai_processed_text)
            && trim($this->ai_processed_text) !== '';
    }

    public function aiProcessingStatusLabel(): string
    {
        return match ($this->resource_type) {
            self::TYPE_TEXT => match ($this->ai_processing_status) {
                self::AI_STATUS_READY => 'Ready',
                self::AI_STATUS_FAILED => 'Processing failed',
                self::AI_STATUS_PENDING, self::AI_STATUS_PROCESSING => 'Processing…',
                default => 'Pending',
            },
            self::TYPE_PDF => match ($this->ai_processing_status) {
                self::AI_STATUS_NOT_APPLICABLE => 'Supplementary PDF',
                default => 'Supplementary PDF',
            },
            self::TYPE_IMAGE => match ($this->ai_processing_status) {
                self::AI_STATUS_NOT_APPLICABLE => 'Supplementary image',
                default => 'Supplementary image',
            },
            self::TYPE_YOUTUBE => match ($this->ai_processing_status) {
                self::AI_STATUS_NOT_APPLICABLE => 'Reference video',
                default => 'Reference video',
            },
            default => match ($this->ai_processing_status) {
                self::AI_STATUS_NOT_APPLICABLE => 'Not supported for AI',
                default => 'Unavailable',
            },
        };
    }
}
