import React from 'react';

function parseDateValue(value) {
    if (!value) return null;
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    const normalized = String(value).trim();
    if (!normalized) return null;

    const dateOnlyMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
        const [, year, month, day] = dateOnlyMatch;
        const parsed = new Date(Number(year), Number(month) - 1, Number(day));
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseTimeValue(value) {
    if (!value) return null;

    const normalized = String(value).trim();
    if (!normalized) return null;

    const timeMatch = normalized.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (timeMatch) {
        const [, hours = '0', minutes = '0', seconds = '0'] = timeMatch;
        const date = new Date();
        date.setHours(Number(hours), Number(minutes), Number(seconds), 0);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(dateString) {
    const date = parseDateValue(dateString);
    if (!date) return '—';
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function formatTime(timeString) {
    const date = parseTimeValue(timeString);
    if (!date) return '—';
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    });
}

export function formatDateTime(dateString) {
    const date = parseDateValue(dateString);
    if (!date) return '—';
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export function formatDateTimeParts(dateString) {
    const date = parseDateValue(dateString);
    if (!date) return { date: '—', time: '—' };

    return {
        date: formatDate(date),
        time: date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        }),
    };
}

export function formatTimeRange(startTime, endTime) {
    const start = formatTime(startTime);
    const end = formatTime(endTime);

    if (start === '—' && end === '—') return '—';
    if (start !== '—' && end !== '—') return `${start} – ${end}`;
    return start !== '—' ? start : end;
}

export function extractSessionLabel(value, sessionIndex = null) {
    const text = String(value || '').trim();
    if (!text) {
        if (Number.isFinite(sessionIndex) && sessionIndex >= 0) {
            return `Session ${sessionIndex + 1}`;
        }
        return '—';
    }

    const match = text.match(/Session\s+\d+/i);
    if (match) {
        const number = match[0].match(/\d+/)?.[0];
        return number ? `Session ${number}` : match[0];
    }

    const dashIndex = text.lastIndexOf(' - ');
    if (dashIndex !== -1) {
        const suffix = text.slice(dashIndex + 3).trim();
        if (suffix) return suffix;
    }

    if (Number.isFinite(sessionIndex) && sessionIndex >= 0) {
        return `Session ${sessionIndex + 1}`;
    }

    return text;
}

export function formatScheduleTimeRange(value) {
    if (!value) return '—';

    const normalized = String(value).trim();
    if (!normalized) return '—';

    const parts = normalized.split(/\s*[-–]\s*/);
    if (parts.length >= 2) {
        return `${formatTime(parts[0].trim())} - ${formatTime(parts[1].trim())}`;
    }

    return formatTime(normalized);
}

export function getRecommendedCommunityEntries(value) {
    if (value && Array.isArray(value.communities)) {
        return value.communities.filter((item) => item && typeof item === 'object');
    }
    if (Array.isArray(value)) {
        return value.filter((item) => item && typeof item === 'object');
    }

    return [];
}

function getRiskBadgeClass(level) {
    const normalized = String(level || '').toLowerCase();
    if (normalized === 'high') return 'border-rose-200 bg-rose-50 text-rose-700';
    if (normalized === 'medium' || normalized === 'moderate') return 'border-amber-200 bg-amber-50 text-amber-700';
    return 'border-slate-200 bg-slate-100 text-slate-700';
}

function getPriorityBadgeClass(level) {
    if (level === 'Priority 1') return 'border-rose-200 bg-rose-50 text-rose-700';
    if (level === 'Priority 2') return 'border-amber-200 bg-amber-50 text-amber-700';
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
}

function getPrioritySortValue(level) {
    if (level === 'Priority 1') return 1;
    if (level === 'Priority 2') return 2;
    return 3;
}

export function CampaignRequestStatusBadge({ status }) {
    const normalized = String(status || '').toLowerCase();

    const map = {
        draft: { label: 'Draft', cls: 'border-amber-200 bg-amber-50 text-amber-700' },
        submitted: { label: 'Submitted', cls: 'border-sky-200 bg-sky-50 text-sky-700' },
        waiting_for_approval: { label: 'Waiting for Approval', cls: 'border-amber-200 bg-amber-50 text-amber-700' },
        approved: { label: 'Approved', cls: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
        scheduled: { label: 'Scheduled', cls: 'border-violet-200 bg-violet-50 text-violet-700' },
        completed: { label: 'Completed', cls: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
        rejected: { label: 'Rejected', cls: 'border-rose-200 bg-rose-50 text-rose-700' },
    };

    const item = map[normalized] || { label: status || '—', cls: 'border-slate-200 bg-slate-50 text-slate-700' };

    return (
        <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${item.cls}`}>
            {item.label}
        </span>
    );
}

export function CampaignRequestProposedSessionsCell({ request }) {
    const sessions = Array.isArray(request?.proposed_sessions) ? request.proposed_sessions : [];

    if (sessions.length === 0) {
        if (!request?.proposed_session_label) {
            return <div className="text-slate-700">—</div>;
        }

        return <div className="text-slate-700">{request.proposed_session_label}</div>;
    }

    const maxVisible = 2;
    const visibleSessions = sessions.slice(0, maxVisible);
    const hiddenCount = sessions.length - visibleSessions.length;

    return (
        <div className="space-y-1">
            {visibleSessions.map((session, idx) => (
                <div key={`${session.label}-${idx}`} className="leading-tight">
                    <div className="font-medium text-slate-900">{session.label}</div>
                    {session.date ? (
                        <div className="text-xs text-slate-700">
                            {session.date}
                        </div>
                    ) : null}
                    {session.time ? (
                        <div className="text-[0.7rem] text-slate-500">
                            {session.time}
                        </div>
                    ) : null}
                </div>
            ))}
            {hiddenCount > 0 ? (
                <div className="text-xs font-medium text-emerald-700">+{hiddenCount} more</div>
            ) : null}
        </div>
    );
}

export function CommunityRecommendationsTable({ communities }) {
    const rows = [...communities].sort((a, b) => {
        const priorityDiff = getPrioritySortValue(a.priority_level) - getPrioritySortValue(b.priority_level);
        if (priorityDiff !== 0) return priorityDiff;

        const riskOrder = { high: 0, medium: 1, moderate: 1, low: 2 };
        const aRisk = riskOrder[String(a.risk_level || '').toLowerCase()] ?? 3;
        const bRisk = riskOrder[String(b.risk_level || '').toLowerCase()] ?? 3;
        return aRisk - bRisk;
    });

    if (rows.length === 0) return null;

    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Community</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Location</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Hazard</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Risk</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Priority</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Recommendation</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {rows.map((community) => {
                        const reason = community.recommendation_reason || community.recommendation || 'Recommended based on hazard assessment.';
                        const priorityLevel = community.priority_level || 'Priority 3';
                        const location = [community.municipality_city, community.province].filter(Boolean).join(', ') || '—';

                        return (
                            <tr key={community.barangay_profile_id} className="align-top">
                                <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{community.barangay_name}</td>
                                <td className="px-4 py-3 text-slate-600">{location}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="inline-flex rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                                        {community.related_hazard || '—'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium ${getRiskBadgeClass(community.risk_level)}`}>
                                        {community.risk_level || '—'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${getPriorityBadgeClass(priorityLevel)}`}>
                                        {priorityLevel}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-slate-600 leading-5">{reason}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export function CampaignCommunityRecommendationsPanel({ recommendedPayload }) {
    const recommended = getRecommendedCommunityEntries(recommendedPayload);

    return (
        <div>
            <p className="text-xs text-slate-500">
                Auto-generated priorities from Hazard Assessment. These are decision-support recommendations, not restrictions.
            </p>
            {recommended.length > 0 ? (
                <div className="mt-3">
                    <CommunityRecommendationsTable communities={recommended} />
                </div>
            ) : (
                <p className="mt-3 text-sm text-slate-600">No recommended communities for this hazard profile.</p>
            )}
        </div>
    );
}
