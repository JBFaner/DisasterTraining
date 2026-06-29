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
            return redirect()->route('participant.login');
        }

        session([PortalAuth::SESSION_PORTAL_KEY => PortalAuth::PARTICIPANT_GUARD]);
        Auth::shouldUse(PortalAuth::PARTICIPANT_GUARD);
        $request->setUserResolver(fn () => PortalAuth::participantUser());

        return $next($request);
    }
}
