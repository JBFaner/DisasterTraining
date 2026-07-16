import React from 'react';
import {
    AlertCircle,
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    Clock3,
    LogIn,
    MapPin,
    UserPlus,
} from 'lucide-react';

function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(timeString) {
    if (!timeString) return '—';
    const match = String(timeString).match(/^(\d{1,2}):(\d{2})/);
    if (!match) return '—';
    const hour = Number(match[1]);
    const minute = match[2];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute} ${ampm}`;
}

function CampaignDetails({ campaignContext }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4">
            <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Campaign Title</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{campaignContext?.training_title || '—'}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Training Module</p>
                    <p className="mt-1 text-sm text-slate-800">{campaignContext?.training_title || '—'}</p>
                </div>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Schedule</p>
                    <p className="mt-1 text-sm text-slate-800 flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-emerald-600" />
                        {formatDate(campaignContext?.scheduled_date)}
                        {(campaignContext?.start_time || campaignContext?.end_time) && (
                            <span className="inline-flex items-center gap-1 text-slate-600">
                                <Clock3 className="h-4 w-4" />
                                {formatTime(campaignContext?.start_time)} – {formatTime(campaignContext?.end_time)}
                            </span>
                        )}
                    </p>
                </div>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Venue</p>
                    <p className="mt-1 text-sm text-slate-800 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-emerald-600" />
                        {campaignContext?.venue || '—'}
                    </p>
                </div>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Registration Deadline</p>
                    <p className="mt-1 text-sm text-slate-800">{formatDate(campaignContext?.registration_deadline)}</p>
                </div>
            </div>
        </div>
    );
}

export function CampaignRegister({
    campaignContext = null,
    alreadyRegistered = false,
    authenticated = false,
    registrationClosed = false,
    errors = {},
}) {
    const campaignId = campaignContext?.campaign_request_id;
    const registerAccountUrl = campaignId
        ? `/participant/register?campaign_request=${campaignId}&create_account=1`
        : '/participant/register';
    const loginUrl = campaignId
        ? `/participant/login?redirect=${encodeURIComponent(`/campaigns/${campaignId}/register`)}`
        : '/participant/login';

    if (registrationClosed) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
                    <h1 className="mt-4 text-2xl font-bold text-slate-900">Registration Not Available</h1>
                    <p className="mt-2 text-slate-600">
                        Registration is not open for this campaign yet, or the campaign has reached capacity.
                    </p>
                    <a href="/" className="mt-6 inline-flex items-center gap-2 text-emerald-700 font-semibold hover:text-emerald-800">
                        Return Home
                        <ArrowRight className="h-4 w-4" />
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-lg">
                <div className="mb-6">
                    <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Campaign Registration</p>
                    <h1 className="mt-1 text-3xl font-bold text-slate-900">
                        {alreadyRegistered ? 'Already Registered' : 'Join This Campaign'}
                    </h1>
                    <p className="mt-2 text-slate-600">
                        {alreadyRegistered
                            ? 'You are already registered for this campaign.'
                            : authenticated
                                ? 'Completing your registration...'
                                : 'Review the campaign details below, then sign in or create an account to register.'}
                    </p>
                </div>

                {errors.form && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errors.form}
                    </div>
                )}

                <CampaignDetails campaignContext={campaignContext} />

                {alreadyRegistered ? (
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <a
                            href="/participant/my-trainings"
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
                        >
                            View My Trainings
                            <ArrowRight className="h-4 w-4" />
                        </a>
                        <a
                            href="/participant/dashboard"
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Go to Dashboard
                        </a>
                    </div>
                ) : !authenticated ? (
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <a
                            href={registerAccountUrl}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
                        >
                            <UserPlus className="h-4 w-4" />
                            Create Account
                        </a>
                        <a
                            href={loginUrl}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-700 px-5 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                        >
                            <LogIn className="h-4 w-4" />
                            Sign In
                        </a>
                    </div>
                ) : (
                    <div className="mt-6 flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Redirecting to confirmation...
                    </div>
                )}
            </div>
        </div>
    );
}

export function CampaignRegisterSuccess({ campaignContext = null }) {
    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg text-center">
                <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
                <h1 className="mt-4 text-2xl font-bold text-slate-900">Registration Successful</h1>
                <p className="mt-2 text-slate-600">
                    You are now registered for{' '}
                    <span className="font-semibold text-slate-900">{campaignContext?.training_title || 'this campaign'}</span>.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <a
                        href="/participant/my-trainings"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
                    >
                        My Trainings
                    </a>
                    <a
                        href="/participant/dashboard"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Dashboard
                    </a>
                </div>
            </div>
        </div>
    );
}
