<?php

namespace App\Http\Middleware;

use App\Support\PortalAuth;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminPortal
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! Auth::guard(PortalAuth::ADMIN_GUARD)->check()) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            return redirect()->route('admin.login');
        }

        $guard = PortalAuth::ADMIN_GUARD;
        session([PortalAuth::SESSION_PORTAL_KEY => $guard]);
        Auth::shouldUse($guard);
        $request->setUserResolver(fn () => PortalAuth::adminUser());

        return $next($request);
    }
}
