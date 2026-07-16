<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>Registration Closed</title>
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/campaign-register.jsx'])
    </head>
    <body>
        <div
            id="campaign-register-root"
            data-campaign-context='@json(["campaign_request_id" => $campaign_request_id])'
            data-registration-closed="true"
        ></div>
    </body>
</html>
