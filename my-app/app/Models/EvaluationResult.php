<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EvaluationResult extends Model
{
    public const STATUS_PASSED = 'passed';

    public const STATUS_NEEDS_IMPROVEMENT = 'needs_improvement';

    protected $fillable = [
        'participant_id',
        'training_module_id',
        'ai_scenario_attempt_id',
        'scenario_title',
        'difficulty',
        'score',
        'correct_answers',
        'wrong_answers',
        'total_questions',
        'percentage',
        'rating',
        'status',
        'knowledge_score',
        'decision_making_score',
        'emergency_response_score',
        'safety_awareness_score',
        'feedback',
        'recommendations',
        'generated_questions',
        'participant_answers',
        'eligible_for_simulation',
        'completed_at',
    ];

    protected $casts = [
        'recommendations' => 'array',
        'generated_questions' => 'array',
        'participant_answers' => 'array',
        'eligible_for_simulation' => 'boolean',
        'completed_at' => 'datetime',
        'percentage' => 'float',
        'rating' => 'integer',
        'score' => 'integer',
        'correct_answers' => 'integer',
        'wrong_answers' => 'integer',
        'total_questions' => 'integer',
        'knowledge_score' => 'integer',
        'decision_making_score' => 'integer',
        'emergency_response_score' => 'integer',
        'safety_awareness_score' => 'integer',
    ];

    protected $appends = [
        'status_label',
    ];

    public function participant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'participant_id');
    }

    public function trainingModule(): BelongsTo
    {
        return $this->belongsTo(TrainingModule::class);
    }

    public function aiScenarioAttempt(): BelongsTo
    {
        return $this->belongsTo(AiScenarioAttempt::class);
    }

    public function getStatusLabelAttribute(): string
    {
        return $this->status === self::STATUS_PASSED ? 'Passed' : 'Needs Improvement';
    }

    public function isPassed(): bool
    {
        return $this->status === self::STATUS_PASSED;
    }

    public function competencyScores(): array
    {
        return [
            'knowledge' => $this->knowledge_score,
            'decision_making' => $this->decision_making_score,
            'emergency_response' => $this->emergency_response_score,
            'safety_awareness' => $this->safety_awareness_score,
        ];
    }
}
