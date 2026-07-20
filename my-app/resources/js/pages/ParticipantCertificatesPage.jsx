import React from 'react';
import {
    Award,
    CalendarClock,
    CheckCircle2,
    ChevronRight,
    Circle,
    Copy,
    ExternalLink,
    Mail,
    Share2,
    Sparkles,
} from 'lucide-react';
import { ParticipantEmptyState, PARTICIPANT_EMPTY_STATES } from '../components/ParticipantEmptyState';

function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusTone(status) {
    if (status === 'issued' || status === 'eligible') {
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (status === 'assessment_failed' || status === 'not_eligible') {
        return 'bg-rose-50 text-rose-800 border-rose-200';
    }
    if (status === 'assessment_ready' || status === 'awaiting_evaluation') {
        return 'bg-sky-50 text-sky-800 border-sky-200';
    }
    return 'bg-amber-50 text-amber-800 border-amber-200';
}

function RequirementList({ requirements = [] }) {
    return (
        <ul className="space-y-2">
            {requirements.map((req) => (
                <li key={req.key} className="flex items-start gap-2 text-sm text-slate-700">
                    {req.met ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                        <Circle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                    )}
                    <span className={req.met ? 'text-slate-700' : 'text-slate-500'}>{req.label}</span>
                </li>
            ))}
        </ul>
    );
}

function EligibilityCard({ entry, icon: Icon }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <Icon className="w-3.5 h-3.5" />
                        {entry.path_label}
                    </div>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">{entry.title}</h3>
                    {entry.event_date && (
                        <p className="mt-1 text-sm text-slate-500">Event date: {formatDate(entry.event_date)}</p>
                    )}
                    {entry.progress_percent != null && entry.path_type === 'self_paced' && (
                        <p className="mt-1 text-sm text-slate-500">
                            Module progress: {entry.progress_percent}%
                            {entry.lesson_count ? ` · ${entry.lesson_count} lessons` : ''}
                        </p>
                    )}
                </div>
                <span className={`inline-flex self-start rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(entry.status)}`}>
                    {entry.status_label}
                </span>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Requirements</p>
                    <RequirementList requirements={entry.requirements} />
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next step</p>
                    <p className="mt-2 text-sm text-slate-700">{entry.next_step}</p>
                    {entry.action_href && (
                        <a
                            href={entry.action_href}
                            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                        >
                            {entry.action_label}
                            <ChevronRight className="w-4 h-4" />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

function CertificateActions({ cert }) {
    const [copied, setCopied] = React.useState(false);
    const verifyUrl = cert.verification_url || cert.share_url;
    const viewUrl = cert.view_url || (cert.id ? `/participant/certificates/${cert.id}/view` : null);
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';

    const copyLink = async () => {
        if (!verifyUrl) return;
        try {
            await navigator.clipboard.writeText(verifyUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            window.prompt('Copy verification link:', verifyUrl);
        }
    };

    const emailCertificate = async () => {
        if (!cert.id) return;
        const response = await fetch(`/participant/certificates/${cert.id}/email`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': csrf,
                Accept: 'application/json',
            },
        });
        const data = await response.json().catch(() => ({}));
        window.alert(data.message || (response.ok ? 'Certificate email sent.' : 'Could not send email.'));
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            {viewUrl && (
                <a
                    href={viewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                    View / Download
                </a>
            )}
            {verifyUrl && (
                <>
                    <a
                        href={verifyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Verify
                    </a>
                    <button
                        type="button"
                        onClick={copyLink}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        <Copy className="w-3.5 h-3.5" />
                        {copied ? 'Copied' : 'Copy link'}
                    </button>
                    <a
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        title="Share verification link"
                    >
                        <Share2 className="w-3.5 h-3.5" />
                        Share
                    </a>
                </>
            )}
            {cert.id && (
                <button
                    type="button"
                    onClick={emailCertificate}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                >
                    <Mail className="w-3.5 h-3.5" />
                    Email me
                </button>
            )}
        </div>
    );
}

function PathGuide({ passingScore, settings }) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                    <Sparkles className="w-4 h-4" />
                    Self-paced path
                </div>
                <ol className="mt-3 space-y-2 text-sm text-emerald-950/80 list-decimal list-inside">
                    <li>Complete all lessons (and lesson quizzes if required)</li>
                    <li>Pass the Final AI Scenario Assessment ({passingScore}%+)</li>
                    <li>Certificate is issued automatically when you pass</li>
                </ol>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-5">
                <div className="flex items-center gap-2 text-sky-900 font-semibold">
                    <CalendarClock className="w-4 h-4" />
                    Simulation event path
                </div>
                <ol className="mt-3 space-y-2 text-sm text-sky-950/80 list-decimal list-inside">
                    <li>Register and get approved for a live drill</li>
                    <li>Attend on event day{settings?.event_requires_attendance ? ' (attendance required)' : ''}</li>
                    <li>Pass the trainer&apos;s drill evaluation ({passingScore}%+)</li>
                    <li>
                        {settings?.event_auto_issue
                            ? 'Certificate is issued automatically — you will be notified in the app'
                            : 'LGU trainer issues your certificate — you will be notified when ready'}
                    </li>
                </ol>
            </div>
        </div>
    );
}

export function ParticipantCertificatesPage({ certificates = [], eligibility = null }) {
    const rows = Array.isArray(certificates)
        ? certificates
        : Object.values(certificates || {});

    const selfPaced = eligibility?.self_paced || [];
    const eventBased = eligibility?.event_based || [];
    const summary = eligibility?.summary || {};
    const passingScore = eligibility?.passing_score ?? 75;
    const settings = eligibility?.settings || {};
    const hasEligibility = selfPaced.length > 0 || eventBased.length > 0;
    const hasCertificates = rows.length > 0;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h1 className="text-xl font-bold text-slate-900 mb-1">My Certificates</h1>
                <p className="text-sm text-slate-600">
                    Track how to earn certificates through self-paced modules or live simulation events.
                </p>
            </div>

            {eligibility && (
                <>
                    <PathGuide passingScore={passingScore} settings={settings} />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: 'Issued', value: summary.issued_count ?? 0 },
                            { label: 'Self-paced eligible', value: summary.self_paced_eligible ?? 0 },
                            { label: 'Event eligible', value: summary.event_eligible ?? 0 },
                            { label: 'In progress', value: summary.in_progress ?? 0 },
                        ].map((item) => (
                            <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                                <p className="mt-1 text-2xl font-bold text-slate-900">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {hasEligibility && (
                <div className="space-y-6">
                    {selfPaced.length > 0 && (
                        <section className="space-y-3">
                            <h2 className="text-lg font-bold text-slate-900">Self-paced modules</h2>
                            {selfPaced.map((entry) => (
                                <EligibilityCard key={`module-${entry.training_module_id}`} entry={entry} icon={Sparkles} />
                            ))}
                        </section>
                    )}

                    {eventBased.length > 0 && (
                        <section className="space-y-3">
                            <h2 className="text-lg font-bold text-slate-900">Simulation events</h2>
                            {eventBased.map((entry) => (
                                <EligibilityCard key={`event-${entry.simulation_event_id}`} entry={entry} icon={CalendarClock} />
                            ))}
                        </section>
                    )}

                    {selfPaced.length === 0 && eventBased.length === 0 && (
                        <ParticipantEmptyState
                            icon={Award}
                            {...PARTICIPANT_EMPTY_STATES.myCertificates}
                        />
                    )}
                </div>
            )}

            {!hasEligibility && !hasCertificates && (
                <ParticipantEmptyState
                    icon={Award}
                    {...PARTICIPANT_EMPTY_STATES.myCertificates}
                />
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Issued certificates</h2>
                {!hasCertificates ? (
                    <p className="text-sm text-slate-500">
                        No certificates have been issued to your account yet. Complete a path above to earn one.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-left text-slate-500">
                                    <th className="py-2 pr-4">Certificate #</th>
                                    <th className="py-2 pr-4">Program</th>
                                    <th className="py-2 pr-4">Path</th>
                                    <th className="py-2 pr-4">Date</th>
                                    <th className="py-2 pr-4">Score</th>
                                    <th className="py-2 pr-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((cert) => {
                                    const isEvent = Boolean(cert.simulation_event_id || cert.simulation_event?.id);
                                    return (
                                        <tr key={cert.id} className="border-b border-slate-100 last:border-0">
                                            <td className="py-2 pr-4 text-slate-900">{cert.certificate_number || '—'}</td>
                                            <td className="py-2 pr-4 text-slate-900">
                                                {cert.training_module?.title
                                                    || cert.simulation_event?.title
                                                    || cert.training_type
                                                    || 'Training Program'}
                                            </td>
                                            <td className="py-2 pr-4 text-slate-600">
                                                {isEvent ? 'Simulation event' : 'Self-paced module'}
                                            </td>
                                            <td className="py-2 pr-4 text-slate-600">
                                                {formatDate(cert.issued_at || cert.completion_date)}
                                            </td>
                                            <td className="py-2 pr-4 text-slate-900">
                                                {cert.final_score != null
                                                    ? `${Number(cert.final_score).toFixed(1)}%`
                                                    : '—'}
                                            </td>
                                            <td className="py-2 pr-4">
                                                {cert.id && <CertificateActions cert={cert} />}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
