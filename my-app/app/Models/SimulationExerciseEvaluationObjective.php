<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SimulationExerciseEvaluationObjective extends Model
{
    protected $fillable = [
        'template_id',
        'activity_id',
        'heading',
        'objective_text',
        'sort_order',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(SimulationExerciseTemplate::class, 'template_id');
    }

    public function activity(): BelongsTo
    {
        return $this->belongsTo(SimulationExerciseActivity::class, 'activity_id');
    }
}
