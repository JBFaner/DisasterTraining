import React, { useEffect, useState } from 'react';
import { Bell, Clock, Link2, Moon, Shield, User } from 'lucide-react';
import { dashboardIndex } from '../utils/portalRoutes';
import { getCsrfToken } from '../utils/csrf';
import { ThemeToggle } from '../components/ThemeToggle';
import { initTheme } from '../utils/theme';

const DEFAULT_NOTIFICATION_PREFERENCES = {
    in_app_enabled: true,
    registrations: true,
    events: true,
    attendance: true,
    evaluations: true,
    certificates: true,
};

function PreferenceCheckbox({ name, label, description, defaultChecked }) {
    return (
        <label className="flex items-start gap-3 rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50 cursor-pointer">
            <input type="hidden" name={name} value="0" />
            <input
                type="checkbox"
                name={name}
                value="1"
                defaultChecked={defaultChecked}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="min-w-0">
                <span className="block text-sm font-medium text-slate-900">{label}</span>
                {description && <span className="block text-xs text-slate-500 mt-0.5">{description}</span>}
            </span>
        </label>
    );
}

function FieldError({ message }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-rose-600">{message}</p>;
}

export function SettingsPage({
    user,
    role = 'PARTICIPANT',
    flashStatus = '',
    flashErrors = [],
    validationErrors = {},
    sessionTimeoutMinutes = 10,
    warningBeforeLogoutSeconds = 60,
}) {
    const csrf = getCsrfToken();
    const backHref = dashboardIndex(role);
    const isAdmin = role === 'LGU_ADMIN';
    const notificationPreferences = {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...(user?.notification_preferences || {}),
    };

    const [autoApproval, setAutoApproval] = useState(null);
    const [autoApprovalBusy, setAutoApprovalBusy] = useState(false);
    const [autoApprovalMessage, setAutoApprovalMessage] = useState('');

    useEffect(() => {
        initTheme();
    }, []);

    useEffect(() => {
        if (!isAdmin) return undefined;
        let cancelled = false;
        fetch('/admin/settings/auto-approval', {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin',
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!cancelled && data && typeof data.enabled === 'boolean') {
                    setAutoApproval(data.enabled);
                }
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [isAdmin]);

    const toggleAutoApproval = async () => {
        if (!isAdmin || autoApprovalBusy || autoApproval === null) return;
        setAutoApprovalBusy(true);
        setAutoApprovalMessage('');
        try {
            const next = !autoApproval;
            const res = await fetch('/admin/settings/auto-approval', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ enabled: next }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || 'Failed to update auto-approval.');
            }
            setAutoApproval(Boolean(data.enabled));
            setAutoApprovalMessage(data.message || 'Auto-approval updated.');
        } catch (err) {
            setAutoApprovalMessage(err.message || 'Failed to update auto-approval.');
        } finally {
            setAutoApprovalBusy(false);
        }
    };

    const fieldError = (field) => validationErrors[field]?.[0] ?? null;

    return (
        <div className="space-y-6">
            <section className="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-emerald-50/60 border border-slate-200/80 shadow-xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
                        <p className="mt-1 text-sm text-slate-600 max-w-xl">
                            Manage notification preferences, review session timeout, and jump to account tools.
                        </p>
                    </div>
                    <a href={backHref} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900">
                        <span className="text-base">←</span>
                        Back to dashboard
                    </a>
                </div>
                {flashStatus && (
                    <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs text-emerald-800 shadow-sm max-w-lg">
                        {flashStatus}
                    </div>
                )}
            </section>

            {flashErrors.length > 0 && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-800">
                    <ul className="list-disc list-inside space-y-1">
                        {flashErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                        ))}
                    </ul>
                </div>
            )}

            <section className="grid gap-6 lg:grid-cols-[240px,minmax(0,1fr)] items-start">
                <aside className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 space-y-4">
                    <h2 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Settings</h2>
                    <nav className="space-y-1 text-sm">
                        <a href="#appearance" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 text-white font-medium shadow-sm">
                            <Moon className="w-4 h-4" /> Appearance
                        </a>
                        <a href="#notifications" className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 border border-transparent hover:border-slate-200">
                            <Bell className="w-4 h-4" /> Notifications
                        </a>
                        <a href="#session" className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 border border-transparent hover:border-slate-200">
                            <Clock className="w-4 h-4" /> Session
                        </a>
                        <a href="#shortcuts" className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 border border-transparent hover:border-slate-200">
                            <Link2 className="w-4 h-4" /> Account shortcuts
                        </a>
                        {isAdmin && (
                            <a href="#admin" className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 border border-transparent hover:border-slate-200">
                                <Shield className="w-4 h-4" /> Admin
                            </a>
                        )}
                    </nav>
                </aside>

                <div className="space-y-6">
                    <section id="appearance" className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8 space-y-4">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">Appearance</h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Choose light or dark mode for the portal. Your preference is saved on this device.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 max-w-xl">
                            <div>
                                <p className="text-sm font-medium text-slate-900">Color theme</p>
                                <p className="text-xs text-slate-500 mt-0.5">Switch anytime between Light and Dark.</p>
                            </div>
                            <ThemeToggle />
                        </div>
                    </section>

                    <section id="notifications" className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8 space-y-4">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">Notification Preferences</h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Choose which in-app notifications you receive in the bell menu. Admin training alerts are always delivered.
                            </p>
                        </div>

                        <form method="POST" action="/profile/notifications" className="space-y-3 max-w-xl">
                            <input type="hidden" name="_token" value={csrf} />
                            <input type="hidden" name="_method" value="PUT" />

                            <PreferenceCheckbox
                                name="in_app_enabled"
                                label="Enable in-app notifications"
                                description="Master switch for all notification categories below."
                                defaultChecked={notificationPreferences.in_app_enabled}
                            />
                            <PreferenceCheckbox
                                name="registrations"
                                label="Registration updates"
                                description="Approvals, rejections, and registration confirmations."
                                defaultChecked={notificationPreferences.registrations}
                            />
                            <PreferenceCheckbox
                                name="events"
                                label="Event updates"
                                description="Event cancellations and schedule changes."
                                defaultChecked={notificationPreferences.events}
                            />
                            <PreferenceCheckbox
                                name="attendance"
                                label="Attendance"
                                description="When you are marked present or late for an event."
                                defaultChecked={notificationPreferences.attendance}
                            />
                            <PreferenceCheckbox
                                name="evaluations"
                                label="Evaluations & assessments"
                                description="Drill results and AI scenario assessment outcomes."
                                defaultChecked={notificationPreferences.evaluations}
                            />
                            <PreferenceCheckbox
                                name="certificates"
                                label="Certificates"
                                description="Certificate issued or revoked notices."
                                defaultChecked={notificationPreferences.certificates}
                            />

                            <div className="pt-2 flex justify-end">
                                <button
                                    type="submit"
                                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
                                >
                                    Save notification preferences
                                </button>
                            </div>
                        </form>
                        <FieldError message={fieldError('notifications')} />
                    </section>

                    <section id="session" className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8 space-y-4">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">Session timeout</h2>
                            <p className="mt-1 text-xs text-slate-500">
                                These values are set by the system. The TopBar countdown only appears in the final minute before logout.
                            </p>
                        </div>
                        <dl className="grid gap-3 sm:grid-cols-2 max-w-xl">
                            <div className="rounded-xl border border-slate-200 px-4 py-3">
                                <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Idle timeout</dt>
                                <dd className="mt-1 text-lg font-semibold text-slate-900">{sessionTimeoutMinutes} minutes</dd>
                            </div>
                            <div className="rounded-xl border border-slate-200 px-4 py-3">
                                <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Warning before logout</dt>
                                <dd className="mt-1 text-lg font-semibold text-slate-900">{warningBeforeLogoutSeconds} seconds</dd>
                            </div>
                        </dl>
                    </section>

                    <section id="shortcuts" className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8 space-y-4">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">Account shortcuts</h2>
                            <p className="mt-1 text-xs text-slate-500">Jump to profile tools for identity and security changes.</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <a
                                href="/profile#profile-information"
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                <User className="w-4 h-4" />
                                Manage Profile
                            </a>
                            <a
                                href="/profile#security"
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                <Shield className="w-4 h-4" />
                                Change password
                            </a>
                            <a
                                href="/profile#email-phone"
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                <Bell className="w-4 h-4" />
                                Email &amp; Phone
                            </a>
                        </div>
                    </section>

                    {isAdmin && (
                        <section id="admin" className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8 space-y-4">
                            <div>
                                <h2 className="text-sm font-semibold text-slate-900">Admin preferences</h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Control whether simulation events can be auto-approved system-wide.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 max-w-xl">
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Event auto-approval</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {autoApproval === null
                                            ? 'Loading current setting…'
                                            : autoApproval
                                              ? 'Enabled — events may be auto-approved.'
                                              : 'Disabled — manual approval required.'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={toggleAutoApproval}
                                    disabled={autoApprovalBusy || autoApproval === null}
                                    className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold"
                                >
                                    {autoApprovalBusy ? 'Saving…' : autoApproval ? 'Disable' : 'Enable'}
                                </button>
                            </div>
                            {autoApprovalMessage && (
                                <p className="text-xs text-slate-600">{autoApprovalMessage}</p>
                            )}
                        </section>
                    )}
                </div>
            </section>
        </div>
    );
}
