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
                <p class="mb-4 text-green-700">
                    USB key protection is <strong>enabled</strong> for this account.
                </p>
                <p class="mb-4 text-sm text-slate-600">
                    You can regenerate the key if your USB is lost. Remember to update the file on your USB drive.
                </p>
            @else
                <p class="mb-4 text-slate-700">
                    USB key protection is currently <strong>disabled</strong>.
                </p>
            @endif

            <form method="POST" action="{{ route('admin.usb.generate') }}">
                @csrf
                <button
                    type="submit"
                    class="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                >
                    Generate USB Key File
                </button>
            </form>

            <div class="mt-6">
                <a href="{{ route('dashboard') }}" class="text-sm text-slate-600 hover:text-slate-800">
                    ← Back to Dashboard
                </a>
            </div>
        </div>
    </div>
</body>
</html>


