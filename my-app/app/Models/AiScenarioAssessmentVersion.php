<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AiScenarioAssessmentVersion extends Model
{
    public const STATUS_AI_GENERATED = 'ai_generated';

    public const STATUS_UNDER_REVIEW = 'under_review';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_PUBLISHED = 'published';

    public const STATUS_ARCHIVED = 'archived';

    public const QUESTION_STATUS_AI_GENERATED = 'ai_generated';

    public const QUESTION_STATUS_UNDER_REVIEW = 'under_review';

    public const QUESTION_STATUS_APPROVED = 'approved';

    public const QUESTION_STATUS_PUBLISHED = 'published';

    public const QUESTION_STATUS_ARCHIVED = 'archived';

    public const EDITABLE_STATUSES = [
        self::STATUS_AI_GENERATED,
        self::STATUS_UNDER_REVIEW,
        self::STATUS_APPROVED,
    ];

    protected $fillable = [
        'ai_scenario_config_id',
        'version_number',
        'status',
        'disaster_type',
        'difficulty',
        'estimated_time_minutes',
        'scenario_title',
        'title_en',
        'title_fil',
        'generated_scenario',
        'description_en',
        'description_fil',
        'learning_objectives_en',
        'learning_objectives_fil',
        'generated_questions',
        'generated_language',
        'change_note',
        'parent_version_id',
        'created_by',
        'approved_by',
        'approved_at',
        'published_at',
        'published_by',
        'last_edited_by',
        'last_edited_at',
    ];

    protected $casts = [
        'generated_questions' => 'array',
        'approved_at' => 'datetime',
        'published_at' => 'datetime',
        'last_edited_at' => 'datetime',
        'version_number' => 'integer',
        'estimated_time_minutes' => 'integer',
    ];

    public function config(): BelongsTo
    {
        return $this->belongsTo(AiScenarioConfig::class, 'ai_scenario_config_id');
    }

    public function parentVersion(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_version_id');
    }

    public function childVersions(): HasMany
    {
        return $this->hasMany(self::class, 'parent_version_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'published_by');
    }

    public function lastEditor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'last_edited_by');
    }

    public function isEditable(): bool
    {
        return in_array($this->status, self::EDITABLE_STATUSES, true);
    }

    public function isPublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED;
    }

    /**
     * @return array<string, mixed>
     */
    public function toContentSnapshot(): array
    {
        return [
            'scenario_title' => $this->scenario_title,
            'title_en' => $this->title_en,
            'title_fil' => $this->title_fil,
            'generated_scenario' => $this->generated_scenario,
            'description_en' => $this->description_en,
            'description_fil' => $this->description_fil,
            'learning_objectives_en' => $this->learning_objectives_en,
            'learning_objectives_fil' => $this->learning_objectives_fil,
            'generated_language' => $this->generated_language,
            'generated_questions' => $this->generated_questions ?? [],
            'difficulty' => $this->difficulty,
            'disaster_type' => $this->disaster_type,
        ];
    }
}
