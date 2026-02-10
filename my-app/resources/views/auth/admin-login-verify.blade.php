<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
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
                        {{ session('status') }}
                    </div>
                @endif

                @if ($errors->any())
                    <div class="mb-4 rounded-lg bg-red-50 border-l-4 border-red-500 px-4 py-3 text-sm text-red-700">
                        {{ $errors->first() }}
                    </div>
                @endif

                <form method="POST" action="{{ route('admin.login.verify.post') }}" class="space-y-5">
                    @csrf

                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-2" for="otp">
                            Verification Code
                        </label>
                        <input
                            id="otp"
                            name="otp"
                            type="text"
                            inputmode="numeric"
                            pattern="[0-9]*"
                            maxlength="6"
                            autocomplete="one-time-code"
                            required
                            placeholder="Enter 6-digit code"
                            class="w-full px-3 py-3 rounded-lg border border-slate-300 text-center tracking-[0.35em] text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                            value="{{ old('otp', '') }}"
                        >
                        @error('otp')
                            <p class="mt-1 text-xs text-rose-600">{{ $message }}</p>
                        @enderror
                    </div>

                    <button
                        type="submit"
                        class="w-full inline-flex justify-center items-center gap-2 rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-sm font-semibold px-4 py-3.5 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c.5304 0 1.0391-.2107 1.4142-.5858C13.7893 10.0391 14 9.5304 14 9s-.2107-1.0391-.5858-1.4142C13.0391 7.2107 12.5304 7 12 7s-1.0391.2107-1.4142.5858C10.2107 7.9609 10 8.4696 10 9s.2107 1.0391.5858 1.4142C10.9609 10.7893 11.4696 11 12 11zm0 2c-.7956 0-1.5587.3161-2.1213.8787C9.3161 14.4413 9 15.2044 9 16h2c0-.2652.1054-.5196.2929-.7071C11.4804 15.1054 11.7348 15 12 15s.5196.1054.7071.2929C12.8946 15.4804 13 15.7348 13 16h2c0-.7956-.3161-1.5587-.8787-2.1213C13.5587 13.3161 12.7956 13 12 13z"/>
                        </svg>
                        <span>Verify &amp; Sign In</span>
                    </button>
                </form>

                <div class="mt-6 pt-4 border-t border-slate-200 text-center">
                    <p class="text-xs text-slate-500">
                        If you didn’t receive the code, please check your spam folder or try logging in again.
                    </p>
                    <p class="text-xs text-slate-500 mt-3">
                        <a href="{{ route('login') }}" class="hover:text-slate-700">← Back to Login</a>
                    </p>
                </div>
            </div>
        </div>
    </body>
</html>

