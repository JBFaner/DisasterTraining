import React, { useState } from 'react';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

export function PasswordRequest({ errors = {}, oldEmail = '', status = '' }) {
    const [email, setEmail] = useState(oldEmail);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        e.target.submit();
    };

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
                                Reset Password
                            </h1>
                            <p className="text-sm text-slate-500">
                                Enter your email address and we'll send you a password reset link.
                            </p>
                        </div>

                        {status && (
                            <div className="mb-6 rounded-lg bg-green-50 border-l-4 border-green-500 px-4 py-3 text-sm text-green-700 flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <span>{status}</span>
                            </div>
                        )}

                        {errors.email && (
                            <div className="mb-6 rounded-lg bg-red-50 border-l-4 border-red-500 px-4 py-3 text-sm text-red-700 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <span>{errors.email}</span>
                            </div>
                        )}

                        <form
                            method="POST"
                            action="/password/email"
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
                                        placeholder="your.email@example.com"
                                        className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-[rgba(15,118,110,0.08)] transition-all duration-200 ease-out"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full inline-flex justify-center items-center gap-2 rounded-md bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 disabled:from-teal-400 disabled:to-teal-500 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 transition-all duration-200 ease-out transform-gpu hover:-translate-y-[1px] hover:shadow-[0_6px_14px_rgba(0,0,0,0.12)]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Sending...</span>
                                    </>
                                ) : (
                                    <>
                                        <Mail className="w-4 h-4" />
                                        <span>Send Reset Link</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <a
                                href="/admin/login"
                                className="text-sm text-slate-500 hover:text-teal-600 inline-flex items-center gap-1 transition-all duration-200 ease-out"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Login
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
