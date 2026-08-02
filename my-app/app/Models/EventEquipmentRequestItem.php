<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventEquipmentRequestItem extends Model
{
    protected $fillable = [
        'event_equipment_request_id',
        'resource_id',
        'quantity_requested',
        'quantity_approved',
        'status',
        'notes',
    ];

    protected $casts = [
        'quantity_requested' => 'integer',
        'quantity_approved' => 'integer',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(EventEquipmentRequest::class, 'event_equipment_request_id');
    }

    public function resource(): BelongsTo
    {
        return $this->belongsTo(Resource::class);
    }
}
