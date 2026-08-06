import {
    resolveQuestionsForLocale,
    resolveAiScenarioLanguage,
    AI_SCENARIO_LANGUAGES,
} from './aiScenarioLocale';

const CHOICE_LETTERS = ['A', 'B', 'C', 'D'];

function isBilingualQuestion(question) {
    return Boolean(
        question?.question_en
        || question?.question_fil
        || (typeof question?.correct_answer === 'string' && /^[A-D]$/i.test(question.correct_answer))
    );
}

function normalizeLegacyQuestion(question, index) {
    const rawChoices = question?.choices || [];
    const choices = {};

    if (Array.isArray(rawChoices)) {
        CHOICE_LETTERS.forEach((letter, choiceIndex) => {
            if (rawChoices[choiceIndex] != null && rawChoices[choiceIndex] !== '') {
                choices[letter] = rawChoices[choiceIndex];
            }
        });
    } else if (rawChoices && typeof rawChoices === 'object') {
        CHOICE_LETTERS.forEach((letter) => {
            if (rawChoices[letter] != null && rawChoices[letter] !== '') {
                choices[letter] = rawChoices[letter];
            }
        });
    }

    const correctIndex = Number(question?.correct_index ?? 0);
    const correctAnswer = typeof question?.correct_answer === 'string' && /^[A-D]$/i.test(question.correct_answer)
        ? question.correct_answer.toUpperCase()
        : CHOICE_LETTERS[correctIndex] || 'A';

    return {
        ...question,
        number: question?.number ?? (index + 1),
        question: question?.question || question?.question_en || '',
        choices,
        correct_answer: correctAnswer,
    };
}

export function prepareLessonQuizReviewQuestions(rawQuestions, locale, { includeAnswers = true } = {}) {
    const lang = resolveAiScenarioLanguage(locale);

    return (rawQuestions || []).map((raw, index) => {
        const normalized = isBilingualQuestion(raw) ? raw : normalizeLegacyQuestion(raw, index);
        return resolveQuestionsForLocale(normalized, lang, { includeAnswers });
    });
}

export function formatDisplayLanguageLabel(locale) {
    return AI_SCENARIO_LANGUAGES[resolveAiScenarioLanguage(locale)]?.label || 'English';
}

export function formatAnswerLabel(choices, letter) {
    if (!letter) return '—';
    const text = choices?.[letter];
    return text ? `${letter}. ${text}` : letter;
}

export function resolveParticipantAnswer(participantAnswers, questionNumber) {
    const answers = participantAnswers || {};
    const num = String(questionNumber);

    return answers[num]
        ?? answers[questionNumber]
        ?? answers[String(Number(questionNumber))]
        ?? null;
}
