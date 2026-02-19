<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to validate centralized login JWT tokens on protected routes
 * This ensures that tokens from the centralized login system are still valid
 */
class ValidateCentralizedToken
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only validate if user is authenticated via centralized login
        if (Auth::check() && session('centralized_login')) {
            $token = $request->session()->get('jwt_token');
            
            if ($token) {
                // Optionally re-validate token periodically (every 5 minutes)
                $lastValidation = $request->session()->get('last_token_validation', 0);
                $now = now()->timestamp;
                
                // Re-validate token every 5 minutes
                if ($now - $lastValidation > 300) {
                    $isValid = $this->validateToken($token);
                    
                    if (!$isValid) {
                        // Token invalid - logout and redirect to centralized login
                        Auth::logout();
                        $request->session()->invalidate();
                        $request->session()->regenerateToken();
                        
                        $loginUrl = config('services.centralized_login.url', 'https://login.alertaraqc.com');
                        return redirect($loginUrl)
                            ->with('error', 'Your session has expired. Please log in again.');
                    }
                    
                    // Update last validation time
                    $request->session()->put('last_token_validation', $now);
                }
            }
        }
        
        return $next($request);
    }
    
    /**
     * Validate JWT token with centralized login API
     */
    private function validateToken(string $token): bool
    {
        try {
            $apiEndpoint = config('services.centralized_login.api_endpoint', 'https://login.alertaraqc.com/api/auth/validate');
            
            $response = Http::timeout(5)
                ->withToken($token)
                ->get($apiEndpoint);
            
            if ($response->successful()) {
                $data = $response->json();
                return $data['authenticated'] ?? false;
            }
            
            return false;
        } catch (\Exception $e) {
            Log::error('Centralized token validation failed', [
                'error' => $e->getMessage(),
            ]);
            
            return false;
        }
    }
}
