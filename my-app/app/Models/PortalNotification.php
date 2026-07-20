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

    public const TYPE_REGISTRATION_APPROVED = 'registration_approved';

    public const TYPE_REGISTRATION_REJECTED = 'registration_rejected';

    public const TYPE_REGISTRATION_SUBMITTED = 'registration_submitted';

    public const TYPE_REGISTRATION_PENDING = 'registration_pending';

    public const TYPE_EVENT_CANCELLED = 'event_cancelled';

    public const TYPE_CERTIFICATE_ISSUED = 'certificate_issued';

    public const TYPE_CERTIFICATE_ELIGIBLE = 'certificate_eligible';

    public const TYPE_EVALUATION_RECORDED = 'evaluation_recorded';

    public const TYPE_ASSESSMENT_COMPLETED = 'assessment_completed';

    public const TYPE_ATTENDANCE_MARKED = 'attendance_marked';

    public const TYPE_CERTIFICATE_REVOKED = 'certificate_revoked';

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
