<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Authenticates inbound API requests from the Resource Allocation module (external team/system).
 */
class VerifyResourceAllocationApiKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $expectedKey = config('resource_allocation.inbound.api_key');

        if (empty($expectedKey)) {
            return response()->json([
                'success' => false,
                'message' => 'Resource Allocation inbound API is not configured on this server.',
            ], 503);
        }

        $header = config('resource_allocation.inbound.header', 'X-Resource-Allocation-Api-Key');
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

