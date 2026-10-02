<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Authenticates inbound dashboard analytics API requests from partner systems.
 */
class VerifyPartnerDashboardApiKey
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('partner_dashboard.enabled')) {
            return response()->json([
                'success' => false,
                'message' => 'Dashboard partner API is disabled on this server.',
            ], 503);
        }

        $expectedKey = config('partner_dashboard.inbound.api_key');

        if (empty($expectedKey)) {
            return response()->json([
                'success' => false,
                'message' => 'Dashboard partner API is not configured on this server.',
            ], 503);
        }

        $header = config('partner_dashboard.inbound.header', 'X-Dashboard-Api-Key');
        $provided = $request->header($header) ?? $request->bearerToken();

        if (! $provided || ! hash_equals((string) $expectedKey, (string) $provided)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or missing API key.',
            ], 401);
        }

        return $next($request);
    }
}
