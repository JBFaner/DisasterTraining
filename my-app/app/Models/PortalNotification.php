<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PortalNotification extends Model
{
    public const TYPE_QUIZ_GENERATED = 'quiz_generated';

    /** @deprecated Use TYPE_QUIZ_GENERATED */
    public const TYPE_LESSON_QUIZ_READY = 'lesson_quiz_generation_completed';

    public const TYPE_LESSON_QUIZ_FAILED = 'lesson_quiz_generation_failed';

    public const TYPE_LESSON_QUIZ_TRANSLATION = 'lesson_quiz_translation_completed';

    public const TYPE_AI_SCENARIO_GENERATED = 'ai_scenario_generated';

    public const TYPE_AI_SCENARIO_GENERATION_FAILED = 'ai_scenario_generation_failed';

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'body',
        'icon',
        'action_label',
        'action_url',
        'metadata',
        'read_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'read_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function markRead(): void
    {
        if ($this->read_at === null) {
            $this->update(['read_at' => now()]);
        }
    }
}
