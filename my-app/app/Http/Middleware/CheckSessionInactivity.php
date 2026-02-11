<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckSessionInactivity
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! Auth::check()) {
            return $next($request);
        }

        $timeoutMinutes = config('security.session_timeout_minutes', 10);
        $lastActivity = $request->session()->get('last_activity');

        if ($lastActivity && $timeoutMinutes > 0) {
            $limit = now()->subMinutes($timeoutMinutes)->timestamp;
            if ($lastActivity < $limit) {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
                if ($request->expectsJson()) {
                    return response()->json(['message' => 'Session expired due to inactivity.'], 401);
                }

                return redirect()
                    ->route('participant.login')
                    ->with('error', 'Session expired due to inactivity.');
            }
        }

        return $next($request);
    }
}
