import React from 'react';
import {
    ArrowLeft,
    Building2,
    CalendarDays,
    FileText,
    Info,
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

    const sessions = request.payload?.available_training_sessions || [];
    const description = request.payload?.short_description || '';

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
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Proposed Session Summary</div>
                                <div className="mt-1 text-sm font-medium text-slate-900">{request.proposed_session_label || '—'}</div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Related Hazards</div>
                                    <div className="mt-1 text-sm text-slate-900">
                                        {Array.isArray(request.payload?.related_hazards)
                                            ? request.payload.related_hazards.join(', ')
                                            : (request.payload?.related_hazards || '—')}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lead Trainers</div>
                                    <div className="mt-1 text-sm text-slate-900">
                                        {Array.isArray(request.payload?.assigned_trainers)
                                            ? request.payload.assigned_trainers.map((trainer) => trainer.name).filter(Boolean).join(', ')
                                            : '—'}
                                    </div>
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
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <CalendarDays className="h-3.5 w-3.5" />
                                Proposed Sessions
                            </div>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                {sessions.length} total
                            </span>
                        </div>

                        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                            {!sessions.length ? (
                                <div className="bg-slate-50 px-4 py-6 text-sm text-slate-600">No sessions provided.</div>
                            ) : (
                                <table className="min-w-full divide-y divide-slate-200 text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Session Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Time</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Max Participants</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {sessions.map((session, idx) => {
                                            const maxParticipants = session?.maximum_participants ?? session?.maximumParticipants ?? '—';

                                            return (
                                                <tr key={`${session?.title || 'session'}-${idx}`} className="align-top">
                                                    <td className="px-4 py-3 font-medium text-slate-900">{session?.title || '—'}</td>
                                                    <td className="px-4 py-3 text-slate-700">{formatDate(session?.date)}</td>
                                                    <td className="px-4 py-3 text-slate-700">{formatTimeRange(session?.start_time, session?.end_time)}</td>
                                                    <td className="px-4 py-3 text-slate-700">{maxParticipants}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </AdminContentCard>
                </section>

                <aside className="space-y-4">
                    <AdminContentCard className="p-5">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <MapPin className="h-3.5 w-3.5" />
                            Community Recommendations
                        </div>
                        <div className="mt-4">
                            <CampaignCommunityRecommendationsPanel
                                recommendedPayload={request.payload?.recommended_communities}
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
