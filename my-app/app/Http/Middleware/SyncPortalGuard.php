<?php

namespace App\Http\Middleware;

use App\Support\PortalAuth;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SyncPortalGuard
{
    public function handle(Request $request, Closure $next): Response
    {
        if (PortalAuth::check()) {
            PortalAuth::syncDefaultGuard();

            $request->setUserResolver(fn () => PortalAuth::user());
        }

        return $next($request);
    }
}
