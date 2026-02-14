<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>USB Security Key - Admin</title>
    @vite(['resources/css/app.css'])
</head>
<body class="bg-slate-100 text-slate-900">
    <div class="min-h-screen flex items-center justify-center px-4">
        <div class="w-full max-w-xl bg-white shadow-lg rounded-xl p-8">
            <h1 class="text-2xl font-bold mb-4">USB Security Key</h1>

            @if($user->usb_key_enabled)
                <div class="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p class="text-emerald-800 font-medium mb-2">
                        USB key protection is <strong>enabled</strong> for this account.
                    </p>
                    <p class="text-sm text-emerald-700">
                        Your USB key is active. You can regenerate a new key if your USB is lost, or revoke the current key.
                    </p>
                </div>

                <div class="flex gap-3 mb-6">
                    <form method="POST" action="{{ route('admin.usb.generate') }}" class="inline">
                        @csrf
                        <button
                            type="submit"
                            class="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                        >
                            Regenerate USB Key
                        </button>
                    </form>
                    <form method="POST" action="{{ route('admin.usb.revoke') }}" class="inline" onsubmit="return confirm('Are you sure you want to revoke your USB key? You will need to generate a new key to use USB authentication again.');">
                        @csrf
                        <button
                            type="submit"
                            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                            Revoke USB Key
                        </button>
                    </form>
                </div>
            @else
                <div class="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <p class="text-slate-700 mb-2">
                        USB key protection is currently <strong>disabled</strong>.
                    </p>
                    <p class="text-sm text-slate-600">
                        Generate a USB key file to enable USB-based authentication for faster login.
                    </p>
                </div>

                <form method="POST" action="{{ route('admin.usb.generate') }}">
                    @csrf
                    <button
                        type="submit"
                        class="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                    >
                        Generate USB Key File
                    </button>
                </form>
            @endif

            @if(session('status'))
                <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                    {{ session('status') }}
                </div>
            @endif

            <div class="mt-6">
                <a href="{{ route('dashboard') }}" class="text-sm text-slate-600 hover:text-slate-800">
                    ← Back to Dashboard
                </a>
            </div>
        </div>
    </div>
</body>
</html>


