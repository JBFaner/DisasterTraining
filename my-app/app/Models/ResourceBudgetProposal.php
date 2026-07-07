<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ResourceBudgetProposal extends Model
{
    protected $fillable = [
        'reference_number',
        'title',
        'justification',
        'justification_source',
        'fund_source',
        'priority',
        'status',
        'total_estimated_cost',
        'resource_id',
        'simulation_event_id',
        'barangay_profile_id',
        'submitted_at',
        'reviewed_at',
        'review_notes',
        'created_by',
        'reviewed_by',
    ];

    protected $casts = [
        'total_estimated_cost' => 'decimal:2',
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(ResourceBudgetProposalItem::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function resource(): BelongsTo
    {
        return $this->belongsTo(Resource::class);
    }

    public function simulationEvent(): BelongsTo
    {
        return $this->belongsTo(SimulationEvent::class);
    }

    public function barangayProfile(): BelongsTo
    {
        return $this->belongsTo(BarangayProfile::class);
    }

    public function recalculateTotal(): void
    {
        $this->total_estimated_cost = $this->items()->sum('total_cost');
        $this->save();
    }
}
