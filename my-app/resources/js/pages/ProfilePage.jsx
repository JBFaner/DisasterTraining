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
    const fileInputRef = React.useRef(null);
    const [viewerOpen, setViewerOpen] = React.useState(false);
    const [pictureBusy, setPictureBusy] = React.useState(false);

    const fieldError = (field) => validationErrors[field]?.[0] ?? null;

    const nameValue = oldInput.name ?? user?.name ?? '';
    const streetValue = oldInput.street ?? user?.street ?? '';
    const newEmailValue = oldInput.new_email ?? '';
    const newPhoneValue = oldInput.new_phone ?? '';

    const profilePictureUrl = user?.profile_picture
        ? (String(user.profile_picture).startsWith('http')
            ? user.profile_picture
            : `/storage/${user.profile_picture}`)
        : null;

    const openFilePicker = () => {
        fileInputRef.current?.click();
    };

    const submitPictureFile = async (file) => {
        if (!file) return;
        setPictureBusy(true);
        try {
            const body = new FormData();
            body.append('_token', csrf);
            body.append('profile_picture', file);
            const res = await fetch('/profile/picture', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body,
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                const message = data?.errors?.profile_picture?.[0]
                    || data?.message
                    || 'Could not upload photo.';
                window.alert(message);
                return;
            }
            window.location.reload();
        } catch (err) {
            console.error(err);
            window.alert('Could not upload photo.');
        } finally {
            setPictureBusy(false);
        }
    };

    const handleDeletePicture = async () => {
        if (!profilePictureUrl) return;
        const ok = window.confirm('Remove your profile photo?');
        if (!ok) return;
        setPictureBusy(true);
        try {
            const res = await fetch('/profile/picture', {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            if (!res.ok && res.status !== 302) {
                const data = await res.json().catch(() => ({}));
                window.alert(data?.errors?.profile_picture?.[0] || data?.message || 'Could not remove photo.');
                return;
            }
            window.location.reload();
        } catch (err) {
            console.error(err);
            window.alert('Could not remove photo.');
        } finally {
            setPictureBusy(false);
        }
    };

    React.useEffect(() => {
        if (!viewerOpen) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') setViewerOpen(false);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [viewerOpen]);

    return (
        <div className="space-y-6">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    submitPictureFile(file);
                }}
            />

            {viewerOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Profile photo"
                    onClick={() => setViewerOpen(false)}
                >
                    <div
                        className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                            <p className="text-sm font-semibold text-slate-900">Profile photo</p>
                            <button
                                type="button"
                                className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                onClick={() => setViewerOpen(false)}
                            >
                                Close
                            </button>
                        </div>
                        <div className="bg-slate-100 flex items-center justify-center min-h-[280px] p-6">
                            {profilePictureUrl ? (
                                <img
                                    src={profilePictureUrl}
                                    alt={user?.name || 'Profile'}
                                    className="max-h-[70vh] max-w-full rounded-xl object-contain shadow-md"
                                />
                            ) : (
                                <div className="h-40 w-40 rounded-full bg-emerald-600 text-white flex items-center justify-center text-4xl font-semibold">
                                    {initials}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 px-4 py-3">
                            {profilePictureUrl ? (
                                <button
                                    type="button"
                                    disabled={pictureBusy}
                                    onClick={handleDeletePicture}
                                    className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                                >
                                    Delete photo
                                </button>
                            ) : null}
                            <button
                                type="button"
                                disabled={pictureBusy}
                                onClick={openFilePicker}
                                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                            >
                                {profilePictureUrl ? 'Change photo' : 'Upload photo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <section className="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-emerald-50/60 border border-slate-200/80 shadow-xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <button
                            type="button"
                            onClick={() => setViewerOpen(true)}
                            className="p-1 bg-emerald-100 rounded-2xl shadow-sm hover:ring-2 hover:ring-emerald-300 transition"
                            title="View profile photo"
                        >
                            {profilePictureUrl ? (
                                <img
                                    src={profilePictureUrl}
                                    alt={user?.name || 'Profile'}
                                    className="h-10 w-10 rounded-xl object-cover"
                                />
                            ) : (
                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white text-lg font-semibold">
                                    {initials}
                                </span>
                            )}
                        </button>
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
                        <a href="/settings#notifications" className="block px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                            Notifications <span className="ml-1 text-[10px] uppercase tracking-wide text-slate-400">Settings</span>
                        </a>
                    </nav>
                </aside>

                <div className="space-y-6">
                    <section id="profile-information" className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <button
                                type="button"
                                onClick={() => setViewerOpen(true)}
                                className="relative group shrink-0"
                                title="View or change photo"
                            >
                                {profilePictureUrl ? (
                                    <img
                                        src={profilePictureUrl}
                                        alt={user?.name || 'Profile'}
                                        className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover border-2 border-emerald-100 shadow-md group-hover:ring-2 group-hover:ring-emerald-400 transition"
                                    />
                                ) : (
                                    <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-emerald-600 text-white flex items-center justify-center text-2xl font-semibold shadow-md group-hover:ring-2 group-hover:ring-emerald-400 transition">
                                        {initials}
                                    </div>
                                )}
                                <span className="absolute inset-0 rounded-full bg-slate-900/0 group-hover:bg-slate-900/35 flex items-center justify-center text-[11px] font-semibold text-white opacity-0 group-hover:opacity-100 transition">
                                    View
                                </span>
                            </button>
                            <div className="space-y-2 flex-1">
                                <h2 className="text-lg font-semibold text-slate-900">Profile Information</h2>
                                <p className="text-xs text-slate-500">
                                    Click your photo to view it full-size. You can change or delete it from there.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        disabled={pictureBusy}
                                        onClick={openFilePicker}
                                        className="inline-flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 disabled:opacity-50"
                                    >
                                        {profilePictureUrl ? 'Change photo' : 'Upload photo'}
                                    </button>
                                    {profilePictureUrl ? (
                                        <button
                                            type="button"
                                            disabled={pictureBusy}
                                            onClick={handleDeletePicture}
                                            className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold px-4 py-2 disabled:opacity-50"
                                        >
                                            Delete photo
                                        </button>
                                    ) : null}
                                </div>
                                <p className="text-[0.7rem] text-slate-500">JPG, PNG, or WebP. Max 2MB. Stored on Cloudinary.</p>
                                <FieldError message={fieldError('profile_picture')} />
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

                    <section id="notification-preferences" className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8 space-y-3">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">Notification Preferences</h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Notification controls now live under Settings so profile stays focused on identity and security.
                            </p>
                        </div>
                        <a
                            href="/settings#notifications"
                            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
                        >
                            Open notification settings
                        </a>
                    </section>
                </div>
            </section>
        </div>
    );
}
