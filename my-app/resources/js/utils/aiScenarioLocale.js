export const AI_SCENARIO_LANGUAGES = {
    en: { label: 'English', flag: '🇺🇸' },
    fil: { label: 'Filipino', flag: '🇵🇭' },
};

export const AI_SCENARIO_DEFAULT_LANGUAGE = 'en';

export function resolveAiScenarioLanguage(locale) {
    return AI_SCENARIO_LANGUAGES[locale] ? locale : AI_SCENARIO_DEFAULT_LANGUAGE;
}

export function resolveScenarioTitle(source, locale) {
    const lang = resolveAiScenarioLanguage(locale);
    return source?.[`title_${lang}`] || source?.scenario_title || '';
}

export function resolveScenarioDescription(source, locale) {
    const lang = resolveAiScenarioLanguage(locale);
    return source?.[`description_${lang}`] || source?.generated_scenario || '';
}

export function resolveLearningObjectives(source, locale) {
    const lang = resolveAiScenarioLanguage(locale);
    return source?.[`learning_objectives_${lang}`] || '';
}

export function resolveQuestionForLocale(question, locale, { includeAnswers = false } = {}) {
    const lang = resolveAiScenarioLanguage(locale);
    const resolved = {
        number: question?.number,
        question: question?.[`question_${lang}`] || question?.question || '',
        choices: {
            A: question?.[`choice_a_${lang}`] || question?.choices?.A || '',
            B: question?.[`choice_b_${lang}`] || question?.choices?.B || '',
            C: question?.[`choice_c_${lang}`] || question?.choices?.C || '',
            D: question?.[`choice_d_${lang}`] || question?.choices?.D || '',
        },
    };

    if (includeAnswers) {
        resolved.correct_answer = question?.correct_answer;
        resolved.explanation = question?.[`explanation_${lang}`] || question?.explanation || '';
        resolved.competency = question?.competency;
    }

    return resolved;
}

export function resolveQuestionsForLocale(questions, locale, options = {}) {
    return (questions || []).map((question) => resolveQuestionForLocale(question, locale, options));
}

export function getAiScenarioLanguageStorageKey(attemptId) {
    return `ai_scenario_lang_${attemptId || 'preview'}`;
}

export function loadPersistedLanguage(attemptId, fallback = AI_SCENARIO_DEFAULT_LANGUAGE) {
    try {
        const stored = sessionStorage.getItem(getAiScenarioLanguageStorageKey(attemptId));
        return resolveAiScenarioLanguage(stored || fallback);
    } catch {
        return resolveAiScenarioLanguage(fallback);
    }
}

export function persistLanguage(attemptId, locale) {
    try {
        sessionStorage.setItem(getAiScenarioLanguageStorageKey(attemptId), resolveAiScenarioLanguage(locale));
    } catch {
        // ignore storage errors
    }
}
