import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, LogIn, Home } from 'lucide-react';

export function ParticipantLogin({ errors = {}, oldEmail = '' }) {
    const [email, setEmail] = useState(oldEmail);
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        e.target.submit();
    };

    const hasErrors = Object.keys(errors).length > 0;

    return (
        <div className="min-h-screen relative">
            {/* Hero Background with Gradient Overlay */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-fixed"
                style={{
                    backgroundImage: 'url(/images/hero-training.jpg)',
                }}
            >
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            'linear-gradient(135deg, rgba(16, 24, 40, 0.95) 0%, rgba(30, 41, 59, 0.92) 50%, rgba(5, 150, 105, 0.88))',
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-5xl bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/20 overflow-hidden">
                    <div className="flex flex-col lg:flex-row min-h-[420px]">
                        {/* Left panel - desktop only */}
                        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                            {/* Background photo with blur */}
                            <div
                                className="absolute inset-0 bg-cover bg-center scale-105 blur-sm"
                                style={{
                                    backgroundImage: 'url(/images/hero-training.jpg)',
                                }}
                            />
                            {/* Green overlay */}
                            <div className="absolute inset-0 bg-emerald-800/85" />
                            <div className="relative z-10 flex flex-col text-white p-10">
                                <div className="mb-8">
                                    <div className="inline-flex items-center justify-center bg-white/95 rounded-full p-3 shadow-lg shadow-emerald-900/40">
                                        <img src="/logo.svg" alt="LGU Logo" className="h-14 w-auto" />
                                    </div>
                                </div>
                                <h2 className="text-2xl font-bold mb-4">
                                    Disaster Preparedness Training &amp; Simulation
                                </h2>
                                <p className="text-sm text-emerald-50 mb-3">
                                    A centralized platform designed for Barangays and Local Government Units to plan,
                                    manage, and conduct disaster preparedness training and simulation exercises.
                                </p>
                                <p className="text-sm text-emerald-50">
                                    This system supports training modules, simulation events, attendance tracking,
                                    evaluation, and certification to help communities stay prepared and resilient.
                                </p>
                            </div>
                        </div>

                        {/* Right panel - login form */}
                        <div className="w-full lg:w-1/2 bg-white/95 p-8">
                            {/* Logo (mobile / small screens only) */}
                            <div className="flex justify-center mb-6 lg:hidden">
                                <img src="/logo.svg" alt="LGU Logo" className="h-16 w-auto" />
                            </div>

                            <div className="mb-8 text-center">
                                <h1 className="text-3xl font-bold text-slate-800 mb-2">Login</h1>
                                <p className="text-sm text-slate-600">
                                    Access training modules and simulation events
                                </p>
                            </div>

                            {hasErrors && (
                                <div className="mb-6 rounded-lg bg-red-50 border-l-4 border-red-500 px-4 py-3 text-sm text-red-700 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                    <span>{Object.values(errors)[0]}</span>
                                </div>
                            )}

                            <form
                                method="POST"
                                action="/participant/login"
                                onSubmit={handleSubmit}
                                className="space-y-5"
                            >
                                <input
                                    type="hidden"
                                    name="_token"
                                    value={
                                        document.head.querySelector('meta[name="csrf-token"]')?.content || ''
                                    }
                                />

                                <div>
                                    <label
                                        className="block text-sm font-semibold text-slate-700 mb-2"
                                        htmlFor="email"
                                    >
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            autoFocus
                                            placeholder="your.email@example.com"
                                            className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label
                                        className="block text-sm font-semibold text-slate-700 mb-2"
                                        htmlFor="password"
                                    >
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            placeholder="Enter your password"
                                            className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs text-slate-600">
                                    <label className="inline-flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="remember"
                                            checked={remember}
                                            onChange={(e) => setRemember(e.target.checked)}
                                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span>Remember me</span>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full inline-flex justify-center items-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 transition-colors"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Logging in...</span>
                                        </>
                                    ) : (
                                        <>
                                            <LogIn className="w-4 h-4" />
                                            <span>Login</span>
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 space-y-2">
                                <p className="text-xs text-slate-500 text-center">
                                    Need an account?{' '}
                                    <a
                                        href="/participant/register"
                                        className="text-emerald-600 hover:text-emerald-700 font-medium"
                                    >
                                        Register here
                                    </a>
                                </p>
                                <p className="text-xs text-slate-500 text-center">
                                    <a
                                        href="/"
                                        className="hover:text-slate-700 inline-flex items-center gap-1"
                                    >
                                        <Home className="w-3 h-3" />
                                        Back to Home
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
