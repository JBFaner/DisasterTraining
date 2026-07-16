<?php

namespace App\Http\Controllers;

use App\Models\CampaignRequest;
use App\Models\User;
use App\Models\SimulationEvent;
use App\Models\EventRegistration;
use App\Mail\ParticipantVerificationEmail;
use App\Mail\AdminLoginOtpEmail;
use App\Services\AuditLogger;
use App\Services\CampaignRegistrationService;
use App\Services\DatabaseBackupService;
use App\Services\LoginAttemptService;
use App\Support\MaskedEmail;
use App\Support\PortalAuth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private const ADMIN_OTP_EXPIRY_MINUTES = 2;
    private const PARTICIPANT_EMAIL_VERIFICATION_EXPIRY_MINUTES = 15;
    private const PARTICIPANT_EMAIL_RESEND_COOLDOWN_SECONDS = 60;
    private const CAMPAIGN_REGISTRATION_SOURCE = 'campaign_planning_scheduling';

    private function resolveCampaignRequestContext(int $campaignRequestId): ?array
    {
        $campaignRequest = CampaignRequest::query()
            ->with('trainingModule')
            ->find($campaignRequestId);

        if (! $campaignRequest) {
            return null;
        }

        return app(CampaignRegistrationService::class)->buildContext($campaignRequest);
    }

    private function resolveCampaignEventContext(int $campaignEventId): ?array
    {
        $event = SimulationEvent::query()
            ->with('scenario.trainingModule')
            ->whereKey($campaignEventId)
            ->where('status', 'published')
            ->first();

        if (! $event) {
            return null;
        }

        $moduleTitle = $event->scenario?->trainingModule?->title;

        return [
            'campaign_event_id' => $event->id,
            'training_module_id' => $event->training_module_id,
            'training_title' => $event->title ?: $moduleTitle,
            'module_title' => $moduleTitle,
            'batch_label' => 'Simulation Event #'.$event->id,
            'scheduled_date' => optional($event->event_date)->toDateString(),
            'start_time' => $event->start_time,
            'end_time' => $event->end_time,
            'venue' => $event->venue ?: $event->location,
        ];
    }

    private function resolveCampaignRegistrationContext(Request $request): ?array
    {
        $campaignEventId = $request->query('campaign_event');
        if ($campaignEventId) {
            return $this->resolveCampaignEventContext((int) $campaignEventId);
        }

        $campaignRequestId = $request->query('campaign_request');
        if ($campaignRequestId) {
            return $this->resolveCampaignRequestContext((int) $campaignRequestId);
        }

        return null;
    }

    private function registrationCampaignIdFromContext(?array $campaignContext): ?string
    {
        if (empty($campaignContext)) {
            return null;
        }

        if (! empty($campaignContext['campaign_event_id'])) {
            return (string) $campaignContext['campaign_event_id'];
        }

        if (! empty($campaignContext['campaign_request_id'])) {
            return 'campaign-request:'.$campaignContext['campaign_request_id'];
        }

        return null;
    }

    private function participantRegisterReturnUrl(Request $request): string
    {
        $sessionContext = $request->session()->get('campaign_registration_context');

        $campaignRequestId = $request->input('campaign_request')
            ?? $request->query('campaign_request')
            ?? ($sessionContext['campaign_request_id'] ?? null);
        $campaignEventId = $request->input('campaign_event')
            ?? $request->query('campaign_event')
            ?? ($sessionContext['campaign_event_id'] ?? null);

        return route('participant.register', array_filter([
            'campaign_request' => $campaignRequestId,
            'campaign_event' => $campaignEventId,
            'create_account' => $campaignRequestId ? 1 : null,
        ]));
    }

    private function redirectBackToParticipantRegister(Request $request, array $errors = [])
    {
        $redirect = redirect($this->participantRegisterReturnUrl($request));

        if ($errors !== []) {
            $redirect->withErrors($errors);
        }

        return $redirect->withInput();
    }

    private function createCampaignEventRegistrationIfNeeded(User $user, ?array $campaignContext): void
    {
        $eventId = $campaignContext['campaign_event_id'] ?? null;
        if (! $eventId) {
            return;
        }

        $event = SimulationEvent::query()
            ->whereKey($eventId)
            ->where('status', 'published')
            ->first();

        if (! $event) {
            return;
        }

        // Mirror the capacity logic from SimulationEventController::register()
        if ($event->max_participants) {
            $currentCount = $event->registrations()->where('status', 'approved')->count();
            if ($currentCount >= $event->max_participants) {
                return;
            }
        }

        if (! $event->self_registration_enabled) {
            return;
        }

        if ($event->registration_deadline && now()->greaterThan($event->registration_deadline)) {
            return;
        }

        $autoApprovalEnabled = \App\Models\Setting::get('event_auto_approval_enabled', false);
        $status = $autoApprovalEnabled ? 'approved' : 'pending';
        $approvedAt = $autoApprovalEnabled ? now() : null;

        EventRegistration::firstOrCreate(
            [
                'user_id' => $user->id,
                'simulation_event_id' => $event->id,
            ],
            [
                'status' => $status,
                'registered_at' => now(),
                'approved_at' => $approvedAt,
            ],
        );
    }

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

        if ($request->filled('redirect')) {
            $redirect = $request->query('redirect');
            if (is_string($redirect) && str_starts_with($redirect, '/')) {
                $request->session()->put('url.intended', $redirect);
            }
        }

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

        if (! $user->email_verified_at || $user->status === 'pending_email_verification') {
            return back()
                ->withErrors([
                    'email' => 'Your email address has not yet been verified. Please verify your email before accessing the system.',
                ])
                ->with('unverified_email', $user->email)
                ->onlyInput('email');
        }

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

        return redirect()->intended(route('participant.dashboard'));
    }

    public function showParticipantRegister(Request $request)
    {
        // Legacy campaign links: /participant/register?campaign_request=X
        // Redirect to the campaign registration page unless the user is creating an account.
        if ($request->filled('campaign_request') && ! $request->boolean('create_account') && ! $request->session()->hasOldInput()) {
            return redirect()->route('campaigns.register', (int) $request->query('campaign_request'));
        }

        $campaignContextFromLink = $this->resolveCampaignRegistrationContext($request);
        if ($request->filled('campaign_request') && ! $campaignContextFromLink) {
            $request->session()->forget('campaign_registration_context');

            return redirect()->route('participant.register')
                ->withErrors(['form' => 'Registration is not open for this campaign request yet.']);
        }

        $campaignContext = $campaignContextFromLink
            ?? $request->session()->get('campaign_registration_context');

        if ($campaignContext) {
            $request->session()->put('campaign_registration_context', $campaignContext);
        }

        $openCampaigns = $campaignContext
            ? []
            : app(CampaignRegistrationService::class)->listOpenForRegistration();

        return view('auth.participant-register', [
            'campaign_context' => $campaignContext,
            'open_campaigns' => $openCampaigns,
        ]);
    }

    /**
     * Step 1: Start registration - validate and store data in session, generate verification code
     */
    public function participantRegisterStart(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'organization' => ['nullable', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email',
            ],
            'phone' => [
                'nullable',
                'string',
                'max:255',
                'unique:users,phone',
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
            'campaign_event' => ['nullable', 'integer'],
            'campaign_request' => ['nullable', 'integer', 'exists:campaign_requests,id'],
        ], [
            'email.unique' => 'This email is already registered. Please log in or use a different one.',
            'phone.unique' => 'This phone number is already registered. Please log in or use a different one.',
            'barangay_name.required' => 'Please select your barangay and wait for the address to load before continuing.',
            'philippine_barangay_id.required' => 'Please select your complete address (Region through Barangay).',
        ]);

        if ($validator->fails()) {
            throw (new ValidationException($validator))
                ->redirectTo($this->participantRegisterReturnUrl($request));
        }

        $data = $validator->validated();

        $campaignContext = $request->session()->get('campaign_registration_context');

        if ($request->filled('campaign_event')) {
            $resolved = $this->resolveCampaignEventContext((int) $request->input('campaign_event'));
            if ($resolved) {
                $campaignContext = $resolved;
                $request->session()->put('campaign_registration_context', $campaignContext);
            }
        } elseif ($request->filled('campaign_request')) {
            $resolved = $this->resolveCampaignRequestContext((int) $request->input('campaign_request'));
            if ($resolved) {
                $campaignContext = $resolved;
                $request->session()->put('campaign_registration_context', $campaignContext);
            } else {
                return $this->redirectBackToParticipantRegister($request, [
                    'form' => 'Registration is not open for this campaign request yet.',
                ]);
            }
        }

        if (empty($campaignContext['campaign_request_id']) && empty($campaignContext['campaign_event_id'])) {
            return $this->redirectBackToParticipantRegister($request, [
                'campaign_request' => 'Please select the training batch / module you are joining.',
            ]);
        }

        // Check if email or phone already exists with friendly message
        if (isset($data['email']) && User::where('email', $data['email'])->exists()) {
            return $this->redirectBackToParticipantRegister($request, [
                'email' => 'This email is already registered. Please log in or use a different one.',
            ]);
        }

        if (isset($data['phone']) && User::where('phone', $data['phone'])->exists()) {
            return $this->redirectBackToParticipantRegister($request, [
                'phone' => 'This phone number is already registered. Please log in or use a different one.',
            ]);
        }

        $participantId = $this->generateParticipantId();
        $hazardProfile = \App\Models\BarangayProfile::where(
            'philippine_barangay_id',
            $data['philippine_barangay_id'] ?? null,
        )->first();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'organization' => $data['organization'] ?? null,
            'philippine_barangay_id' => $data['philippine_barangay_id'] ?? null,
            'barangay_id' => $hazardProfile?->id,
            'province' => $data['province'] ?? null,
            'city' => $data['municipality_city'] ?? null,
            'barangay' => $data['barangay_name'] ?? null,
            'street' => $data['street'] ?? null,
            'password' => $data['password'],
            'role' => 'PARTICIPANT',
            'participant_id' => $participantId,
            'status' => 'pending_email_verification',
            'registered_at' => now(),
            'registration_source' => ! empty($campaignContext) ? self::CAMPAIGN_REGISTRATION_SOURCE : 'direct_registration',
        ]);

        try {
            $this->sendParticipantEmailVerificationCode($user);
        } catch (\Throwable $e) {
            \Log::error('Failed to send participant verification email: '.$e->getMessage());

            return $this->redirectBackToParticipantRegister($request, [
                'email' => 'We could not send the verification email. Please try again later.',
            ]);
        }

        $request->session()->put('participant_registration_verify', [
            'user_id' => $user->id,
            'campaign_context' => $campaignContext,
            'last_sent_at' => now()->getTimestamp(),
        ]);

        return redirect()->route('participant.register.verify')
            ->with('contact', $user->email)
            ->with('status', 'A verification code has been sent to your email.');
    }

    /**
     * Show verification page
     */
    public function showParticipantRegisterVerify()
    {
        $verifySession = session('participant_registration_verify');
        if (! $verifySession || empty($verifySession['user_id'])) {
            return redirect()->route('participant.register')
                ->withErrors(['form' => 'Registration session expired. Please start again.']);
        }

        $user = User::find($verifySession['user_id']);
        if (! $user || $user->role !== 'PARTICIPANT') {
            session()->forget('participant_registration_verify');
            return redirect()->route('participant.register')
                ->withErrors(['form' => 'Registration session expired. Please start again.']);
        }

        $resendAvailableAt = (int) (($verifySession['last_sent_at'] ?? 0) + self::PARTICIPANT_EMAIL_RESEND_COOLDOWN_SECONDS);

        return view('auth.participant-register-verify', [
            'verification_method' => 'email',
            'contact' => $user->email,
            'resend_available_at' => $resendAvailableAt,
            'status' => session('status'),
        ]);
    }

    /**
     * Resend the participant registration verification code.
     */
    public function participantRegisterResend(Request $request)
    {
        $verifySession = $request->session()->get('participant_registration_verify');
        if (! $verifySession || empty($verifySession['user_id'])) {
            return redirect()->route('participant.register')
                ->withErrors(['form' => 'Registration session expired. Please start again.']);
        }

        $user = User::find($verifySession['user_id']);
        if (! $user || $user->role !== 'PARTICIPANT') {
            $request->session()->forget('participant_registration_verify');
            return redirect()->route('participant.register')
                ->withErrors(['form' => 'Registration session expired. Please start again.']);
        }

        $lastSentAt = (int) ($verifySession['last_sent_at'] ?? 0);
        if (now()->getTimestamp() - $lastSentAt < self::PARTICIPANT_EMAIL_RESEND_COOLDOWN_SECONDS) {
            return back()
                ->withErrors(['otp' => 'Please wait at least 60 seconds before requesting a new code.'])
                ->with('verification_method', 'email')
                ->with('contact', $user->email);
        }

        try {
            $this->sendParticipantEmailVerificationCode($user);
        } catch (\Throwable $e) {
            \Log::error('Failed to resend participant verification email: '.$e->getMessage());

            return back()
                ->withErrors(['otp' => 'Unable to resend verification email. Please try again later.'])
                ->with('verification_method', 'email')
                ->with('contact', $user->email);
        }

        $verifySession['last_sent_at'] = now()->getTimestamp();
        $request->session()->put('participant_registration_verify', $verifySession);

        return back()
            ->with('status', 'A new verification code has been sent.')
            ->with('verification_method', 'email')
            ->with('contact', $user->email);
    }

    /**
     * Step 2: Verify and complete registration
     */
    public function participantRegisterVerify(Request $request)
    {
        $verifySession = $request->session()->get('participant_registration_verify');
        if (! $verifySession || empty($verifySession['user_id'])) {
            return redirect()->route('participant.register')
                ->withErrors(['form' => 'Registration session expired. Please start again.']);
        }

        $user = User::find($verifySession['user_id']);
        if (! $user || $user->role !== 'PARTICIPANT') {
            $request->session()->forget('participant_registration_verify');
            return redirect()->route('participant.register')
                ->withErrors(['form' => 'Registration session expired. Please start again.']);
        }

        $request->validate([
            'otp' => ['required', 'digits:6'],
        ], [
            'otp.required' => 'Please enter the verification code.',
            'otp.digits' => 'Verification code must be 6 digits.',
        ]);

        $cachedCode = Cache::get($this->participantVerificationCacheKey($user->id));
        if (! $cachedCode) {
            return back()
                ->withErrors(['otp' => 'This verification code has expired.'])
                ->with('verification_method', 'email')
                ->with('contact', $user->email);
        }

        if ($request->string('otp')->toString() !== (string) $cachedCode) {
            return back()
                ->withErrors(['otp' => 'The verification code you entered is invalid.'])
                ->with('verification_method', 'email')
                ->with('contact', $user->email);
        }

        $user->email_verified_at = now();
        $user->status = 'active';
        $user->save();

        Cache::forget($this->participantVerificationCacheKey($user->id));
        $campaignContext = $verifySession['campaign_context'] ?? null;
        $campaignRequestId = $campaignContext['campaign_request_id'] ?? null;

        $request->session()->forget('participant_registration_verify');
        $request->session()->forget('campaign_registration_context');

        $user->refresh();

        PortalAuth::login($user, false);
        $request->session()->regenerate();
        $request->session()->put('last_activity', now()->timestamp);

        if ($campaignRequestId) {
            $campaignRequest = CampaignRequest::query()->find($campaignRequestId);
            if ($campaignRequest) {
                try {
                    app(CampaignRegistrationService::class)->register($user, $campaignRequest);
                } catch (ValidationException $exception) {
                    return redirect()
                        ->route('campaigns.register', $campaignRequest)
                        ->withErrors($exception->errors());
                }

                $this->createCampaignEventRegistrationIfNeeded($user, $campaignContext);
                app(DatabaseBackupService::class)->queueAfterCommit('participant_registered');

                return redirect()
                    ->route('campaigns.register.success', $campaignRequest)
                    ->with('status', 'Your account has been verified and you are registered for this campaign.');
            }
        }

        $this->createCampaignEventRegistrationIfNeeded($user, $campaignContext);
        app(DatabaseBackupService::class)->queueAfterCommit('participant_registered');

        return redirect()->intended(route('participant.dashboard'))
            ->with('status', 'Your email has been successfully verified. Welcome!');
    }

    /**
     * Handle email verification via link (GET request)
     */
    public function participantRegisterVerifyEmail(Request $request, $token)
    {
        return redirect()->route('participant.register.verify')
            ->withErrors(['otp' => 'Please enter the 6-digit verification code sent to your email.']);
    }

    public function participantResendVerificationFromLogin(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $data['email'])
            ->where('role', 'PARTICIPANT')
            ->first();

        if (! $user) {
            return back()->withErrors(['email' => 'Participant account not found.']);
        }

        if ($user->email_verified_at) {
            return back()->with('status', 'This email is already verified. You can log in now.');
        }

        $lastSentAt = (int) Cache::get($this->participantVerificationCooldownCacheKey($user->id), 0);
        if (now()->getTimestamp() - $lastSentAt < self::PARTICIPANT_EMAIL_RESEND_COOLDOWN_SECONDS) {
            return back()->withErrors(['email' => 'Please wait at least 60 seconds before requesting a new code.']);
        }

        try {
            $this->sendParticipantEmailVerificationCode($user);
        } catch (\Throwable $e) {
            \Log::error('Failed to send participant verification email from login: '.$e->getMessage());
            return back()->withErrors(['email' => 'Unable to resend verification code right now. Please try again later.']);
        }
        $request->session()->put('participant_registration_verify', [
            'user_id' => $user->id,
            'campaign_context' => null,
            'last_sent_at' => now()->getTimestamp(),
        ]);

        return redirect()->route('participant.register.verify')
            ->with('status', 'A new verification code has been sent to your email.')
            ->with('contact', $user->email);
    }

    protected function participantVerificationCacheKey(int $userId): string
    {
        return "participant_email_verification_code:{$userId}";
    }

    protected function participantVerificationCooldownCacheKey(int $userId): string
    {
        return "participant_email_verification_last_sent:{$userId}";
    }

    protected function sendParticipantEmailVerificationCode(User $user): void
    {
        $verificationCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        Cache::put(
            $this->participantVerificationCacheKey($user->id),
            $verificationCode,
            now()->addMinutes(self::PARTICIPANT_EMAIL_VERIFICATION_EXPIRY_MINUTES),
        );
        Cache::put(
            $this->participantVerificationCooldownCacheKey($user->id),
            now()->getTimestamp(),
            now()->addMinutes(self::PARTICIPANT_EMAIL_VERIFICATION_EXPIRY_MINUTES),
        );

        Mail::to($user->email)->send(
            new ParticipantVerificationEmail($verificationCode, $user->name)
        );
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

        $showDevSection = app()->environment('local') || config('app.debug');
        $devOtp = $showDevSection ? ($otpData['otp'] ?? null) : null;

        $user = User::find($otpData['user_id']);
        $loginEmail = $user?->email;
        $maskedEmail = MaskedEmail::mask($loginEmail);
        $expiresAt = (int) ($otpData['expires_at'] ?? 0);
        $isExpired = now()->getTimestamp() > $expiresAt;

        return view('auth.admin-login-verify', compact(
            'devOtp',
            'loginEmail',
            'maskedEmail',
            'expiresAt',
            'isExpired',
            'showDevSection',
        ));
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

        $now = now()->getTimestamp();
        if ($now <= ($otpData['expires_at'] ?? 0)) {
            return back()->withErrors(['otp' => 'Please wait until the current code expires before requesting a new one.']);
        }

        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expiresAt = now()->addMinutes(self::ADMIN_OTP_EXPIRY_MINUTES)->getTimestamp();

        $request->session()->put('admin_login_otp', [
            'user_id' => $user->id,
            'otp' => $otp,
            'expires_at' => $expiresAt,
            'remember' => $otpData['remember'] ?? false,
        ]);

        try {
            Mail::to($user->email)->send(new AdminLoginOtpEmail($otp, $user->name));
        } catch (\Exception $e) {
            \Log::error('Failed to resend admin login OTP: ' . $e->getMessage());
            return back()->withErrors(['otp' => 'Unable to send verification code. Please try again in a moment.']);
        }

        $maskedEmail = MaskedEmail::mask($user->email);

        return back()->with('status', "A new 6-digit verification code has been sent to {$maskedEmail}. The code will expire in ".self::ADMIN_OTP_EXPIRY_MINUTES.' minutes.');
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
            AuditLogger::log([
                'user' => User::find($otpData['user_id']),
                'action' => 'OTP verification failed',
                'module' => 'Auth',
                'status' => 'failed',
                'description' => 'Admin/trainer OTP expired.',
            ]);

            return back()
                ->withErrors(['otp' => 'The verification code has expired.']);
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

        // OTP verified - redirect to admin dashboard
        return redirect()->intended(route('admin.dashboard'));
    }

    /**
     * Generate and email the admin login OTP, then redirect to the verification form.
     */
    private function sendAdminLoginOtp(Request $request, User $user)
    {
        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expiresAt = now()->addMinutes(self::ADMIN_OTP_EXPIRY_MINUTES)->getTimestamp();

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

            if (app()->environment('local') || config('app.debug')) {
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

        $maskedEmail = MaskedEmail::mask($user->email);

        return redirect('/admin/login/verify')
            ->with('status', "A 6-digit verification code has been sent to {$maskedEmail}. The code will expire in ".self::ADMIN_OTP_EXPIRY_MINUTES.' minutes.');
    }
}




