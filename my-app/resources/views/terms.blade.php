<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Terms of Service - Disaster Preparedness Training</title>
    @vite(['resources/css/app.css'])
</head>
<body class="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
    <!-- Top bar / breadcrumb -->
    <div class="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <a href="{{ url('/') }}" class="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800">
                    <span class="text-lg">←</span>
                    <span>Back to home</span>
                </a>
                <span class="hidden sm:inline text-xs text-slate-400">/</span>
                <button
                    type="button"
                    id="terms-help-link"
                    class="hidden sm:inline text-xs text-emerald-700 hover:text-emerald-800 underline-offset-2 hover:underline"
                >
                    Help &amp; Support
                </button>
                <span class="hidden sm:inline text-xs text-slate-400">/</span>
                <span class="hidden sm:inline text-xs font-semibold text-emerald-700">Terms of Service</span>
            </div>
            <span class="hidden sm:inline text-xs text-slate-500">
                Last updated: {{ now()->format('F j, Y') }}
            </span>
        </div>
    </div>

    <main class="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <!-- Hero / header card -->
        <section class="rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500 text-white shadow-lg">
            <div class="px-6 sm:px-10 py-8 sm:py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                    <p class="text-xs font-semibold uppercase tracking-widest text-emerald-100 mb-2">
                        Disaster Preparedness Training &amp; Simulation
                    </p>
                    <h1 class="text-2xl sm:text-3xl font-bold mb-2">
                        Terms of Service
                    </h1>
                    <p class="text-sm sm:text-base text-emerald-50 max-w-2xl">
                        These terms explain how the system can be used by administrators, trainers, and participants.
                        We wrote them to be clear, practical, and supportive of safe training operations.
                    </p>
                </div>
                <div class="flex flex-col items-start md:items-end gap-2 text-xs sm:text-sm">
                    <div class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 border border-emerald-300/40">
                        <span class="w-2 h-2 rounded-full bg-emerald-200"></span>
                        <span>Operational use only</span>
                    </div>
                    <p class="text-emerald-100">
                        Last updated <span class="font-medium">{{ now()->format('F j, Y') }}</span>
                    </p>
                </div>
            </div>
        </section>

        <!-- Section chips (clickable navigation) -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-100 px-4 py-3">
            <div class="flex flex-wrap gap-2 text-xs sm:text-sm" id="terms-section-chips">
                <button
                    type="button"
                    data-section-target="overview"
                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200"
                >
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Overview</span>
                </button>
                <button
                    type="button"
                    data-section-target="accounts"
                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 text-slate-600 border border-transparent hover:border-emerald-200 hover:text-emerald-700"
                >
                    <span>Accounts &amp; Responsibilities</span>
                </button>
                <button
                    type="button"
                    data-section-target="acceptable-use"
                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 text-slate-600 border border-transparent hover:border-emerald-200 hover:text-emerald-700"
                >
                    <span>Acceptable Use</span>
                </button>
                <button
                    type="button"
                    data-section-target="system-liability"
                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 text-slate-600 border border-transparent hover:border-emerald-200 hover:text-emerald-700"
                >
                    <span>System &amp; Liability</span>
                </button>
                <button
                    type="button"
                    data-section-target="faqs"
                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 text-slate-600 border border-transparent hover:border-emerald-200 hover:text-emerald-700"
                >
                    <span>FAQs</span>
                </button>
            </div>
        </section>

        <!-- Main content grid -->
        <section id="terms-main-grid" class="grid gap-6 items-start">
            <!-- Left: core terms, partitioned into blocks -->
            <div class="space-y-6">
                <!-- Acceptance & Purpose -->
                <div id="terms-section-overview" data-section-id="overview" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                    <div class="flex items-start gap-3">
                        <div class="mt-1 h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 text-lg">
                            <span>✓</span>
                        </div>
                        <div>
                            <h2 class="text-base sm:text-lg font-semibold text-slate-900 mb-1">
                                Acceptance of Terms
                            </h2>
                            <p class="text-sm text-slate-600">
                                By accessing and using the Disaster Preparedness Training and Simulation System
                                (“System”), you agree to follow these Terms of Service and all applicable laws of
                                the Republic of the Philippines. If you do not agree with these terms, please
                                stop using the System.
                            </p>
                        </div>
                    </div>
                    <div class="border-l-2 border-emerald-100 pl-4 space-y-2">
                        <h3 class="text-sm font-semibold text-slate-900">
                            System Purpose
                        </h3>
                        <p class="text-sm text-slate-600">
                            The System is a web‑based platform used by Local Government Units (LGUs) and partners to:
                        </p>
                        <ul class="text-sm text-slate-600 list-disc pl-5 space-y-1">
                            <li>Design and deliver disaster preparedness and response training modules;</li>
                            <li>Plan and manage simulation events and scenario‑based exercises;</li>
                            <li>Register participants and track attendance, lesson completion, and certifications;</li>
                            <li>Manage resources, equipment, and barangay‑level profiles for training purposes;</li>
                            <li>Support evaluation, reporting, and continuous improvement of preparedness programs.</li>
                        </ul>
                    </div>
                </div>

                <!-- Accounts & responsibilities -->
                <div id="terms-section-accounts" data-section-id="accounts" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                    <h2 class="text-base sm:text-lg font-semibold text-slate-900 mb-1">
                        User Accounts &amp; Responsibilities
                    </h2>
                    <p class="text-sm text-slate-600">
                        The System supports different roles such as LGU administrators, trainers, and participants.
                        Each role has specific permissions, but all users share responsibilities for accuracy and security.
                    </p>
                    <div class="grid sm:grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <h3 class="text-sm font-semibold text-slate-900">Account Security</h3>
                            <p class="text-sm text-slate-600">
                                Keep your username, password, and any verification tools (OTP, USB keys) private.
                                Inform your LGU administrator immediately if you suspect unauthorized access or
                                account misuse.
                            </p>
                        </div>
                        <div class="space-y-2">
                            <h3 class="text-sm font-semibold text-slate-900">Accurate Information</h3>
                            <p class="text-sm text-slate-600">
                                Provide complete and accurate information when creating or updating your account.
                                This helps ensure that training records, participation, and certifications
                                reflect real activities.
                            </p>
                        </div>
                        <div class="space-y-2">
                            <h3 class="text-sm font-semibold text-slate-900">Authorized Use Only</h3>
                            <p class="text-sm text-slate-600">
                                Use the System only for official disaster preparedness and related training
                                activities. Personal projects, unrelated commercial use, or any harmful behavior
                                are not permitted.
                            </p>
                        </div>
                        <div class="space-y-2">
                            <h3 class="text-sm font-semibold text-slate-900">Account Suspension or Termination</h3>
                            <p class="text-sm text-slate-600">
                                System administrators may suspend or deactivate accounts that violate these terms,
                                compromise security, or interfere with the safe operation of the System.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Acceptable use -->
                <div id="terms-section-acceptable-use" data-section-id="acceptable-use" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                    <h2 class="text-base sm:text-lg font-semibold text-slate-900 mb-1">
                        Acceptable Use Policy
                    </h2>
                    <p class="text-sm text-slate-600">
                        To keep the System safe and reliable, please follow these practical do’s and don’ts.
                    </p>
                    <div class="grid sm:grid-cols-2 gap-4">
                        <div class="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 space-y-2">
                            <h3 class="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Permitted
                            </h3>
                            <ul class="text-sm text-emerald-900 list-disc pl-5 space-y-1">
                                <li>Using the System for official training and simulation events;</li>
                                <li>Registering and managing participants in line with LGU policies;</li>
                                <li>Accurately recording attendance, evaluations, and certifications;</li>
                                <li>Exporting reports and certificates for legitimate government use.</li>
                            </ul>
                        </div>
                        <div class="rounded-xl border border-rose-100 bg-rose-50/70 p-4 space-y-2">
                            <h3 class="text-sm font-semibold text-rose-800 flex items-center gap-2">
                                <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                Prohibited
                            </h3>
                            <ul class="text-sm text-rose-900 list-disc pl-5 space-y-1">
                                <li>Attempting to bypass security or access data you are not authorized to see;</li>
                                <li>Uploading malicious files, harmful code, or intentionally inaccurate records;</li>
                                <li>Sharing your account or using someone else’s credentials;</li>
                                <li>Using exported data for purposes outside approved government or LGU use;</li>
                                <li>Impersonating other users or falsifying attendance or evaluation data.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- System / Liability / Privacy / Changes / Law -->
                <div id="terms-section-system-liability" data-section-id="system-liability" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
                    <div class="space-y-2">
                        <h2 class="text-base sm:text-lg font-semibold text-slate-900 mb-1">
                            System Availability
                        </h2>
                        <p class="text-sm text-slate-600">
                            We aim to keep the System available and responsive. However, there may be scheduled
                            maintenance or unforeseen technical issues when the System is temporarily unavailable.
                            When possible, planned downtime will be communicated in advance.
                        </p>
                    </div>
                    <div class="space-y-2">
                        <h2 class="text-base sm:text-lg font-semibold text-slate-900 mb-1">
                            Limitation of Liability
                        </h2>
                        <p class="text-sm text-slate-600">
                            To the extent allowed by law, the LGU, AlertaraQC, and authorized personnel are not
                            liable for indirect, incidental, or consequential damages arising from the use or
                            unavailability of the System. The System is a support tool and does not replace official
                            emergency response procedures or command structures.
                        </p>
                    </div>
                    <div class="space-y-2">
                        <h2 class="text-base sm:text-lg font-semibold text-slate-900 mb-1">
                            Privacy &amp; Data Protection
                        </h2>
                        <p class="text-sm text-slate-600">
                            Personal information is collected and processed in accordance with the Data Privacy Act
                            of 2012 and its implementing rules. The System’s Privacy Policy explains what data is
                            collected, how it is used, and your rights as a data subject.
                        </p>
                    </div>
                    <div class="space-y-2">
                        <h2 class="text-base sm:text-lg font-semibold text-slate-900 mb-1">
                            Updates to These Terms
                        </h2>
                        <p class="text-sm text-slate-600">
                            These Terms may change as policies, features, or legal requirements evolve. Significant
                            updates will be communicated through system notices or official channels. Continued use
                            of the System after changes take effect means you accept the updated Terms.
                        </p>
                    </div>
                    <div class="space-y-2">
                        <h2 class="text-base sm:text-lg font-semibold text-slate-900 mb-1">
                            Governing Law
                        </h2>
                        <p class="text-sm text-slate-600">
                            These Terms are governed by the laws of the Republic of the Philippines. Disputes will
                            be handled in accordance with applicable government policies and, where necessary, the
                            appropriate courts with jurisdiction.
                        </p>
                    </div>
                    <div class="border-t border-slate-100 pt-4">
                        <p class="text-sm text-slate-700 font-medium">
                            By using the Disaster Preparedness Training and Simulation System, you confirm that you
                            have read, understood, and agree to these Terms of Service.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Right: summary / Help & Support / FAQs -->
            <aside class="space-y-5" id="terms-section-faqs" data-section-id="faqs">
                <!-- Quick summary card -->
                <div class="bg-emerald-900 text-emerald-50 rounded-2xl shadow-md p-6 space-y-3">
                    <h2 class="text-sm font-semibold tracking-wide uppercase text-emerald-100">
                        Key points at a glance
                    </h2>
                    <p class="text-sm text-emerald-50">
                        This page highlights the main ideas in plain language to make the terms easier to understand.
                        If there is any difference between this summary and formal LGU issuances, the official policies
                        and laws will prevail.
                    </p>
                </div>

                <!-- Help & Support style section -->
                <div id="help-support-section" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                    <div>
                        <h2 class="text-sm font-semibold text-slate-900">
                            Help &amp; Support
                        </h2>
                        <p class="mt-1 text-xs text-slate-500">
                            If you need assistance with your account, training schedules, or technical issues,
                            use any of the channels below.
                        </p>
                    </div>
                    <div class="grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-3">
                        <div class="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-4 flex flex-col gap-1">
                            <div class="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                Email
                            </div>
                            <div class="text-sm font-medium text-slate-900">
                                General inquiries
                            </div>
                            <a href="mailto:support@example.gov.ph" class="text-xs text-emerald-700 font-medium hover:text-emerald-800">
                                support@example.gov.ph
                            </a>
                        </div>
                        <div class="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-4 flex flex-col gap-1">
                            <div class="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                Phone
                            </div>
                            <div class="text-sm font-medium text-slate-900">
                                Office hours
                            </div>
                            <p class="text-xs text-slate-600">
                                Mon–Fri, 8:00 AM–5:00 PM
                            </p>
                            <p class="text-xs font-semibold text-emerald-700">
                                (02) 0000-0000
                            </p>
                        </div>
                        <div class="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-4 flex flex-col gap-1">
                            <div class="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                Office
                            </div>
                            <div class="text-sm font-medium text-slate-900">
                                On-site support
                            </div>
                            <p class="text-xs text-slate-600">
                                Visit your LGU Disaster Risk Reduction and Management Office during office hours.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Expanded FAQs -->
                <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                    <h2 class="text-sm font-semibold text-slate-900">
                        Frequently Asked Questions
                    </h2>
                    <p class="text-xs text-slate-500">
                        Quick answers to common questions about access, security, and how your information is used.
                    </p>
                    <div class="space-y-2 text-sm text-slate-700">
                        <details class="group rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                            <summary class="flex items-center justify-between cursor-pointer list-none">
                                <span class="font-medium text-slate-900">
                                    Who is allowed to use the System?
                                </span>
                                <span class="text-xs text-slate-400 group-open:rotate-180 transition-transform">⌃</span>
                            </summary>
                            <p class="mt-2 text-xs text-slate-600">
                                Access is limited to LGU‑approved administrators, trainers, and registered participants.
                                Guest or shared accounts are not allowed so that activity logs and records stay accurate.
                            </p>
                        </details>

                        <details class="group rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                            <summary class="flex items-center justify-between cursor-pointer list-none">
                                <span class="font-medium text-slate-900">
                                    Can I share my login with a colleague?
                                </span>
                                <span class="text-xs text-slate-400 group-open:rotate-180 transition-transform">⌃</span>
                            </summary>
                            <p class="mt-2 text-xs text-slate-600">
                                No. Each user must have their own account. Sharing credentials can lead to incorrect
                                attendance, certification, and audit records and may result in account actions.
                            </p>
                        </details>

                        <details class="group rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                            <summary class="flex items-center justify-between cursor-pointer list-none">
                                <span class="font-medium text-slate-900">
                                    How is my information protected?
                                </span>
                                <span class="text-xs text-slate-400 group-open:rotate-180 transition-transform">⌃</span>
                            </summary>
                            <p class="mt-2 text-xs text-slate-600">
                                The System follows the Data Privacy Act of 2012 and uses role‑based access, logging,
                                and technical safeguards. Only authorized personnel can see sensitive information needed
                                for their role.
                            </p>
                        </details>

                        <details class="group rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                            <summary class="flex items-center justify-between cursor-pointer list-none">
                                <span class="font-medium text-slate-900">
                                    Who can I contact if I have concerns?
                                </span>
                                <span class="text-xs text-slate-400 group-open:rotate-180 transition-transform">⌃</span>
                            </summary>
                            <p class="mt-2 text-xs text-slate-600">
                                For usage or account questions, contact your LGU system administrator or focal person.
                                For privacy‑related concerns, reach out to the designated Data Protection Officer of
                                your LGU or the system operator.
                            </p>
                        </details>
                    </div>
                </div>
            </aside>
        </section>
    </main>

    <script>
        (function () {
            const chipsContainer = document.getElementById('terms-section-chips');
            if (!chipsContainer) return;

            const chips = Array.from(chipsContainer.querySelectorAll('[data-section-target]'));
            const sections = Array.from(document.querySelectorAll('[data-section-id]'));
            const helpLink = document.getElementById('terms-help-link');

            const visibilityMap = {
                overview: ['overview', 'accounts', 'acceptable-use', 'system-liability'],
                accounts: ['accounts'],
                'acceptable-use': ['acceptable-use'],
                'system-liability': ['system-liability'],
                faqs: ['faqs'],
            };

            const setActiveChip = (id) => {
                chips.forEach((chip) => {
                    const isActive = chip.getAttribute('data-section-target') === id;
                    chip.classList.toggle('bg-emerald-50', isActive);
                    chip.classList.toggle('text-emerald-700', isActive);
                    chip.classList.toggle('border-emerald-200', isActive);
                    chip.classList.toggle('bg-slate-50', !isActive);
                    chip.classList.toggle('text-slate-600', !isActive);
                    chip.classList.toggle('border-transparent', !isActive);
                });
            };

            const setVisibleSections = (id) => {
                const allowed = visibilityMap[id] || [];
                sections.forEach((section) => {
                    const sectionId = section.getAttribute('data-section-id');
                    const shouldShow = allowed.includes(sectionId);
                    section.classList.toggle('hidden', !shouldShow);
                });
            };

            chips.forEach((chip) => {
                chip.addEventListener('click', () => {
                    const targetId = chip.getAttribute('data-section-target');
                    setActiveChip(targetId);
                    setVisibleSections(targetId);

                    const firstVisible = document.querySelector('[data-section-id="' + targetId + '"]');
                    if (firstVisible) {
                        const rect = firstVisible.getBoundingClientRect();
                        const offset = rect.top + window.scrollY - 96; // account for top bar
                        window.scrollTo({ top: offset, behavior: 'smooth' });
                    }
                });
            });

            // Breadcrumb "Help & Support" jumps to Help & Support inside FAQs
            if (helpLink) {
                helpLink.addEventListener('click', () => {
                    setActiveChip('faqs');
                    setVisibleSections('faqs');
                    const target = document.getElementById('help-support-section');
                    if (target) {
                        const rect = target.getBoundingClientRect();
                        const offset = rect.top + window.scrollY - 96;
                        window.scrollTo({ top: offset, behavior: 'smooth' });
                    }
                });
            }

            // Initial state: Overview shows main terms sections only
            setActiveChip('overview');
            setVisibleSections('overview');
        })();
    </script>
</body>
</html>
