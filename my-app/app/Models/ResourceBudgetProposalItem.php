<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResourceBudgetProposalItem extends Model
{
    protected $fillable = [
        'resource_budget_proposal_id',
        'item_name',
        'category',
        'quantity',
        'unit_cost',
        'total_cost',
        'notes',
        'resource_id',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
    ];

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(ResourceBudgetProposal::class, 'resource_budget_proposal_id');
    }

    public function resource(): BelongsTo
    {
        return $this->belongsTo(Resource::class);
    }
}
