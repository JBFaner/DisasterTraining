<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Request;

class AuditLogger
{
    /**
     * Create an audit log entry.
     *
     * @param  array<string,mixed>  $attributes
     */
    public static function log(array $attributes): AuditLog
    {
        /** @var User|null $user */
        $user = $attributes['user'] ?? auth()->user();
        unset($attributes['user']);

        $request = request();

        return AuditLog::create([
            'user_id' => $user?->id,
            'user_name' => $user?->name,
            'user_role' => $user?->role,
            'action' => $attributes['action'] ?? 'Unknown action',
            'module' => $attributes['module'] ?? null,
            'status' => $attributes['status'] ?? 'success',
            'description' => $attributes['description'] ?? null,
            'ip_address' => $attributes['ip_address'] ?? $request?->ip(),
            'user_agent' => $attributes['user_agent'] ?? ($request?->userAgent() ?? null),
            'url' => $attributes['url'] ?? ($request?->fullUrl() ?? null),
            'metadata' => $attributes['metadata'] ?? null,
            'old_values' => $attributes['old_values'] ?? null,
            'new_values' => $attributes['new_values'] ?? null,
            'failure_reason' => $attributes['failure_reason'] ?? null,
            'performed_at' => $attributes['performed_at'] ?? now(),
        ]);
    }
}

