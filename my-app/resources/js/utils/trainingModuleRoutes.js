export function trainingModulesBase(role) {
    return role === 'PARTICIPANT' ? '/participant/training-modules' : '/admin/training-modules';
}

export function trainingModulesIndex(role) {
    return trainingModulesBase(role);
}

export function trainingModuleShow(role, moduleId) {
    return `${trainingModulesBase(role)}/${moduleId}`;
}

export function trainingModuleCreate() {
    return '/admin/training-modules/create';
}

export function trainingModuleEdit(moduleId) {
    return `/admin/training-modules/${moduleId}/edit`;
}

export function trainingModuleStore() {
    return '/admin/training-modules';
}

export function trainingModuleGenerateAi() {
    return '/admin/training-modules/generate-ai';
}

export function trainingModulePublish(moduleId) {
    return `/admin/training-modules/${moduleId}/publish`;
}

export function trainingModuleArchive(moduleId) {
    return `/admin/training-modules/${moduleId}/archive`;
}

export function trainingModuleDestroy(moduleId) {
    return `/admin/training-modules/${moduleId}`;
}

export function participantLessonCompletion(moduleId, contentId) {
    return `/participant/training-modules/${moduleId}/contents/${contentId}/completion`;
}

export function participantAiScenarioStart(moduleId) {
    return `/participant/training-modules/${moduleId}/ai-scenario-training/start`;
}

export function participantAiScenarioAttempt(attemptId) {
    return `/participant/ai-scenario-attempts/${attemptId}`;
}

export function adminAiScenarioConfig() {
    return '/admin/ai-scenario-config';
}
