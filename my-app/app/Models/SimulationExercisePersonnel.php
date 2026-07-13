<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SimulationExercisePersonnel extends Model
{
    protected $table = 'simulation_exercise_personnel';

    protected $fillable = [
        'template_id',
        'role',
        'qualified_trainer_id',
        'recommended_count',
        'notes',
        'sort_order',
    ];

    protected $casts = [
        'recommended_count' => 'integer',
        'sort_order' => 'integer',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(SimulationExerciseTemplate::class, 'template_id');
    }

    public function qualifiedTrainer(): BelongsTo
    {
        return $this->belongsTo(QualifiedTrainer::class);
    }
}
