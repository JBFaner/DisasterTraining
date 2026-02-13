<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>USB Key Verification - Admin</title>
    @vite(['resources/css/app.css'])
</head>
<body class="bg-slate-100 text-slate-900">
    <div class="min-h-screen flex items-center justify-center px-4">
        <div class="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
            <h1 class="text-2xl font-bold mb-4">USB Key Verification</h1>
            <p class="mb-4 text-slate-700">
                Insert your USB drive and upload your Disaster Training key file to complete login.
            </p>

            <form method="POST" action="{{ route('admin.usb.check.post') }}" enctype="multipart/form-data">
                @csrf

                <div class="mb-4">
                    <label class="block text-sm font-medium text-slate-700 mb-1">
                        USB key file
                    </label>
                    <input
                        type="file"
                        name="usb_key_file"
                        required
                        class="block w-full text-sm border border-slate-300 rounded px-3 py-2"
                    />
                    @error('usb_key_file')
                        <div class="mt-1 text-sm text-red-600">{{ $message }}</div>
                    @enderror
                </div>

                <button
                    type="submit"
                    class="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 w-full"
                >
                    Verify and Continue
                </button>
            </form>
        </div>
    </div>
</body>
</html>


