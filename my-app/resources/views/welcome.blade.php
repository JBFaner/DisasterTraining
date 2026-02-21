<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LGU Disaster Preparedness Training & Simulation System</title>
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        * {
            font-family: 'Inter', sans-serif;
        }
        
        .hero-bg {
            position: relative;
            background-image: url('{{ asset('images/hero-training.jpg') }}');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
        }
        
        .hero-bg::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(20, 30, 48, 0.9) 0%, rgba(36, 59, 85, 0.85) 50%, rgba(58, 118, 117, 0.8) 100%);
            z-index: 1;
        }
        
        .hero-content {
            position: relative;
            z-index: 2;
        }
        
        .section-bg {
            background-image: linear-gradient(rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.95)), url('{{ asset('images/pexels-vladbagacian-1368382.jpg') }}');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
        }
        
        .gradient-text {
            background: linear-gradient(135deg, #3a7675 0%, #2d5a59 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .card-hover {
            transition: all 0.3s ease;
        }
        
        .card-hover:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        
        .pulse-animation {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
            0%, 100% {
                opacity: 1;
            }
            50% {
                opacity: .7;
            }
        }
        
        .scroll-smooth {
            scroll-behavior: smooth;
        }
        
        nav {
            backdrop-filter: blur(10px);
            background-color: rgba(255, 255, 255, 0.9);
        }
        
        /* Scroll-based reveal (Apple-style) */
        .scroll-reveal {
            opacity: 0;
            transform: translateY(40px);
            transition: opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .scroll-reveal.is-visible {
            opacity: 1;
            transform: translateY(0);
        }
        .scroll-reveal-delay-1 { transition-delay: 0.1s; }
        .scroll-reveal-delay-2 { transition-delay: 0.2s; }
        .scroll-reveal-delay-3 { transition-delay: 0.3s; }
        
        /* Section decorative backgrounds – colors match image backgrounds */
        .section-about-bg {
            background-color: #f8f8f8;
            position: relative;
            overflow: hidden;
        }
        .section-about-bg .section-bg-image-right {
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            width: 58%;
            max-width: 780px;
            background-image: url('{{ asset('images/Firehat.png') }}');
            background-size: contain;
            background-position: right center;
            background-repeat: no-repeat;
            opacity: 0;
            transform: translateX(24px) scale(0.96);
            transition: opacity 1s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .section-about-bg.section-image-visible .section-bg-image-right {
            opacity: 0.92;
            transform: translateX(0) scale(1);
        }
        .section-trainings-bg {
            background-color: #F1F1F1;
            position: relative;
            overflow: hidden;
        }
        .section-trainings-bg .section-bg-image-left {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 68%;
            max-width: 920px;
            background-image: url('{{ asset('images/Whistle.png') }}');
            background-size: contain;
            background-position: left top;
            background-repeat: no-repeat;
            opacity: 0;
            transform: translateX(-24px) scale(0.96);
            transition: opacity 1s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .section-trainings-bg .section-bg-image-left::after {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            background: linear-gradient(to right, transparent 15%, #F1F1F1 70%, #F1F1F1 100%);
            pointer-events: none;
        }
        .section-trainings-bg.section-image-visible .section-bg-image-left {
            opacity: 0.92;
            transform: translateX(0) scale(1);
        }
        .section-how-it-works-bg {
            background: linear-gradient(
                180deg,
                #f4f7f6 0%,
                #e6f0ee 40%,
                #dcebea 100%
            );
            position: relative;
        }
        .how-it-works-card {
            transition: box-shadow 0.3s ease;
        }
        .how-it-works-card:hover {
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.12), 0 8px 20px rgba(0, 0, 0, 0.08);
        }
        /* How It Works: single stacked cards, reveal 1→5 on scroll (CodePen-style) */
        .how-it-works-stack-container {
            position: relative;
            height: 520vh;
        }
        @media (max-width: 768px) {
            .how-it-works-stack-container {
                height: 420vh;
            }
        }
        .how-it-works-stack {
            position: sticky;
            top: 5rem;
            min-height: calc(100vh - 6rem);
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding: 6rem 1rem 2rem 1rem;
            box-sizing: border-box;
        }
        .how-it-works-stack-heading {
            flex-shrink: 0;
            text-align: center;
            padding-bottom: 2rem;
        }
        .how-it-works-stack-cards {
            position: relative;
            width: 100%;
            max-width: 52rem;
            height: 480px;
        }
        .how-it-works-stack-cards .stack-card {
            position: absolute;
            left: 50%;
            top: 50%;
            max-width: 52rem;
            padding: 2.75rem 3rem;
            border-radius: 1rem;
            border: 1px solid rgba(0, 0, 0, 0.06);
            transition: transform 1s cubic-bezier(0.33, 1, 0.68, 1), box-shadow 0.3s ease;
            will-change: transform;
        }
        .how-it-works-stack-cards .stack-card h3 {
            font-size: 1.75rem;
            font-weight: 700;
            margin-bottom: 0.75rem;
            letter-spacing: -0.02em;
        }
        .how-it-works-stack-cards .stack-card p {
            font-size: 1.125rem;
            line-height: 1.5;
            color: #4b5563;
        }
        .how-it-works-stack-cards .stack-card.bg-teal-50 p {
            color: #4b5563;
        }
        .how-it-works-stack-cards .stack-card.bg-gradient-to-r p {
            color: rgba(255, 255, 255, 0.9);
        }
        .how-it-works-stack-cards .stack-card:nth-child(1) {
            z-index: 1;
            width: 100%;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.04);
            transform: translate(-50%, -50%) rotate(-0.5deg);
        }
        .how-it-works-stack-cards .stack-card:nth-child(2) {
            z-index: 2;
            width: 96%;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08), 0 4px 10px rgba(0, 0, 0, 0.05);
            transform: translate(-50%, -50%) translateY(120%) rotate(0.5deg);
        }
        .how-it-works-stack-cards .stack-card:nth-child(3) {
            z-index: 3;
            width: 92%;
            box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1), 0 6px 14px rgba(0, 0, 0, 0.06);
            transform: translate(-50%, -50%) translateY(120%) rotate(-0.5deg);
        }
        .how-it-works-stack-cards .stack-card:nth-child(4) {
            z-index: 4;
            width: 88%;
            box-shadow: 0 16px 36px rgba(0, 0, 0, 0.11), 0 8px 18px rgba(0, 0, 0, 0.07);
            transform: translate(-50%, -50%) translateY(120%) rotate(0.5deg);
        }
        .how-it-works-stack-cards .stack-card:nth-child(5) {
            z-index: 5;
            width: 84%;
            box-shadow: 0 20px 44px rgba(0, 0, 0, 0.14), 0 10px 22px rgba(0, 0, 0, 0.08);
            transform: translate(-50%, -50%) translateY(120%) rotate(-0.5deg);
            border-color: rgba(0, 0, 0, 0.12);
            background: linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #115e59 100%);
        }
        .how-it-works-stack-cards.reveal-2 .stack-card:nth-child(2) { transform: translate(-50%, -50%) rotate(0.5deg); }
        .how-it-works-stack-cards.reveal-3 .stack-card:nth-child(2) { transform: translate(-50%, -50%) rotate(0.5deg); }
        .how-it-works-stack-cards.reveal-3 .stack-card:nth-child(3) { transform: translate(-50%, -50%) rotate(-0.5deg); }
        .how-it-works-stack-cards.reveal-4 .stack-card:nth-child(2) { transform: translate(-50%, -50%) rotate(0.5deg); }
        .how-it-works-stack-cards.reveal-4 .stack-card:nth-child(3) { transform: translate(-50%, -50%) rotate(-0.5deg); }
        .how-it-works-stack-cards.reveal-4 .stack-card:nth-child(4) { transform: translate(-50%, -50%) rotate(0.5deg); }
        .how-it-works-stack-cards.reveal-5 .stack-card:nth-child(2) { transform: translate(-50%, -50%) rotate(0.5deg); }
        .how-it-works-stack-cards.reveal-5 .stack-card:nth-child(3) { transform: translate(-50%, -50%) rotate(-0.5deg); }
        .how-it-works-stack-cards.reveal-5 .stack-card:nth-child(4) { transform: translate(-50%, -50%) rotate(0.5deg); }
        .how-it-works-stack-cards.reveal-5 .stack-card:nth-child(5) { transform: translate(-50%, -50%) rotate(-0.5deg); }
        @media (max-width: 768px) {
            .how-it-works-stack-cards { max-width: 100%; height: 400px; }
            .how-it-works-stack-cards .stack-card { max-width: 100%; padding: 2rem 1.5rem; }
            .how-it-works-stack-cards .stack-card h3 { font-size: 1.5rem; }
            .how-it-works-stack-cards .stack-card p { font-size: 1rem; }
        }
        @media (max-width: 640px) {
            .how-it-works-stack-cards .stack-card:nth-child(1) { width: 100%; }
            .how-it-works-stack-cards .stack-card:nth-child(2) { width: 98%; }
            .how-it-works-stack-cards .stack-card:nth-child(3) { width: 96%; }
            .how-it-works-stack-cards .stack-card:nth-child(4) { width: 94%; }
            .how-it-works-stack-cards .stack-card:nth-child(5) { width: 92%; }
            .how-it-works-stack-cards .stack-card { padding: 1.75rem 1.25rem; }
            .how-it-works-stack-cards .stack-card h3 { font-size: 1.35rem; }
        }
    </style>
</head>
<body class="scroll-smooth">
    
    <!-- 1️⃣ Header / Navigation Bar -->
    <nav class="fixed top-0 left-0 right-0 z-50 shadow-md">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-20">
                <!-- Logo and System Name -->
                <div class="flex items-center space-x-4">
                    <img src="{{ asset('images/logo.svg') }}" alt="LGU Logo" class="h-12 w-auto">
                    <div class="hidden md:block">
                        <h1 class="text-lg font-bold text-gray-800 leading-tight">
                            LGU Disaster Preparedness<br>
                            <span class="text-sm font-normal text-gray-600">Training & Simulation System</span>
                        </h1>
                    </div>
                </div>
                
                <!-- Navigation Links -->
                <div class="hidden lg:flex items-center space-x-8">
                    <a href="#home" class="text-gray-700 hover:text-teal-700 font-medium transition">Home</a>
                    <a href="#about" class="text-gray-700 hover:text-teal-700 font-medium transition">About</a>
                    <a href="#trainings" class="text-gray-700 hover:text-teal-700 font-medium transition">Trainings & Drills</a>
                    <a href="#how-it-works" class="text-gray-700 hover:text-teal-700 font-medium transition">How It Works</a>
                    <a href="/participant/login" class="text-teal-700 hover:text-teal-800 font-semibold transition">Login</a>
                    <a href="/register" class="bg-teal-700 text-white px-6 py-2.5 rounded-lg hover:bg-teal-800 font-semibold transition shadow-md">
                        Register
                    </a>
                </div>
                
                <!-- Mobile Menu Button -->
                <div class="lg:hidden">
                    <button id="mobile-menu-btn" class="text-gray-700 hover:text-teal-700 focus:outline-none">
                        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Mobile Menu -->
        <div id="mobile-menu" class="hidden lg:hidden bg-white border-t">
            <div class="px-4 pt-2 pb-4 space-y-2">
                <a href="#home" class="block px-3 py-2 text-gray-700 hover:bg-teal-50 rounded-md">Home</a>
                <a href="#about" class="block px-3 py-2 text-gray-700 hover:bg-teal-50 rounded-md">About</a>
                <a href="#trainings" class="block px-3 py-2 text-gray-700 hover:bg-teal-50 rounded-md">Trainings & Drills</a>
                <a href="#how-it-works" class="block px-3 py-2 text-gray-700 hover:bg-teal-50 rounded-md">How It Works</a>
                <a href="/participant/login" class="block px-3 py-2 text-teal-700 font-semibold hover:bg-teal-50 rounded-md">Login</a>
                <a href="/register" class="block px-3 py-2 bg-teal-700 text-white text-center rounded-md hover:bg-teal-800">Register</a>
            </div>
        </div>
    </nav>
    
    <!-- 2️⃣ Hero Section -->
    <section id="home" class="hero-bg min-h-screen flex items-center justify-center pt-20">
        <div class="hero-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <div class="animate-fade-in">
                <h1 class="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight drop-shadow-2xl">
                    Preparing Communities<br>for Emergencies
                </h1>
                <p class="text-xl md:text-2xl text-white/95 mb-12 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
                    A centralized platform for disaster preparedness training, simulation drills, evaluation, and certification conducted by the Local Government Unit.
                </p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <a href="/participant/register" class="bg-white text-teal-700 px-10 py-4 rounded-lg text-lg font-bold hover:bg-gray-100 transition shadow-xl hover:shadow-2xl transform hover:scale-105">
                        ✅ Register as Participant
                    </a>
                    <a href="/participant/login" class="bg-white/10 backdrop-blur-md text-white border-2 border-white/50 px-10 py-4 rounded-lg text-lg font-bold hover:bg-white/20 transition shadow-xl">
                        LOGIN
                    </a>
                </div>
                
                <!-- Scroll Down Indicator -->
                <div class="mt-16 pulse-animation">
                    <a href="#about" class="text-white text-sm uppercase tracking-wider flex flex-col items-center">
                        <span class="mb-2">Learn More</span>
                        <svg class="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    </section>
    
    <!-- 3️⃣ About the System -->
    <section id="about" class="section-about-bg py-20">
        <div class="section-bg-image-right" aria-hidden="true"></div>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div class="text-center mb-16 scroll-reveal">
                <h2 class="text-4xl md:text-5xl font-extrabold gradient-text mb-4">
                    About the System
                </h2>
                <p class="text-xl text-gray-600 max-w-3xl mx-auto">
                    Building resilient communities through comprehensive disaster preparedness training and realistic simulation exercises.
                </p>
            </div>
            
            <div class="grid md:grid-cols-3 gap-8 mb-12">
                <!-- What it is -->
                <div class="bg-white p-8 rounded-2xl shadow-lg card-hover scroll-reveal scroll-reveal-delay-1">
                    <div class="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                        <svg class="w-8 h-8 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-4 text-center">What It Is</h3>
                    <p class="text-gray-600 text-center leading-relaxed">
                        A comprehensive digital platform designed to manage, track, and conduct disaster preparedness training and simulation drills for the entire community.
                    </p>
                </div>
                
                <!-- Who it's for -->
                <div class="bg-white p-8 rounded-2xl shadow-lg card-hover scroll-reveal scroll-reveal-delay-2">
                    <div class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                        <svg class="w-8 h-8 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-4 text-center">Who It's For</h3>
                    <ul class="text-gray-600 space-y-2">
                        <li class="flex items-center">
                            <span class="text-teal-600 mr-2">✓</span> LGU Staff
                        </li>
                        <li class="flex items-center">
                            <span class="text-teal-600 mr-2">✓</span> Volunteers
                        </li>
                        <li class="flex items-center">
                            <span class="text-teal-600 mr-2">✓</span> Students
                        </li>
                        <li class="flex items-center">
                            <span class="text-teal-600 mr-2">✓</span> Community Members
                        </li>
                    </ul>
                </div>
                
                <!-- Why it exists -->
                <div class="bg-white p-8 rounded-2xl shadow-lg card-hover scroll-reveal scroll-reveal-delay-3">
                    <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                        <svg class="w-8 h-8 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-4 text-center">Why It Exists</h3>
                    <ul class="text-gray-600 space-y-2">
                        <li class="flex items-center">
                            <span class="text-red-600 mr-2">•</span> Improve disaster readiness
                        </li>
                        <li class="flex items-center">
                            <span class="text-red-600 mr-2">•</span> Conduct realistic simulations
                        </li>
                        <li class="flex items-center">
                            <span class="text-red-600 mr-2">•</span> Track training progress
                        </li>
                        <li class="flex items-center">
                            <span class="text-red-600 mr-2">•</span> Issue certifications
                        </li>
                    </ul>
                </div>
                <div class="how-it-works-media-layer image-layer" id="how-it-works-image-layer"></div>
            </div>
            <div class="how-it-works-media-layer layer-3" id="how-it-works-layer3"></div>
        </div>
    </section>
    
    <!-- 4️⃣ Available Disaster Trainings & Simulations -->
    <section id="trainings" class="section-trainings-bg py-20">
        <div class="section-bg-image-left" aria-hidden="true"></div>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div class="text-center mb-16 scroll-reveal">
                <h2 class="text-4xl md:text-5xl font-extrabold gradient-text mb-4">
                    Available Trainings & Simulations
                </h2>
                <p class="text-xl text-gray-600 max-w-3xl mx-auto">
                    Join our comprehensive disaster preparedness programs designed to save lives and protect communities.
                </p>
            </div>
            
            <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <!-- Earthquake -->
                <div class="bg-white rounded-2xl shadow-lg overflow-hidden card-hover scroll-reveal scroll-reveal-delay-1">
                    <div class="h-48 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                        <svg class="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                    </div>
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-3">
                            <span class="bg-orange-100 text-orange-800 text-xs font-semibold px-3 py-1 rounded-full">OPEN</span>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-3">🟠 Earthquake Preparedness</h3>
                        <p class="text-gray-600 mb-4 text-sm leading-relaxed">
                            Learn essential earthquake safety procedures, drop-cover-hold techniques, and evacuation protocols.
                        </p>
                        <div class="flex gap-2">
                            <a href="/register" class="flex-1 bg-teal-700 text-white text-center px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-800 transition">
                                Register
                            </a>
                            <button class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                                Details
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Fire -->
                <div class="bg-white rounded-2xl shadow-lg overflow-hidden card-hover scroll-reveal scroll-reveal-delay-2">
                    <div class="h-48 bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                        <svg class="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd"/>
                        </svg>
                    </div>
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-3">
                            <span class="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">UPCOMING</span>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-3">🔴 Fire Evacuation Training</h3>
                        <p class="text-gray-600 mb-4 text-sm leading-relaxed">
                            Master fire safety measures, proper use of fire extinguishers, and safe evacuation procedures.
                        </p>
                        <div class="flex gap-2">
                            <button class="flex-1 bg-gray-300 text-gray-600 text-center px-4 py-2 rounded-lg text-sm font-semibold cursor-not-allowed">
                                Coming Soon
                            </button>
                            <button class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                                Details
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Flood -->
                <div class="bg-white rounded-2xl shadow-lg overflow-hidden card-hover scroll-reveal scroll-reveal-delay-3">
                    <div class="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                        <svg class="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M5.5 3A2.5 2.5 0 003 5.5v9A2.5 2.5 0 005.5 17h9a2.5 2.5 0 002.5-2.5v-9A2.5 2.5 0 0014.5 3h-9zm0 2h9a.5.5 0 01.5.5v7a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5v-7a.5.5 0 01.5-.5z" clip-rule="evenodd"/>
                        </svg>
                    </div>
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-3">
                            <span class="bg-orange-100 text-orange-800 text-xs font-semibold px-3 py-1 rounded-full">OPEN</span>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-3">🔵 Flood Response Simulation</h3>
                        <p class="text-gray-600 mb-4 text-sm leading-relaxed">
                            Understand flood preparedness, water rescue basics, and emergency response during flooding.
                        </p>
                        <div class="flex gap-2">
                            <a href="/register" class="flex-1 bg-teal-700 text-white text-center px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-800 transition">
                                Register
                            </a>
                            <button class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                                Details
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- First Aid -->
                <div class="bg-white rounded-2xl shadow-lg overflow-hidden card-hover scroll-reveal">
                    <div class="h-48 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                        <svg class="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z"/>
                        </svg>
                    </div>
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-3">
                            <span class="bg-orange-100 text-orange-800 text-xs font-semibold px-3 py-1 rounded-full">OPEN</span>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-3">🟢 First Aid & Rescue</h3>
                        <p class="text-gray-600 mb-4 text-sm leading-relaxed">
                            Training in emergency first aid, CPR, basic life support, and rescue operations.
                        </p>
                        <div class="flex gap-2">
                            <a href="/register" class="flex-1 bg-teal-700 text-white text-center px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-800 transition">
                                Register
                            </a>
                            <button class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                                Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <!-- 5️⃣ How the System Works (stacked cards, reveal 1→5 on scroll – CodePen-style) -->
    <section id="how-it-works" class="section-how-it-works-bg py-16">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="how-it-works-stack-container" id="how-it-works-stack-container">
                <div class="how-it-works-stack">
                    <div class="how-it-works-stack-heading scroll-reveal">
                        <h2 class="text-4xl md:text-5xl font-extrabold gradient-text mb-4">How It Works</h2>
                        <p class="text-xl text-gray-600 max-w-3xl mx-auto">Simple, transparent process from registration to certification</p>
                    </div>
                    <div class="how-it-works-stack-cards reveal-1" id="how-it-works-stack-cards">
                    <div class="stack-card bg-teal-50 how-it-works-card">
                        <h3 class="text-2xl font-bold text-teal-800 mb-2">1. Register as Participant</h3>
                        <p class="text-gray-700">Create your account with basic information and verify your identity.</p>
                    </div>
                    <div class="stack-card bg-teal-50 how-it-works-card">
                        <h3 class="text-2xl font-bold text-teal-800 mb-2">2. Join a Training or Drill</h3>
                        <p class="text-gray-700">Browse available events and register for the training programs you're interested in.</p>
                    </div>
                    <div class="stack-card bg-teal-50 how-it-works-card">
                        <h3 class="text-2xl font-bold text-teal-800 mb-2">3. Attend the Simulation</h3>
                        <p class="text-gray-700">Participate in hands-on training and realistic disaster simulation exercises.</p>
                    </div>
                    <div class="stack-card bg-teal-50 how-it-works-card">
                        <h3 class="text-2xl font-bold text-teal-800 mb-2">4. Get Evaluated</h3>
                        <p class="text-gray-700">Your performance is assessed based on established criteria and competency standards.</p>
                    </div>
                    <div class="stack-card bg-gradient-to-r from-teal-600 to-teal-700 text-white how-it-works-card">
                        <h3 class="text-2xl font-bold mb-2">5. Receive Certification 🎓</h3>
                        <p>Download your official digital certificate and add it to your professional profile.</p>
                    </div>
                </div>
            </div>
            </div>
        </div>
    </section>
    
    <!-- 6️⃣ Certifications & Benefits -->
    <section class="py-20 bg-gradient-to-br from-teal-700 to-teal-900 text-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="text-4xl md:text-5xl font-extrabold mb-4">
                    Certifications & Benefits
                </h2>
                <p class="text-xl text-teal-100 max-w-3xl mx-auto">
                    Enhance your skills and earn recognized certifications
                </p>
            </div>
            
            <div class="grid md:grid-cols-2 gap-12 items-center">
                <!-- Left: Benefits -->
                <div class="space-y-6">
                    <div class="flex items-start space-x-4">
                        <div class="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold mb-2">Digital Certificates Issued</h3>
                            <p class="text-teal-100">Official LGU-issued certificates upon successful completion of training programs.</p>
                        </div>
                    </div>
                    
                    <div class="flex items-start space-x-4">
                        <div class="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold mb-2">Proof of Participation</h3>
                            <p class="text-teal-100">Verified attendance records and participation certificates for all completed drills.</p>
                        </div>
                    </div>
                    
                    <div class="flex items-start space-x-4">
                        <div class="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold mb-2">Skills Gained</h3>
                            <p class="text-teal-100">Emergency response, evacuation procedures, first aid, team coordination, and more.</p>
                        </div>
                    </div>
                    
                    <div class="flex items-start space-x-4">
                        <div class="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clip-rule="evenodd"/>
                                <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/>
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold mb-2">Career Benefits</h3>
                            <p class="text-teal-100">Enhance employability, fulfill school requirements, and contribute to community resilience.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Right: Visual -->
                <div class="flex justify-center">
                    <div class="bg-white/10 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-white/20">
                        <div class="bg-white p-8 rounded-2xl shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                            <div class="text-center">
                                <div class="w-20 h-20 bg-teal-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                                    </svg>
                                </div>
                                <h4 class="text-2xl font-bold text-gray-800 mb-2">Official Certificate</h4>
                                <p class="text-gray-600 mb-4">Disaster Preparedness Training</p>
                                <div class="border-t border-gray-200 pt-4">
                                    <p class="text-sm text-gray-500">Issued by:</p>
                                    <p class="font-semibold text-gray-800">Local Government Unit</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <!-- 7️⃣ Announcements & Notices -->
    <section class="py-20 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="text-4xl md:text-5xl font-extrabold gradient-text mb-4">
                    Announcements & Notices
                </h2>
                <p class="text-xl text-gray-600 max-w-3xl mx-auto">
                    Stay updated with the latest news and schedules
                </p>
            </div>
            
            <div class="grid md:grid-cols-3 gap-8">
                <!-- Announcement 1 -->
                <div class="bg-white border-l-4 border-red-500 shadow-lg rounded-lg p-6 card-hover">
                    <div class="flex items-start">
                        <div class="flex-shrink-0">
                            <svg class="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-gray-500 mb-1">Dec 22, 2025</p>
                            <h3 class="text-lg font-bold text-gray-900 mb-2">Earthquake Drill - Registration Deadline</h3>
                            <p class="text-gray-600 text-sm">Final day to register for the Earthquake Preparedness Drill scheduled for Dec 28, 2025. Limited slots available.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Announcement 2 -->
                <div class="bg-white border-l-4 border-blue-500 shadow-lg rounded-lg p-6 card-hover">
                    <div class="flex items-start">
                        <div class="flex-shrink-0">
                            <svg class="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-gray-500 mb-1">Dec 20, 2025</p>
                            <h3 class="text-lg font-bold text-gray-900 mb-2">Upcoming Flood Response Training</h3>
                            <p class="text-gray-600 text-sm">Flood Response Simulation will be conducted on January 15, 2026. Early registration now open for all qualified participants.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Announcement 3 -->
                <div class="bg-white border-l-4 border-green-500 shadow-lg rounded-lg p-6 card-hover">
                    <div class="flex items-start">
                        <div class="flex-shrink-0">
                            <svg class="h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-gray-500 mb-1">Dec 18, 2025</p>
                            <h3 class="text-lg font-bold text-gray-900 mb-2">LGU Advisory: System Maintenance</h3>
                            <p class="text-gray-600 text-sm">System maintenance scheduled for Dec 24, 2025, 11 PM - 3 AM. Registration and login may be temporarily unavailable.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <!-- 8️⃣ Footer Section -->
    <footer class="bg-gray-900 text-gray-300 py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid md:grid-cols-4 gap-8 mb-8">
                <!-- About -->
                <div>
                    <div class="flex items-center space-x-3 mb-4">
                        <img src="{{ asset('images/logo.svg') }}" alt="LGU Logo" class="h-10 w-auto">
                        <h3 class="text-white font-bold text-lg">LGU ALERTARA</h3>
                    </div>
                    <p class="text-sm leading-relaxed">
                        Building safer, more resilient communities through comprehensive disaster preparedness training and simulation programs.
                    </p>
                </div>
                
                <!-- Quick Links -->
                <div>
                    <h4 class="text-white font-bold mb-4">Quick Links</h4>
                    <ul class="space-y-2 text-sm">
                        <li><a href="#home" class="hover:text-teal-400 transition">Home</a></li>
                        <li><a href="#about" class="hover:text-teal-400 transition">About the Program</a></li>
                        <li><a href="#trainings" class="hover:text-teal-400 transition">Trainings & Drills</a></li>
                        <li><a href="#how-it-works" class="hover:text-teal-400 transition">How It Works</a></li>
                    </ul>
                </div>
                
                <!-- Contact -->
                <div>
                    <h4 class="text-white font-bold mb-4">Contact Information</h4>
                    <ul class="space-y-3 text-sm">
                        <li class="flex items-start">
                            <svg class="w-5 h-5 text-teal-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                            </svg>
                            <span>disaster.preparedness@lgu.gov.ph</span>
                        </li>
                        <li class="flex items-start">
                            <svg class="w-5 h-5 text-teal-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                            </svg>
                            <span>+63 (2) 123-4567</span>
                        </li>
                        <li class="flex items-start">
                            <svg class="w-5 h-5 text-teal-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                            </svg>
                            <span>LGU Main Office, City Hall Complex</span>
                        </li>
                    </ul>
                </div>
                
                <!-- Legal -->
                <div>
                    <h4 class="text-white font-bold mb-4">Legal</h4>
                    <ul class="space-y-2 text-sm">
                        <li><a href="#" class="hover:text-teal-400 transition">Privacy Policy</a></li>
                        <li><a href="#" class="hover:text-teal-400 transition">Terms of Use</a></li>
                        <li><a href="#" class="hover:text-teal-400 transition">Data Protection</a></li>
                        <li><a href="#" class="hover:text-teal-400 transition">Accessibility</a></li>
                    </ul>
                </div>
            </div>
            
            <!-- Bottom Bar -->
            <div class="border-t border-gray-800 pt-8 text-center text-sm">
                <p>&copy; 2025 Local Government Unit - Disaster Preparedness Office. All rights reserved.</p>
                <p class="mt-2 text-gray-500">Powered by LGU LERTARA - Building Resilient Communities</p>
            </div>
        </div>
    </footer>
    
    <!-- Mobile Menu Toggle Script -->
    <script>
        document.getElementById('mobile-menu-btn').addEventListener('click', function() {
            const menu = document.getElementById('mobile-menu');
            menu.classList.toggle('hidden');
        });
        
        // Close mobile menu when clicking on a link
        document.querySelectorAll('#mobile-menu a').forEach(link => {
            link.addEventListener('click', function() {
                document.getElementById('mobile-menu').classList.add('hidden');
            });
        });
        
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
        
        // Navbar background on scroll
        window.addEventListener('scroll', function() {
            const nav = document.querySelector('nav');
            if (window.scrollY > 50) {
                nav.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
            } else {
                nav.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            }
        });
        
        // Scroll-based reveal (Apple-style): reveal elements when they enter viewport
        (function() {
            const revealEls = document.querySelectorAll('.scroll-reveal');
            if (!revealEls.length) return;
            const observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                    }
                });
            }, { rootMargin: '0px 0px -60px 0px', threshold: 0.1 });
            revealEls.forEach(function(el) { observer.observe(el); });
        })();
        
        // Section background images: scroll transition (reveal when section enters view)
        (function() {
            const sections = document.querySelectorAll('.section-about-bg, .section-trainings-bg, .section-how-it-works-bg');
            if (!sections.length) return;
            const observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('section-image-visible');
                    }
                });
            }, { rootMargin: '0px 0px -80px 0px', threshold: 0.15 });
            sections.forEach(function(section) { observer.observe(section); });
        })();
        
        // How It Works: scroll-driven 3-layer media (SafetyKit.png → video → safetykit2.png)
        (function() {
            var section = document.getElementById('how-it-works');
            var videoLayer = document.getElementById('how-it-works-video-layer');
            var imageLayer = document.getElementById('how-it-works-image-layer');
            var video = document.getElementById('how-it-works-video');
            if (!section || !videoLayer || !imageLayer || !video || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

            gsap.registerPlugin(ScrollTrigger);

            function initScrollTriggerVideo() {
                ScrollTrigger.create({
                    trigger: section,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 1,
                    onUpdate: function(self) {
                        var p = self.progress;
                        if (video.readyState >= 2 && video.duration && !isNaN(video.duration)) {
                            video.currentTime = p * video.duration;
                        }
                        videoLayer.style.opacity = p <= 0.85 ? 1 : Math.max(0, 1 - (p - 0.85) / 0.15);
                        imageLayer.style.opacity = p <= 0.75 ? 0 : Math.min(1, (p - 0.75) / 0.2);
                    }
                });
                ScrollTrigger.refresh();
            }
            
            video.addEventListener('loadedmetadata', updateHowItWorksMedia);
            video.addEventListener('loadeddata', updateHowItWorksMedia);
            window.addEventListener('scroll', updateHowItWorksMedia, { passive: true });
            window.addEventListener('resize', updateHowItWorksMedia);
            updateHowItWorksMedia();
        })();

        // How It Works: stacked cards – reveal card 1→5 as user scrolls (CodePen-style)
        (function() {
            var container = document.getElementById('how-it-works-stack-container');
            var cardsEl = document.getElementById('how-it-works-stack-cards');
            if (!container || !cardsEl) return;
            function updateStackReveal() {
                var rect = container.getBoundingClientRect();
                var windowHeight = window.innerHeight;
                var containerHeight = container.offsetHeight;
                var scrollProgress = 0;
                if (rect.top < windowHeight && rect.bottom > 0) {
                    var visibleStart = Math.max(0, windowHeight - rect.top);
                    scrollProgress = Math.min(1, visibleStart / (containerHeight * 0.85));
                }
                var step = Math.floor(scrollProgress * 5) + 1;
                step = Math.max(1, Math.min(5, step));
                cardsEl.classList.remove('reveal-1', 'reveal-2', 'reveal-3', 'reveal-4', 'reveal-5');
                cardsEl.classList.add('reveal-' + step);
            }
            window.addEventListener('scroll', updateStackReveal, { passive: true });
            window.addEventListener('resize', updateStackReveal);
            updateStackReveal();
        })();
    </script>
</body>
</html>
