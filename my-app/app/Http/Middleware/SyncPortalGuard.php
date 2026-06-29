<?php

namespace App\Http\Middleware;

use App\Support\PortalAuth;
use App\Support\PortalSession;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class SyncPortalGuard
{
    public function handle(Request $request, Closure $next): Response
    {
        if (PortalAuth::check()) {
            PortalAuth::syncDefaultGuard();

            $guard = PortalSession::currentGuard();
            $request->setUserResolver(fn () => Auth::guard($guard)->user());
        }

        return $next($request);
    }
}
