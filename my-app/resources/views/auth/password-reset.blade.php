<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>Reset Password - LGU Disaster Preparedness Training</title>
        <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
        @vite(['resources/css/app.css', 'resources/js/auth.jsx'])
    </head>
    <body>
        <div
            id="password-reset-root"
            data-errors='@json($errors->getMessages() ?: [])'
            data-token="{{ $token }}"
            data-email="{{ $email }}"
        ></div>
    </body>
</html>
