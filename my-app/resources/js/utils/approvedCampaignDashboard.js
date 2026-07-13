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
    return row.simulation_event_href
        || (row.simulation_event_id ? `/admin/simulation-events/${row.simulation_event_id}` : null);
}

export function computeDashboardSummary(schedules = []) {
    return {
        approved: schedules.length,
        ready: schedules.filter((row) => row.is_ready_for_simulation).length,
        waitingRegistration: schedules.filter((row) => row.simulation_readiness === 'registration_open').length,
        withPlan: schedules.filter((row) => row.has_simulation_plan || row.simulation_event_id).length,
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
    const planHref = campaignPlanHref(row);
    const simulationHref = campaignSimulationHref(row);
    const planBadge = row.simulation_plan_badge || 'not_created';

    if (simulationHref) {
        return {
            type: 'view_simulation',
            href: simulationHref,
            label: 'View Simulation',
            variant: 'danger',
            icon: 'alert',
        };
    }

    if (planBadge === 'ready') {
        return {
            type: 'view_plan',
            href: planHref,
            label: 'View Plan',
            variant: 'view',
            icon: 'eye',
        };
    }

    if (row.has_simulation_plan || planBadge === 'draft') {
        return {
            type: 'continue_planning',
            href: planHref,
            label: 'Continue Planning',
            variant: 'edit',
            icon: 'edit',
        };
    }

    if (row.can_create_plan) {
        const campaignId = row.campaign_request_id || row.campaign_id || row.id;
        return {
            type: 'use_template',
            href: `/admin/simulation-events?tab=templates&reuse_campaign=${campaignId}`,
            label: 'Use Template',
            variant: 'edit',
            icon: 'plus',
            disabled: false,
            tooltip: null,
        };
    }

    return {
        type: 'create_plan',
        href: planHref,
        label: 'Create Plan',
        variant: 'edit',
        icon: 'plus',
        disabled: true,
        tooltip: row.create_plan_disabled_reason || null,
    };
}
