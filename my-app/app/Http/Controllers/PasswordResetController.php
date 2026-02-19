<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules\Password as PasswordRule;

class PasswordResetController extends Controller
{
    /**
     * Show the password reset request form
     */
    public function showRequestForm()
    {
        return view('auth.password-request');
    }

    /**
     * Handle password reset request
     */
    public function sendResetLink(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
        ], [
            'email.exists' => 'We could not find a user with that email address.',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return back()
                ->withInput($request->only('email'))
                ->withErrors(['email' => 'We could not find a user with that email address.']);
        }

        // Generate reset token
        $token = Str::random(64);
        
        // Delete any existing tokens for this email
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();
        
        // Store new token
        DB::table('password_reset_tokens')->insert([
            'email' => $request->email,
            'token' => Hash::make($token),
            'created_at' => now(),
        ]);

        // Send reset email
        try {
            $resetUrl = url("/password/reset/{$token}?email=" . urlencode($request->email));
            
            Mail::send('emails.password-reset', [
                'user' => $user,
                'resetUrl' => $resetUrl,
                'token' => $token,
            ], function ($message) use ($user) {
                $message->to($user->email)
                    ->subject('Reset Your Password - LGU Training Portal');
            });

            AuditLogger::log([
                'user' => $user,
                'action' => 'Password reset requested',
                'module' => 'Auth',
                'status' => 'success',
                'description' => 'User requested password reset via email.',
            ]);

            return back()->with('status', 'We have emailed your password reset link!');
        } catch (\Exception $e) {
            \Log::error('Failed to send password reset email: ' . $e->getMessage());

            return back()
                ->withInput($request->only('email'))
                ->withErrors(['email' => 'Unable to send reset email. Please try again later.']);
        }
    }

    /**
     * Show the password reset form
     */
    public function showResetForm(Request $request, $token)
    {
        $email = $request->query('email');

        if (!$email) {
            return redirect()->route('password.request')
                ->withErrors(['email' => 'Email address is required.']);
        }

        // Verify token
        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->first();

        if (!$resetRecord || !Hash::check($token, $resetRecord->token)) {
            return redirect()->route('password.request')
                ->withErrors(['email' => 'This password reset link is invalid or has expired.']);
        }

        // Check if token expired (60 minutes)
        $expiresAt = now()->subMinutes(60);
        if ($resetRecord->created_at < $expiresAt) {
            DB::table('password_reset_tokens')->where('email', $email)->delete();
            return redirect()->route('password.request')
                ->withErrors(['email' => 'This password reset link has expired. Please request a new one.']);
        }

        return view('auth.password-reset', [
            'token' => $token,
            'email' => $email,
        ]);
    }

    /**
     * Handle password reset
     */
    public function reset(Request $request)
    {
        $request->validate([
            'token' => ['required'],
            'email' => ['required', 'email', 'exists:users,email'],
            'password' => [
                'required',
                'confirmed',
                'min:8',
                PasswordRule::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
            ],
        ], [
            'password.min' => 'The password must be at least 8 characters.',
            'password.mixed' => 'The password must contain both uppercase and lowercase letters.',
            'password.numbers' => 'The password must contain at least one number.',
            'password.symbols' => 'The password must contain at least one special character.',
            'password.confirmed' => 'The password confirmation does not match.',
            'password.uncompromised' => 'This password has been found in a data breach. Please choose a different password.',
        ]);

        // Verify token
        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$resetRecord || !Hash::check($request->token, $resetRecord->token)) {
            return back()
                ->withInput($request->only('email'))
                ->withErrors(['email' => 'This password reset link is invalid or has expired.']);
        }

        // Check if token expired
        $expiresAt = now()->subMinutes(60);
        if ($resetRecord->created_at < $expiresAt) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return back()
                ->withInput($request->only('email'))
                ->withErrors(['email' => 'This password reset link has expired. Please request a new one.']);
        }

        // Update user password
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return back()
                ->withInput($request->only('email'))
                ->withErrors(['email' => 'User not found.']);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        // Delete used token
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        AuditLogger::log([
            'user' => $user,
            'action' => 'Password reset completed',
            'module' => 'Auth',
            'status' => 'success',
            'description' => 'User successfully reset their password.',
        ]);

        // Clear any login attempt locks for this user
        $loginAttempts = app(\App\Services\LoginAttemptService::class);
        $loginAttempts->clearAttempts($user->email, $request->ip());

        return redirect()->route('admin.login')
            ->with('status', 'Your password has been reset successfully! You can now log in with your new password.');
    }

    /**
     * Get failed login attempt count for an email
     */
    public function getFailedAttemptCount(string $email): int
    {
        $attemptsKey = 'login_attempts:email:' . $email;
        return (int) \Illuminate\Support\Facades\Cache::get($attemptsKey, 0);
    }
}
