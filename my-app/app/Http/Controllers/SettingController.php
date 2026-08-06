<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Services\AuditLogger;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Get current auto-approval setting
     */
    public function getAutoApproval()
    {
        $enabled = Setting::get('event_auto_approval_enabled', false);
        return response()->json(['enabled' => $enabled]);
    }

    /**
     * Toggle auto-approval setting
     */
    public function toggleAutoApproval(Request $request)
    {
        $enabled = $request->boolean('enabled');
        
        Setting::set('event_auto_approval_enabled', $enabled ? '1' : '0', 'boolean');

        AuditLogger::log([
            'action' => 'Updated auto-approval setting',
            'module' => 'Settings',
            'status' => 'success',
            'description' => $enabled
                ? 'Enabled auto-approval for all events'
                : 'Disabled auto-approval (manual approval required)',
            'new_values' => ['event_auto_approval_enabled' => $enabled],
        ]);
        
        return response()->json([
            'success' => true,
            'enabled' => $enabled,
            'message' => $enabled 
                ? 'Auto-approval enabled for all events' 
                : 'Manual approval required for all events'
        ]);
    }

    /**
     * Get demo tools (Meet Quota / Test Start) enabled flag.
     */
    public function getDemoTools()
    {
        return response()->json([
            'enabled' => (bool) Setting::get('demo_tools_enabled', true),
        ]);
    }

    /**
     * Toggle demo tools — Admin only.
     */
    public function toggleDemoTools(Request $request)
    {
        $user = portal_user();
        if (! $user || ! in_array($user->role, ['LGU_ADMIN', 'SUPER_ADMIN'], true)) {
            abort(403, 'Only admins can enable or disable demo tools.');
        }

        $enabled = $request->boolean('enabled');

        Setting::set('demo_tools_enabled', $enabled ? '1' : '0', 'boolean');

        AuditLogger::log([
            'action' => 'Updated demo tools setting',
            'module' => 'Settings',
            'status' => 'success',
            'description' => $enabled
                ? 'Enabled presentation demo tools (Meet Quota / Test Start)'
                : 'Disabled presentation demo tools',
            'new_values' => ['demo_tools_enabled' => $enabled],
        ]);

        return response()->json([
            'success' => true,
            'enabled' => $enabled,
            'message' => $enabled
                ? 'Demo tools enabled'
                : 'Demo tools disabled',
        ]);
    }
}
