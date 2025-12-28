<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>LGU Disaster Preparedness Training & Simulation</title>
        <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    </head>
    <body class="bg-slate-100 text-slate-900">
        <div
            id="app"
            data-role="{{ auth()->check() ? (auth()->user()->role ?? 'PARTICIPANT') : 'PARTICIPANT' }}"
            data-section="{{ $section ?? 'dashboard' }}"
            @isset($modules)
                data-modules='@json($modules)'
            @endisset
            @isset($module)
                data-module='@json($module)'
            @endisset
            @isset($scenarios)
                data-scenarios='@json($scenarios)'
            @endisset
            @isset($scenario)
                data-scenario='@json($scenario)'
            @endisset
            @isset($events)
                data-events='@json($events)'
            @endisset
            @isset($event)
                data-event='@json($event)'
            @endisset
            @isset($participants)
                data-participants='@json($participants)'
            @endisset
            @isset($participant)
                data-participant='@json($participant)'
            @endisset
            @isset($registrations)
                data-registrations='@json($registrations)'
            @endisset
            @isset($resources)
                data-resources='@json($resources)'
            @endisset
            @isset($resource)
                data-resource='@json($resource)'
            @endisset
            @if (session('status'))
                data-status="{{ session('status') }}"
            @endif
        ></div>
    </body>
</html>


