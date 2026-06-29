<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrainingProgressReset extends Model
{
    protected $fillable = [
        'participant_id',
        'training_module_id',
        'reset_by_user_id',
        'evaluation_result_id',
        'cycle_number',
        'reason',
        'reset_at',
        'is_active',
    ];

    protected $casts = [
        'cycle_number' => 'integer',
        'reset_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function participant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'participant_id');
    }

    public function trainingModule(): BelongsTo
    {
        return $this->belongsTo(TrainingModule::class);
    }

    public function resetBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reset_by_user_id');
    }

    public function evaluationResult(): BelongsTo
    {
        return $this->belongsTo(EvaluationResult::class);
    }
}
