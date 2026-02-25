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
@php
    $initials = collect(explode(' ', $user->name ?? 'User'))
        ->map(fn ($part) => mb_substr($part, 0, 1))
        ->take(2)
        ->implode('');
@endphp

    <main class="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {{-- Hero header / module header --}}
        <section class="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-emerald-50/60 border border-slate-200/80 shadow-xl p-6 md:p-8">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div class="flex items-start gap-4">
                    <div class="p-3 bg-emerald-100 rounded-2xl shadow-sm">
                        <span class="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white text-lg font-semibold">
                            {{ $initials }}
                        </span>
                    </div>
                    <div>
                        <h1 class="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                            My Profile
                        </h1>
                        <p class="mt-1 text-sm text-slate-600 max-w-xl">
                            Manage your account information, contact details, and security settings from a single place.
                        </p>
                        <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span class="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-3 py-1 border border-slate-200">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Signed in as <span class="font-semibold text-slate-800">{{ $user->email }}</span>
                            </span>
                            <span class="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-3 py-1 border border-slate-200">
                                Role: <span class="font-semibold text-slate-800 text-[0.7rem] uppercase tracking-wide">{{ $user->role ?? 'User' }}</span>
                            </span>
                        </div>
                    </div>
                </div>
                <div class="flex flex-col items-start md:items-end gap-3">
                    <a href="{{ route('dashboard') }}" class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900">
                        <span class="text-base">←</span>
                        Back to dashboard
                    </a>
                    @if (session('status'))
                        <div class="mt-1 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs text-emerald-800 shadow-sm max-w-xs">
                            {{ session('status') }}
                        </div>
                    @endif
                </div>
            </div>
        </section>

        {{-- Two-column layout: left sub-navigation, right active section content --}}
        <section class="grid gap-6 lg:grid-cols-[240px,minmax(0,1fr)] items-start">
            {{-- Profile sub-navigation --}}
            <aside class="bg-white rounded-2xl shadow-md border border-slate-200 p-4 space-y-4">
                <div>
                    <h2 class="text-xs font-semibold tracking-wide text-slate-500 uppercase mb-2">
                        Manage Profile
                    </h2>
                    <p class="text-xs text-slate-500">
                        Switch between profile details, security, and contact information.
                    </p>
                </div>
                <nav class="space-y-1 text-sm">
                    <a href="#profile-information" class="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 text-white font-medium shadow-sm">
                        <span>Profile Information</span>
                        <span class="text-[10px] uppercase tracking-wide opacity-80">Main</span>
                    </a>
                    <a href="#security" class="block px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                        Security (Change Password)
                    </a>
                    <a href="#email-phone" class="block px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                        Email &amp; Phone
                    </a>
                    <a href="#activity-logs" class="block px-3 py-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                        Activity Logs <span class="ml-1 text-[10px] uppercase tracking-wide text-amber-600">Soon</span>
                    </a>
                </nav>
            </aside>

            {{-- Right column: section content --}}
            <div class="space-y-6">
                {{-- Profile Information --}}
                <section id="profile-information" class="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8 space-y-6">
                    <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div class="relative">
                            <div class="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl sm:text-2xl font-semibold shadow-md">
                                {{ $initials }}
                            </div>
                        </div>
                        <div class="space-y-1">
                            <h2 class="text-lg font-semibold text-slate-900">
                                Profile Information
                            </h2>
                            <p class="text-xs text-slate-500">
                                Update your name and address details. Your contact information is shown to administrators for coordination.
                            </p>
                        </div>
                    </div>

                    <form method="POST" action="{{ route('profile.update') }}" class="space-y-4 max-w-xl">
                        @csrf
                        @method('PUT')

                        <div class="grid gap-4 sm:grid-cols-2">
                            <div class="sm:col-span-2">
                                <label for="name" class="block text-xs font-semibold text-slate-600 mb-1">
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value="{{ old('name', $user->name) }}"
                                    required
                                    class="w-full rounded-lg border @error('name') border-rose-300 @else border-slate-300 @enderror px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                                @error('name')
                                    <p class="mt-1 text-xs text-rose-600">{{ $message }}</p>
                                @enderror
                            </div>

                            <div class="sm:col-span-2">
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
                                    Use the Email &amp; Phone section to request changes and manage verification.
                                </p>
                            </div>

                            <div class="sm:col-span-2">
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

                            <div class="sm:col-span-2">
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
                                    class="w-full rounded-lg border @error('street') border-rose-300 @else border-slate-300 @enderror px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                                @error('street')
                                    <p class="mt-1 text-xs text-rose-600">{{ $message }}</p>
                                @enderror
                            </div>
                        </div>

                        <div class="pt-4 border-t border-slate-100 flex items-center justify-end">
                            <button
                                type="submit"
                                class="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                Save changes
                            </button>
                        </div>
                    </form>
                </section>

                {{-- Security: Change Password --}}
                <section id="security" class="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8 space-y-4">
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <h2 class="text-sm font-semibold text-slate-900">
                                Security
                            </h2>
                            <p class="mt-1 text-xs text-slate-500">
                                Change your password to keep your account secure.
                            </p>
                        </div>
                    </div>

                    <form method="POST" action="{{ route('profile.password.change') }}" class="space-y-3 max-w-md">
                        @csrf
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 mb-1" for="current_password">
                                Current Password
                            </label>
                            <input
                                id="current_password"
                                name="current_password"
                                type="password"
                                class="w-full rounded-lg border @error('current_password') border-rose-300 @else border-slate-300 @enderror px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                                class="w-full rounded-lg border @error('password') border-rose-300 @else border-slate-300 @enderror px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>

                        <div class="pt-2 flex justify-end">
                            <button
                                type="submit"
                                class="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
                            >
                                Update password
                            </button>
                        </div>
                    </form>
                </section>

                {{-- Email & Phone --}}
                <section id="email-phone" class="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8 space-y-6">
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <h2 class="text-sm font-semibold text-slate-900">
                                Email &amp; Phone
                            </h2>
                            <p class="mt-1 text-xs text-slate-500">
                                Request changes to your primary email and phone number. All changes are verified before they go live.
                            </p>
                        </div>
                    </div>

                    <div class="space-y-4">
                        {{-- Change email --}}
                        <form method="POST" action="{{ route('profile.email.request') }}" class="space-y-2">
                            @csrf
                            <label class="block text-xs font-semibold text-slate-600 mb-1" for="new_email">
                                Change Email Address
                            </label>
                            <div class="grid gap-1 sm:gap-2 sm:grid-cols-[minmax(0,1.7fr)_auto] items-center">
                                <div>
                                    <input
                                        id="new_email"
                                        name="new_email"
                                        type="email"
                                        value="{{ old('new_email') }}"
                                        placeholder="you@example.com"
                                        class="w-full rounded-lg border @error('new_email') border-rose-300 @else border-slate-300 @enderror px-3 text-sm h-11 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                                <div class="sm:pl-2">
                                    <button
                                        type="submit"
                                        class="inline-flex items-center justify-center px-4 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold whitespace-nowrap"
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
                            <form method="POST" action="{{ route('profile.email.resend') }}" class="space-y-1">
                                @csrf
                                <p class="text-xs text-slate-500">
                                    We have a pending email change to <strong>{{ $user->pending_email }}</strong>. If you did not receive the verification email, you can resend it.
                                </p>
                                <button
                                    type="submit"
                                    class="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[0.7rem] font-semibold"
                                >
                                    Resend verification email
                                </button>
                            </form>
                        @endif

                        {{-- Change phone --}}
                        <form method="POST" action="{{ route('profile.phone.request') }}" class="space-y-2">
                            @csrf
                            <label class="block text-xs font-semibold text-slate-600 mb-1" for="new_phone">
                                Change Phone Number
                            </label>
                            <div class="grid gap-1 sm:gap-2 sm:grid-cols-[minmax(0,1.7fr)_auto] items-center">
                                <div>
                                    <input
                                        id="new_phone"
                                        name="new_phone"
                                        type="text"
                                        value="{{ old('new_phone') }}"
                                        placeholder="+63 9XXXXXXXXX"
                                        class="w-full rounded-lg border @error('new_phone') border-rose-300 @else border-slate-300 @enderror px-3 text-sm h-11 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                                <div class="sm:pl-2">
                                    <button
                                        type="submit"
                                        class="inline-flex items-center justify-center px-4 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold whitespace-nowrap"
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
                </section>

                {{-- Activity Logs (future-ready placeholder) --}}
                <section id="activity-logs" class="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8 space-y-3">
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <h2 class="text-sm font-semibold text-slate-900">
                                Activity Logs
                            </h2>
                            <p class="mt-1 text-xs text-slate-500">
                                In a future update, this section will show your recent sign-ins and important security events.
                            </p>
                        </div>
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Coming soon
                        </span>
                    </div>
                    <p class="text-xs text-slate-500">
                        For now, administrators can review detailed account activity from the Audit Logs module.
                    </p>
                </section>
            </div>
        </section>
    </main>
</body>
</html>

