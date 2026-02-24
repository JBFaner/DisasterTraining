<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Data Protection - Disaster Preparedness Training</title>
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
                <span class="hidden sm:inline text-xs font-semibold text-emerald-700">Data Protection</span>
            </div>
            <span class="hidden sm:inline text-xs text-slate-500">
                Last updated: {{ now()->format('F j, Y') }}
            </span>
        </div>
    </div>

    <main class="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <section class="rounded-2xl bg-white shadow-sm border border-slate-100 p-6 sm:p-8 space-y-4">
            <h1 class="text-2xl font-bold text-slate-900">Data Protection Statement</h1>
            <p class="text-sm text-slate-600">
                The Disaster Preparedness Training &amp; Simulation System is operated in coordination with Local
                Government Units (LGUs) and follows the principles of the Data Privacy Act of 2012 (Republic Act
                No. 10173). This page explains, in practical terms, how personal data is protected when the system
                is used for training, simulation events, and related administrative activities.
            </p>

            <div class="grid md:grid-cols-2 gap-6 text-sm text-slate-700">
                <div class="space-y-2">
                    <h2 class="text-sm font-semibold text-slate-900">What information we handle</h2>
                    <p>
                        Depending on your role (administrator, trainer, or participant), the system may store basic
                        profile details such as your name, contact information, role, training participation history,
                        attendance, and certifications issued.
                    </p>
                </div>
                <div class="space-y-2">
                    <h2 class="text-sm font-semibold text-slate-900">Why the data is collected</h2>
                    <p>
                        Information is used to manage training programs, register participants, record attendance,
                        generate evaluations and certificates, and produce summary reports that help improve disaster
                        preparedness activities.
                    </p>
                </div>
                <div class="space-y-2">
                    <h2 class="text-sm font-semibold text-slate-900">How the data is protected</h2>
                    <p>
                        Access to the system is role‑based. Only authorized users can view or update sensitive
                        information needed for their duties. System activity is logged, and administrative accounts
                        may require additional verification methods such as one‑time passwords or USB keys.
                    </p>
                </div>
                <div class="space-y-2">
                    <h2 class="text-sm font-semibold text-slate-900">Retention and disposal</h2>
                    <p>
                        Records are retained only for as long as needed for training, reporting, and legal
                        requirements. When data is no longer required, it is scheduled for secure deletion or
                        anonymization according to LGU policies.
                    </p>
                </div>
            </div>

            <div class="space-y-2 pt-4 border-t border-slate-100">
                <h2 class="text-sm font-semibold text-slate-900">Your rights and contact</h2>
                <p class="text-sm text-slate-600">
                    Data subjects may have rights to access, correct, or request deletion of their personal data,
                    subject to applicable laws and government records policies. For questions or requests related to
                    data protection, please contact your LGU’s designated Data Protection Officer or the system
                    administrator.
                </p>
            </div>
        </section>
    </main>
</body>
</html>

