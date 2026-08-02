import React, { useEffect, useRef } from 'react';
import { Timer } from 'lucide-react';
import { formatSessionCountdown, useSessionIdle } from '../contexts/SessionIdleContext';

export function SessionTimeout() {
    const session = useSessionIdle();
    const primaryBtnRef = useRef(null);

    const show = Boolean(session?.enabled && session.showWarning);
    const remainingSeconds = session?.remainingSeconds ?? 0;
    const warningSeconds = session?.warningSeconds ?? 60;
    const progress = Math.max(0, Math.min(1, remainingSeconds / Math.max(1, warningSeconds)));
    const urgent = remainingSeconds <= 15;
    const circumference = 2 * Math.PI * 54;
    const strokeDashoffset = circumference * (1 - progress);

    useEffect(() => {
        if (!show) return undefined;
        primaryBtnRef.current?.focus();
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [show]);

    if (!show) {
        return null;
    }

    const { stayLoggedIn, logoutNow } = session;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="session-timeout-title"
            aria-describedby="session-timeout-desc"
        >
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]" />

            <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
                <div className={`px-6 pt-6 pb-4 text-center ${urgent ? 'bg-rose-50' : 'bg-amber-50'}`}>
                    <div className={`mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full ${urgent ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        <Timer className="h-5 w-5" />
                    </div>
                    <h2 id="session-timeout-title" className="text-xl font-bold text-slate-900 tracking-tight">
                        Session timeout
                    </h2>
                    <p id="session-timeout-desc" className="mt-1 text-sm text-slate-600">
                        You have been inactive. You will be logged out automatically when the timer reaches zero.
                    </p>
                </div>

                <div className="px-6 py-8 flex flex-col items-center gap-5">
                    <div className="relative h-40 w-40" aria-live="polite" aria-atomic="true">
                        <svg className="h-40 w-40 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
                            <circle
                                cx="60"
                                cy="60"
                                r="54"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                                className="text-slate-200"
                            />
                            <circle
                                cx="60"
                                cy="60"
                                r="54"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                className={`transition-[stroke-dashoffset] duration-200 ${urgent ? 'text-rose-500' : 'text-amber-500'}`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`font-mono text-4xl font-bold tracking-tight tabular-nums ${urgent ? 'text-rose-700' : 'text-slate-900'}`}>
                                {formatSessionCountdown(remainingSeconds)}
                            </span>
                            <span className="mt-1 text-[0.7rem] uppercase tracking-wider text-slate-500 font-semibold">
                                remaining
                            </span>
                        </div>
                    </div>

                    <p className="text-center text-sm text-slate-600 max-w-xs">
                        Click <strong>Stay logged in</strong> to continue working, or log out now.
                    </p>

                    <div className="flex w-full flex-col-reverse sm:flex-row gap-3 sm:justify-center pt-1">
                        <button
                            type="button"
                            onClick={logoutNow}
                            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold"
                        >
                            Logout now
                        </button>
                        <button
                            ref={primaryBtnRef}
                            type="button"
                            onClick={stayLoggedIn}
                            className={`px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm ${
                                urgent
                                    ? 'bg-rose-600 hover:bg-rose-700'
                                    : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                        >
                            Stay logged in
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
