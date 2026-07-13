<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SimulationExerciseActivity extends Model
{
    protected $fillable = [
        'template_id',
        'title',
        'description',
        'duration_minutes',
        'sort_order',
    ];

    protected $casts = [
        'duration_minutes' => 'integer',
        'sort_order' => 'integer',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(SimulationExerciseTemplate::class, 'template_id');
    }

    public function equipment(): HasMany
    {
        return $this->hasMany(SimulationExerciseActivityEquipment::class, 'activity_id')->orderBy('sort_order');
    }

    public function evaluationObjectives(): HasMany
    {
        return $this->hasMany(SimulationExerciseEvaluationObjective::class, 'activity_id')->orderBy('sort_order');
    }
}
