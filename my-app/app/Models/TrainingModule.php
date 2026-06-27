<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainingModule extends Model
{
    use HasFactory;

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

    public function participantHasCompletedAllContents(int $userId): bool
    {
        $contentIds = $this->contentIds();

        if (empty($contentIds)) {
            return false;
        }

        $completedCount = LessonCompletion::query()
            ->where('user_id', $userId)
            ->where('training_module_id', $this->id)
            ->whereIn('training_content_id', $contentIds)
            ->count();

        return $completedCount >= count($contentIds);
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


