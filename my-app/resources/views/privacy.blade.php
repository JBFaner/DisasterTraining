<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Privacy Policy - Disaster Preparedness Training</title>
    @vite(['resources/css/app.css'])
</head>
<body class="bg-slate-50 text-slate-900">
    <div class="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <a href="{{ url('/') }}" class="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800">
                    <span class="text-lg">←</span>
                    <span>Back to home</span>
                </a>
                <span class="hidden sm:inline text-xs text-slate-400">/</span>
                <span class="hidden sm:inline text-xs font-semibold text-emerald-700">Privacy Policy</span>
            </div>
            <span class="hidden sm:inline text-xs text-slate-500">
                Last updated: {{ now()->format('F j, Y') }}
            </span>
        </div>
    </div>

    <main class="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <section class="rounded-2xl bg-white shadow-sm border border-slate-100 p-6 sm:p-8 space-y-4">
            <h1 class="text-2xl font-bold text-slate-900">Privacy Policy</h1>
            <p class="text-sm text-slate-600">
                This page will describe how the Disaster Preparedness Training &amp; Simulation System collects,
                uses, and protects personal information in line with the Data Privacy Act of 2012. You can work with
                your LGU’s Data Protection Officer to finalize the full text here.
            </p>
        </section>
    </main>
</body>
</html>

