<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>Register LGU Admin / Trainer</title>
        <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
        @vite(['resources/css/app.css'])
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

            * {
                font-family: 'Inter', sans-serif;
            }
        </style>
    </head>
    <body class="bg-slate-100 min-h-screen">
        <div class="max-w-4xl mx-auto px-6 py-10">
            <div class="mb-6 flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-semibold text-slate-900 tracking-tight">Register New LGU Admin / Trainer</h1>
                    <p class="text-sm text-slate-600 mt-2">
                        Create a new staff account for the LGU admin dashboard. Login requires email verification and OTP.
                    </p>
                </div>
                <a
                    href="/dashboard"
                    class="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                >
                    ← Back to Dashboard
                </a>
            </div>

            @if (session('status'))
                <div class="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                    {{ session('status') }}
                </div>
            @endif

            @if ($errors->any())
                <div class="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
                    <ul class="list-disc list-inside space-y-0.5">
                        @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            <form
                id="admin-registration-form"
                method="POST"
                action="{{ route('admin.users.store') }}"
                class="space-y-8 bg-white rounded-2xl shadow-lg border border-slate-200 p-8"
            >
                @csrf

                <div class="space-y-4">
                    <h2 class="text-sm font-semibold text-slate-700 tracking-wide uppercase">
                        Account Details
                    </h2>

                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1.5" for="account_type">
                            Account Type
                        </label>
                        <select
                            id="account_type"
                            name="account_type"
                            class="block w-full max-w-xs rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm py-2.5 px-3 bg-white"
                        >
                            <option value="LGU_ADMIN" {{ old('account_type', 'LGU_ADMIN') === 'LGU_ADMIN' ? 'selected' : '' }}>
                                LGU Admin
                            </option>
                            <option value="LGU_TRAINER" {{ old('account_type') === 'LGU_TRAINER' ? 'selected' : '' }}>
                                LGU Trainer
                            </option>
                            <option value="PARTICIPANT" {{ old('account_type') === 'PARTICIPANT' ? 'selected' : '' }}>
                                Participant
                            </option>
                        </select>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1.5" for="last_name">
                                Surname / Last Name
                            </label>
                            <input
                                id="last_name"
                                name="last_name"
                                type="text"
                                value="{{ old('last_name') }}"
                                required
                                class="block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-base py-3 px-3"
                            >
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1.5" for="first_name">
                                First Name
                            </label>
                            <input
                                id="first_name"
                                name="first_name"
                                type="text"
                                value="{{ old('first_name') }}"
                                required
                                class="block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-base py-3 px-3"
                            >
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1.5" for="middle_name">
                                Middle Name (optional)
                            </label>
                            <input
                                id="middle_name"
                                name="middle_name"
                                type="text"
                                value="{{ old('middle_name') }}"
                                class="block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-base py-3 px-3"
                            >
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1.5" for="email">
                            Official LGU Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value="{{ old('email') }}"
                            required
                            class="block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-base py-3 px-3"
                        >
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1.5" for="password">
                            Initial Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            class="block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-base py-3 px-3"
                        >
                        <p class="mt-1 text-xs text-slate-500">
                            Minimum 8 characters. The admin can change this after first login.
                        </p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1.5" for="password_confirmation">
                            Confirm Password
                        </label>
                        <input
                            id="password_confirmation"
                            name="password_confirmation"
                            type="password"
                            required
                            class="block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-base py-3 px-3"
                        >
                    </div>
                </div>

                <div class="flex items-center justify-end pt-4 border-t border-slate-200">
                    <button
                        type="submit"
                        class="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 shadow-sm"
                    >
                        Register Account
                    </button>
                </div>
            </form>
        </div>

        <script></script>
    </body>
</html>

