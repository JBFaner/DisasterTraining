<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>Campaign Registration</title>
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/campaign-register.jsx'])
    </head>
    <body>
        <div
            id="campaign-register-root"
            data-campaign-context='@json($campaign_context ?? null)'
            data-already-registered='@json($already_registered ?? false)'
            data-authenticated='@json($authenticated ?? false)'
            data-errors='@json($errors->getMessages() ?: [])'
        ></div>
    </body>
</html>
