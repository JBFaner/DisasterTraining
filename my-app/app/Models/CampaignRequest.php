<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Services\DatabaseBackupService;

class CampaignRequest extends Model
{
    protected $fillable = [
        'training_module_id',
        'simulation_event_id',
        'submitted_to',
        'proposed_session_label',
        'submitted_at',
        'approved_at',
        'status',
        'expected_participants',
        'minimum_qualified_participants',
        'session_index',
        'payload',
        'remarks',
        'submitted_by_id',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'payload' => 'array',
        'remarks' => 'array',
        'expected_participants' => 'integer',
        'minimum_qualified_participants' => 'integer',
        'session_index' => 'integer',
    ];

    public function trainingModule(): BelongsTo
    {
        return $this->belongsTo(TrainingModule::class, 'training_module_id');
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'submitted_by_id');
    }

    public function simulationEvent(): BelongsTo
    {
        return $this->belongsTo(SimulationEvent::class);
    }

    public function simulationPlan(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(SimulationPlan::class);
    }

    protected static function booted(): void
    {
        static::updated(function (CampaignRequest $request) {
            if ($request->wasChanged('status') && $request->status === 'approved') {
                app(DatabaseBackupService::class)->queueAfterCommit('campaign_request_approved');
            }
        });
    }
}

