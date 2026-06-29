<?php

namespace App\Http\Middleware;

use App\Support\PortalAuth;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckSessionInactivity
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! PortalAuth::check()) {
            return $next($request);
        }

        $timeoutMinutes = config('security.session_timeout_minutes', 10);
        $lastActivity = $request->session()->get('last_activity');

        if ($lastActivity && $timeoutMinutes > 0) {
            $limit = now()->subMinutes($timeoutMinutes)->timestamp;
            if ($lastActivity < $limit) {
                $activeGuard = PortalAuth::activeGuard();

                if ($activeGuard) {
                    PortalAuth::logoutGuard($activeGuard);
                } else {
                    PortalAuth::logoutAll();
                }

                if (! PortalAuth::check()) {
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();
                }

                if ($request->expectsJson()) {
                    return response()->json(['message' => 'Session expired due to inactivity.'], 401);
                }

                $loginRoute = $activeGuard === PortalAuth::PARTICIPANT_GUARD
                    ? 'participant.login'
                    : 'admin.login';

                return redirect()
                    ->route($loginRoute)
                    ->with('error', 'Session expired due to inactivity.');
            }
        }

        $response = $next($request);

        if (PortalAuth::check()) {
            $request->session()->put('last_activity', now()->timestamp);
        }

        return $response;
    }
}
