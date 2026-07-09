<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResourceMovement extends Model
{
    protected $fillable = [
        'resource_id',
        'simulation_event_id',
        'requested_by',
        'source_module',
        'quantity',
        'status',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function resource()
    {
        return $this->belongsTo(Resource::class);
    }

    public function simulationEvent()
    {
        return $this->belongsTo(SimulationEvent::class, 'simulation_event_id');
    }
}

