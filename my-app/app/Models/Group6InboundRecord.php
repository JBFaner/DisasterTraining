<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Staged payload received from Group 6's external system.
 *
 * Data is stored here until Group6DataConsumer processes it once the API contract is finalized.
 */
class Group6InboundRecord extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_PROCESSED = 'processed';

    public const STATUS_FAILED = 'failed';

    public const TYPE_PARTICIPANTS = 'participants';

    public const TYPE_TRAINERS = 'trainers';

    protected $fillable = [
        'record_type',
        'external_id',
        'payload',
        'status',
        'error_message',
        'received_at',
        'processed_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'received_at' => 'datetime',
            'processed_at' => 'datetime',
        ];
    }
}
