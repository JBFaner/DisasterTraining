import React from 'react';
import {
    ArrowLeft,
    Building2,
    CalendarDays,
    FileText,
    Info,
    Link2,
    MapPin,
    ShieldCheck,
    UserRound,
    Workflow,
} from 'lucide-react';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminContentCard,
} from '../components/admin/AdminLayout';
import {
    CampaignCommunityRecommendationsPanel,
    CampaignRequestStatusBadge,
    formatDate,
    formatDateTime,
    formatDateTimeParts,
    formatTimeRange,
} from '../components/campaign/CampaignRequestUi';

export function CampaignRequestShow({ request }) {
    const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);
    const [copyStatus, setCopyStatus] = React.useState('');

    if (!request) {
        return (
            <AdminPageShell>
                <p className="text-slate-600">Campaign request not found.</p>
            </AdminPageShell>
        );
    }

    const moduleId = request.training_module?.id;
    const backHref = moduleId
        ? `/admin/training-modules/${moduleId}#campaign_requests`
        : '/admin/training-modules';

    const planning = request.campaign_planning || request.payload || {};
    const description = planning.short_description || request.payload?.short_description || '';
    const registrationLinkActive = request.registration_link_active !== false;
    const registrationLink = registrationLinkActive
        ? (request.registration_link || request.payload?.registration_link || `${window.location.origin}/participant/register?campaign_request=${request.id}`)
        : '';

    const handleCopyRegistrationLink = async () => {
        if (!registrationLinkActive || !registrationLink) {
            setCopyStatus('Not active yet');
            window.setTimeout(() => setCopyStatus(''), 2000);
            return;
        }

        try {
            await navigator.clipboard.writeText(registrationLink);
            setCopyStatus('Copied');
            window.setTimeout(() => setCopyStatus(''), 2000);
        } catch {
            setCopyStatus('Copy failed');
        }
    };

    return (
        <AdminPageShell>
            <div className="mb-1">
                <a href={backHref} className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Campaign Requests
                </a>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <AdminPageHeader
                    icon={FileText}
                    title={`Campaign Request #${request.id}`}
                    description={request.training_module?.title || 'Training campaign request details'}
                />
                <CampaignRequestStatusBadge status={request.status} />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <AdminContentCard className="p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <FileText className="h-3.5 w-3.5" />
                        Request ID
                    </div>
                    <div className="mt-2 text-base font-semibold text-slate-900">#{request.id}</div>
                    <p className="mt-1 text-xs text-slate-500">Operational reference</p>
                </AdminContentCard>

                <AdminContentCard className="p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Submitted
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{formatDate(request.submitted_at)}</div>
                    <p className="mt-1 text-xs text-slate-500">{formatDateTimeParts(request.submitted_at).time}</p>
                </AdminContentCard>

                <AdminContentCard className="p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <UserRound className="h-3.5 w-3.5" />
                        Submitted By
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{request.submitted_by?.name || '—'}</div>
                    <p className="mt-1 text-xs text-slate-500">Request owner</p>
                </AdminContentCard>

                <AdminContentCard className="p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <Building2 className="h-3.5 w-3.5" />
                        Submitted To
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{request.submitted_to || '—'}</div>
                    <p className="mt-1 text-xs text-slate-500">Destination system</p>
                </AdminContentCard>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
                <section className="space-y-4">
                    <AdminContentCard className="p-5">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <Info className="h-3.5 w-3.5" />
                            Request Overview
                        </div>
                        <div className="mt-4 space-y-4">
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Registration Period</div>
                                <div className="mt-1 text-sm font-medium text-slate-900">{request.registration_period_label || request.proposed_session_label || '—'}</div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Published Status</div>
                                    <div className="mt-1 text-sm text-slate-900 capitalize">{planning.published_status || '—'}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Registration Enabled</div>
                                    <div className="mt-1 text-sm text-slate-900">{planning.registration_enabled === false ? 'No' : 'Yes'}</div>
                                </div>
                            </div>

                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Training Description</div>
                                <div className="mt-2 text-sm leading-6 text-slate-700">
                                    {!description ? (
                                        '—'
                                    ) : !isDescriptionExpanded && description.length > 220 ? (
                                        <>
                                            <div>{description.slice(0, 220)}…</div>
                                            <button
                                                type="button"
                                                onClick={() => setIsDescriptionExpanded(true)}
                                                className="mt-2 text-xs font-medium text-emerald-700 hover:text-emerald-800"
                                            >
                                                Read more
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div>{description}</div>
                                            {description.length > 220 ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsDescriptionExpanded(false)}
                                                    className="mt-2 text-xs font-medium text-emerald-700 hover:text-emerald-800"
                                                >
                                                    Show less
                                                </button>
                                            ) : null}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </AdminContentCard>

                    <AdminContentCard className="p-5">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Campaign Schedule
                        </div>

                        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Registration Opens</dt>
                                <dd className="mt-1 text-sm text-slate-900">{formatDateTime(planning.registration_opens)}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Registration Deadline</dt>
                                <dd className="mt-1 text-sm text-slate-900">{formatDateTime(planning.registration_deadline)}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Training Completion Deadline</dt>
                                <dd className="mt-1 text-sm text-slate-900">{formatDateTime(planning.training_completion_deadline)}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Maximum Participants</dt>
                                <dd className="mt-1 text-sm text-slate-900">{planning.maximum_participants ?? '—'}</dd>
                            </div>
                        </dl>
                    </AdminContentCard>
                </section>

                <aside className="space-y-4">
                    <AdminContentCard className="p-5">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <Link2 className="h-3.5 w-3.5" />
                            Participant Registration Link
                        </div>
                        <p className="mt-3 text-sm text-slate-600">
                            Share this link with Group 6 once campaign status is approved.
                        </p>
                        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                            {registrationLinkActive && registrationLink ? (
                                <a
                                    href={registrationLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="break-all text-sm font-medium text-emerald-700 hover:text-emerald-800"
                                >
                                    {registrationLink}
                                </a>
                            ) : (
                                <p className="text-sm text-amber-700">
                                    Registration link is inactive until this campaign request is approved.
                                </p>
                            )}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleCopyRegistrationLink}
                                disabled={!registrationLinkActive || !registrationLink}
                                className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Copy link
                            </button>
                            {copyStatus ? (
                                <span className="text-xs font-medium text-emerald-700">{copyStatus}</span>
                            ) : null}
                        </div>
                    </AdminContentCard>

                    <AdminContentCard className="p-5">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <MapPin className="h-3.5 w-3.5" />
                            Community Recommendations
                        </div>
                        <div className="mt-4">
                            <CampaignCommunityRecommendationsPanel
                                recommendedPayload={planning.recommended_communities || request.payload?.recommended_communities}
                            />
                        </div>
                    </AdminContentCard>

                    <AdminContentCard className="p-5">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <Workflow className="h-3.5 w-3.5" />
                            Audit Trail
                        </div>
                        <dl className="mt-4 space-y-3">
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created</dt>
                                <dd className="mt-1 text-sm text-slate-900">{formatDateTime(request.created_at)}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last Updated</dt>
                                <dd className="mt-1 text-sm text-slate-900">{formatDateTime(request.updated_at)}</dd>
                            </div>
                        </dl>
                    </AdminContentCard>

                    <AdminContentCard className="p-5">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Campaign Remarks
                        </div>
                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                            {request.remarks ? (
                                <pre className="overflow-auto whitespace-pre-wrap wrap-break-word font-sans">{JSON.stringify(request.remarks, null, 2)}</pre>
                            ) : (
                                <p>No remarks yet.</p>
                            )}
                        </div>
                    </AdminContentCard>
                </aside>
            </div>
        </AdminPageShell>
    );
}
