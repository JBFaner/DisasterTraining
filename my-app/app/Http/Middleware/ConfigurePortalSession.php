<?php

namespace App\Http\Middleware;

use App\Support\PortalSession;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Select the portal-specific session cookie before Laravel starts the session.
 */
class ConfigurePortalSession
{
    public function handle(Request $request, Closure $next): Response
    {
        $portal = PortalSession::configureForRequest($request);
        $request->attributes->set(PortalSession::CONFIG_KEY, $portal);

        return $next($request);
    }
}
