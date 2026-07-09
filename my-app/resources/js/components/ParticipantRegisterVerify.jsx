import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, Mail, ShieldCheck } from 'lucide-react';

export function ParticipantRegisterVerify({ contact = '', errors = {}, status = '', resendAvailableAt = 0 }) {
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [countdown, setCountdown] = useState(() => Math.max(0, resendAvailableAt - Math.floor(Date.now() / 1000)));
    const inputRefs = useRef([]);

    const otp = useMemo(() => otpDigits.join(''), [otpDigits]);
    const errorMessage = Object.values(errors || {}).flat?.()?.[0] || Object.values(errors || {})[0] || '';

    useEffect(() => {
        if (countdown <= 0) return undefined;
        const timer = window.setInterval(() => {
            setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
        }, 1000);
        return () => window.clearInterval(timer);
    }, [countdown]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (otp.length !== 6) return;
        setIsSubmitting(true);
        e.target.submit();
    };

    const updateDigit = (index, value) => {
        const numeric = value.replace(/\D/g, '').slice(-1);
        setOtpDigits((prev) => {
            const next = [...prev];
            next[index] = numeric;
            return next;
        });
        if (numeric && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, event) => {
        if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (event) => {
        event.preventDefault();
        const pasted = (event.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;
        const next = pasted.split('');
        while (next.length < 6) next.push('');
        setOtpDigits(next);
        const focusIndex = Math.min(5, pasted.length);
        inputRefs.current[focusIndex === 6 ? 5 : focusIndex]?.focus();
    };

    return (
        <div className="min-h-screen relative">
            <div
                className="absolute inset-0 bg-cover bg-center bg-fixed"
                style={{ backgroundImage: 'url(/images/hero-training.jpg)' }}
            >
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            'linear-gradient(135deg, rgba(16, 24, 40, 0.95) 0%, rgba(30, 41, 59, 0.92) 50%, rgba(5, 150, 105, 0.88))',
                    }}
                />
            </div>

            <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-8">
                    <div className="mb-6 text-center">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 mb-4 mx-auto border border-emerald-200">
                            <ShieldCheck className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h1 className="text-2xl font-semibold text-slate-800 mb-1">Verify Your Email</h1>
                        <p className="text-sm text-slate-500">We have sent a verification code to:</p>
                    </div>

                    <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-md">
                        <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            <div>
                                <p className="text-sm text-slate-700 font-medium">{contact}</p>
                                <p className="text-xs text-slate-500 mt-0.5">Please enter the 6-digit verification code below to activate your account.</p>
                            </div>
                        </div>
                    </div>

                    {status ? (
                        <div className="mb-4 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700 flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{status}</span>
                        </div>
                    ) : null}

                    {errorMessage ? (
                        <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        </div>
                    ) : null}

                    <form method="POST" action="/participant/register/verify" onSubmit={handleSubmit} className="space-y-4">
                        <input type="hidden" name="_token" value={document.head.querySelector('meta[name="csrf-token"]')?.content || ''} />
                        <input type="hidden" name="otp" value={otp} />

                        <div className="flex justify-center gap-2" onPaste={handlePaste}>
                            {otpDigits.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => {
                                        inputRefs.current[index] = el;
                                    }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => updateDigit(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-11 h-12 rounded-md border border-slate-300 text-center text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    autoFocus={index === 0}
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || otp.length !== 6}
                            className="w-full inline-flex justify-center items-center gap-2 rounded-md bg-[#16A34A] hover:bg-[#1FA463] disabled:bg-[#16A34A]/60 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 transition-all duration-200 ease-out"
                        >
                            {isSubmitting ? 'Verifying...' : 'Verify Email'}
                        </button>
                    </form>

                    <form method="POST" action="/participant/register/resend" onSubmit={() => setIsResending(true)} className="mt-4 text-center">
                        <input type="hidden" name="_token" value={document.head.querySelector('meta[name="csrf-token"]')?.content || ''} />
                        <button
                            type="submit"
                            disabled={isResending || isSubmitting || countdown > 0}
                            className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold disabled:text-slate-400 disabled:cursor-not-allowed"
                        >
                            {isResending ? 'Sending new code...' : 'Resend Code'}
                        </button>
                        {countdown > 0 ? (
                            <p className="text-xs text-slate-500 mt-1">Resend available in {countdown} seconds</p>
                        ) : null}
                    </form>

                    <div className="mt-6 pt-6 border-t border-slate-200">
                        <a
                            href="/participant/register"
                            className="inline-flex items-center gap-2 text-xs text-slate-600 hover:text-slate-800 font-medium"
                        >
                            <ArrowLeft className="w-3 h-3" />
                            <span>Back to registration</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

