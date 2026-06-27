<?php

namespace App\Models;

use App\Services\AiScenarioLocaleService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AiScenarioConfig extends Model
{
    public const DIFFICULTIES = ['easy', 'medium', 'hard'];

    public const QUESTION_COUNTS = [10, 15, 20];

    public const LANGUAGES = ['en', 'fil'];

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
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'generated_questions' => 'array',
        'generated_at' => 'datetime',
        'translated_at' => 'datetime',
        'number_of_questions' => 'integer',
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

    public function isReady(): bool
    {
        if (! $this->is_enabled) {
            return false;
        }

        return app(AiScenarioLocaleService::class)->isReady($this);
    }
}
