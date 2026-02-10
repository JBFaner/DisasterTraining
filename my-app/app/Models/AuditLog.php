<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $fillable = [
        'user_id',
        'user_name',
        'user_role',
        'action',
        'module',
        'status',
        'description',
        'ip_address',
        'user_agent',
        'url',
        'metadata',
        'old_values',
        'new_values',
        'failure_reason',
        'performed_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'old_values' => 'array',
        'new_values' => 'array',
        'performed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

