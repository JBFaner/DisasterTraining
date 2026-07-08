<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Services\DatabaseBackupService;

class CampaignRequest extends Model
{
    protected $fillable = [
        'training_module_id',
        'submitted_to',
        'proposed_session_label',
        'submitted_at',
        'status',
        'payload',
        'remarks',
        'submitted_by_id',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'payload' => 'array',
        'remarks' => 'array',
    ];

    public function trainingModule(): BelongsTo
    {
        return $this->belongsTo(TrainingModule::class, 'training_module_id');
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'submitted_by_id');
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

