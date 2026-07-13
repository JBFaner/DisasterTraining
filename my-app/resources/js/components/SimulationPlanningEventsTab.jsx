import React from 'react';
import {
    CalendarClock,
    Eye,
    Layers,
    Pencil,
    Rocket,
    ShieldCheck,
} from 'lucide-react';
import { AdminStatCard } from './admin/AdminLayout';
import {
    AdminCollapsibleFilterBar,
    AdminFilterSelect,
} from './admin/AdminCollapsibleFilterBar';
import { formatDate, formatTime } from './campaign/CampaignRequestUi';
import { deriveSimulationEventStatus } from '../utils/simulationEventStatus';
import { isExercisePlanEvent, simulationEventHref } from '../utils/simulationEventNavigation';

function eventStatusTone(status) {
    const map = {
        draft: 'bg-slate-50 text-slate-700 border-slate-200',
        published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        ongoing: 'bg-blue-50 text-blue-700 border-blue-200',
        ready: 'bg-sky-50 text-sky-700 border-sky-200',
        cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
        ended: 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return map[status] || 'bg-slate-50 text-slate-700 border-slate-200';
}

function getExercisePlanTitle(event) {
    return event.simulation_exercise_template?.title
        || event.exercise_plan_title
        || null;
}

function getCampaignLabel(event) {
    const campaign = event.campaign_request;
    if (!campaign) return null;

    const moduleTitle = campaign.training_module?.title
        || event.training_module?.title
        || null;

    return moduleTitle
        ? `#${campaign.id} — ${moduleTitle}`
        : `Campaign #${campaign.id}`;
}

export function SimulationPlanningEventsTab({
    events = [],
    onSwitchTab,
}) {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [filterStatus, setFilterStatus] = React.useState('');

    const activeEvents = React.useMemo(
        () => (events || []).filter((event) => !['completed', 'ended', 'archived'].includes(event.status)),
        [events],
    );

    const summary = React.useMemo(() => ({
        total: activeEvents.length,
        draft: activeEvents.filter((event) => deriveSimulationEventStatus(event) === 'draft').length,
        published: activeEvents.filter((event) => {
            const status = deriveSimulationEventStatus(event);
            return status === 'published' || status === 'ongoing';
        }).length,
        fromExercisePlans: activeEvents.filter((event) => Boolean(
            event.simulation_exercise_template_id || getExercisePlanTitle(event),
        )).length,
        linkedCampaigns: activeEvents.filter((event) => Boolean(event.campaign_request_id)).length,
    }), [activeEvents]);

    const filteredEvents = React.useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return activeEvents.filter((event) => {
            const derivedStatus = deriveSimulationEventStatus(event);
            const exercisePlanTitle = getExercisePlanTitle(event) || '';
            const campaignLabel = getCampaignLabel(event) || '';

            const matchesSearch = !query
                || event.title?.toLowerCase().includes(query)
                || event.location?.toLowerCase().includes(query)
                || exercisePlanTitle.toLowerCase().includes(query)
                || campaignLabel.toLowerCase().includes(query);

            const matchesStatus = !filterStatus || derivedStatus === filterStatus;

            return matchesSearch && matchesStatus;
        });
    }, [activeEvents, filterStatus, searchQuery]);

    const handleSwitch = (tabId) => {
        if (typeof onSwitchTab === 'function') {
            onSwitchTab(tabId);
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <AdminStatCard label="Active Events" value={summary.total} accent="slate" />
                <AdminStatCard label="Draft" value={summary.draft} accent="amber" />
                <AdminStatCard label="Published / Ongoing" value={summary.published} accent="emerald" />
                <AdminStatCard
                    label="From Exercise Plans"
                    value={summary.fromExercisePlans}
                    hint={`${summary.linkedCampaigns} linked to campaigns`}
                    accent="blue"
                />
            </div>

            <AdminCollapsibleFilterBar
                searchValue={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search events, exercise plans, or campaigns..."
                hasActiveFilters={Boolean(filterStatus)}
                onClearFilters={() => setFilterStatus('')}
            >
                <AdminFilterSelect label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="cancelled">Cancelled</option>
                </AdminFilterSelect>
            </AdminCollapsibleFilterBar>

            {filteredEvents.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center">
                    {activeEvents.length === 0 ? (
                        <>
                            <div className="text-5xl mb-4 opacity-80">📅</div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-1">No simulation events yet</h3>
                            <p className="text-slate-500 text-sm mb-6 max-w-2xl mx-auto">
                                Simulation events are created when you reuse a published exercise plan for a ready approved campaign.
                                Publish an exercise plan first, then use <strong>Use Template</strong> from Approved Campaigns.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleSwitch('templates')}
                                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                                >
                                    <Layers className="w-4 h-4" />
                                    Go to Exercise Plans
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSwitch('schedules')}
                                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    Go to Approved Campaigns
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-4xl mb-4 opacity-80">🔍</div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-1">No events match your filters</h3>
                            <p className="text-slate-500 text-sm">Try adjusting your search or filter criteria.</p>
                        </>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredEvents.map((event) => {
                        const derivedStatus = deriveSimulationEventStatus(event);
                        const exercisePlanTitle = getExercisePlanTitle(event);
                        const campaignLabel = getCampaignLabel(event);
                        const eventHref = simulationEventHref(event);
                        const fromExercisePlan = isExercisePlanEvent(event);

                        return (
                            <article
                                key={event.id}
                                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                                <div className="p-5 flex flex-col gap-3 h-full">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-emerald-100 rounded-xl shrink-0">
                                            <CalendarClock className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <a
                                                href={eventHref}
                                                className="font-semibold text-slate-900 hover:text-emerald-700 line-clamp-2"
                                            >
                                                {event.title}
                                            </a>
                                            <p className="text-sm text-slate-500 mt-1">
                                                {(event.disaster_type || '—')}
                                                {event.event_category ? ` • ${event.event_category}` : ''}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-xs text-slate-500">
                                        {formatDate(event.event_date)}
                                        {' · '}
                                        {formatTime(event.start_time)}
                                        {' – '}
                                        {formatTime(event.end_time)}
                                        {event.location || event.venue ? ` • ${event.location || event.venue}` : ''}
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${eventStatusTone(derivedStatus)}`}>
                                            {derivedStatus}
                                        </span>
                                        {exercisePlanTitle ? (
                                            <span className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                                                <Layers className="w-3.5 h-3.5" />
                                                {exercisePlanTitle}
                                            </span>
                                        ) : null}
                                        {campaignLabel ? (
                                            <span className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                                                <Rocket className="w-3.5 h-3.5" />
                                                {campaignLabel}
                                            </span>
                                        ) : null}
                                    </div>

                                    <div className="mt-auto flex flex-wrap gap-2 pt-1">
                                        <a
                                            href={eventHref}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            {fromExercisePlan
                                                ? (derivedStatus === 'draft' ? 'Open Readiness' : 'Open Monitoring')
                                                : (event.status === 'draft' ? 'Continue Setup' : 'View Event')}
                                        </a>
                                        {event.status === 'draft' && !fromExercisePlan ? (
                                            <a
                                                href={`/admin/simulation-events/${event.id}/edit`}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                                Edit
                                            </a>
                                        ) : null}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
