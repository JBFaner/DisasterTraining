import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getCsrfToken, pingSessionActivity } from '../utils/csrf';
import { getLogoutUrl } from '../utils/portalAuth';

const ACTIVITY_THROTTLE_MS = 30000;
const SessionIdleContext = createContext(null);

function submitLogout(reason = null) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = reason ? getLogoutUrl(reason) : getLogoutUrl();
    const csrf = document.createElement('input');
    csrf.type = 'hidden';
    csrf.name = '_token';
    csrf.value = getCsrfToken();
    form.appendChild(csrf);
    document.body.appendChild(form);
    form.submit();
}

export function SessionIdleProvider({ timeoutMinutes = 10, warningSeconds = 60, enabled = true, children }) {
    const totalSeconds = Math.max(warningSeconds + 1, timeoutMinutes * 60);
    const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
    const [showWarning, setShowWarning] = useState(false);

    const idleTimerRef = useRef(null);
    const warningTimerRef = useRef(null);
    const countdownIntervalRef = useRef(null);
    const lastPingRef = useRef(0);
    const deadlineRef = useRef(Date.now() + totalSeconds * 1000);
    const showWarningRef = useRef(false);
    const loggedOutRef = useRef(false);

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
        pingSessionActivity().catch(() => {});
    }, []);

    const startIdleTimer = useCallback(() => {
        clearTimers();
        loggedOutRef.current = false;
        deadlineRef.current = Date.now() + totalSeconds * 1000;
        showWarningRef.current = false;
        setShowWarning(false);
        setRemainingSeconds(totalSeconds);

        const warningDelayMs = Math.max(0, (totalSeconds - warningSeconds) * 1000);

        idleTimerRef.current = setTimeout(() => {
            idleTimerRef.current = null;
            showWarningRef.current = true;
            setShowWarning(true);

            warningTimerRef.current = setTimeout(() => {
                warningTimerRef.current = null;
                if (!loggedOutRef.current) {
                    loggedOutRef.current = true;
                    submitLogout('inactivity');
                }
            }, warningSeconds * 1000);
        }, warningDelayMs);

        countdownIntervalRef.current = setInterval(() => {
            const left = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
            setRemainingSeconds(left);
            const inWarning = left <= warningSeconds;
            if (inWarning !== showWarningRef.current) {
                showWarningRef.current = inWarning;
                setShowWarning(inWarning);
            }
            if (left <= 0 && !loggedOutRef.current) {
                loggedOutRef.current = true;
                clearTimers();
                submitLogout('inactivity');
            }
        }, 250);
    }, [clearTimers, totalSeconds, warningSeconds]);

    const handleStayLoggedIn = useCallback(() => {
        pingActivity();
        startIdleTimer();
    }, [pingActivity, startIdleTimer]);

    const handleLogoutNow = useCallback(() => {
        clearTimers();
        submitLogout();
    }, [clearTimers]);

    useEffect(() => {
        if (!enabled) {
            clearTimers();
            return undefined;
        }

        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
        const onActivity = () => {
            if (showWarningRef.current) return;
            startIdleTimer();
            pingActivity();
        };

        events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));
        startIdleTimer();

        return () => {
            events.forEach((ev) => window.removeEventListener(ev, onActivity));
            clearTimers();
        };
    }, [enabled, startIdleTimer, pingActivity, clearTimers]);

    const value = useMemo(
        () => ({
            enabled,
            remainingSeconds,
            showWarning,
            warningSeconds,
            timeoutMinutes,
            stayLoggedIn: handleStayLoggedIn,
            logoutNow: handleLogoutNow,
        }),
        [
            enabled,
            remainingSeconds,
            showWarning,
            warningSeconds,
            timeoutMinutes,
            handleStayLoggedIn,
            handleLogoutNow,
        ],
    );

    return <SessionIdleContext.Provider value={value}>{children}</SessionIdleContext.Provider>;
}

export function useSessionIdle() {
    return useContext(SessionIdleContext);
}

export function formatSessionCountdown(totalSeconds) {
    const seconds = Math.max(0, totalSeconds | 0);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
