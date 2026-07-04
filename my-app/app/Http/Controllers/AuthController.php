<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Mail\ParticipantVerificationEmail;
use App\Mail\AdminLoginOtpEmail;
use App\Services\SmsService;
use App\Services\AuditLogger;
use App\Services\LoginAttemptService;
use App\Support\PortalAuth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function showLogin(Request $request)
    {
        $request->session()->regenerateToken();

        $email = $request->old('email', '');
        $failedAttempts = 0;
        
        if ($email) {
            $failedAttempts = (int) \Illuminate\Support\Facades\Cache::get('login_attempts:email:' . $email, 0);
        }
        
        return view('auth.admin-login', [
            'failedAttempts' => $failedAttempts,
        ]);
    }

    public function login(Request $request, LoginAttemptService $loginAttempts)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $email = $credentials['email'];
        $ip = $request->ip() ?? '0.0.0.0';

        $lockout = $loginAttempts->isLockedOut($email, $ip);
        if ($lockout !== null) {
            $seconds = $lockout['retry_after_seconds'];
            return back()
                ->withErrors([
                    'email' => "Too many failed login attempts. Please wait {$seconds} seconds before trying again.",
                ])
                ->with('lockout_retry_after', $seconds)
                ->onlyInput('email');
        }

        /** @var \App\Models\User|null $user */
        $user = User::where('email', $email)->first();

        // Only allow admin/trainer roles through admin login
        if (! $user || ! in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true)) {
            if ($user) {
                AuditLogger::log([
                    'user' => $user,
                    'action' => 'Failed login',
                    'module' => 'Auth',
                    'status' => 'failed',
                    'description' => 'Non-admin user attempted to log in through admin login.',
                ]);
            }

            $result = $loginAttempts->recordFailedAttempt($email, $ip);
            $retryAfter = $result['retry_after_seconds'];

            if ($retryAfter > 0) {
                return back()
                    ->withErrors([
                        'email' => "Too many failed login attempts. Please wait {$retryAfter} seconds before trying again.",
                    ])
                    ->with('lockout_retry_after', $retryAfter)
                    ->onlyInput('email');
            }

            return back()
                ->withErrors(['email' => 'The provided credentials do not match our records.'])
                ->onlyInput('email');
        }

        if (! Hash::check($credentials['password'], $user->password)) {
            AuditLogger::log([
                'user' => $user,
                'action' => 'Failed login',
                'module' => 'Auth',
                'status' => 'failed',
                'description' => 'Invalid credentials for admin/trainer login.',
            ]);

            $result = $loginAttempts->recordFailedAttempt($email, $ip);
            $retryAfter = $result['retry_after_seconds'];

            if ($retryAfter > 0) {
                return back()
                    ->withErrors([
                        'email' => "Too many failed login attempts. Please wait {$retryAfter} seconds before trying again.",
                    ])
                    ->with('lockout_retry_after', $retryAfter)
                    ->onlyInput('email');
            }

            return back()
                ->withErrors(['email' => 'The provided credentials do not match our records.'])
                ->onlyInput('email');
        }

        $loginAttempts->clearAttempts($email, $ip);

        // Admin / Trainer login flow - send email OTP after password verification
        if ($user->status !== 'active' || ! $user->email_verified_at) {
            $statusMessage = match($user->status) {
                'disabled' => 'Your account has been disabled. Please contact an administrator.',
                default => ! $user->email_verified_at 
                    ? 'Your admin account is not fully verified yet. Please complete email verification or contact an existing administrator.'
                    : 'Your account is not active. Please contact an administrator.',
            };
            
            AuditLogger::log([
                'user' => $user,
                'action' => 'Failed login',
                'module' => 'Auth',
                'status' => 'failed',
                'description' => "Admin/trainer attempted login. Status: {$user->status}, Verified: " . ($user->email_verified_at ? 'Yes' : 'No'),
            ]);

            return back()
                ->withErrors([
                    'email' => $statusMessage,
                ])
                ->onlyInput('email');
        }

        AuditLogger::log([
            'user' => $user,
            'action' => 'Password verified',
            'module' => 'Auth',
            'status' => 'success',
            'description' => 'Admin/trainer password verified, sending email OTP.',
        ]);

        return $this->sendAdminLoginOtp($request, $user);
    }

    public function showRegister()
    {
        abort(404);
    }

    public function register(Request $request)
    {
        abort(404);
    }

    public function showParticipantLogin(Request $request)
    {
        $request->session()->regenerateToken();

        $email = $request->old('email', '');
        $failedAttempts = 0;
        
        if ($email) {
            $failedAttempts = (int) \Illuminate\Support\Facades\Cache::get('login_attempts:email:' . $email, 0);
        }
        
        return view('auth.participant-login', [
            'failedAttempts' => $failedAttempts,
        ]);
    }

    public function participantLogin(Request $request, LoginAttemptService $loginAttempts)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $email = $credentials['email'];
        $ip = $request->ip() ?? '0.0.0.0';

        $lockout = $loginAttempts->isLockedOut($email, $ip);
        if ($lockout !== null) {
            $seconds = $lockout['retry_after_seconds'];
            return back()
                ->withErrors([
                    'email' => "Too many failed login attempts. Please wait {$seconds} seconds before trying again.",
                ])
                ->with('lockout_retry_after', $seconds)
                ->onlyInput('email');
        }

        /** @var \App\Models\User|null $user */
        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            $result = $loginAttempts->recordFailedAttempt($email, $ip);
            $retryAfter = $result['retry_after_seconds'];

            if ($retryAfter > 0) {
                return back()
                    ->withErrors([
                        'email' => "Too many failed login attempts. Please wait {$retryAfter} seconds before trying again.",
                    ])
                    ->with('lockout_retry_after', $retryAfter)
                    ->onlyInput('email');
            }

            return back()
                ->withErrors(['email' => 'The provided credentials do not match our records.'])
                ->onlyInput('email');
        }

        // Only allow participants through participant login
        if ($user->role !== 'PARTICIPANT') {
            AuditLogger::log([
                'user' => $user,
                'action' => 'Failed login',
                'module' => 'Auth',
                'status' => 'failed',
                'description' => 'Non-participant user attempted to log in through participant login.',
            ]);

            $result = $loginAttempts->recordFailedAttempt($email, $ip);
            $retryAfter = $result['retry_after_seconds'];

            if ($retryAfter > 0) {
                return back()
                    ->withErrors([
                        'email' => "Too many failed login attempts. Please wait {$retryAfter} seconds before trying again.",
                    ])
                    ->with('lockout_retry_after', $retryAfter)
                    ->onlyInput('email');
            }

            return back()
                ->withErrors(['email' => 'The provided credentials do not match our records.'])
                ->onlyInput('email');
        }

        $loginAttempts->clearAttempts($email, $ip);

        // Participant login flow (no OTP, no remember token)
        if ($user->status === 'inactive') {
            AuditLogger::log([
                'user' => $user,
                'action' => 'Failed login',
                'module' => 'Auth',
                'status' => 'failed',
                'description' => 'Inactive participant attempted to log in.',
            ]);

            return back()
                ->withErrors(['email' => 'Your account has been deactivated. Please contact an administrator.'])
                ->onlyInput('email');
        }

        PortalAuth::login($user, false);
        $request->session()->regenerate();
        $request->session()->put('last_activity', now()->timestamp);

        $user->last_login = now();
        $user->save();

        AuditLogger::log([
            'user' => $user,
            'action' => 'Logged in',
            'module' => 'Auth',
            'status' => 'success',
            'description' => 'Participant logged in.',
        ]);

        return redirect()->intended('/dashboard');
    }

    public function showParticipantRegister()
    {
        return view('auth.participant-register');
    }

    /**
     * Step 1: Start registration - validate and store data in session, generate verification code
     */
    public function participantRegisterStart(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'nullable',
                'email',
                'max:255',
                'unique:users,email',
                'required_without:phone',
            ],
            'phone' => [
                'nullable',
                'string',
                'max:255',
                'unique:users,phone',
                'required_without:email',
            ],
            'street' => [
                'nullable',
                'string',
                'max:255',
            ],
            'philippine_barangay_id' => ['required', 'integer', 'exists:philippine_barangays,id'],
            'region' => ['required', 'string', 'max:255'],
            'province' => ['required', 'string', 'max:255'],
            'municipality_city' => ['required', 'string', 'max:255'],
            'barangay_name' => ['required', 'string', 'max:255'],
            'password' => ['required', 'confirmed', 'min:8'],
        ], [
            'email.required_without' => 'Please provide either an email or phone number.',
            'phone.required_without' => 'Please provide either an email or phone number.',
            'email.unique' => 'This email is already registered. Please log in or use a different one.',
            'phone.unique' => 'This phone number is already registered. Please log in or use a different one.',
        ]);

        // Check if email or phone already exists with friendly message
        if (isset($data['email']) && User::where('email', $data['email'])->exists()) {
            return back()
                ->withErrors(['email' => 'This email is already registered. Please log in or use a different one.'])
                ->withInput();
        }

        if (isset($data['phone']) && User::where('phone', $data['phone'])->exists()) {
            return back()
                ->withErrors(['phone' => 'This phone number is already registered. Please log in or use a different one.'])
                ->withInput();
        }

        // Determine verification method
        $verificationMethod = isset($data['email']) ? 'email' : 'phone';
        $verificationCode = null;

        // Generate 6-digit verification code for both email and phone
        $verificationCode = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);

        if ($verificationMethod === 'phone') {
            // Send OTP via SMS
            try {
                $smsService = new SmsService();
                $smsService->sendOtp($data['phone'], $verificationCode);
            } catch (\Exception $e) {
                \Log::error("Failed to send SMS OTP: " . $e->getMessage());
                // Still continue - OTP is logged as fallback
                \Log::info("OTP for {$data['phone']}: {$verificationCode}");
            }
        } else {
            // Send verification code via email
            try {
                Mail::to($data['email'])->send(
                    new ParticipantVerificationEmail($verificationCode, $data['name'])
                );
            } catch (\Exception $e) {
                \Log::error("Failed to send verification email: " . $e->getMessage());

                return back()
                    ->withErrors(['email' => 'We could not send the verification email. Please try again later.'])
                    ->withInput();
            }
        }

        // Store registration data in session
        $request->session()->put('participant_registration', [
            'name' => $data['name'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'philippine_barangay_id' => $data['philippine_barangay_id'],
            'region' => $data['region'],
            'province' => $data['province'],
            'city' => $data['municipality_city'],
            'municipality_city' => $data['municipality_city'],
            'barangay' => $data['barangay_name'],
            'barangay_name' => $data['barangay_name'],
            'street' => $data['street'] ?? null,
            'password' => $data['password'],
            'verification_method' => $verificationMethod,
            'verification_code' => $verificationCode,
            'expires_at' => now()->addMinutes(15),
        ]);

        return redirect()->route('participant.register.verify')
            ->with('verification_method', $verificationMethod)
            ->with('contact', $verificationMethod === 'email' ? $data['email'] : $data['phone']);
    }

    /**
     * Show verification page
     */
    public function showParticipantRegisterVerify()
    {
        $registrationData = session('participant_registration');
        
        if (!$registrationData) {
            return redirect()->route('participant.register')
                ->withErrors(['form' => 'Registration session expired. Please start again.']);
        }

        $verificationMethod = $registrationData['verification_method'] ?? 'email';
        $contact = $verificationMethod === 'email' 
            ? $registrationData['email'] 
            : $registrationData['phone'];

        return view('auth.participant-register-verify', [
            'verification_method' => $verificationMethod,
            'contact' => $contact,
            'status' => session('status'),
        ]);
    }

    /**
     * Resend the participant registration verification code.
     */
    public function participantRegisterResend(Request $request)
    {
        $registrationData = $request->session()->get('participant_registration');

        if (! $registrationData) {
            return redirect()->route('participant.register')
                ->withErrors(['form' => 'Registration session expired. Please start again.']);
        }

        $lastResend = (int) $request->session()->get('participant_register_last_resend_at', 0);
        if (now()->getTimestamp() - $lastResend < 60) {
            $verificationMethod = $registrationData['verification_method'] ?? 'email';
            $contact = $verificationMethod === 'email'
                ? $registrationData['email']
                : $registrationData['phone'];

            return back()
                ->withErrors(['otp' => 'Please wait at least 60 seconds before requesting a new code.'])
                ->with('verification_method', $verificationMethod)
                ->with('contact', $contact);
        }

        $verificationMethod = $registrationData['verification_method'] ?? 'email';
        $verificationCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $registrationData['verification_code'] = $verificationCode;
        $registrationData['expires_at'] = now()->addMinutes(15);
        $request->session()->put('participant_registration', $registrationData);
        $request->session()->put('participant_register_last_resend_at', now()->getTimestamp());

        $contact = $verificationMethod === 'email'
            ? $registrationData['email']
            : $registrationData['phone'];

        if ($verificationMethod === 'phone') {
            try {
                $smsService = new SmsService();
                $smsService->sendOtp($registrationData['phone'], $verificationCode);
            } catch (\Exception $e) {
                \Log::error('Failed to resend SMS OTP: ' . $e->getMessage());

                return back()
                    ->withErrors(['otp' => 'Unable to resend verification code. Please try again later.'])
                    ->with('verification_method', $verificationMethod)
                    ->with('contact', $contact);
            }
        } else {
            try {
                Mail::to($registrationData['email'])->send(
                    new ParticipantVerificationEmail($verificationCode, $registrationData['name'])
                );
            } catch (\Exception $e) {
                \Log::error('Failed to resend verification email: ' . $e->getMessage());

                return back()
                    ->withErrors(['otp' => 'Unable to resend verification email. Please try again later.'])
                    ->with('verification_method', $verificationMethod)
                    ->with('contact', $contact);
            }
        }

        return back()
            ->with('status', 'A new verification code has been sent.')
            ->with('verification_method', $verificationMethod)
            ->with('contact', $contact);
    }

    /**
     * Step 2: Verify and complete registration
     */
    public function participantRegisterVerify(Request $request)
    {
        $registrationData = $request->session()->get('participant_registration');

        if (!$registrationData) {
            return redirect()->route('participant.register')
                ->withErrors(['form' => 'Registration session expired. Please start again.']);
        }

        // Check expiry
        if (now()->isAfter($registrationData['expires_at'])) {
            $request->session()->forget('participant_registration');
            return redirect()->route('participant.register')
                ->withErrors(['form' => 'Verification code expired. Please start registration again.']);
        }

        $verificationMethod = $registrationData['verification_method'];

        // Validate verification code (same for both email and phone)
        $request->validate([
            'otp' => ['required', 'string', 'size:6'],
        ], [
            'otp.required' => 'Please enter the verification code.',
            'otp.size' => 'Verification code must be 6 digits.',
        ]);

        if ($request->otp !== $registrationData['verification_code']) {
            $contact = $verificationMethod === 'email' 
                ? $registrationData['email'] 
                : $registrationData['phone'];
            
            return back()
                ->withErrors(['otp' => 'Invalid verification code. Please try again.'])
                ->with('verification_method', $verificationMethod)
                ->with('contact', $contact);
        }

        // All verified - create the user
        $participantId = $this->generateParticipantId();
        $hazardProfile = \App\Models\BarangayProfile::where(
            'philippine_barangay_id',
            $registrationData['philippine_barangay_id'] ?? null,
        )->first();

        $user = User::create([
            'name' => $registrationData['name'],
            'email' => $registrationData['email'],
            'phone' => $registrationData['phone'],
            'philippine_barangay_id' => $registrationData['philippine_barangay_id'] ?? null,
            'barangay_id' => $hazardProfile?->id,
            'province' => $registrationData['province'] ?? null,
            'city' => $registrationData['city'] ?? $registrationData['municipality_city'] ?? null,
            'barangay' => $registrationData['barangay'] ?? $registrationData['barangay_name'] ?? null,
            'street' => $registrationData['street'] ?? null,
            'password' => $registrationData['password'],
            'role' => 'PARTICIPANT',
            'participant_id' => $participantId,
            'status' => 'active',
            'registered_at' => now(),
        ]);

        if ($verificationMethod === 'email' && ! empty($registrationData['email'])) {
            $user->email_verified_at = now();
        }
        if ($verificationMethod === 'phone' && ! empty($registrationData['phone'])) {
            $user->phone_verified_at = now();
        }
        if ($user->isDirty(['email_verified_at', 'phone_verified_at'])) {
            $user->save();
        }

        // Clear session
        $request->session()->forget('participant_registration');

        PortalAuth::login($user);
        $request->session()->put('last_activity', now()->timestamp);

        return redirect('/dashboard')
            ->with('status', 'Registration successful! Welcome to the training platform.');
    }

    /**
     * Handle email verification via link (GET request)
     */
    public function participantRegisterVerifyEmail(Request $request, $token)
    {
        $registrationData = $request->session()->get('participant_registration');

        if (!$registrationData) {
            return redirect()->route('participant.register')
                ->withErrors(['form' => 'Registration session expired. Please start again.']);
        }

        // Check expiry
        if (now()->isAfter($registrationData['expires_at'])) {
            $request->session()->forget('participant_registration');
            return redirect()->route('participant.register')
                ->withErrors(['form' => 'Verification link expired. Please start registration again.']);
        }

        if ($registrationData['verification_method'] !== 'email') {
            return redirect()->route('participant.register.verify')
                ->withErrors(['form' => 'Invalid verification method.']);
        }

        if ($token !== $registrationData['verification_token']) {
            return redirect()->route('participant.register.verify')
                ->withErrors(['token' => 'Invalid verification link.'])
                ->with('verification_method', 'email')
                ->with('contact', $registrationData['email']);
        }

        // Token is valid - complete registration
        $participantId = $this->generateParticipantId();
        $hazardProfile = \App\Models\BarangayProfile::where(
            'philippine_barangay_id',
            $registrationData['philippine_barangay_id'] ?? null,
        )->first();

        $user = User::create([
            'name' => $registrationData['name'],
            'email' => $registrationData['email'],
            'phone' => $registrationData['phone'],
            'philippine_barangay_id' => $registrationData['philippine_barangay_id'] ?? null,
            'barangay_id' => $hazardProfile?->id,
            'province' => $registrationData['province'] ?? null,
            'city' => $registrationData['city'] ?? $registrationData['municipality_city'] ?? null,
            'barangay' => $registrationData['barangay'] ?? $registrationData['barangay_name'] ?? null,
            'street' => $registrationData['street'] ?? null,
            'password' => $registrationData['password'],
            'role' => 'PARTICIPANT',
            'participant_id' => $participantId,
            'status' => 'active',
            'registered_at' => now(),
            'email_verified_at' => now(),
        ]);

        // Clear session
        $request->session()->forget('participant_registration');

        PortalAuth::login($user);
        $request->session()->put('last_activity', now()->timestamp);

        return redirect('/dashboard')
            ->with('status', 'Registration successful! Welcome to the training platform.');
    }

    private function generateParticipantId()
    {
        do {
            $id = 'PART-' . strtoupper(\Illuminate\Support\Str::random(8));
        } while (User::where('participant_id', $id)->exists());

        return $id;
    }

    public function adminLogout(Request $request)
    {
        $request->merge(['guard' => PortalAuth::ADMIN_GUARD]);

        return $this->logout($request);
    }

    public function participantLogout(Request $request)
    {
        $request->merge(['guard' => PortalAuth::PARTICIPANT_GUARD]);

        return $this->logout($request);
    }

    public function logout(Request $request)
    {
        $requestedGuard = $request->input('guard');
        $activeGuard = PortalAuth::activeGuard();

        $guard = in_array($requestedGuard, PortalAuth::guards(), true)
            ? $requestedGuard
            : $activeGuard;

        $user = $guard === PortalAuth::PARTICIPANT_GUARD
            ? PortalAuth::participantUser()
            : PortalAuth::adminUser();

        if (! $user && $guard === null) {
            $user = portal_user();
            $guard = PortalAuth::activeGuard();
        }

        if ($guard) {
            PortalAuth::logoutGuard($guard);
        } else {
            PortalAuth::logoutAll();
        }

        if ($user) {
            AuditLogger::log([
                'user' => $user,
                'action' => 'Logged out',
                'module' => 'Auth',
                'status' => 'success',
                'description' => 'User logged out.',
            ]);
        }

        $inactivity = $request->input('reason') === 'inactivity';
        $resolvedGuard = $guard ?? ($user?->role === 'PARTICIPANT'
            ? PortalAuth::PARTICIPANT_GUARD
            : PortalAuth::ADMIN_GUARD);

        if ($resolvedGuard === PortalAuth::PARTICIPANT_GUARD) {
            $redirect = redirect()->route('participant.login');

            return $inactivity
                ? $redirect->with('error', 'Session expired due to inactivity.')
                : $redirect;
        }

        $redirect = redirect()->route('admin.login');

        return $inactivity
            ? $redirect->with('error', 'Session expired due to inactivity.')
            : $redirect;
    }

    /**
     * Legacy route for the removed verification-method step.
     * Handles cached pages and in-progress sessions from the old login flow.
     */
    public function legacyAdminLoginMethod(Request $request)
    {
        $otpData = $request->session()->get('admin_login_otp');
        if ($otpData && ! empty($otpData['user_id'])) {
            return redirect('/admin/login/verify');
        }

        $pending = $request->session()->get('admin_login_pending');
        if ($pending && ! empty($pending['user_id'])) {
            $expiresAt = $pending['expires_at'] ?? 0;
            if (now()->getTimestamp() > $expiresAt) {
                $request->session()->forget('admin_login_pending');

                return redirect()->route('admin.login')
                    ->withErrors(['email' => 'Your login session has expired. Please log in again.']);
            }

            $user = User::find($pending['user_id']);
            if (! $user) {
                $request->session()->forget('admin_login_pending');

                return redirect()->route('admin.login')
                    ->withErrors(['email' => 'Unable to continue login. Please log in again.']);
            }

            return $this->sendAdminLoginOtp($request, $user);
        }

        return redirect()->route('admin.login')
            ->with('status', 'Please sign in with your email and password to continue.');
    }

    /**
     * Show the admin login OTP verification form.
     */
    public function showAdminLoginVerify(Request $request)
    {
        $otpData = $request->session()->get('admin_login_otp');

        if (! $otpData || empty($otpData['user_id'])) {
            return redirect()->route('admin.login')
                ->withErrors(['email' => 'Your login session has expired. Please log in again.']);
        }

        $devOtp = null;
        $loginEmail = null;
        if (app()->environment('local') && config('app.debug')) {
            $devOtp = $otpData['otp'] ?? null;
        }

        $user = User::find($otpData['user_id']);
        $loginEmail = $user?->email;

        return view('auth.admin-login-verify', compact('devOtp', 'loginEmail'));
    }

    /**
     * Resend the admin login OTP to the user's email.
     */
    public function resendAdminLoginOtp(Request $request)
    {
        $otpData = $request->session()->get('admin_login_otp');

        if (! $otpData || empty($otpData['user_id'])) {
            return redirect()->route('admin.login')
                ->withErrors(['email' => 'Your login session has expired. Please log in again.']);
        }

        $user = User::find($otpData['user_id']);
        if (! $user) {
            $request->session()->forget('admin_login_otp');
            return redirect()->route('admin.login')
                ->withErrors(['email' => 'Unable to resend code. Please log in again.']);
        }

        $lastResend = $request->session()->get('admin_otp_last_resend_at', 0);
        if (now()->getTimestamp() - $lastResend < 60) {
            return back()->withErrors(['otp' => 'Please wait at least 60 seconds before requesting a new code.']);
        }

        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expiresAt = now()->addMinutes(10)->getTimestamp();

        $request->session()->put('admin_login_otp', [
            'user_id' => $user->id,
            'otp' => $otp,
            'expires_at' => $expiresAt,
            'remember' => $otpData['remember'] ?? false,
        ]);
        $request->session()->put('admin_otp_last_resend_at', now()->getTimestamp());

        try {
            Mail::to($user->email)->send(new AdminLoginOtpEmail($otp, $user->name));
        } catch (\Exception $e) {
            \Log::error('Failed to resend admin login OTP: ' . $e->getMessage());
            return back()->withErrors(['otp' => 'Unable to send verification code. Please try again in a moment.']);
        }

        return back()->with('status', 'A new verification code has been sent to your email.');
    }

    /**
     * Verify the admin login OTP and complete authentication.
     */
    public function verifyAdminLoginOtp(Request $request)
    {
        $otpData = $request->session()->get('admin_login_otp');

        if (! $otpData || empty($otpData['user_id'])) {
            return redirect()->route('admin.login')
                ->withErrors(['email' => 'Your login session has expired. Please log in again.']);
        }

        $request->validate([
            'otp' => ['required', 'string', 'size:6'],
        ], [
            'otp.required' => 'Please enter the verification code.',
            'otp.size' => 'Verification code must be 6 digits.',
        ]);

        $now = now()->getTimestamp();

        if ($now > ($otpData['expires_at'] ?? 0)) {
            $request->session()->forget('admin_login_otp');

            AuditLogger::log([
                'user' => User::find($otpData['user_id']),
                'action' => 'OTP verification failed',
                'module' => 'Auth',
                'status' => 'failed',
                'description' => 'Admin/trainer OTP expired.',
            ]);

            return redirect()->route('admin.login')
                ->withErrors(['email' => 'Verification code expired. Please log in again.']);
        }

        if ($request->otp !== ($otpData['otp'] ?? null)) {
            AuditLogger::log([
                'user' => User::find($otpData['user_id']),
                'action' => 'OTP verification failed',
                'module' => 'Auth',
                'status' => 'failed',
                'description' => 'Admin/trainer entered invalid OTP.',
            ]);

            return back()
                ->withErrors(['otp' => 'Invalid verification code. Please try again.']);
        }

        $user = User::find($otpData['user_id']);

        if (! $user) {
            $request->session()->forget('admin_login_otp');

            return redirect()->route('admin.login')
                ->withErrors(['email' => 'Unable to complete login. Please try again.']);
        }

        // Clear OTP data and complete login (no remember token for admin)
        $request->session()->forget('admin_login_otp');

        PortalAuth::login($user, false);
        $request->session()->regenerate();
        $request->session()->put('last_activity', now()->timestamp);

        \Log::info('Admin OTP login success', [
            'user_id' => $user->id,
            'email' => $user->email,
            'session_id' => $request->session()->getId(),
            'ip' => $request->ip(),
        ]);

        AuditLogger::log([
            'user' => $user,
            'action' => 'OTP verified',
            'module' => 'Auth',
            'status' => 'success',
            'description' => 'Admin/trainer OTP verified and login completed.',
        ]);

        $user->last_login = now();
        $user->save();

        // OTP verified - redirect to dashboard
        return redirect()->intended('/dashboard');
    }

    /**
     * Generate and email the admin login OTP, then redirect to the verification form.
     */
    private function sendAdminLoginOtp(Request $request, User $user)
    {
        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expiresAt = now()->addMinutes(10)->getTimestamp();

        $request->session()->put('admin_login_otp', [
            'user_id' => $user->id,
            'otp' => $otp,
            'expires_at' => $expiresAt,
            'remember' => false,
        ]);
        $request->session()->forget('admin_login_pending');

        try {
            Mail::to($user->email)->send(new AdminLoginOtpEmail($otp, $user->name));
        } catch (\Exception $e) {
            \Log::error('Failed to send admin login OTP: '.$e->getMessage());

            if (app()->environment('local') && config('app.debug')) {
                \Log::info("Admin login OTP for {$user->email}: {$otp}");

                return redirect('/admin/login/verify')
                    ->with('mail_delivery_failed', true)
                    ->with('status', 'Email delivery failed in local development. Use the verification code shown below.');
            }

            AuditLogger::log([
                'user' => $user,
                'action' => 'OTP send failed',
                'module' => 'Auth',
                'status' => 'failed',
                'description' => 'Failed to send admin login OTP.',
                'failure_reason' => $e->getMessage(),
            ]);

            return redirect()->route('admin.login')
                ->withErrors(['email' => 'Unable to send verification code. Please try again later or contact support.']);
        }

        AuditLogger::log([
            'user' => $user,
            'action' => 'OTP requested',
            'module' => 'Auth',
            'status' => 'success',
            'description' => 'Admin/trainer email OTP sent after password verification.',
        ]);

        return redirect('/admin/login/verify')
            ->with('status', 'We have sent a verification code to your email. Please enter it to continue.');
    }
}




