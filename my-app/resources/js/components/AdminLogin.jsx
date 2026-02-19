import React, { useState, useEffect } from 'react';
import { Mail, Lock, AlertCircle, LogIn, Home } from 'lucide-react';

export function AdminLogin({ errors = {}, oldEmail = '', lockoutRetryAfter = 0, failedAttempts = 0 }) {
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
                            'linear-gradient(135deg, rgba(16, 24, 40, 0.95) 0%, rgba(30, 41, 59, 0.92) 50%, rgba(15, 118, 110, 0.88))',
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
                <div
                    className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden"
                    style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
                >
                    <div className="p-8">
                        {/* Logo */}
                        <div className="flex justify-center mb-6">
                            <img src="/logo.svg" alt="LGU Logo" className="h-16 w-auto" />
                        </div>

                        <div className="mb-8 text-center">
                            <h1 className="text-3xl font-bold mb-2" style={{ color: '#1f2937' }}>
                                Admin Login
                            </h1>
                            <p className="text-xs text-slate-500 uppercase tracking-[0.12em]">
                                LGU Training Management Portal
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
                            action="/admin/login"
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
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-500" />
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoFocus
                                        placeholder="admin@example.com"
                                        disabled={isLockedOut}
                                        className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-[rgba(15,118,110,0.08)] transition-all duration-200 ease-out disabled:opacity-60 disabled:cursor-not-allowed"
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
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-500" />
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="Enter your password"
                                        disabled={isLockedOut}
                                        className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-[rgba(15,118,110,0.08)] transition-all duration-200 ease-out disabled:opacity-60 disabled:cursor-not-allowed"
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
                                className="w-full inline-flex justify-center items-center gap-2 rounded-md bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 disabled:from-teal-400 disabled:to-teal-500 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 transition-all duration-200 ease-out transform-gpu hover:-translate-y-[1px] hover:shadow-[0_6px_14px_rgba(0,0,0,0.12)]"
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
                                        <span>Sign In to Dashboard</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 space-y-2">
                            <p className="text-xs text-slate-500 text-center">
                                <a
                                    href="/"
                                    className="hover:text-teal-600 inline-flex items-center gap-1 transition-all duration-200 ease-out"
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
    );
}
