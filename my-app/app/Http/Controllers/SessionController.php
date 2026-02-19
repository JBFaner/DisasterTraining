<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SessionController extends Controller
{
    /**
     * Update last activity timestamp. Call this when the frontend detects user activity.
     * Throttled by the frontend to avoid excessive requests.
     */
    public function activity(Request $request)
    {
        if (! Auth::check()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $user = Auth::user();
        $now = now();
        
        // Update session
        $request->session()->put('last_activity', $now->timestamp);
        
        // Update database (only update if more than 30 seconds have passed to reduce DB writes)
        // Check if last_activity column exists before trying to update
        if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'last_activity')) {
            try {
                $lastDbUpdate = $user->last_activity;
                if (!$lastDbUpdate || $now->diffInSeconds($lastDbUpdate) >= 30) {
                    $user->last_activity = $now;
                    $user->saveQuietly(); // Use saveQuietly to avoid triggering events
                }
            } catch (\Exception $e) {
                // Silently fail if column doesn't exist or update fails
                // Session tracking will still work
            }
        }

        return response()->noContent();
    }

    /**
     * Return session timeout config for the frontend (only when authenticated).
     */
    public function config(Request $request)
    {
        if (! Auth::check()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return response()->json([
            'session_timeout_minutes' => config('security.session_timeout_minutes', 10),
            'warning_before_logout_seconds' => config('security.warning_before_logout_seconds', 60),
        ]);
    }
}
