<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>Admin OTP Verification</title>
        <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
        @vite(['resources/css/app.css'])
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
            
            * {
                font-family: 'Inter', sans-serif;
            }
            
            .login-hero-bg {
                position: relative;
                background-image: url('{{ asset('images/hero-training.jpg') }}');
                background-size: cover;
                background-position: center;
                background-attachment: fixed;
                min-height: 100vh;
            }
            
            .login-hero-bg::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, rgba(16, 24, 40, 0.95) 0%, rgba(30, 41, 59, 0.92) 50%, rgba(15, 118, 110, 0.88) 100%);
                z-index: 1;
            }
            
            .login-form-wrapper {
                position: relative;
                z-index: 2;
            }

            .otp-digit:disabled {
                background-color: #f1f5f9;
                color: #94a3b8;
                cursor: not-allowed;
            }
        </style>
    </head>
    <body class="login-hero-bg">
        <div class="login-form-wrapper min-h-screen flex items-center justify-center p-4">
            <div class="w-full max-w-md bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl p-8 border border-white/20">
                <!-- Logo -->
                <div class="flex justify-center mb-6">
                    <img src="{{ asset('logo.svg') }}" alt="LGU Logo" class="h-16 w-auto">
                </div>
                
                <h1 class="text-2xl font-bold text-slate-800 mb-2 text-center">Verify Admin Login</h1>
                <p class="text-sm text-slate-600 mb-4 text-center">
                    Enter the 6-digit code we sent to your email to access the admin dashboard.
                </p>

                @if (session('status'))
                    <div class="mb-4 rounded-lg bg-emerald-50 border-l-4 border-emerald-500 px-4 py-3 text-sm text-emerald-700">
                        <p class="flex items-start gap-2">
                            <span class="flex-shrink-0" aria-hidden="true">✅</span>
                            <span>{{ session('status') }}</span>
                        </p>
                    </div>
                @elseif ($maskedEmail)
                    <div class="mb-4 rounded-lg bg-emerald-50 border-l-4 border-emerald-500 px-4 py-3 text-sm text-emerald-700">
                        <p class="flex items-start gap-2">
                            <span class="flex-shrink-0" aria-hidden="true">✅</span>
                            <span>
                                A 6-digit verification code has been sent to {{ $maskedEmail }}. The code will expire in 2 minutes.
                            </span>
                        </p>
                    </div>
                @endif

                @if ($showDevSection && $devOtp)
                    <div class="mb-4 rounded-lg {{ session('mail_delivery_failed') ? 'bg-orange-50 border-orange-500' : 'bg-amber-50 border-amber-500' }} border-l-4 px-4 py-3 text-sm text-amber-900">
                        <p class="font-semibold mb-1">
                            @if (session('mail_delivery_failed'))
                                Email could not be delivered
                            @else
                                Local development
                            @endif
                        </p>
                        @if (session('mail_delivery_failed'))
                            <p class="mb-2 text-orange-900">
                                Gmail rejected SMTP login for <strong>alertaraqc@gmail.com</strong>.
                                The code below is for <strong>{{ $loginEmail ?? 'your login email' }}</strong>.
                            </p>
                        @endif
                        <p class="mb-1">Your verification code: <span class="font-mono text-lg tracking-widest">{{ $devOtp }}</span></p>
                    </div>
                @endif

                @if ($errors->any())
                    <div class="mb-4 rounded-lg bg-red-50 border-l-4 border-red-500 px-4 py-3 text-sm text-red-700">
                        {{ $errors->first() }}
                    </div>
                @endif

                <div
                    id="otp-expired-message"
                    class="mb-4 rounded-lg bg-red-50 border-l-4 border-red-500 px-4 py-3 text-sm text-red-700 {{ $isExpired ? '' : 'hidden' }}"
                    role="alert"
                >
                    The verification code has expired.
                </div>

                <form
                    method="POST"
                    action="/admin/login/verify"
                    class="space-y-5"
                    id="admin-otp-form"
                    data-otp-expires-at="{{ $expiresAt }}"
                >
                    @csrf

                    <div>
                        <x-otp-input
                            name="otp"
                            label="Verification Code"
                            :error="$errors->first('otp')"
                            :clear-on-error="$errors->has('otp')"
                        />

                        <div class="mt-3 text-center">
                            <p class="text-xs font-medium text-slate-500 mb-0.5">Code expires in</p>
                            <p
                                id="otp-countdown"
                                class="text-lg font-mono font-semibold tabular-nums text-emerald-600"
                                aria-live="polite"
                                aria-atomic="true"
                            >
                                --:--
                            </p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        id="verify-submit-btn"
                        @if($isExpired) disabled @endif
                        class="w-full inline-flex justify-center items-center gap-2 rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-sm font-semibold px-4 py-3.5 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c.5304 0 1.0391-.2107 1.4142-.5858C13.7893 10.0391 14 9.5304 14 9s-.2107-1.0391-.5858-1.4142C13.0391 7.2107 12.5304 7 12 7s-1.0391.2107-1.4142.5858C10.2107 7.9609 10 8.4696 10 9s.2107 1.0391.5858 1.4142C10.9609 10.7893 11.4696 11 12 11zm0 2c-.7956 0-1.5587.3161-2.1213.8787C9.3161 14.4413 9 15.2044 9 16h2c0-.2652.1054-.5196.2929-.7071C11.4804 15.1054 11.7348 15 12 15s.5196.1054.7071.2929C12.8946 15.4804 13 15.7348 13 16h2c0-.7956-.3161-1.5587-.8787-2.1213C13.5587 13.3161 12.7956 13 12 13z"/>
                        </svg>
                        <span>Verify &amp; Sign In</span>
                    </button>
                </form>

                <div class="mt-6 pt-4 border-t border-slate-200 text-center space-y-3">
                    <p class="text-xs text-slate-500">
                        If you didn't receive the code, check your spam folder or resend a new code.
                    </p>
                    <form method="POST" action="/admin/login/resend-otp" class="inline" id="resend-otp-form">
                        @csrf
                        <button
                            type="submit"
                            id="resend-otp-btn"
                            @if(! $isExpired) disabled @endif
                            class="text-sm font-medium text-teal-600 hover:text-teal-700 hover:underline focus:outline-none focus:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed"
                        >
                            Resend code
                        </button>
                    </form>
                    <p
                        id="resend-countdown-text"
                        class="text-xs text-slate-500 {{ $isExpired ? 'hidden' : '' }}"
                    >
                        Resend available in <span id="resend-countdown" class="font-mono font-medium">--:--</span>
                    </p>
                    <p class="text-xs text-slate-500 mt-3">
                        <a href="{{ route('admin.login') }}" class="hover:text-slate-700">← Back to Login</a>
                    </p>
                </div>
            </div>
        </div>

        @push('scripts')
            <script>
                (function () {
                    const form = document.getElementById('admin-otp-form');
                    if (!form) {
                        return;
                    }

                    const expiresAt = parseInt(form.dataset.otpExpiresAt || '0', 10);
                    const countdownEl = document.getElementById('otp-countdown');
                    const resendCountdownEl = document.getElementById('resend-countdown');
                    const resendCountdownText = document.getElementById('resend-countdown-text');
                    const resendBtn = document.getElementById('resend-otp-btn');
                    const verifyBtn = document.getElementById('verify-submit-btn');
                    const expiredMessage = document.getElementById('otp-expired-message');
                    const otpDigits = form.querySelectorAll('[data-otp-digit]');

                    function formatTime(totalSeconds) {
                        const minutes = Math.floor(totalSeconds / 60);
                        const seconds = totalSeconds % 60;
                        return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
                    }

                    function setCountdownColor(secondsRemaining) {
                        if (!countdownEl) {
                            return;
                        }

                        countdownEl.classList.remove('text-emerald-600', 'text-orange-500', 'text-red-600');

                        if (secondsRemaining <= 15) {
                            countdownEl.classList.add('text-red-600');
                        } else if (secondsRemaining <= 60) {
                            countdownEl.classList.add('text-orange-500');
                        } else {
                            countdownEl.classList.add('text-emerald-600');
                        }
                    }

                    function setExpiredState() {
                        if (countdownEl) {
                            countdownEl.textContent = '00:00';
                            countdownEl.classList.remove('text-emerald-600', 'text-orange-500');
                            countdownEl.classList.add('text-red-600');
                        }

                        if (resendCountdownText) {
                            resendCountdownText.classList.add('hidden');
                        }

                        if (resendBtn) {
                            resendBtn.disabled = false;
                        }

                        if (verifyBtn) {
                            verifyBtn.disabled = true;
                        }

                        if (expiredMessage) {
                            expiredMessage.classList.remove('hidden');
                        }

                        otpDigits.forEach((input) => {
                            input.disabled = true;
                        });
                    }

                    function tick() {
                        const now = Math.floor(Date.now() / 1000);
                        const remaining = Math.max(0, expiresAt - now);

                        if (countdownEl) {
                            countdownEl.textContent = formatTime(remaining);
                            setCountdownColor(remaining);
                        }

                        if (resendCountdownEl) {
                            resendCountdownEl.textContent = formatTime(remaining);
                        }

                        if (remaining <= 0) {
                            setExpiredState();
                            return;
                        }

                        if (resendBtn) {
                            resendBtn.disabled = true;
                        }

                        if (verifyBtn) {
                            verifyBtn.disabled = false;
                        }

                        if (resendCountdownText) {
                            resendCountdownText.classList.remove('hidden');
                        }

                        if (expiredMessage) {
                            expiredMessage.classList.add('hidden');
                        }

                        otpDigits.forEach((input) => {
                            input.disabled = false;
                        });
                    }

                    tick();
                    setInterval(tick, 1000);

                    form.addEventListener('submit', (event) => {
                        const now = Math.floor(Date.now() / 1000);
                        if (now > expiresAt) {
                            event.preventDefault();
                            setExpiredState();
                        }
                    });

                    const resendForm = document.getElementById('resend-otp-form');
                    if (resendForm) {
                        resendForm.addEventListener('submit', (event) => {
                            const now = Math.floor(Date.now() / 1000);
                            if (now <= expiresAt) {
                                event.preventDefault();
                            }
                        });
                    }
                })();
            </script>
        @endpush

        @stack('scripts')
    </body>
</html>
