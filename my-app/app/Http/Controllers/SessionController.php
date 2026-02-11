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

        $request->session()->put('last_activity', now()->timestamp);

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
