<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>Registration Successful</title>
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/campaign-register.jsx'])
    </head>
    <body>
        <div
            id="campaign-register-success-root"
            data-campaign-context='@json($campaign_context ?? null)'
        ></div>
    </body>
</html>
