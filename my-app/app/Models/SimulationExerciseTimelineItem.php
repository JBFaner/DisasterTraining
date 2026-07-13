<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SimulationExerciseTimelineItem extends Model
{
    protected $fillable = [
        'template_id',
        'start_time',
        'label',
        'description',
        'activity_id',
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
