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
            return redirect()->route('admin.login');
        }

        session([PortalAuth::SESSION_PORTAL_KEY => PortalAuth::ADMIN_GUARD]);
        Auth::shouldUse(PortalAuth::ADMIN_GUARD);
        $request->setUserResolver(fn () => PortalAuth::adminUser());

        return $next($request);
    }
}
