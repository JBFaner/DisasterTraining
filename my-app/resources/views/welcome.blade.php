<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Disaster Preparedness Training &amp; Simulation — ALERTARA</title>
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
    @vite(['resources/css/app.css', 'resources/js/landing.js'])
</head>
<body class="bg-slate-50 text-slate-900 antialiased">
    {{-- Replace public/videos/landing-hero.mp4 with your LGU drill footage when ready --}}
    @php
        $heroPoster = asset('images/landing/hero-poster.jpg');
        $heroVideo = asset('videos/landing-hero.mp4');
    @endphp

    <header id="landing-nav" class="landing-nav is-over-hero sticky top-0 z-50 border-b border-transparent">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex h-16 items-center justify-between gap-4">
                <a href="{{ url('/') }}" class="flex items-center gap-3 min-w-0">
                    <img src="{{ asset('images/logo.svg') }}" alt="ALERTARA" class="h-9 w-auto shrink-0">
                    <div class="hidden sm:block min-w-0">
                        <p class="landing-nav-brand-title text-sm font-bold text-slate-900 leading-tight truncate">ALERTARA</p>
                        <p class="landing-nav-brand-sub text-[11px] text-slate-500 leading-tight truncate">Training &amp; Simulation</p>
                    </div>
                </a>

                <nav class="hidden lg:flex items-center gap-6 text-sm font-medium">
                    <a href="#about" class="landing-nav-link text-slate-600 hover:text-emerald-700 transition-colors">About</a>
                    <a href="#trainings" class="landing-nav-link text-slate-600 hover:text-emerald-700 transition-colors">Trainings</a>
                    <a href="#how-it-works" class="landing-nav-link text-slate-600 hover:text-emerald-700 transition-colors">How it works</a>
                    <a href="#announcements" class="landing-nav-link text-slate-600 hover:text-emerald-700 transition-colors">Updates</a>
                </nav>

                <div class="hidden lg:flex items-center gap-2 shrink-0">
                    <a href="{{ url('/participant/login') }}" class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 bg-white/90 rounded-lg hover:bg-white transition-colors">
                        Login
                    </a>
                    <a href="{{ url('/register') }}" class="landing-btn-primary inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">
                        Register
                        <svg class="landing-btn-arrow w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                    </a>
                </div>

                <button type="button" id="mobile-menu-btn" class="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-white/20 text-white hover:bg-white/10" aria-label="Open menu">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
                </button>
            </div>
        </div>
        <div id="mobile-menu" class="hidden lg:hidden border-t border-slate-200 bg-white">
            <div class="px-4 py-3 space-y-1 text-sm">
                <a href="#about" class="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50">About</a>
                <a href="#trainings" class="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50">Trainings</a>
                <a href="#how-it-works" class="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50">How it works</a>
                <a href="#announcements" class="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50">Updates</a>
                <a href="{{ url('/participant/login') }}" class="block px-3 py-2 rounded-lg text-emerald-700 font-medium hover:bg-emerald-50">Participant Login</a>
                <a href="{{ url('/register') }}" class="block px-3 py-2 rounded-lg bg-emerald-600 text-white text-center font-semibold hover:bg-emerald-700">Register</a>
            </div>
        </div>
    </header>

    <main>
        {{-- Hero with video background --}}
        <section id="home" class="landing-hero relative overflow-hidden border-b border-slate-800">
            <div class="absolute inset-0 -z-20">
                <video
                    id="landing-hero-video"
                    class="landing-hero-video absolute inset-0 h-full w-full"
                    autoplay
                    muted
                    loop
                    playsinline
                    poster="{{ $heroPoster }}"
                >
                    <source src="{{ $heroVideo }}" type="video/mp4">
                </video>
                <div id="landing-hero-fallback" class="hidden absolute inset-0">
                    <img src="{{ $heroPoster }}" alt="" class="landing-ken-burns h-full w-full object-cover" aria-hidden="true">
                </div>
            </div>
            <div class="landing-hero-overlay absolute inset-0 -z-10"></div>

            {{-- Ambient blobs --}}
            <div class="pointer-events-none absolute -z-10 top-20 right-10 h-64 w-64 rounded-full bg-emerald-500/20 landing-blob" aria-hidden="true"></div>
            <div class="pointer-events-none absolute -z-10 bottom-10 left-10 h-48 w-48 rounded-full bg-sky-400/15 landing-blob landing-blob-delay" aria-hidden="true"></div>

            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20 relative">
                <div class="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
                    <div class="space-y-6">
                        <div data-landing-hero class="inline-flex items-center gap-3 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 backdrop-blur-sm">
                            <div id="lottie-shield" class="h-7 w-7 shrink-0" aria-hidden="true"></div>
                            <span class="flex items-center gap-2">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                LGU Disaster Preparedness Platform
                            </span>
                        </div>

                        <h1 data-landing-hero class="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                            Preparing communities for emergencies
                        </h1>
                        <p data-landing-hero class="text-base sm:text-lg text-slate-200 max-w-xl leading-relaxed">
                            A centralized platform for disaster preparedness training, simulation drills, evaluations, and digital certification—operated by your Local Government Unit.
                        </p>

                        <div data-landing-hero class="flex flex-col sm:flex-row gap-3">
                            <a href="{{ url('/register') }}" class="landing-btn-primary inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500">
                                Register as participant
                                <svg class="landing-btn-arrow w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                            </a>
                            <a href="{{ url('/participant/login') }}" class="inline-flex items-center justify-center px-5 py-3 text-sm font-semibold text-white border border-white/25 bg-white/10 rounded-lg hover:bg-white/15 backdrop-blur-sm transition-colors">
                                Participant login
                            </a>
                        </div>
                    </div>

                    {{-- Tilt product preview --}}
                    <div data-landing-hero class="relative">
                        <div id="hero-preview" class="landing-preview rounded-2xl border border-white/20 bg-white/95 shadow-2xl overflow-hidden">
                            <div class="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                                <span class="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                                <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                                <span class="ml-2 text-[11px] font-medium text-slate-500">Participant portal preview</span>
                            </div>
                            <div class="p-4 sm:p-5 space-y-3 bg-slate-50/50">
                                <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Dashboard</p>
                                    <p class="mt-1 text-sm font-bold text-slate-900">Training progress &amp; upcoming drills</p>
                                    <div class="mt-3 grid grid-cols-3 gap-2">
                                        <div class="rounded-lg bg-emerald-50 border border-emerald-100 p-2 text-center">
                                            <p class="text-lg font-bold text-emerald-700">3</p>
                                            <p class="text-[10px] text-slate-500">Modules</p>
                                        </div>
                                        <div class="rounded-lg bg-amber-50 border border-amber-100 p-2 text-center">
                                            <p class="text-lg font-bold text-amber-700">1</p>
                                            <p class="text-[10px] text-slate-500">Pending eval</p>
                                        </div>
                                        <div class="rounded-lg bg-sky-50 border border-sky-100 p-2 text-center">
                                            <p class="text-lg font-bold text-sky-700">2</p>
                                            <p class="text-[10px] text-slate-500">Certificates</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div class="flex items-start justify-between gap-2">
                                        <div>
                                            <p class="text-xs font-semibold text-emerald-700">Open training</p>
                                            <p class="text-sm font-semibold text-slate-900 mt-0.5">Earthquake preparedness module</p>
                                        </div>
                                        <span class="shrink-0 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold">Open</span>
                                    </div>
                                    <div class="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                                        <div class="h-full w-2/3 rounded-full bg-emerald-600"></div>
                                    </div>
                                </div>
                                <div class="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4">
                                    <p class="text-xs font-semibold text-emerald-800">Certificate issued</p>
                                    <p class="text-sm text-slate-700 mt-1">Verify, share, or download your LGU certificate after completing drills.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {{-- About --}}
        <section id="about" class="py-14 lg:py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="landing-reveal max-w-2xl mb-10">
                    <p class="text-xs font-semibold uppercase tracking-wide text-emerald-700">About the system</p>
                    <h2 class="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">Built for LGU training operations</h2>
                    <p class="mt-3 text-slate-600">Manage the full preparedness lifecycle—from training modules and campaign registration to simulation drills, evaluations, and certification.</p>
                </div>
                <div class="grid md:grid-cols-3 gap-5">
                    @foreach ([
                        ['icon' => 'book', 'bg' => 'bg-emerald-100', 'text' => 'text-emerald-700', 'title' => 'What it is', 'body' => 'A digital platform to deliver training modules, run simulation events, score participants, and issue verifiable certificates.'],
                        ['icon' => 'users', 'bg' => 'bg-sky-100', 'text' => 'text-sky-700', 'title' => "Who it's for", 'list' => ['LGU staff & trainers', 'Volunteers & responders', 'Students & community members']],
                        ['icon' => 'shield', 'bg' => 'bg-amber-100', 'text' => 'text-amber-700', 'title' => 'Why it exists', 'list' => ['Improve disaster readiness across barangays', 'Run realistic simulation drills with records', 'Track evaluations and issue certificates']],
                    ] as $card)
                        <article class="landing-about-card landing-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div class="w-10 h-10 rounded-xl {{ $card['bg'] }} {{ $card['text'] }} flex items-center justify-center mb-4">
                                @if ($card['icon'] === 'book')
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                                @elseif ($card['icon'] === 'users')
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                @else
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                                @endif
                            </div>
                            <h3 class="text-lg font-semibold text-slate-900">{{ $card['title'] }}</h3>
                            @if (!empty($card['body']))
                                <p class="mt-2 text-sm text-slate-600 leading-relaxed">{{ $card['body'] }}</p>
                            @else
                                <ul class="mt-2 text-sm text-slate-600 space-y-1.5">
                                    @foreach ($card['list'] as $item)
                                        <li class="flex items-center gap-2"><span class="text-emerald-600">✓</span> {{ $item }}</li>
                                    @endforeach
                                </ul>
                            @endif
                        </article>
                    @endforeach
                </div>
            </div>
        </section>

        {{-- Trainings --}}
        <section id="trainings" class="py-14 lg:py-16 bg-white border-y border-slate-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="landing-reveal flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                    <div>
                        <p class="text-xs font-semibold uppercase tracking-wide text-emerald-700">Available programs</p>
                        <h2 class="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">Trainings &amp; simulations</h2>
                        <p class="mt-2 text-slate-600 max-w-2xl">Published training modules from your LGU. Register when a campaign batch is open.</p>
                    </div>
                </div>

                <div class="grid md:grid-cols-2 {{ count($landingTrainings ?? []) >= 4 ? 'xl:grid-cols-4' : 'lg:grid-cols-3' }} gap-5">
                    @forelse (($landingTrainings ?? []) as $training)
                        @php
                            $isOpen = ($training['status'] ?? '') === 'open';
                            $theme = $training['theme'] ?? [];
                            $imageUrl = $training['image_url'] ?? asset('images/landing/training-default.jpg');
                        @endphp
                        <article class="landing-card group rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
                            <div class="relative h-40 overflow-hidden">
                                <img src="{{ $imageUrl }}" alt="" class="landing-card-image h-full w-full object-cover" loading="lazy">
                                <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                                <span class="absolute top-3 right-3 shrink-0 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm {{ $isOpen ? 'bg-emerald-500/90 text-white border-emerald-400' : 'bg-white/90 text-slate-600 border-slate-200' }}">
                                    {{ $training['status_label'] }}
                                </span>
                                <p class="absolute bottom-3 left-4 text-xs font-semibold uppercase tracking-wide text-white/90">{{ $training['category'] ?: 'Training' }}</p>
                            </div>
                            <div class="px-5 py-4 border-b border-slate-100 {{ $theme['accent'] ?? 'bg-emerald-50' }}">
                                <h3 class="text-base font-bold text-slate-900 line-clamp-2">{{ $training['title'] }}</h3>
                            </div>
                            <div class="p-5 flex flex-col flex-1">
                                <p class="text-sm text-slate-600 leading-relaxed flex-1">{{ $training['description'] }}</p>
                                @if (!empty($training['batch_label']) && $isOpen)
                                    <p class="mt-3 text-xs text-slate-500">{{ $training['batch_label'] }}</p>
                                @endif
                                @if (!empty($training['seats_remaining']) && $isOpen)
                                    <p class="mt-1 text-xs font-medium text-amber-700">{{ $training['seats_remaining'] }} seats remaining</p>
                                @endif
                                <div class="mt-4 flex gap-2">
                                    @if ($isOpen && !empty($training['register_url']))
                                        <a href="{{ $training['register_url'] }}" class="landing-btn-primary flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">
                                            Register
                                        </a>
                                        <a href="{{ $training['details_url'] }}" class="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50">
                                            Details
                                        </a>
                                    @else
                                        <span class="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed">
                                            Coming soon
                                        </span>
                                        <a href="{{ url('/participant/login') }}" class="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50">
                                            Login
                                        </a>
                                    @endif
                                </div>
                            </div>
                        </article>
                    @empty
                        <div class="landing-reveal md:col-span-2 lg:col-span-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                            <h3 class="text-lg font-semibold text-slate-800">No published trainings yet</h3>
                            <p class="mt-2 text-sm text-slate-600">Published modules will appear here when your LGU opens registration campaigns.</p>
                            <a href="{{ url('/participant/login') }}" class="landing-btn-primary mt-4 inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">Participant login</a>
                        </div>
                    @endforelse
                </div>
            </div>
        </section>

        {{-- How it works --}}
        <section id="how-it-works" class="py-14 lg:py-16 relative">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="landing-reveal max-w-2xl mb-10">
                    <p class="text-xs font-semibold uppercase tracking-wide text-emerald-700">Participant journey</p>
                    <h2 class="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">How it works</h2>
                    <p class="mt-3 text-slate-600">From registration to verifiable certificate—five clear steps.</p>
                </div>
                <div class="relative">
                    <div class="landing-timeline-line" aria-hidden="true">
                        <div id="landing-timeline-progress" class="landing-timeline-progress"></div>
                    </div>
                    <ol class="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        @foreach ([
                            ['step' => '1', 'title' => 'Register', 'desc' => 'Create your participant account and verify your email.'],
                            ['step' => '2', 'title' => 'Join training', 'desc' => 'Enroll in an open campaign or assigned training module.'],
                            ['step' => '3', 'title' => 'Attend drill', 'desc' => 'Participate in simulation events and mark attendance.'],
                            ['step' => '4', 'title' => 'Get evaluated', 'desc' => 'Complete evaluations for modules and event drills.'],
                            ['step' => '5', 'title' => 'Receive certificate', 'desc' => 'Download, verify, and share your digital LGU certificate.'],
                        ] as $item)
                            <li class="landing-step rounded-2xl border border-slate-200 bg-white p-5 shadow-sm relative z-10">
                                <span class="inline-flex w-8 h-8 items-center justify-center rounded-lg bg-emerald-600 text-white text-sm font-bold">{{ $item['step'] }}</span>
                                <h3 class="mt-3 text-sm font-semibold text-slate-900">{{ $item['title'] }}</h3>
                                <p class="mt-1.5 text-xs text-slate-600 leading-relaxed">{{ $item['desc'] }}</p>
                            </li>
                        @endforeach
                    </ol>
                </div>
            </div>
        </section>

        {{-- Certifications --}}
        <section class="py-14 lg:py-16 bg-white border-y border-slate-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid lg:grid-cols-2 gap-10 items-center">
                    <div class="landing-reveal">
                        <p class="text-xs font-semibold uppercase tracking-wide text-emerald-700">Certifications</p>
                        <h2 class="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">Recognized completion records</h2>
                        <p class="mt-3 text-slate-600">Successful participants receive LGU-issued digital certificates with verification support.</p>
                        <ul class="mt-6 space-y-4">
                            @foreach ([
                                ['title' => 'Digital certificates', 'desc' => 'Official records upon successful completion of training and drills.'],
                                ['title' => 'Verification & QR', 'desc' => 'Third parties can confirm authenticity through verify links and QR codes.'],
                                ['title' => 'Skills documentation', 'desc' => 'Attendance, evaluations, and certificates tracked in your participant portal.'],
                            ] as $benefit)
                                <li class="flex gap-3">
                                    <span class="shrink-0 w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                                    </span>
                                    <div>
                                        <p class="text-sm font-semibold text-slate-900">{{ $benefit['title'] }}</p>
                                        <p class="text-sm text-slate-600">{{ $benefit['desc'] }}</p>
                                    </div>
                                </li>
                            @endforeach
                        </ul>
                    </div>
                    <div class="landing-reveal">
                        <div id="landing-cert-scene" class="landing-cert-scene" tabindex="0" role="button" aria-label="Sample certificate — hover to tilt, click to flip">
                            <div id="landing-cert-flipper" class="landing-cert-flipper">
                                <div id="landing-cert-tilt" class="landing-cert-tilt">
                                    {{-- Front --}}
                                    <article class="landing-cert-face landing-cert-front">
                                        <div id="landing-cert-shine" class="landing-cert-shine" aria-hidden="true"></div>
                                        <div class="landing-cert-inner">
                                            <div class="landing-cert-border">
                                                <div class="landing-cert-content">
                                                    <div class="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p class="text-[10px] uppercase tracking-[0.2em] text-emerald-800/80">Republic of the Philippines</p>
                                                            <p class="text-xs font-semibold text-slate-800 mt-0.5">Local Government Unit</p>
                                                            <p class="text-[10px] text-slate-500">Disaster Preparedness Office</p>
                                                        </div>
                                                        <div class="landing-cert-seal" aria-hidden="true">
                                                            <span class="text-[8px] font-bold uppercase tracking-wide text-emerald-900">LGU</span>
                                                        </div>
                                                    </div>

                                                    <div class="text-center my-4 sm:my-5">
                                                        <p class="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-emerald-700 font-semibold">Certificate of Completion</p>
                                                        <p class="text-[10px] text-slate-500 mt-2">This certifies that</p>
                                                        <p class="text-lg sm:text-xl font-bold text-slate-900 mt-1 font-serif tracking-tight">Maria Clara Santos</p>
                                                        <p class="text-[10px] sm:text-xs text-slate-500 mt-3 max-w-xs mx-auto leading-relaxed">
                                                            has successfully completed the training and simulation requirements for
                                                        </p>
                                                        <p class="text-sm sm:text-base font-semibold text-emerald-800 mt-2 leading-snug">Earthquake Preparedness &amp; Evacuation Drill</p>
                                                    </div>

                                                    <div class="grid grid-cols-2 gap-3 text-[10px] sm:text-xs border-t border-emerald-100 pt-3 mt-auto">
                                                        <div>
                                                            <p class="text-slate-400 uppercase tracking-wide">Event date</p>
                                                            <p class="font-medium text-slate-800 mt-0.5">March 15, 2026</p>
                                                        </div>
                                                        <div>
                                                            <p class="text-slate-400 uppercase tracking-wide">Certificate no.</p>
                                                            <p class="font-mono font-medium text-slate-800 mt-0.5">CERT-2026-004821</p>
                                                        </div>
                                                    </div>

                                                    <div class="flex items-end justify-between gap-3 mt-4 pt-3 border-t border-dashed border-emerald-200/80">
                                                        <div class="space-y-3 flex-1">
                                                            <div>
                                                                <div class="h-px w-28 bg-slate-400"></div>
                                                                <p class="text-[9px] text-slate-500 mt-1">LGU Trainer / Facilitator</p>
                                                            </div>
                                                            <div>
                                                                <div class="h-px w-28 bg-slate-400"></div>
                                                                <p class="text-[9px] text-slate-500 mt-1">LGU Administrator</p>
                                                            </div>
                                                        </div>
                                                        <div class="shrink-0 text-center">
                                                            <div class="landing-cert-qr bg-white p-1 border border-slate-200 rounded" aria-hidden="true">
                                                                <svg viewBox="0 0 64 64" class="w-14 h-14 sm:w-16 sm:h-16 text-slate-900">
                                                                    <rect width="64" height="64" fill="white"/>
                                                                    <path fill="currentColor" d="M8 8h16v16H8V8zm4 4v8h8v-8h-8zm20-4h16v16H32V8zm4 4v8h8v-8h-8zM8 32h16v16H8V32zm4 4v8h8v-8h-8zm12 0h4v4h-4v-4zm8 0h4v4h-4v-4zm8 0h4v4h-4v-4zm-8 8h4v4h-4v-4zm8-8h4v4h-4v-4zm0 8h4v4h-4v-4zm8-8h8v8h-8v-8zm0 12h4v4h-4v-4zm-12 4h4v4h-4v-4zM32 32h16v16H32V32zm4 4v8h8v-8h-8z"/>
                                                                </svg>
                                                            </div>
                                                            <p class="text-[8px] text-slate-400 mt-1">Scan to verify</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </article>

                                    {{-- Back --}}
                                    <article class="landing-cert-face landing-cert-back">
                                        <div class="landing-cert-inner landing-cert-inner-back">
                                            <div class="landing-cert-border">
                                                <div class="landing-cert-content text-center">
                                                    <p class="text-xs uppercase tracking-[0.2em] text-emerald-700 font-semibold">Verification record</p>
                                                    <p class="text-sm font-bold text-slate-900 mt-2">ALERTARA Digital Certificate</p>
                                                    <p class="text-xs text-slate-500 mt-1">Sample data for demonstration only</p>

                                                    <div class="mt-5 rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3 text-left text-xs space-y-2">
                                                        <div class="flex justify-between gap-2"><span class="text-slate-500">Status</span><span class="font-semibold text-emerald-700">Valid</span></div>
                                                        <div class="flex justify-between gap-2"><span class="text-slate-500">Issued</span><span class="font-medium text-slate-800">Mar 15, 2026</span></div>
                                                        <div class="flex justify-between gap-2"><span class="text-slate-500">Participant</span><span class="font-medium text-slate-800">Maria Clara Santos</span></div>
                                                        <div class="flex justify-between gap-2"><span class="text-slate-500">Program</span><span class="font-medium text-slate-800 text-right">Earthquake Preparedness</span></div>
                                                    </div>

                                                    <div class="mt-5 mx-auto w-fit landing-cert-qr bg-white p-2 border border-slate-200 rounded-lg" aria-hidden="true">
                                                        <svg viewBox="0 0 64 64" class="w-20 h-20 text-slate-900">
                                                            <rect width="64" height="64" fill="white"/>
                                                            <path fill="currentColor" d="M8 8h16v16H8V8zm4 4v8h8v-8h-8zm20-4h16v16H32V8zm4 4v8h8v-8h-8zM8 32h16v16H8V32zm4 4v8h8v-8h-8zm12 0h4v4h-4v-4zm8 0h4v4h-4v-4zm8 0h4v4h-4v-4zm-8 8h4v4h-4v-4zm8-8h4v4h-4v-4zm0 8h4v4h-4v-4zm8-8h8v8h-8v-8zm0 12h4v4h-4v-4zm-12 4h4v4h-4v-4zM32 32h16v16H32V32zm4 4v8h8v-8h-8z"/>
                                                        </svg>
                                                    </div>
                                                    <p class="text-[10px] font-mono text-slate-500 mt-3 break-all">verify.alertara.local/CERT-2026-004821</p>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                </div>
                            </div>
                        </div>
                        <p class="text-center text-xs text-slate-500 mt-4">
                            <span class="hidden sm:inline">Hover to tilt</span><span class="hidden sm:inline"> · </span>Click to flip
                        </p>
                    </div>
                </div>
            </div>
        </section>

        {{-- Announcements --}}
        <section id="announcements" class="py-14 lg:py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="landing-reveal max-w-2xl mb-8">
                    <p class="text-xs font-semibold uppercase tracking-wide text-emerald-700">Updates</p>
                    <h2 class="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">Announcements &amp; notices</h2>
                    <p class="mt-3 text-slate-600">Live updates from open campaigns and upcoming simulation events.</p>
                </div>
                @if (count($landingAnnouncements ?? []) > 0)
                    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        @foreach ($landingAnnouncements as $notice)
                            @php
                                $toneClass = match ($notice['tone'] ?? 'slate') {
                                    'amber' => 'border-amber-200 bg-amber-50/50',
                                    'sky' => 'border-sky-200 bg-sky-50/50',
                                    default => 'border-slate-200 bg-white',
                                };
                            @endphp
                            <a href="{{ $notice['href'] ?? '#' }}" class="landing-notice block rounded-2xl border p-5 shadow-sm {{ $toneClass }}">
                                <p class="text-xs text-slate-500">{{ $notice['date_label'] ?? '' }}</p>
                                <h3 class="mt-1 text-base font-semibold text-slate-900">{{ $notice['title'] }}</h3>
                                <p class="mt-2 text-sm text-slate-600">{{ $notice['message'] }}</p>
                            </a>
                        @endforeach
                    </div>
                @else
                    <div class="landing-reveal rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
                        No active announcements right now. Check back when new training campaigns or events are published.
                    </div>
                @endif
            </div>
        </section>
    </main>

    <footer class="border-t border-slate-800 bg-slate-900 text-slate-300 py-12">
        @php
            $pilot = config('pilot.contact', []);
            $pilotEmail = $pilot['email'] ?? 'disaster.preparedness@lgu.gov.ph';
            $pilotPhone = $pilot['phone_landline'] ?? '(02) 8287-6248';
            $pilotPhoneMobile = $pilot['phone_mobile'] ?? '0919-064-7974';
            $pilotAddress = $pilot['address_full'] ?? 'Barangay Hall, San Agustin, Novaliches, Quezon City 1123';
            $mapsUrl = 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode($pilot['maps_query'] ?? 'Barangay San Agustin Hall Novaliches Quezon City');
        @endphp
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                <div>
                    <div class="flex items-center gap-3 mb-4">
                        <img src="{{ asset('images/logo.svg') }}" alt="ALERTARA" class="h-9 w-auto">
                        <span class="text-white font-bold">LGU ALERTARA</span>
                    </div>
                    <p class="text-sm leading-relaxed text-slate-400">
                        Building safer, more resilient communities through disaster preparedness training and simulation programs.
                        <span class="block mt-2 text-emerald-400/90 font-medium">{{ config('pilot.barangay_name') }}, {{ config('pilot.district') }} — pilot site.</span>
                    </p>
                </div>
                <div>
                    <h4 class="text-white font-semibold mb-4 text-sm">Quick links</h4>
                    <ul class="space-y-2 text-sm">
                        <li><a href="#home" class="hover:text-emerald-400 transition-colors">Home</a></li>
                        <li><a href="#about" class="hover:text-emerald-400 transition-colors">About the program</a></li>
                        <li><a href="#trainings" class="hover:text-emerald-400 transition-colors">Trainings &amp; drills</a></li>
                        <li><a href="#how-it-works" class="hover:text-emerald-400 transition-colors">How it works</a></li>
                        <li><a href="{{ url('/register') }}" class="hover:text-emerald-400 transition-colors">Register</a></li>
                        <li><a href="{{ url('/participant/login') }}" class="hover:text-emerald-400 transition-colors">Participant login</a></li>
                        <li><a href="{{ url('/admin/login') }}" class="hover:text-emerald-400 transition-colors">LGU admin login</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="text-white font-semibold mb-4 text-sm">Contact information</h4>
                    <ul class="space-y-3 text-sm text-slate-400">
                        <li class="flex gap-2.5">
                            <svg class="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                            <a href="mailto:{{ $pilotEmail }}" class="hover:text-emerald-400 transition-colors break-all">{{ $pilotEmail }}</a>
                        </li>
                        <li class="flex gap-2.5">
                            <svg class="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                            <span>
                                <a href="tel:+63282876248" class="hover:text-emerald-400 transition-colors">{{ $pilotPhone }}</a>
                                <span class="text-slate-500"> · </span>
                                <a href="tel:+639190647974" class="hover:text-emerald-400 transition-colors">{{ $pilotPhoneMobile }}</a>
                            </span>
                        </li>
                        <li class="flex gap-2.5">
                            <svg class="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            <a href="{{ $mapsUrl }}" target="_blank" rel="noopener noreferrer" class="hover:text-emerald-400 transition-colors leading-relaxed">{{ $pilotAddress }}</a>
                        </li>
                    </ul>
                </div>
                <div>
                    <h4 class="text-white font-semibold mb-4 text-sm">Legal</h4>
                    <ul class="space-y-2 text-sm">
                        <li><a href="{{ route('privacy') }}" class="hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
                        <li><a href="{{ route('terms') }}" class="hover:text-emerald-400 transition-colors">Terms &amp; Conditions</a></li>
                        <li><a href="{{ route('data.protection') }}" class="hover:text-emerald-400 transition-colors">Data Protection</a></li>
                        <li><a href="{{ route('accessibility') }}" class="hover:text-emerald-400 transition-colors">Accessibility</a></li>
                    </ul>
                </div>
            </div>
            <div class="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
                <p>&copy; {{ date('Y') }} {{ config('pilot.barangay_name') }}, Quezon City — Disaster Preparedness &amp; BDRRM (Pilot). All rights reserved.</p>
                <p class="mt-1">Powered by LGU ALERTARA — Building resilient communities</p>
            </div>
        </div>
    </footer>
</body>
</html>
