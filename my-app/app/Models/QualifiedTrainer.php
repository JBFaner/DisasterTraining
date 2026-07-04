<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QualifiedTrainer extends Model
{
    public const STATUS_ACTIVE = 'active';

    public const STATUS_INACTIVE = 'inactive';

    protected $fillable = [
        'group6_external_id',
        'name',
        'email',
        'phone',
        'specialization',
        'barangay',
        'certifications',
        'status',
        'qualified_at',
        'last_synced_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'certifications' => 'array',
            'metadata' => 'array',
            'qualified_at' => 'datetime',
            'last_synced_at' => 'datetime',
        ];
    }

    public function simulationEvents(): HasMany
    {
        return $this->hasMany(SimulationEvent::class, 'assigned_trainer_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }
}
