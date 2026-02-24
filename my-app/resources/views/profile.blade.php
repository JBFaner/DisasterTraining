<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>My Profile - Disaster Preparedness Training</title>
    @vite(['resources/css/app.css'])
</head>
<body class="bg-slate-50 text-slate-900">
    <div class="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <a href="{{ route('dashboard') }}" class="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800">
                    <span class="text-lg">←</span>
                    <span>Back to dashboard</span>
                </a>
                <span class="hidden sm:inline text-xs text-slate-400">/</span>
                <span class="hidden sm:inline text-xs font-semibold text-emerald-700">My Profile</span>
            </div>
            <span class="hidden sm:inline text-xs text-slate-500">
                Logged in as {{ $user->email }}
            </span>
        </div>
    </div>

    <main class="max-w-7xl mx-auto px-4 py-8 space-y-6">
        @if (session('status'))
            <div class="rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                {{ session('status') }}
            </div>
        @endif

        <section class="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-start">
            <!-- Profile card -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 space-y-6">
                <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div class="relative">
                        @php
                            $initials = collect(explode(' ', $user->name ?? 'User'))
                                ->map(fn ($part) => mb_substr($part, 0, 1))
                                ->take(2)
                                ->implode('');
                        @endphp
                        <div class="h-16 w-16 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl font-semibold shadow-md">
                            {{ $initials }}
                        </div>
                    </div>
                    <div class="space-y-1">
                        <h1 class="text-lg font-semibold text-slate-900">
                            {{ $user->name }}
                        </h1>
                        <p class="text-xs uppercase tracking-wide text-slate-500">
                            {{ $user->role ?? 'User' }}
                        </p>
                    </div>
                </div>

                <form method="POST" action="{{ route('profile.update') }}" class="space-y-4 max-w-lg">
                    @csrf
                    @method('PUT')
                    <div>
                        <label for="name" class="block text-xs font-semibold text-slate-600 mb-1">
                            Full Name
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value="{{ old('name', $user->name) }}"
                            required
                            class="w-full rounded-md border @error('name') border-rose-300 @else border-slate-300 @enderror px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        @error('name')
                            <p class="mt-1 text-xs text-rose-600">{{ $message }}</p>
                        @enderror
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-slate-600 mb-1">
                            Email
                        </label>
                        <div class="flex flex-wrap items-center gap-2 text-sm">
                            <span class="font-medium text-slate-900">{{ $user->email ?? 'Not set' }}</span>
                            @if($user->email_verified_at)
                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Verified
                                </span>
                            @else
                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                    Unverified
                                </span>
                            @endif
                            @if($user->pending_email)
                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                                    Pending: {{ $user->pending_email }}
                                </span>
                            @endif
                        </div>
                        <p class="mt-1 text-xs text-slate-500">
                            Use the Email &amp; Phone card to request changes and manage verification.
                        </p>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-slate-600 mb-1">
                            Phone Number
                        </label>
                        <div class="flex flex-wrap items-center gap-2 text-sm">
                            <span class="font-medium text-slate-900">{{ $user->phone ?? 'Not provided' }}</span>
                            @if($user->phone_verified_at)
                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Verified
                                </span>
                            @endif
                            @if($user->pending_phone)
                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                                    Pending: {{ $user->pending_phone }}
                                </span>
                            @endif
                        </div>
                        <p class="mt-1 text-xs text-slate-500">
                            Phone changes are confirmed via an email sent to your current address.
                        </p>
                    </div>

                    <div>
                        <label for="street" class="block text-xs font-semibold text-slate-600 mb-1">
                            Address
                        </label>
                        <input
                            id="street"
                            name="street"
                            type="text"
                            value="{{ old('street', $user->street) }}"
                            placeholder="Block 5 Lot 10, Barangay Commonwealth, Quezon City"
                            required
                            class="w-full rounded-md border @error('street') border-rose-300 @else border-slate-300 @enderror px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        @error('street')
                            <p class="mt-1 text-xs text-rose-600">{{ $message }}</p>
                        @enderror
                    </div>

                    <div class="pt-2">
                        <button
                            type="submit"
                            class="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            Save changes
                        </button>
                    </div>
                </form>
            </div>

            <!-- Security & Activity -->
            <div class="space-y-4">
                <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
                    <h2 class="text-sm font-semibold text-slate-900 mb-3">Email &amp; Phone</h2>

                    <form method="POST" action="{{ route('profile.email.request') }}" class="space-y-2 mb-4">
                        @csrf
                        <label class="block text-xs font-semibold text-slate-600 mb-1" for="new_email">
                            Change Email Address
                        </label>
                        <div class="grid gap-1 sm:gap-2 sm:grid-cols-[minmax(0,1.6fr)_auto] items-center">
                            <div>
                                <input
                                    id="new_email"
                                    name="new_email"
                                    type="email"
                                    value="{{ old('new_email') }}"
                                    placeholder="you@example.com"
                                    class="w-full rounded-md border @error('new_email') border-rose-300 @else border-slate-300 @enderror px-3 text-sm h-11 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div class="sm:pl-2">
                                <button
                                    type="submit"
                                    class="inline-flex items-center justify-center px-4 h-11 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium whitespace-nowrap"
                                >
                                    Send verification link
                                </button>
                            </div>
                            <div class="sm:col-span-2">
                                @error('new_email')
                                    <p class="mt-1 text-xs text-rose-600">{{ $message }}</p>
                                @enderror
                            </div>
                        </div>
                    </form>

                    @if($user->pending_email)
                        <form method="POST" action="{{ route('profile.email.resend') }}" class="space-y-1 mb-4">
                            @csrf
                            <p class="text-xs text-slate-500">
                                We have a pending email change to <strong>{{ $user->pending_email }}</strong>. If you did not receive the verification email, you can resend it.
                            </p>
                            <button
                                type="submit"
                                class="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-[0.7rem] font-medium"
                            >
                                Resend verification email
                            </button>
                        </form>
                    @endif

                    <form method="POST" action="{{ route('profile.phone.request') }}" class="space-y-2">
                        @csrf
                        <label class="block text-xs font-semibold text-slate-600 mb-1" for="new_phone">
                            Change Phone Number
                        </label>
                        <div class="grid gap-1 sm:gap-2 sm:grid-cols-[minmax(0,1.6fr)_auto] items-center">
                            <div>
                                <input
                                    id="new_phone"
                                    name="new_phone"
                                    type="text"
                                    value="{{ old('new_phone') }}"
                                    placeholder="+63 9XXXXXXXXX"
                                    class="w-full rounded-md border @error('new_phone') border-rose-300 @else border-slate-300 @enderror px-3 text-sm h-11 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div class="sm:pl-2">
                                <button
                                    type="submit"
                                    class="inline-flex items-center justify-center px-4 h-11 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium whitespace-nowrap"
                                >
                                    Send confirmation email
                                </button>
                            </div>
                            <div class="sm:col-span-2">
                                @error('new_phone')
                                    <p class="mt-1 text-xs text-rose-600">{{ $message }}</p>
                                @enderror
                            </div>
                        </div>
                    </form>
                </div>
                <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
                    <h2 class="text-sm font-semibold text-slate-900 mb-3">Change Password</h2>

                    <form method="POST" action="{{ route('profile.password.change') }}" class="space-y-3">
                        @csrf
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 mb-1" for="current_password">
                                Current Password
                            </label>
                            <input
                                id="current_password"
                                name="current_password"
                                type="password"
                                class="w-full rounded-md border @error('current_password') border-rose-300 @else border-slate-300 @enderror px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                            @error('current_password')
                                <p class="mt-1 text-xs text-rose-600">{{ $message }}</p>
                            @enderror
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-slate-600 mb-1" for="password">
                                New Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                class="w-full rounded-md border @error('password') border-rose-300 @else border-slate-300 @enderror px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                            <p class="mt-1 text-xs text-slate-500">
                                Minimum 8 characters, with at least one uppercase letter, one lowercase letter, and one number.
                            </p>
                            @error('password')
                                <p class="mt-1 text-xs text-rose-600">{{ $message }}</p>
                            @enderror
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-slate-600 mb-1" for="password_confirmation">
                                Confirm New Password
                            </label>
                            <input
                                id="password_confirmation"
                                name="password_confirmation"
                                type="password"
                                class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>

                        <button
                            type="submit"
                            class="inline-flex items-center justify-center px-4 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
                        >
                            Update password
                        </button>
                    </form>
                </div>
            </div>
        </section>
    </main>
</body>
</html>

