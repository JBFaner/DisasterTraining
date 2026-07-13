<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainingContent extends Model
{
    use HasFactory;

    protected $fillable = [
        'training_module_id',
        'title',
        'description',
        'learning_objectives',
        'sort_order',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'learning_objectives' => 'array',
    ];

    public function module()
    {
        return $this->belongsTo(TrainingModule::class, 'training_module_id');
    }

    public function resources()
    {
        return $this->hasMany(LessonResource::class)->orderBy('sort_order');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function lessonQuizConfig()
    {
        return $this->hasOne(LessonQuizConfig::class, 'training_content_id');
    }

    public function hasReadableAiContent(): bool
    {
        if ($this->relationLoaded('resources')) {
            return $this->resources->contains(fn (LessonResource $resource) => $resource->hasReadableAiContent());
        }

        return $this->resources()
            ->where('ai_processing_status', LessonResource::AI_STATUS_READY)
            ->whereNotNull('ai_processed_text')
            ->where('ai_processed_text', '!=', '')
            ->exists();
    }

    public function supportsAiQuestionGeneration(): bool
    {
        if ($this->relationLoaded('resources')) {
            return $this->resources->contains(fn (LessonResource $resource) => $resource->supportsAiQuestionGeneration());
        }

        return $this->resources()
            ->where('resource_type', LessonResource::TYPE_TEXT)
            ->exists();
    }
}
