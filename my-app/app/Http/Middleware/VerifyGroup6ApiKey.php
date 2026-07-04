<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Authenticates inbound API requests from Group 6 (Campaign Planning & Scheduling).
 */
class VerifyGroup6ApiKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $expectedKey = config('group6.inbound.api_key');

        if (empty($expectedKey)) {
            return response()->json([
                'success' => false,
                'message' => 'Group 6 inbound API is not configured on this server.',
            ], 503);
        }

        $header = config('group6.inbound.header', 'X-Group6-Api-Key');
        $provided = $request->header($header) ?? $request->bearerToken();

        if (! $provided || ! hash_equals($expectedKey, $provided)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or missing API key.',
            ], 401);
        }

        return $next($request);
    }
}
