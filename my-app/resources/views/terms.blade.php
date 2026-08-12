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
                Last updated: August 12, 2026
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
                        Last updated <span class="font-medium">August 12, 2026</span>
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
                    data-section-target="data-backup"
                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 text-slate-600 border border-transparent hover:border-emerald-200 hover:text-emerald-700"
                >
                    <span>Data &amp; Backups</span>
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
                    <div class="border-l-2 border-emerald-100 pl-4 space-y-3">
                        <h3 class="text-sm font-semibold text-slate-900">
                            What the System Provides
                        </h3>
                        <p class="text-sm text-slate-600">
                            ALERtARA is a web-based platform used by Local Government Units (LGUs) and partners for disaster preparedness training and simulation operations, including:
                        </p>
                        <div class="grid sm:grid-cols-2 gap-3 text-sm text-slate-600">
                            <div>
                                <p class="font-semibold text-slate-800 mb-1">Admin &amp; LGU tools</p>
                                <ul class="list-disc pl-5 space-y-1">
                                    <li>Operations dashboard, KPIs, and hazard analytics;</li>
                                    <li>Training modules with lessons, resources, and optional AI-assisted content generation;</li>
                                    <li>AI scenario training, final assessments, and lesson quiz generator workflows;</li>
                                    <li>Scenario design, simulation exercise templates, and event planning from approved campaigns;</li>
                                    <li>Simulation event lifecycle, monitoring, attendance, and evaluations;</li>
                                    <li>Certification templates, issuance, revocation, and export;</li>
                                    <li>Resource inventory, budget proposals, hazard assessment profiles;</li>
                                    <li>Audit logs and in-app database backup &amp; recovery.</li>
                                </ul>
                            </div>
                            <div>
                                <p class="font-semibold text-slate-800 mb-1">Participant portal &amp; public features</p>
                                <ul class="list-disc pl-5 space-y-1">
                                    <li>Personal dashboard, training progress, and in-app notifications;</li>
                                    <li>Lesson completion, AI scenario attempts, and lesson quizzes;</li>
                                    <li>Event registration, self check-in, attendance, and My Trainings;</li>
                                    <li>Evaluation results, attempt history, and portfolio export;</li>
                                    <li>Digital certificates with verify/share/email options;</li>
                                    <li>Public certificate verification and campaign registration pages.</li>
                                </ul>
                            </div>
                        </div>
                        <p class="text-xs text-slate-500">
                            Access depends on your role, LGU configuration, campaign approval status, and module or event publication state. Not all features are available to every user.
                        </p>
                    </div>
                </div>

                <!-- Accounts & responsibilities -->
                <div id="terms-section-accounts" data-section-id="accounts" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                    <h2 class="text-base sm:text-lg font-semibold text-slate-900 mb-1">
                        User Accounts &amp; Responsibilities
                    </h2>
                    <p class="text-sm text-slate-600">
                        The System supports role-based access for LGU Admin, Lead Trainer, LGU Trainer, Evaluator, Staff, Viewer, and Participants.
                        Each role has scoped permissions. Administrators and trainers may be required to complete email OTP verification at login.
                        Participants must verify their email during registration before full access.
                    </p>
                    <div class="grid sm:grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <h3 class="text-sm font-semibold text-slate-900">Account Security</h3>
                            <p class="text-sm text-slate-600">
                                Keep your username, password, and one-time verification codes private. Do not share credentials.
                                The System may log you out after inactivity. Where enabled, login may also use the AlerTara Centralized Login System.
                                Report suspected unauthorized access to your LGU administrator immediately.
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
                                <li>Using the System for official training, simulation, and LGU preparedness programs;</li>
                                <li>Creating, reviewing, and publishing training content through approved workflows;</li>
                                <li>Registering and managing participants, attendance, evaluations, and certifications accurately;</li>
                                <li>Exporting reports, evaluation portfolios, and certificates for legitimate government use;</li>
                                <li>Verifying certificates through official verification links or QR codes.</li>
                            </ul>
                        </div>
                        <div class="rounded-xl border border-rose-100 bg-rose-50/70 p-4 space-y-2">
                            <h3 class="text-sm font-semibold text-rose-800 flex items-center gap-2">
                                <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                Prohibited
                            </h3>
                            <ul class="text-sm text-rose-900 list-disc pl-5 space-y-1">
                                <li>Attempting to bypass security, campaign locks, or role-based access controls;</li>
                                <li>Uploading malicious files, harmful code, or intentionally inaccurate records;</li>
                                <li>Sharing your account or using someone else’s credentials;</li>
                                <li>Using exported data, certificates, or reports outside approved LGU or program use;</li>
                                <li>Impersonating others or falsifying attendance, evaluation, or certification data;</li>
                                <li>Treating AI-generated drafts or simulation content as official emergency orders without review.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Training, AI, and certificates -->
                <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                    <h2 class="text-base sm:text-lg font-semibold text-slate-900 mb-1">
                        Training Content, AI Tools &amp; Certificates
                    </h2>
                    <p class="text-sm text-slate-600">
                        Training modules, scenarios, quizzes, simulation plans, evaluations, and certificates are for
                        <strong class="font-semibold text-slate-800">training and preparedness purposes only</strong>.
                        They do not replace official emergency response procedures, government warnings, or incident command authority.
                    </p>
                    <div class="grid sm:grid-cols-2 gap-4 text-sm text-slate-600">
                        <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
                            <h3 class="font-semibold text-slate-900">AI-assisted features</h3>
                            <p>
                                Where enabled, AI may help generate modules, scenarios, quizzes, or planning drafts.
                                Authorized personnel remain responsible for reviewing and approving content before publication.
                                AI outputs may contain errors and must not be relied on without human verification.
                            </p>
                        </div>
                        <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
                            <h3 class="font-semibold text-slate-900">Certificates &amp; verification</h3>
                            <p>
                                Certificates are digital records of program completion or participation as defined by the issuing LGU.
                                The System may provide printable views, verification URLs, QR codes, and email delivery.
                                Revoked certificates must not be represented as valid. Use only official verification links for confirmation.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Data backup & retention -->
                <div id="terms-section-data-backup" data-section-id="data-backup" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                    <h2 class="text-base sm:text-lg font-semibold text-slate-900 mb-1">
                        Data Backup, Retention &amp; Recovery
                    </h2>
                    <p class="text-sm text-slate-600">
                        The System may create application database backups (.sql dumps) automatically after important
                        operational events and on a configured schedule, and authorized administrators may create,
                        download, delete, or restore backups from the Backup &amp; Recovery module.
                    </p>
                    <div class="grid sm:grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <h3 class="text-sm font-semibold text-slate-900">What in-app backups cover</h3>
                            <p class="text-sm text-slate-600">
                                In-app backups cover the application database used for training records, participants,
                                events, evaluations, certifications, and related operational data. They do not replace
                                full hosting or VPS backups (application files, SSL certificates, server configuration).
                            </p>
                        </div>
                        <div class="space-y-2">
                            <h3 class="text-sm font-semibold text-slate-900">Hosting / CyberPanel recovery</h3>
                            <p class="text-sm text-slate-600">
                                Full site or server disaster recovery remains the responsibility of the hosting
                                environment (for example CyberPanel / Hostinger). Administrators should maintain
                                off-server copies of critical backups where required by LGU policy.
                            </p>
                        </div>
                        <div class="space-y-2">
                            <h3 class="text-sm font-semibold text-slate-900">Restore caution</h3>
                            <p class="text-sm text-slate-600">
                                Restoring a database backup overwrites current application data. Only authorized
                                LGU administrators should perform restores, and only after confirming the correct
                                backup file. A safety backup is created before in-app restore when possible.
                            </p>
                        </div>
                        <div class="space-y-2">
                            <h3 class="text-sm font-semibold text-slate-900">Retention</h3>
                            <p class="text-sm text-slate-600">
                                The System may keep a limited number of recent backup files (configurable by
                                administrators). Older files may be pruned automatically. Retention does not guarantee
                                indefinite storage; follow LGU records and data privacy requirements for official archives.
                            </p>
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
                            of 2012 and its implementing rules. This may include identity and contact information,
                            attendance and evaluation records, certificate details, audit logs, and usage data needed
                            to operate the Service. See our
                            <a href="{{ route('privacy') }}" class="text-emerald-700 font-medium hover:text-emerald-800 underline-offset-2 hover:underline">Privacy Policy</a>
                            for details and your rights as a data subject.
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
                                Access is limited to LGU‑approved administrators, trainers, evaluators, staff, viewers, and registered participants.
                                Public pages (such as certificate verification and campaign registration) are available where published by the LGU.
                                Shared accounts are not allowed so that attendance, evaluation, and audit records stay accurate.
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
                                    Are AI-generated quizzes and scenarios official instructions?
                                </span>
                                <span class="text-xs text-slate-400 group-open:rotate-180 transition-transform">⌃</span>
                            </summary>
                            <p class="mt-2 text-xs text-slate-600">
                                No. AI-assisted content is a drafting and training aid. Authorized LGU personnel must review and approve
                                published materials. During real emergencies, follow official LGU and government instructions—not simulation content alone.
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
