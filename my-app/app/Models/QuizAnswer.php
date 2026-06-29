<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizAnswer extends Model
{
    protected $fillable = [
        'ai_scenario_attempt_id',
        'question_id',
        'selected_answer',
        'is_correct',
        'answered_at',
    ];

    protected $casts = [
        'question_id' => 'integer',
        'is_correct' => 'boolean',
        'answered_at' => 'datetime',
    ];

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(AiScenarioAttempt::class, 'ai_scenario_attempt_id');
    }
}
