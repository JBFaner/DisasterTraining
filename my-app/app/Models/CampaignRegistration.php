<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CampaignRegistration extends Model
{
    public const STATUS_REGISTERED = 'registered';

    public const STATUS_CANCELLED = 'cancelled';

    public const ATTENDANCE_NOT_STARTED = 'not_started';

    public const EVALUATION_NOT_STARTED = 'not_started';

    public const CERTIFICATE_NOT_ISSUED = 'not_issued';

    protected $fillable = [
        'user_id',
        'campaign_request_id',
        'training_module_id',
        'registration_status',
        'registered_at',
        'attendance_status',
        'evaluation_status',
        'certificate_status',
    ];

    protected $casts = [
        'registered_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function campaignRequest(): BelongsTo
    {
        return $this->belongsTo(CampaignRequest::class);
    }

    public function trainingModule(): BelongsTo
    {
        return $this->belongsTo(TrainingModule::class);
    }
}
