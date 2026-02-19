<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CentralizedLoginController extends Controller
{
    /**
     * Handle incoming requests from centralized login system.
     * This is the entry point when users are redirected from login.alertaraqc.com
     */
    public function handle(Request $request)
    {
        // Get token from URL or session
        $token = $request->get('token') ?? $request->session()->get('jwt_token');

        if (!$token) {
            // No token - redirect to centralized login
            return redirect($this->getCentralizedLoginUrl());
        }

        // Store token in session for subsequent requests
        $request->session()->put('jwt_token', $token);

        // Validate token via API
        $response = $this->validateToken($token);

        if (!$response || !($response['authenticated'] ?? false)) {
            // Token invalid or expired - redirect to centralized login
            $request->session()->forget('jwt_token');
            return redirect($this->getCentralizedLoginUrl())
                ->with('error', 'Your session has expired. Please log in again.');
        }

        // Get user data from response
        $userData = $response['user'] ?? null;

        if (!$userData) {
            Log::error('Centralized login: User data missing from API response', ['response' => $response]);
            return redirect($this->getCentralizedLoginUrl())
                ->with('error', 'Unable to authenticate. Please try again.');
        }

        // Map centralized login user to local user
        $user = $this->syncUser($userData);

        if (!$user) {
            Log::error('Centralized login: Failed to sync user', ['user_data' => $userData]);
            return redirect($this->getCentralizedLoginUrl())
                ->with('error', 'Unable to access your account. Please contact support.');
        }

        // Log the user in
        Auth::login($user, false); // No remember token
        $request->session()->regenerate();
        $request->session()->put('last_activity', now()->timestamp);

        // Update last login
        $user->last_login = now();
        $user->save();

        // Log the authentication
        AuditLogger::log([
            'user' => $user,
            'action' => 'Logged in via centralized login',
            'module' => 'Auth',
            'status' => 'success',
            'description' => 'User authenticated via AlerTara Centralized Login System.',
        ]);

        // Redirect to dashboard (hide token from URL using JavaScript)
        $redirectUrl = url('/dashboard');
        return redirect($redirectUrl)->with('centralized_login_success', true);
    }

    /**
     * Validate JWT token with centralized login API
     */
    private function validateToken(string $token): ?array
    {
        try {
            $apiEndpoint = config('services.centralized_login.api_endpoint', 'https://login.alertaraqc.com/api/auth/validate');
            
            $response = Http::timeout(10)
                ->withToken($token)
                ->get($apiEndpoint);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning('Centralized login: API validation failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Centralized login: API request failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return null;
        }
    }

    /**
     * Sync centralized login user with local user database
     * Creates user if doesn't exist, updates if exists
     */
    private function syncUser(array $userData): ?User
    {
        try {
            $email = $userData['email'] ?? null;
            $role = $this->mapRole($userData['role'] ?? 'admin');
            $department = $userData['department'] ?? null;
            $departmentName = $userData['department_name'] ?? null;

            if (!$email) {
                Log::error('Centralized login: Email missing from user data', ['user_data' => $userData]);
                return null;
            }

            // Find or create user
            $user = User::where('email', $email)->first();

            if (!$user) {
                // Create new user from centralized login
                $user = User::create([
                    'name' => $this->extractNameFromEmail($email),
                    'email' => $email,
                    'password' => bcrypt(str()->random(32)), // Random password - not used for centralized login
                    'role' => $role,
                    'status' => 'active',
                    'email_verified_at' => now(), // Trust centralized login verification
                    'last_login' => now(),
                ]);

                Log::info('Centralized login: Created new user', [
                    'email' => $email,
                    'role' => $role,
                ]);
            } else {
                // Update existing user
                $user->role = $role;
                $user->status = 'active';
                $user->email_verified_at = $user->email_verified_at ?? now();
                $user->last_login = now();
                $user->save();

                Log::info('Centralized login: Updated existing user', [
                    'email' => $email,
                    'role' => $role,
                ]);
            }

            // Store centralized login metadata in session
            session([
                'centralized_login' => true,
                'centralized_department' => $department,
                'centralized_department_name' => $departmentName,
            ]);

            return $user;
        } catch (\Exception $e) {
            Log::error('Centralized login: Failed to sync user', [
                'error' => $e->getMessage(),
                'user_data' => $userData,
                'trace' => $e->getTraceAsString(),
            ]);

            return null;
        }
    }

    /**
     * Map centralized login role to local role
     */
    private function mapRole(string $centralizedRole): string
    {
        return match (strtolower($centralizedRole)) {
            'super_admin' => 'LGU_ADMIN', // Map super_admin to LGU_ADMIN (Admin has full access)
            'admin' => 'LGU_ADMIN',
            default => 'LGU_ADMIN', // Default to LGU_ADMIN
        };
    }

    /**
     * Extract name from email (fallback if name not provided)
     */
    private function extractNameFromEmail(string $email): string
    {
        $parts = explode('@', $email);
        $username = $parts[0] ?? 'User';
        return ucfirst(str_replace(['.', '_', '-'], ' ', $username));
    }

    /**
     * Get centralized login URL
     */
    private function getCentralizedLoginUrl(): string
    {
        return config('services.centralized_login.url', 'https://login.alertaraqc.com');
    }

    /**
     * Handle logout - redirect to centralized login logout
     */
    public function logout(Request $request)
    {
        $user = Auth::user();

        if ($user) {
            AuditLogger::log([
                'user' => $user,
                'action' => 'Logged out from centralized login',
                'module' => 'Auth',
                'status' => 'success',
                'description' => 'User logged out via centralized login system.',
            ]);
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Redirect to centralized login logout
        $logoutUrl = $this->getCentralizedLoginUrl() . '/logout';
        return redirect($logoutUrl);
    }
}
