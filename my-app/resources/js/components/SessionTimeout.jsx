import React, { useCallback, useEffect, useRef, useState } from 'react';

const ACTIVITY_THROTTLE_MS = 30000; // ping backend at most every 30s
const CSRF_TOKEN = () => document.head.querySelector('meta[name="csrf-token"]')?.content || '';

export function SessionTimeout({ timeoutMinutes = 10, warningSeconds = 60 }) {
    const [showWarning, setShowWarning] = useState(false);
    const [warningCountdown, setWarningCountdown] = useState(warningSeconds);
    const timeoutMs = (timeoutMinutes * 60 - warningSeconds) * 1000;
    const warningDurationMs = warningSeconds * 1000;
    const idleTimerRef = useRef(null);
    const warningTimerRef = useRef(null);
    const lastPingRef = useRef(0);
    const countdownIntervalRef = useRef(null);

    const clearTimers = useCallback(() => {
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
            idleTimerRef.current = null;
        }
        if (warningTimerRef.current) {
            clearTimeout(warningTimerRef.current);
            warningTimerRef.current = null;
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
    }, []);

    const pingActivity = useCallback(() => {
        const now = Date.now();
        if (now - lastPingRef.current < ACTIVITY_THROTTLE_MS) return;
        lastPingRef.current = now;
        fetch('/session/activity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': CSRF_TOKEN(),
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
        }).catch(() => {});
    }, []);

    const startIdleTimer = useCallback(() => {
        clearTimers();
        setShowWarning(false);
        setWarningCountdown(warningSeconds);
        idleTimerRef.current = setTimeout(() => {
            idleTimerRef.current = null;
            setShowWarning(true);
            setWarningCountdown(warningSeconds);
            const start = Date.now();
            countdownIntervalRef.current = setInterval(() => {
                const left = Math.max(0, warningSeconds - Math.floor((Date.now() - start) / 1000));
                setWarningCountdown(left);
            }, 500);
            warningTimerRef.current = setTimeout(() => {
                warningTimerRef.current = null;
                if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current);
                    countdownIntervalRef.current = null;
                }
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = '/logout?reason=inactivity';
                const csrf = document.createElement('input');
                csrf.type = 'hidden';
                csrf.name = '_token';
                csrf.value = CSRF_TOKEN();
                form.appendChild(csrf);
                document.body.appendChild(form);
                form.submit();
            }, warningDurationMs);
        }, timeoutMs);
    }, [timeoutMs, warningSeconds, warningDurationMs, clearTimers]);

    const handleStayLoggedIn = useCallback(() => {
        pingActivity();
        startIdleTimer();
    }, [pingActivity, startIdleTimer]);

    const handleLogoutNow = useCallback(() => {
        clearTimers();
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/logout';
        const csrf = document.createElement('input');
        csrf.type = 'hidden';
        csrf.name = '_token';
        csrf.value = CSRF_TOKEN();
        form.appendChild(csrf);
        document.body.appendChild(form);
        form.submit();
    }, [clearTimers]);

    useEffect(() => {
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
        const onActivity = () => {
            if (showWarning) return;
            startIdleTimer();
            pingActivity();
        };
        events.forEach((ev) => window.addEventListener(ev, onActivity));
        startIdleTimer();
        return () => {
            events.forEach((ev) => window.removeEventListener(ev, onActivity));
            clearTimers();
        };
    }, [startIdleTimer, pingActivity, showWarning, clearTimers]);

    if (!showWarning) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">Session timeout</h3>
                <p className="text-slate-600">
                    You will be logged out due to inactivity.
                </p>
                <p className="text-sm text-slate-500">
                    Logging out in <strong>{warningCountdown}</strong> seconds.
                </p>
                <div className="flex gap-3 justify-end pt-2">
                    <button
                        type="button"
                        onClick={handleLogoutNow}
                        className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium"
                    >
                        Logout now
                    </button>
                    <button
                        type="button"
                        onClick={handleStayLoggedIn}
                        className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-medium"
                    >
                        Stay logged in
                    </button>
                </div>
            </div>
        </div>
    );
}
