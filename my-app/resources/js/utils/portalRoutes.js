/**
 * Portal-prefixed URL helpers for admin vs participant navigation.
 */

export function isParticipantRole(role) {
    return role === 'PARTICIPANT';
}

export function evaluationsIndex(role) {
    return isParticipantRole(role) ? '/participant/evaluations' : '/admin/evaluations';
}

export function evaluationResultShow(role, resultId) {
    const base = isParticipantRole(role) ? '/participant/evaluations' : '/admin/evaluations';
    return `${base}/results/${resultId}`;
}

export function simulationEventsIndex(role) {
    return isParticipantRole(role) ? '/participant/simulation-events' : '/admin/simulation-events';
}

export function simulationEventShow(role, eventId) {
    return `${simulationEventsIndex(role)}/${eventId}`;
}

export function simulationEventCreate() {
    return '/admin/simulation-events/create';
}

export function simulationEventEdit(eventId) {
    return `/admin/simulation-events/${eventId}/edit`;
}

export function simulationEventAction(eventId, action) {
    return `/admin/simulation-events/${eventId}/${action}`;
}

export function certificationIndex(role) {
    return isParticipantRole(role) ? '/participant/certification' : '/admin/certification';
}

export function participantsIndex() {
    return '/admin/participants';
}

export function resourcesIndex() {
    return '/admin/resources';
}

export function barangayProfileIndex() {
    return hazardAssessmentProfileIndex();
}

export function hazardAssessmentProfileIndex() {
    return '/admin/hazard-assessment-profiles';
}

export function auditLogsIndex() {
    return '/admin/audit-logs';
}

export function myAttendanceIndex() {
    return '/participant/my-attendance';
}

export function scenariosIndex() {
    return '/admin/scenarios';
}

export function settingsAutoApproval() {
    return '/admin/settings/auto-approval';
}

export function adminEvaluationsApi(path = '') {
    return `/admin/evaluations${path}`;
}

export function adminCertificationApi(path = '') {
    return `/admin/certification${path}`;
}

export function adminResourcesApi(path = '') {
    return `/admin/resources${path}`;
}

export function adminAuditLogsApi(path = '') {
    return `/admin/api/audit-logs${path}`;
}
