/**
 * Portal-prefixed URL helpers for admin vs participant navigation.
 */

export function isParticipantRole(role) {
    return role === 'PARTICIPANT';
}

export function dashboardIndex(role) {
    return isParticipantRole(role) ? '/participant/dashboard' : '/admin/dashboard';
}

export function evaluationsIndex(role) {
    return isParticipantRole(role) ? '/participant/evaluations' : '/admin/evaluations';
}

export function evaluationsIndexWithTab(role, tab = 'modules') {
    const base = evaluationsIndex(role);
    return tab ? `${base}?tab=${tab}` : base;
}

export function evaluationsIndexWithFocus(role, focus = 'pending') {
    const base = evaluationsIndex(role);
    return focus ? `${base}?focus=${focus}` : base;
}

export function participantEvaluationPortfolioUrl(print = false) {
    return print ? '/participant/evaluations/portfolio?print=1' : '/participant/evaluations/portfolio';
}

export function evaluationResultShow(role, resultId) {
    const base = isParticipantRole(role) ? '/participant/evaluations' : '/admin/evaluations';
    return `${base}/results/${resultId}`;
}

export function participantEventEvaluationShow(evaluationId) {
    return `/participant/evaluations/event-drills/${evaluationId}`;
}

export function notificationsApi(role) {
    return isParticipantRole(role) ? '/participant/notifications' : '/admin/notifications';
}

export function lessonQuizAttemptShow(attemptId) {
    return `/participant/lesson-quiz-attempts/${attemptId}`;
}

export function myTrainingsIndex() {
    return '/participant/my-trainings';
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
