<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>Select Verification Method - Admin Login</title>
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

            .method-card {
                transition: all 0.3s ease;
                cursor: pointer;
            }

            .method-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            }

            .method-card input[type="radio"]:checked + .method-content {
                border-color: #14b8a6;
                background-color: rgba(20, 184, 166, 0.05);
            }
        </style>
    </head>
    <body class="login-hero-bg">
        <div class="login-form-wrapper min-h-screen flex items-center justify-center p-4">
            <div class="w-full max-w-2xl bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl p-8 border border-white/20">
                <!-- Logo -->
                <div class="flex justify-center mb-6">
                    <img src="{{ asset('logo.svg') }}" alt="LGU Logo" class="h-16 w-auto">
                </div>
                
                <h1 class="text-2xl font-bold text-slate-800 mb-2 text-center">Select Verification Method</h1>
                <p class="text-sm text-slate-600 mb-6 text-center">
                    Choose how you would like to verify your identity to complete the login process.
                </p>

                @if ($errors->any())
                    <div class="mb-6 rounded-lg bg-red-50 border-l-4 border-red-500 px-4 py-3 text-sm text-red-700">
                        {{ $errors->first() }}
                    </div>
                @endif

                <form method="POST" action="{{ route('admin.login.method.post') }}" id="methodForm">
                    @csrf

                    <div class="space-y-4 mb-6">
                        <!-- OTP Method -->
                        <label class="method-card block">
                            <input
                                type="radio"
                                name="verification_method"
                                value="otp"
                                class="hidden"
                                checked
                                id="method_otp"
                            >
                            <div class="method-content border-2 border-slate-200 rounded-lg p-5 hover:border-teal-400">
                                <div class="flex items-start gap-4">
                                    <div class="flex-shrink-0 mt-1">
                                        <svg class="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                        </svg>
                                    </div>
                                    <div class="flex-1">
                                        <h3 class="font-semibold text-slate-800 mb-1">Email OTP Verification</h3>
                                        <p class="text-sm text-slate-600">
                                            We'll send a 6-digit verification code to your email address ({{ $user->email }}).
                                        </p>
                                    </div>
                                    <div class="flex-shrink-0">
                                        <div class="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center method-radio">
                                            <div class="w-3 h-3 rounded-full bg-teal-600 hidden method-radio-dot"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </label>

                        <!-- USB Key Method -->
                        @if($hasUsbKey)
                        <label class="method-card block">
                            <input
                                type="radio"
                                name="verification_method"
                                value="usb"
                                class="hidden"
                                id="method_usb"
                            >
                            <div class="method-content border-2 border-slate-200 rounded-lg p-5 hover:border-teal-400">
                                <div class="flex items-start gap-4">
                                    <div class="flex-shrink-0 mt-1">
                                        <svg class="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/>
                                        </svg>
                                    </div>
                                    <div class="flex-1">
                                        <h3 class="font-semibold text-slate-800 mb-1">USB Key Verification</h3>
                                        <p class="text-sm text-slate-600">
                                            Use your USB flash drive with the disaster training key file for faster authentication.
                                        </p>
                                    </div>
                                    <div class="flex-shrink-0">
                                        <div class="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center method-radio">
                                            <div class="w-3 h-3 rounded-full bg-teal-600 hidden method-radio-dot"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </label>
                        @else
                        <div class="border-2 border-slate-200 rounded-lg p-5 opacity-50">
                            <div class="flex items-start gap-4">
                                <div class="flex-shrink-0 mt-1">
                                    <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/>
                                    </svg>
                                </div>
                                <div class="flex-1">
                                    <h3 class="font-semibold text-slate-600 mb-1">USB Key Verification</h3>
                                    <p class="text-sm text-slate-500">
                                        USB key verification is not enabled for your account. Contact an administrator to set it up.
                                    </p>
                                </div>
                            </div>
                        </div>
                        @endif
                    </div>

                    <button
                        type="submit"
                        class="w-full inline-flex justify-center items-center gap-2 rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-sm font-semibold px-4 py-3.5 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span>Continue</span>
                    </button>
                </form>

                <div class="mt-6 pt-4 border-t border-slate-200 text-center">
                    <p class="text-xs text-slate-500">
                        <a href="{{ route('admin.login') }}" class="hover:text-slate-700">← Back to Login</a>
                    </p>
                </div>
            </div>
        </div>

        <script>
            // Handle radio button visual feedback
            document.querySelectorAll('input[name="verification_method"]').forEach(radio => {
                radio.addEventListener('change', function() {
                    document.querySelectorAll('.method-radio').forEach(el => {
                        el.classList.remove('border-teal-600');
                        el.querySelector('.method-radio-dot').classList.add('hidden');
                    });
                    
                    const selectedCard = this.closest('.method-card');
                    const radioIndicator = selectedCard.querySelector('.method-radio');
                    const radioDot = selectedCard.querySelector('.method-radio-dot');
                    radioIndicator.classList.add('border-teal-600');
                    radioDot.classList.remove('hidden');
                });
            });

            // Set initial state
            const checkedRadio = document.querySelector('input[name="verification_method"]:checked');
            if (checkedRadio) {
                checkedRadio.dispatchEvent(new Event('change'));
            }
        </script>
    </body>
</html>
