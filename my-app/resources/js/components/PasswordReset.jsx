import React, { useState } from 'react';
import { Lock, ArrowLeft, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

export function PasswordReset({ errors = {}, token = '', email = '' }) {
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Password validation
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
    const passwordsMatch = password === passwordConfirmation && passwordConfirmation.length > 0;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isPasswordValid || !passwordsMatch) {
            return;
        }
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
                                Create a new strong password for your account.
                            </p>
                        </div>

                        {errors.email && (
                            <div className="mb-6 rounded-lg bg-red-50 border-l-4 border-red-500 px-4 py-3 text-sm text-red-700 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <span>{errors.email}</span>
                            </div>
                        )}

                        {errors.password && (
                            <div className="mb-6 rounded-lg bg-red-50 border-l-4 border-red-500 px-4 py-3 text-sm text-red-700 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <span>{errors.password}</span>
                            </div>
                        )}

                        <form
                            method="POST"
                            action="/password/reset"
                            onSubmit={handleSubmit}
                            className="space-y-5"
                            noValidate
                        >
                            <input type="hidden" name="_token" value={document.head.querySelector('meta[name="csrf-token"]')?.content || ''} />
                            <input type="hidden" name="token" value={token} />
                            <input type="hidden" name="email" value={email} />

                            <div>
                                <label
                                    className="block text-sm font-semibold text-slate-700 mb-2"
                                    htmlFor="password"
                                >
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-500" />
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoFocus
                                        placeholder="Enter new password"
                                        className="w-full rounded-lg border border-slate-300 pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-[rgba(15,118,110,0.08)] transition-all duration-200 ease-out"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                
                                {/* Password Requirements */}
                                {password.length > 0 && (
                                    <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                                        <p className="font-semibold text-slate-700 mb-2">Password Requirements:</p>
                                        <div className={`flex items-center gap-2 ${hasMinLength ? 'text-green-600' : 'text-slate-500'}`}>
                                            <CheckCircle className={`w-4 h-4 ${hasMinLength ? '' : 'opacity-30'}`} />
                                            <span>At least 8 characters</span>
                                        </div>
                                        <div className={`flex items-center gap-2 ${hasUpperCase ? 'text-green-600' : 'text-slate-500'}`}>
                                            <CheckCircle className={`w-4 h-4 ${hasUpperCase ? '' : 'opacity-30'}`} />
                                            <span>One uppercase letter</span>
                                        </div>
                                        <div className={`flex items-center gap-2 ${hasLowerCase ? 'text-green-600' : 'text-slate-500'}`}>
                                            <CheckCircle className={`w-4 h-4 ${hasLowerCase ? '' : 'opacity-30'}`} />
                                            <span>One lowercase letter</span>
                                        </div>
                                        <div className={`flex items-center gap-2 ${hasNumber ? 'text-green-600' : 'text-slate-500'}`}>
                                            <CheckCircle className={`w-4 h-4 ${hasNumber ? '' : 'opacity-30'}`} />
                                            <span>One number</span>
                                        </div>
                                        <div className={`flex items-center gap-2 ${hasSpecialChar ? 'text-green-600' : 'text-slate-500'}`}>
                                            <CheckCircle className={`w-4 h-4 ${hasSpecialChar ? '' : 'opacity-30'}`} />
                                            <span>One special character (!@#$%^&*)</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label
                                    className="block text-sm font-semibold text-slate-700 mb-2"
                                    htmlFor="password_confirmation"
                                >
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-500" />
                                    <input
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        type={showPasswordConfirmation ? 'text' : 'password'}
                                        value={passwordConfirmation}
                                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                                        required
                                        placeholder="Confirm new password"
                                        className="w-full rounded-lg border border-slate-300 pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-[rgba(15,118,110,0.08)] transition-all duration-200 ease-out"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPasswordConfirmation ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {passwordConfirmation.length > 0 && !passwordsMatch && (
                                    <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                                )}
                                {passwordsMatch && (
                                    <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        Passwords match
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !isPasswordValid || !passwordsMatch}
                                className="w-full inline-flex justify-center items-center gap-2 rounded-md bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 disabled:from-teal-400 disabled:to-teal-500 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 transition-all duration-200 ease-out transform-gpu hover:-translate-y-[1px] hover:shadow-[0_6px_14px_rgba(0,0,0,0.12)]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Resetting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-4 h-4" />
                                        <span>Reset Password</span>
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
