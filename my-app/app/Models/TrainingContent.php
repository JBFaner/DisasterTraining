<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class TrainingContent extends Model
{
    use HasFactory;

    public const TYPE_TEXT = 'text';

    public const TYPE_PDF = 'pdf';

    public const TYPE_YOUTUBE = 'youtube';

    public const TYPE_VIDEO = 'video';

    public const TYPE_IMAGE = 'image';

    public const TYPES = [
        self::TYPE_TEXT,
        self::TYPE_PDF,
        self::TYPE_YOUTUBE,
        self::TYPE_VIDEO,
        self::TYPE_IMAGE,
    ];

    protected $fillable = [
        'training_module_id',
        'title',
        'content_type',
        'body',
        'file_path',
        'external_url',
        'sort_order',
    ];

    protected $appends = [
        'display_url',
    ];

    public function module()
    {
        return $this->belongsTo(TrainingModule::class, 'training_module_id');
    }

    public function getDisplayUrlAttribute(): ?string
    {
        if ($this->content_type === self::TYPE_YOUTUBE && $this->external_url) {
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

    public function isYouTube(): bool
    {
        return $this->content_type === self::TYPE_YOUTUBE;
    }
}
