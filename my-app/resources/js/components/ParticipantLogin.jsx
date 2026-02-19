import React, { useState, useEffect } from 'react';
import { Mail, Lock, AlertCircle, LogIn, Home } from 'lucide-react';

export function ParticipantLogin({ errors = {}, oldEmail = '', lockoutRetryAfter = 0, failedAttempts = 0 }) {
    const [email, setEmail] = useState(oldEmail);
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState(lockoutRetryAfter > 0 ? lockoutRetryAfter : 0);
    const showResetPrompt = failedAttempts >= 3;

    useEffect(() => {
        if (lockoutSecondsLeft <= 0) return;
        const t = setInterval(() => {
            setLockoutSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
        }, 1000);
        return () => clearInterval(t);
    }, [lockoutSecondsLeft]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isLockedOut) return;
        setIsSubmitting(true);
        e.target.submit();
    };

    const hasErrors = Object.keys(errors).length > 0;
    const isLockedOut = lockoutSecondsLeft > 0;
    const firstErrorMessage = hasErrors ? Object.values(errors)[0] : null;
    const isLockoutError = typeof firstErrorMessage === 'string' && firstErrorMessage.includes('Too many failed login attempts');
    const lockoutMessage = isLockedOut
        ? `Too many failed login attempts. Please wait ${lockoutSecondsLeft} seconds before trying again.`
        : firstErrorMessage;
    const showErrorBanner = isLockedOut || (hasErrors && !isLockoutError);

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
                <div
                    className="w-full max-w-5xl bg-white/95 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden"
                    style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
                >
                    <div className="flex flex-col lg:flex-row min-h-[420px]">
                        {/* Left panel - desktop only */}
                        <div
                            className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
                            style={{ borderRight: '1px solid rgba(255,255,255,0.2)' }}
                        >
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
                                    <div
                                        className="inline-flex items-center justify-center"
                                        style={{
                                            background: 'rgba(255,255,255,0.15)',
                                            backdropFilter: 'blur(6px)',
                                            border: '1px solid rgba(255,255,255,0.25)',
                                            borderRadius: '999px',
                                            padding: '10px 18px',
                                            boxShadow: '0 4px 18px rgba(0,0,0,0.12)',
                                        }}
                                    >
                                        <img
                                            src="/logo.svg"
                                            alt="LGU Logo"
                                            className="h-14 w-auto"
                                            style={{
                                                filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.35))',
                                            }}
                                        />
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
                        <div
                            className="w-full lg:w-1/2 bg-white/95 p-8"
                            style={{ borderLeft: '1px solid rgba(0,0,0,0.06)' }}
                        >
                            {/* Logo (mobile / small screens only) */}
                            <div className="flex justify-center mb-6 lg:hidden">
                                <img src="/logo.svg" alt="LGU Logo" className="h-16 w-auto" />
                            </div>

                            <div className="mb-8 text-center">
                                <h1 className="text-3xl font-bold mb-2" style={{ color: '#1f2937' }}>
                                    Login
                                </h1>
                                <p
                                    className="text-xs text-slate-500 uppercase tracking-[0.12em]"
                                >
                                    Official LGU Training Portal
                                </p>
                            </div>

                            {showResetPrompt && (
                                <div className="mb-6 rounded-lg bg-blue-50 border-l-4 border-blue-500 px-4 py-3 text-sm text-blue-700 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="font-semibold mb-1">Having trouble logging in?</p>
                                        <p className="mb-2">Why not try resetting your password?</p>
                                        <a
                                            href="/password/reset"
                                            className="text-blue-600 hover:text-blue-800 underline font-medium"
                                        >
                                            Reset Password →
                                        </a>
                                    </div>
                                </div>
                            )}

                            {showErrorBanner && lockoutMessage && (
                                <div className="mb-6 rounded-lg bg-red-50 border-l-4 border-red-500 px-4 py-3 text-sm text-red-700 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                    <span>{lockoutMessage}</span>
                                </div>
                            )}

                                <form
                                    method="POST"
                                    action="/participant/login"
                                    onSubmit={handleSubmit}
                                    className="space-y-5"
                                    noValidate
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
                                            disabled={isLockedOut}
                                            className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1FA463] focus:border-[#1FA463] focus:bg-[rgba(22,163,74,0.08)] transition-all duration-200 ease-out disabled:opacity-60 disabled:cursor-not-allowed"
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
                                            disabled={isLockedOut}
                                            className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1FA463] focus:border-[#1FA463] focus:bg-[rgba(22,163,74,0.08)] transition-all duration-200 ease-out disabled:opacity-60 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="mt-1 text-right">
                                    <a
                                        href="/password/reset"
                                        className="text-[0.7rem] text-slate-500 hover:text-slate-700 underline-offset-2 hover:underline transition-all duration-200 ease-out"
                                    >
                                        Forgot Password?
                                    </a>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || isLockedOut}
                                    className="w-full inline-flex justify-center items-center gap-2 rounded-md bg-[#16A34A] hover:bg-[#1FA463] disabled:bg-[#16A34A]/60 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 transition-all duration-200 ease-out transform-gpu hover:-translate-y-[1px] hover:shadow-[0_6px_14px_rgba(0,0,0,0.12)]"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Logging in...</span>
                                        </>
                                    ) : isLockedOut ? (
                                        <span>Please wait {lockoutSecondsLeft}s</span>
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
                                        className="text-emerald-600 hover:text-[#1FA463] font-medium transition-all duration-200 ease-out"
                                    >
                                        Register here
                                    </a>
                                </p>
                                <p className="text-xs text-slate-500 text-center">
                                    <a
                                        href="/"
                                        className="hover:text-[#1FA463] inline-flex items-center gap-1 transition-all duration-200 ease-out"
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
