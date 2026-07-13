<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SimulationExerciseActivityEquipment extends Model
{
    protected $table = 'simulation_exercise_activity_equipment';

    protected $fillable = [
        'template_id',
        'activity_id',
        'resource_id',
        'required_quantity',
        'sort_order',
    ];

    protected $casts = [
        'required_quantity' => 'integer',
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

    public function resource(): BelongsTo
    {
        return $this->belongsTo(Resource::class);
    }
}
