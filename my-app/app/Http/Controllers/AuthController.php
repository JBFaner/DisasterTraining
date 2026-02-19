<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Mail\ParticipantVerificationEmail;
use App\Mail\AdminLoginOtpEmail;
use App\Services\SmsService;
use App\Services\AuditLogger;
use App\Services\LoginAttemptService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function showLogin(Request $request)
    {
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

        // Only allow admin/trainer/super admin roles through admin login
        if (! $user || ! in_array($user->role, ['SUPER_ADMIN', 'LGU_ADMIN', 'LGU_TRAINER'], true)) {
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

        // Admin / Trainer / Super Admin login flow - redirect to method selection
        // For admins, trainers, and super admins, enforce that the account is active and the email has been verified.
        // Check if user account is active (not disabled)
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
                'description' => "Admin/trainer/super admin attempted login. Status: {$user->status}, Verified: " . ($user->email_verified_at ? 'Yes' : 'No'),
            ]);

            return back()
                ->withErrors([
                    'email' => $statusMessage,
                ])
                ->onlyInput('email');
        }

        // Store user ID in session for method selection
        $request->session()->put('admin_login_pending', [
            'user_id' => $user->id,
            'expires_at' => now()->addMinutes(15)->getTimestamp(),
        ]);

        AuditLogger::log([
            'user' => $user,
            'action' => 'Password verified',
            'module' => 'Auth',
            'status' => 'success',
            'description' => 'Admin/trainer password verified, awaiting verification method selection.',
        ]);

        return redirect()->route('admin.login.method');
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

        Auth::login($user, false); // No remember token for participants
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
                // Still log for development fallback
                \Log::info("Email verification code for {$data['email']}: {$verificationCode}");
            }
        }

        // Store registration data in session
        $request->session()->put('participant_registration', [
            'name' => $data['name'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'password' => $data['password'],
            'verification_method' => $verificationMethod,
            'verification_code' => $verificationCode,
            'expires_at' => now()->addMinutes(15), // 15 minutes expiry
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
        ]);
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

        $user = User::create([
            'name' => $registrationData['name'],
            'email' => $registrationData['email'],
            'phone' => $registrationData['phone'],
            'password' => $registrationData['password'],
            'role' => 'PARTICIPANT',
            'participant_id' => $participantId,
            'status' => 'active',
            'registered_at' => now(),
        ]);

        // Clear session
        $request->session()->forget('participant_registration');

        Auth::login($user);
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

        $user = User::create([
            'name' => $registrationData['name'],
            'email' => $registrationData['email'],
            'phone' => $registrationData['phone'],
            'password' => $registrationData['password'],
            'role' => 'PARTICIPANT',
            'participant_id' => $participantId,
            'status' => 'active',
            'registered_at' => now(),
        ]);

        // Clear session
        $request->session()->forget('participant_registration');

        Auth::login($user);
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

    public function logout(Request $request)
    {
        // Capture role before logging out
        $user = Auth::user();
        $role = $user->role ?? null;

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($user) {
            AuditLogger::log([
                'user' => $user,
                'action' => 'Logged out',
                'module' => 'Auth',
                'status' => 'success',
                'description' => 'User logged out.',
            ]);
        }

        // Redirect based on last role; show message if session expired due to inactivity
        $inactivity = $request->input('reason') === 'inactivity';
        if ($role === 'PARTICIPANT') {
            $r = redirect()->route('participant.login');
            return $inactivity ? $r->with('error', 'Session expired due to inactivity.') : $r;
        }
        $r = redirect()->route('admin.login');
        return $inactivity ? $r->with('error', 'Session expired due to inactivity.') : $r;
    }

    /**
     * Show the admin login method selection page.
     */
    public function showAdminLoginMethod(Request $request)
    {
        $pendingData = $request->session()->get('admin_login_pending');

        if (! $pendingData || empty($pendingData['user_id'])) {
            return redirect()->route('admin.login')
                ->withErrors(['email' => 'Your login session has expired. Please log in again.']);
        }

        $user = User::find($pendingData['user_id']);
        if (! $user) {
            $request->session()->forget('admin_login_pending');
            return redirect()->route('admin.login')
                ->withErrors(['email' => 'Unable to verify session. Please log in again.']);
        }

        // Check if session expired
        if (now()->getTimestamp() > ($pendingData['expires_at'] ?? 0)) {
            $request->session()->forget('admin_login_pending');
            return redirect()->route('admin.login')
                ->withErrors(['email' => 'Your login session has expired. Please log in again.']);
        }

        return view('auth.admin-login-method', [
            'user' => $user,
            'hasUsbKey' => $user->usb_key_enabled && !empty($user->usb_key_hash),
        ]);
    }

    /**
     * Handle admin login method selection.
     */
    public function selectAdminLoginMethod(Request $request)
    {
        $pendingData = $request->session()->get('admin_login_pending');

        if (! $pendingData || empty($pendingData['user_id'])) {
            return redirect()->route('admin.login')
                ->withErrors(['email' => 'Your login session has expired. Please log in again.']);
        }

        $user = User::find($pendingData['user_id']);
        if (! $user) {
            $request->session()->forget('admin_login_pending');
            return redirect()->route('admin.login')
                ->withErrors(['email' => 'Unable to verify session. Please log in again.']);
        }

        // Check if session expired
        if (now()->getTimestamp() > ($pendingData['expires_at'] ?? 0)) {
            $request->session()->forget('admin_login_pending');
            return redirect()->route('admin.login')
                ->withErrors(['email' => 'Your login session has expired. Please log in again.']);
        }

        $request->validate([
            'verification_method' => ['required', 'in:otp,usb'],
        ], [
            'verification_method.required' => 'Please select a verification method.',
            'verification_method.in' => 'Invalid verification method selected.',
        ]);

        $method = $request->input('verification_method');

        if ($method === 'usb') {
            // Check if USB key is enabled
            if (! $user->usb_key_enabled || empty($user->usb_key_hash)) {
                return back()
                    ->withErrors(['verification_method' => 'USB key verification is not enabled for your account.']);
            }

            // Verify user role is allowed for USB key verification
            if (! in_array($user->role, ['SUPER_ADMIN', 'LGU_ADMIN', 'LGU_TRAINER'], true)) {
                return back()
                    ->withErrors(['verification_method' => 'USB key verification is not available for your account type.']);
            }

            // Store user ID for USB verification
            $request->session()->forget('admin_login_pending');
            $request->session()->put('pending_usb_admin_id', $user->id);

            AuditLogger::log([
                'user' => $user,
                'action' => 'USB verification selected',
                'module' => 'Auth',
                'status' => 'success',
                'description' => 'Admin/trainer/super admin selected USB key verification method.',
            ]);

            return redirect()->route('admin.usb.check');
        }

        // OTP method selected - generate and send OTP
        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expiresAt = now()->addMinutes(10)->getTimestamp();

        // Store OTP session data
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
            \Log::error('Failed to send admin login OTP: ' . $e->getMessage());

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
            'description' => 'Admin/trainer selected OTP verification method.',
        ]);

        return redirect()
            ->route('admin.login.verify')
            ->with('status', 'We have sent a verification code to your email. Please enter it to continue.');
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

        return view('auth.admin-login-verify');
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

        Auth::login($user, false);
        $request->session()->regenerate();
        $request->session()->put('last_activity', now()->timestamp);

        AuditLogger::log([
            'user' => $user,
            'action' => 'OTP verified',
            'module' => 'Auth',
            'status' => 'success',
            'description' => 'Admin/trainer OTP verified and login completed.',
        ]);

        $user->last_login = now();
        $user->save();

        // OTP verified - redirect to dashboard (USB check is now handled in method selection)
        return redirect()->intended('/dashboard');
    }
}




