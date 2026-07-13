export const READINESS_TONES = {
    ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    registration_open: 'bg-amber-50 text-amber-800 border-amber-200',
    waiting_qualification: 'bg-orange-50 text-orange-800 border-orange-200',
    simulation_created: 'bg-sky-50 text-sky-700 border-sky-200',
};

export const PLAN_BADGE_TONES = {
    not_created: 'bg-slate-50 text-slate-600 border-slate-200',
    draft: 'bg-amber-50 text-amber-800 border-amber-200',
    ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    generated: 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-slate-50 text-slate-700 border-slate-300',
};

export function campaignRowId(row) {
    return row.campaign_request_id || row.campaign_id || row.id;
}

export function campaignPlanHref(row) {
    return row.planning_href || `/admin/simulation-planning/${campaignRowId(row)}`;
}

export function campaignSimulationHref(row) {
    if (row.simulation_event_href) {
        return row.simulation_event_href;
    }
    if (!row.simulation_event_id) {
        return null;
    }
    return `/admin/simulation-events/${row.simulation_event_id}?tab=monitoring`;
}

export function computeDashboardSummary(schedules = []) {
    return {
        approved: schedules.length,
        ready: schedules.filter((row) => row.is_ready_for_simulation).length,
        waitingRegistration: schedules.filter((row) => row.simulation_readiness === 'registration_open').length,
        withPlan: schedules.filter((row) => row.simulation_event_id).length,
    };
}

export function filterApprovedCampaigns(schedules = [], filters = {}) {
    const {
        searchQuery = '',
        community = '',
        targetAudience = '',
        readiness = '',
        planStatus = '',
        readyOnly = false,
    } = filters;

    const query = searchQuery.trim().toLowerCase();

    return schedules.filter((row) => {
        const communityLabel = (row.recommended_community || row.community || '').toLowerCase();
        const campaignTitle = (row.campaign_title || '').toLowerCase();
        const trainingTitle = (row.training_title || '').toLowerCase();
        const audienceLabel = (row.target_audience_label || '').toLowerCase();
        const audienceValues = Array.isArray(row.target_audience)
            ? row.target_audience.map((item) => String(item).toLowerCase())
            : [];

        const matchesSearch = !query
            || campaignTitle.includes(query)
            || trainingTitle.includes(query)
            || communityLabel.includes(query);

        const matchesCommunity = !community
            || (row.recommended_community || row.community) === community;

        const matchesAudience = !targetAudience
            || audienceLabel.includes(targetAudience.toLowerCase())
            || audienceValues.includes(targetAudience.toLowerCase());

        const matchesReadiness = !readiness || row.simulation_readiness === readiness;

        const planBadge = row.simulation_plan_badge
            || (row.simulation_plan_status === 'Not Yet Created' ? 'not_created' : row.simulation_plan_status?.toLowerCase());
        const matchesPlan = !planStatus || planBadge === planStatus;

        const matchesReadyOnly = !readyOnly || row.is_ready_for_simulation;

        return (
            matchesSearch
            && matchesCommunity
            && matchesAudience
            && matchesReadiness
            && matchesPlan
            && matchesReadyOnly
        );
    });
}

export function resolveRowAction(row) {
    const simulationHref = campaignSimulationHref(row);

    if (simulationHref) {
        return {
            type: 'view_simulation',
            href: simulationHref,
            label: 'View Simulation',
            variant: 'danger',
            icon: 'alert',
        };
    }

    if (row.can_create_plan) {
        const campaignId = campaignRowId(row);
        const hasPublishedPlans = row.published_exercise_plans_available !== false;

        return {
            type: 'use_template',
            href: hasPublishedPlans
                ? `/admin/simulation-events?tab=templates&reuse_campaign=${campaignId}`
                : null,
            label: 'Use Template',
            variant: 'edit',
            icon: 'plus',
            disabled: !hasPublishedPlans,
            tooltip: hasPublishedPlans
                ? null
                : 'Publish an exercise plan in the Exercise Plans tab first.',
        };
    }

    return {
        type: 'create_plan',
        href: null,
        label: 'Create Plan',
        variant: 'edit',
        icon: 'plus',
        disabled: true,
        tooltip: row.create_plan_disabled_reason || 'Requirements not yet met.',
    };
}
