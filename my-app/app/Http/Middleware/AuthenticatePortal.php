<?php

namespace App\Http\Middleware;

use App\Support\PortalAuth;
use App\Support\PortalSession;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Authenticate the request against the portal session selected for this request.
 */
class AuthenticatePortal
{
    public function handle(Request $request, Closure $next): Response
    {
        $guard = PortalSession::currentGuard();

        if (! Auth::guard($guard)->check()) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            $loginRoute = $guard === PortalAuth::PARTICIPANT_GUARD
                ? 'participant.login'
                : 'admin.login';

            return redirect()->guest(route($loginRoute));
        }

        Auth::shouldUse($guard);
        session([PortalAuth::SESSION_PORTAL_KEY => $guard]);

        return $next($request);
    }
}
