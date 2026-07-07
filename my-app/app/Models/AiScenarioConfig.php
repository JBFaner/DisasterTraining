<?php

namespace App\Models;

use App\Services\AiScenarioLocaleService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class AiScenarioConfig extends Model
{
    public const DIFFICULTIES = ['easy', 'medium', 'hard'];

    public const QUESTION_COUNTS = [10, 15, 20];

    public const LANGUAGES = ['en', 'fil'];

    public const FAIL_POLICY_REQUIRE_LESSON_REVIEW = 'require_lesson_review';

    public const FAIL_POLICY_QUIZ_RETAKE_ONLY = 'quiz_retake_only';

    public const FAIL_POLICIES = [
        self::FAIL_POLICY_REQUIRE_LESSON_REVIEW,
        self::FAIL_POLICY_QUIZ_RETAKE_ONLY,
    ];

    protected $fillable = [
        'training_module_id',
        'difficulty',
        'number_of_questions',
        'generation_language',
        'is_enabled',
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
        'generated_at',
        'translated_at',
        'created_by',
        'time_limit_minutes',
        'max_attempts',
        'passing_score',
        'fail_retake_policy',
        'auto_submit_on_expire',
        'allow_resume_attempt',
        'shuffle_questions',
        'shuffle_answer_choices',
        'current_version_id',
        'published_version_id',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'auto_submit_on_expire' => 'boolean',
        'allow_resume_attempt' => 'boolean',
        'shuffle_questions' => 'boolean',
        'shuffle_answer_choices' => 'boolean',
        'generated_questions' => 'array',
        'generated_at' => 'datetime',
        'translated_at' => 'datetime',
        'number_of_questions' => 'integer',
        'time_limit_minutes' => 'integer',
        'max_attempts' => 'integer',
        'passing_score' => 'integer',
    ];

    public function trainingModule(): BelongsTo
    {
        return $this->belongsTo(TrainingModule::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(AiScenarioAttempt::class);
    }

    public function currentVersion(): BelongsTo
    {
        return $this->belongsTo(AiScenarioAssessmentVersion::class, 'current_version_id');
    }

    public function publishedVersion(): BelongsTo
    {
        return $this->belongsTo(AiScenarioAssessmentVersion::class, 'published_version_id');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(AiScenarioAssessmentVersion::class)->orderByDesc('version_number');
    }

    public function generationJobs(): HasMany
    {
        return $this->hasMany(AiScenarioGenerationJob::class)->orderByDesc('created_at');
    }

    public function latestGenerationJob(): HasOne
    {
        return $this->hasOne(AiScenarioGenerationJob::class)->latestOfMany();
    }

    public function isReady(): bool
    {
        if (! $this->is_enabled) {
            return false;
        }

        $published = $this->publishedVersion;
        if (! $published || $published->status !== AiScenarioAssessmentVersion::STATUS_PUBLISHED) {
            return false;
        }

        return app(AiScenarioLocaleService::class)->isReady($published->toContentSnapshot());
    }

    /**
     * @return array<string, mixed>|null
     */
    public function publishedContentSnapshot(): ?array
    {
        $published = $this->publishedVersion;

        if (! $published || $published->status !== AiScenarioAssessmentVersion::STATUS_PUBLISHED) {
            return null;
        }

        return $published->toContentSnapshot();
    }

    public function requiresLessonReviewOnFail(): bool
    {
        return ($this->fail_retake_policy ?? self::FAIL_POLICY_REQUIRE_LESSON_REVIEW)
            === self::FAIL_POLICY_REQUIRE_LESSON_REVIEW;
    }
}

