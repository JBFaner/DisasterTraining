<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SimulationExercisePersonnelAssignment extends Model
{
    protected $table = 'simulation_exercise_personnel_assignments';

    protected $fillable = [
        'template_id',
        'role',
        'source_group',
        'qualified_trainer_id',
        'person_name',
        'person_external_id',
        'notes',
        'sort_order',
    ];

    protected $casts = [
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
