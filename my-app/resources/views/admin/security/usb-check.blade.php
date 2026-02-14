<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>USB Key Verification - Admin Login</title>
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
            
            <h1 class="text-2xl font-bold text-slate-800 mb-2 text-center">USB Key Verification</h1>
            <p class="text-sm text-slate-600 mb-6 text-center">
                Insert your USB drive and upload your Disaster Training key file to complete login.
            </p>

            @if ($errors->any())
                <div class="mb-6 rounded-lg bg-red-50 border-l-4 border-red-500 px-4 py-3 text-sm text-red-700">
                    {{ $errors->first() }}
                </div>
            @endif

            <form method="POST" action="{{ route('admin.usb.check.post') }}" enctype="multipart/form-data" class="space-y-5">
                @csrf

                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2" for="usb_key_file">
                        USB Key File
                    </label>
                    <div class="relative">
                        <input
                            type="file"
                            id="usb_key_file"
                            name="usb_key_file"
                            required
                            accept=".txt"
                            class="block w-full text-sm text-slate-700 border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition file:mr-4 file:py-1.5 file:px-3 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                        />
                    </div>
                    @error('usb_key_file')
                        <p class="mt-1 text-xs text-red-600">{{ $message }}</p>
                    @enderror
                    <p class="mt-2 text-xs text-slate-500">
                        Select the disaster-training-usb-key-*.txt file from your USB drive.
                    </p>
                </div>

                <button
                    type="submit"
                    class="w-full inline-flex justify-center items-center gap-2 rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-sm font-semibold px-4 py-3.5 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span>Verify & Continue</span>
                </button>
            </form>

            <div class="mt-6 pt-4 border-t border-slate-200 text-center">
                <p class="text-xs text-slate-500">
                    <a href="{{ route('admin.login') }}" class="hover:text-slate-700">← Back to Login</a>
                </p>
            </div>
        </div>
    </div>
</body>
</html>


