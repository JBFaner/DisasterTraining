import React from 'react';
import { dashboardIndex } from '../utils/portalRoutes';

function userInitials(name = 'User') {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join('');
}

function FieldError({ message }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-rose-600">{message}</p>;
}

function VerifiedBadge({ verified, verifiedLabel = 'Verified', unverifiedLabel = 'Unverified' }) {
    if (verified) {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {verifiedLabel}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            {unverifiedLabel}
        </span>
    );
}

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

export function ProfilePage({
    user,
    role = 'PARTICIPANT',
    flashStatus = '',
    flashErrors = [],
    validationErrors = {},
    oldInput = {},
}) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const initials = userInitials(user?.name);
    const backHref = dashboardIndex(role);

    const fieldError = (field) => validationErrors[field]?.[0] ?? null;

    const nameValue = oldInput.name ?? user?.name ?? '';
    const streetValue = oldInput.street ?? user?.street ?? '';
    const newEmailValue = oldInput.new_email ?? '';
    const newPhoneValue = oldInput.new_phone ?? '';
    const notificationPreferences = {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...(user?.notification_preferences || {}),
    };

    return (
        <div className="space-y-6">
            <section className="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-emerald-50/60 border border-slate-200/80 shadow-xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-emerald-100 rounded-2xl shadow-sm">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white text-lg font-semibold">
                                {initials}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">My Profile</h1>
                            <p className="mt-1 text-sm text-slate-600 max-w-xl">
                                Manage your account information, contact details, and security settings from a single place.
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-3 py-1 border border-slate-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Signed in as <span className="font-semibold text-slate-800">{user?.email}</span>
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-3 py-1 border border-slate-200">
                                    Role:{' '}
                                    <span className="font-semibold text-slate-800 text-[0.7rem] uppercase tracking-wide">
                                        {user?.role ?? 'User'}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-3">
                        <a href={backHref} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900">
                            <span className="text-base">←</span>
                            Back to dashboard
                        </a>
                        {flashStatus && (
                            <div className="mt-1 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs text-emerald-800 shadow-sm max-w-xs">
                                {flashStatus}
                            </div>
                        )}
                    </div>
                </div>
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
                    <div>
                        <h2 className="text-xs font-semibold tracking-wide text-slate-500 uppercase mb-2">Manage Profile</h2>
                        <p className="text-xs text-slate-500">
                            Switch between profile details, security, and contact information.
                        </p>
                    </div>
                    <nav className="space-y-1 text-sm">
                        <a href="#profile-information" className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 text-white font-medium shadow-sm">
                            <span>Profile Information</span>
                            <span className="text-[10px] uppercase tracking-wide opacity-80">Main</span>
                        </a>
                        <a href="#security" className="block px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                            Security (Change Password)
                        </a>
                        <a href="#email-phone" className="block px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                            Email &amp; Phone
                        </a>
                        <a href="#notification-preferences" className="block px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                            Notifications
                        </a>
                        <a href="#activity-logs" className="block px-3 py-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                            Activity Logs <span className="ml-1 text-[10px] uppercase tracking-wide text-amber-600">Soon</span>
                        </a>
                    </nav>
                </aside>

                <div className="space-y-6">
                    <section id="profile-information" className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl sm:text-2xl font-semibold shadow-md">
                                {initials}
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-lg font-semibold text-slate-900">Profile Information</h2>
                                <p className="text-xs text-slate-500">
                                    Update your name and address details. Your contact information is shown to administrators for coordination.
                                </p>
                            </div>
                        </div>

                        <form method="POST" action="/profile" className="space-y-4 max-w-xl">
                            <input type="hidden" name="_token" value={csrf} />
                            <input type="hidden" name="_method" value="PUT" />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label htmlFor="name" className="block text-xs font-semibold text-slate-600 mb-1">
                                        Full Name
                                    </label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        defaultValue={nameValue}
                                        required
                                        className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                                            fieldError('name') ? 'border-rose-300' : 'border-slate-300'
                                        }`}
                                    />
                                    <FieldError message={fieldError('name')} />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                        <span className="font-medium text-slate-900">{user?.email ?? 'Not set'}</span>
                                        <VerifiedBadge verified={Boolean(user?.email_verified_at)} />
                                        {user?.pending_email && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                                                Pending: {user.pending_email}
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Use the Email &amp; Phone section to request changes and manage verification.
                                    </p>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                        <span className="font-medium text-slate-900">{user?.phone ?? 'Not provided'}</span>
                                        {user?.phone_verified_at && <VerifiedBadge verified />}
                                        {user?.pending_phone && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                                                Pending: {user.pending_phone}
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Phone changes are confirmed via an email sent to your current address.
                                    </p>
                                </div>

                                <div className="sm:col-span-2">
                                    <label htmlFor="street" className="block text-xs font-semibold text-slate-600 mb-1">
                                        Address
                                    </label>
                                    <input
                                        id="street"
                                        name="street"
                                        type="text"
                                        defaultValue={streetValue}
                                        placeholder="Block 5 Lot 10, Barangay Commonwealth, Quezon City"
                                        required
                                        className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                                            fieldError('street') ? 'border-rose-300' : 'border-slate-300'
                                        }`}
                                    />
                                    <FieldError message={fieldError('street')} />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                                <button
                                    type="submit"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 transition-colors"
                                >
                                    Save changes
                                </button>
                            </div>
                        </form>
                    </section>

                    <section id="security" className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8 space-y-4">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">Security</h2>
                            <p className="mt-1 text-xs text-slate-500">Change your password to keep your account secure.</p>
                        </div>

                        <form method="POST" action="/profile/password" className="space-y-3 max-w-md">
                            <input type="hidden" name="_token" value={csrf} />

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="current_password">
                                    Current Password
                                </label>
                                <input
                                    id="current_password"
                                    name="current_password"
                                    type="password"
                                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                                        fieldError('current_password') ? 'border-rose-300' : 'border-slate-300'
                                    }`}
                                />
                                <FieldError message={fieldError('current_password')} />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="password">
                                    New Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                                        fieldError('password') ? 'border-rose-300' : 'border-slate-300'
                                    }`}
                                />
                                <p className="mt-1 text-xs text-slate-500">
                                    Minimum 8 characters, with at least one uppercase letter, one lowercase letter, and one number.
                                </p>
                                <FieldError message={fieldError('password')} />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="password_confirmation">
                                    Confirm New Password
                                </label>
                                <input
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    type="password"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button
                                    type="submit"
                                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
                                >
                                    Update password
                                </button>
                            </div>
                        </form>
                    </section>

                    <section id="email-phone" className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8 space-y-6">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">Email &amp; Phone</h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Request changes to your primary email and phone number. All changes are verified before they go live.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <form method="POST" action="/profile/email" className="space-y-2">
                                <input type="hidden" name="_token" value={csrf} />
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="new_email">
                                    Change Email Address
                                </label>
                                <div className="grid gap-1 sm:gap-2 sm:grid-cols-[minmax(0,1.7fr)_auto] items-center">
                                    <input
                                        id="new_email"
                                        name="new_email"
                                        type="email"
                                        defaultValue={newEmailValue}
                                        placeholder="you@example.com"
                                        className={`w-full rounded-lg border px-3 text-sm h-11 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                                            fieldError('new_email') ? 'border-rose-300' : 'border-slate-300'
                                        }`}
                                    />
                                    <button
                                        type="submit"
                                        className="inline-flex items-center justify-center px-4 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold whitespace-nowrap"
                                    >
                                        Send verification link
                                    </button>
                                    <div className="sm:col-span-2">
                                        <FieldError message={fieldError('new_email')} />
                                    </div>
                                </div>
                            </form>

                            {user?.pending_email && (
                                <form method="POST" action="/profile/email/resend" className="space-y-1">
                                    <input type="hidden" name="_token" value={csrf} />
                                    <p className="text-xs text-slate-500">
                                        We have a pending email change to <strong>{user.pending_email}</strong>. If you did not receive the verification email, you can resend it.
                                    </p>
                                    <button
                                        type="submit"
                                        className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[0.7rem] font-semibold"
                                    >
                                        Resend verification email
                                    </button>
                                </form>
                            )}

                            <form method="POST" action="/profile/phone" className="space-y-2">
                                <input type="hidden" name="_token" value={csrf} />
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="new_phone">
                                    Change Phone Number
                                </label>
                                <div className="grid gap-1 sm:gap-2 sm:grid-cols-[minmax(0,1.7fr)_auto] items-center">
                                    <input
                                        id="new_phone"
                                        name="new_phone"
                                        type="text"
                                        defaultValue={newPhoneValue}
                                        placeholder="+63 9XXXXXXXXX"
                                        className={`w-full rounded-lg border px-3 text-sm h-11 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                                            fieldError('new_phone') ? 'border-rose-300' : 'border-slate-300'
                                        }`}
                                    />
                                    <button
                                        type="submit"
                                        className="inline-flex items-center justify-center px-4 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold whitespace-nowrap"
                                    >
                                        Send confirmation email
                                    </button>
                                    <div className="sm:col-span-2">
                                        <FieldError message={fieldError('new_phone')} />
                                    </div>
                                </div>
                            </form>
                        </div>
                    </section>

                    <section id="notification-preferences" className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8 space-y-4">
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
                    </section>

                    <section id="activity-logs" className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-sm font-semibold text-slate-900">Activity Logs</h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    In a future update, this section will show your recent sign-ins and important security events.
                                </p>
                            </div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                Coming soon
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">
                            For now, administrators can review detailed account activity from the Audit Logs module.
                        </p>
                    </section>
                </div>
            </section>
        </div>
    );
}
