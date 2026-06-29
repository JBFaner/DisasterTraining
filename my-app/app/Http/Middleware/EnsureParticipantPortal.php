<?php

namespace App\Http\Middleware;

use App\Support\PortalAuth;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureParticipantPortal
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! Auth::guard(PortalAuth::PARTICIPANT_GUARD)->check()) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            return redirect()->route('participant.login');
        }

        $guard = PortalAuth::PARTICIPANT_GUARD;
        session([PortalAuth::SESSION_PORTAL_KEY => $guard]);
        Auth::shouldUse($guard);
        $request->setUserResolver(fn () => PortalAuth::participantUser());

        return $next($request);
    }
}
