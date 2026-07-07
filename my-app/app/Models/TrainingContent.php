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
        'sort_order',
    ];

    public function module()
    {
        return $this->belongsTo(TrainingModule::class, 'training_module_id');
    }

    public function resources()
    {
        return $this->hasMany(LessonResource::class)->orderBy('sort_order');
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
            ->whereIn('resource_type', [
                LessonResource::TYPE_TEXT,
                LessonResource::TYPE_PDF,
                LessonResource::TYPE_IMAGE,
                LessonResource::TYPE_YOUTUBE,
            ])
            ->exists();
    }
}
