import { deriveSimulationEventStatus } from './simulationEventStatus';

export function isExercisePlanEvent(event) {
    return Boolean(event?.simulation_exercise_template_id || event?.simulation_exercise_template);
}

export function simulationEventLifecycleTab(event) {
    const status = deriveSimulationEventStatus(event);
    if (['ongoing'].includes(status)) {
        return 'monitoring';
    }
    if (['published'].includes(status)) {
        return 'monitoring';
    }
    return 'readiness';
}

export function simulationEventHref(event, { tab } = {}) {
    const id = event?.id;
    if (!id) return '/admin/simulation-events';

    if (isExercisePlanEvent(event)) {
        const resolvedTab = tab || simulationEventLifecycleTab(event);
        return `/admin/simulation-events/${id}?tab=${resolvedTab}`;
    }

    const status = deriveSimulationEventStatus(event);
    if (status === 'draft') {
        return `/admin/simulation-events/${id}/edit`;
    }

    return `/admin/simulation-events/${id}?tab=${tab || 'monitoring'}`;
}
