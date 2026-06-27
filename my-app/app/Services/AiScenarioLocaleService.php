<?php

namespace App\Services;

use App\Models\AiScenarioAttempt;
use App\Models\AiScenarioConfig;

class AiScenarioLocaleService
{
    /** @return list<string> */
    public function supportedLanguages(): array
    {
        return config('ai_scenario.language_codes', ['en', 'fil']);
    }

    public function defaultLanguage(): string
    {
        return config('ai_scenario.default_language', 'en');
    }

    public function isSupported(string $locale): bool
    {
        return in_array($locale, $this->supportedLanguages(), true);
    }

    public function resolveLocale(?string $locale): string
    {
        return $this->isSupported((string) $locale) ? (string) $locale : $this->defaultLanguage();
    }

    /** @return array<string, array{label: string, native_label: string, flag: string}> */
    public function languageOptions(): array
    {
        return config('ai_scenario.languages', []);
    }

    public function resolveTitle(AiScenarioConfig|AiScenarioAttempt|array $source, string $locale): string
    {
        $locale = $this->resolveLocale($locale);
        $data = $this->toArray($source);

        return (string) ($data["title_{$locale}"] ?? $data['scenario_title'] ?? '');
    }

    public function resolveDescription(AiScenarioConfig|AiScenarioAttempt|array $source, string $locale): string
    {
        $locale = $this->resolveLocale($locale);
        $data = $this->toArray($source);

        return (string) ($data["description_{$locale}"] ?? $data['generated_scenario'] ?? '');
    }

    public function resolveLearningObjectives(AiScenarioConfig|AiScenarioAttempt|array $source, string $locale): string
    {
        $locale = $this->resolveLocale($locale);
        $data = $this->toArray($source);

        return (string) ($data["learning_objectives_{$locale}"] ?? '');
    }

    /**
     * @param  array<string, mixed>  $question
     * @return array<string, mixed>
     */
    public function resolveQuestionForDisplay(array $question, string $locale, bool $includeAnswers = false): array
    {
        $locale = $this->resolveLocale($locale);
        $normalized = $this->normalizeQuestionToBilingual($question, $this->detectSourceLocale($question));

        $resolved = [
            'number' => $normalized['number'] ?? null,
            'question' => (string) ($normalized["question_{$locale}"] ?? ''),
            'choices' => [
                'A' => (string) ($normalized['choice_a_'.$locale] ?? ''),
                'B' => (string) ($normalized['choice_b_'.$locale] ?? ''),
                'C' => (string) ($normalized['choice_c_'.$locale] ?? ''),
                'D' => (string) ($normalized['choice_d_'.$locale] ?? ''),
            ],
        ];

        if ($includeAnswers) {
            $resolved['correct_answer'] = strtoupper((string) ($normalized['correct_answer'] ?? ''));
            $resolved['explanation'] = (string) ($normalized["explanation_{$locale}"] ?? '');
            $resolved['competency'] = $normalized['competency'] ?? null;
        }

        return $resolved;
    }

    /**
     * @param  array<string, mixed>  $question
     * @return array<string, mixed>
     */
    public function normalizeQuestionToBilingual(array $question, string $sourceLocale = 'en'): array
    {
        $sourceLocale = $this->resolveLocale($sourceLocale);
        $otherLocale = $this->otherLanguage($sourceLocale);

        if ($this->hasBilingualFields($question)) {
            return $this->ensureBothLocalesPresent($question, $sourceLocale);
        }

        $choices = $question['choices'] ?? [];
        $normalized = [
            'number' => (int) ($question['number'] ?? 0),
            'competency' => $question['competency'] ?? null,
            'correct_answer' => strtoupper((string) ($question['correct_answer'] ?? 'A')),
            "question_{$sourceLocale}" => (string) ($question['question'] ?? ''),
            "question_{$otherLocale}" => (string) ($question["question_{$otherLocale}"] ?? ''),
            "explanation_{$sourceLocale}" => (string) ($question['explanation'] ?? ''),
            "explanation_{$otherLocale}" => (string) ($question["explanation_{$otherLocale}"] ?? ''),
        ];

        foreach (['a', 'b', 'c', 'd'] as $letter) {
            $upper = strtoupper($letter);
            $normalized["choice_{$letter}_{$sourceLocale}"] = (string) ($choices[$upper] ?? $question["choice_{$letter}_{$sourceLocale}"] ?? '');
            $normalized["choice_{$letter}_{$otherLocale}"] = (string) ($question["choice_{$letter}_{$otherLocale}"] ?? '');
        }

        return $normalized;
    }

    /**
     * @param  list<array<string, mixed>>  $questions
     * @return list<array<string, mixed>>
     */
    public function normalizeQuestionsToBilingual(array $questions, string $sourceLocale): array
    {
        return array_values(array_map(
            fn (array $question) => $this->normalizeQuestionToBilingual($question, $sourceLocale),
            $questions,
        ));
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function applyBilingualPayload(array $payload, string $sourceLocale): array
    {
        $sourceLocale = $this->resolveLocale($sourceLocale);
        $otherLocale = $this->otherLanguage($sourceLocale);

        $title = (string) ($payload['scenario_title'] ?? '');
        $description = (string) ($payload['scenario'] ?? '');
        $objectives = $this->stringifyObjectives($payload['learning_objectives'] ?? '');

        return [
            'title_'.$sourceLocale => $title,
            'title_'.$otherLocale => (string) ($payload['title_'.$otherLocale] ?? ''),
            'description_'.$sourceLocale => $description,
            'description_'.$otherLocale => (string) ($payload['description_'.$otherLocale] ?? ''),
            'learning_objectives_'.$sourceLocale => $objectives,
            'learning_objectives_'.$otherLocale => (string) ($payload['learning_objectives_'.$otherLocale] ?? ''),
            'generated_language' => $sourceLocale,
            'generated_questions' => $this->normalizeQuestionsToBilingual($payload['questions'] ?? [], $sourceLocale),
            'scenario_title' => $title,
            'generated_scenario' => $description,
        ];
    }

    public function syncLegacyFields(AiScenarioConfig|AiScenarioAttempt $model): void
    {
        $locale = $this->resolveLocale($model->generated_language ?? $this->defaultLanguage());

        $model->scenario_title = $this->resolveTitle($model, $locale);
        $model->generated_scenario = $this->resolveDescription($model, $locale);

        $questions = $model->generated_questions ?? [];
        if (is_array($questions)) {
            $model->generated_questions = array_map(
                fn (array $question) => array_merge(
                    $this->resolveQuestionForDisplay($question, $locale, true),
                    ['competency' => $question['competency'] ?? null],
                ),
                $questions,
            );
        }
    }

    /**
     * @param  array<string, mixed>  $source
     * @param  array<string, mixed>  $translation
     * @return array<string, mixed>
     */
    public function mergeSourceAndTranslation(array $source, array $translation, string $sourceLocale): array
    {
        $sourceLocale = $this->resolveLocale($sourceLocale);
        $targetLocale = $this->otherLanguage($sourceLocale);

        $sourceQuestions = $this->normalizeQuestionsToBilingual($source['questions'] ?? [], $sourceLocale);
        $translatedQuestions = $this->normalizeQuestionsToBilingual($translation['questions'] ?? [], $targetLocale);

        $questions = [];
        foreach ($sourceQuestions as $index => $sourceQuestion) {
            $translatedQuestion = $translatedQuestions[$index] ?? [];
            $number = (int) ($sourceQuestion['number'] ?? ($index + 1));

            $merged = [
                'number' => $number,
                'competency' => $sourceQuestion['competency'] ?? $translatedQuestion['competency'] ?? null,
                'correct_answer' => strtoupper((string) ($sourceQuestion['correct_answer'] ?? 'A')),
                "question_{$sourceLocale}" => (string) ($sourceQuestion["question_{$sourceLocale}"] ?? ''),
                "question_{$targetLocale}" => (string) ($translatedQuestion["question_{$targetLocale}"] ?? $translatedQuestion['question'] ?? ''),
                "explanation_{$sourceLocale}" => (string) ($sourceQuestion["explanation_{$sourceLocale}"] ?? ''),
                "explanation_{$targetLocale}" => (string) ($translatedQuestion["explanation_{$targetLocale}"] ?? $translatedQuestion['explanation'] ?? ''),
            ];

            foreach (['a', 'b', 'c', 'd'] as $letter) {
                $merged["choice_{$letter}_{$sourceLocale}"] = (string) ($sourceQuestion["choice_{$letter}_{$sourceLocale}"] ?? '');
                $merged["choice_{$letter}_{$targetLocale}"] = (string) (
                    $translatedQuestion["choice_{$letter}_{$targetLocale}"]
                    ?? $translatedQuestion['choices'][strtoupper($letter)] ?? ''
                );
            }

            $questions[] = $merged;
        }

        return [
            'title_'.$sourceLocale => (string) ($source['scenario_title'] ?? ''),
            'title_'.$targetLocale => (string) ($translation['scenario_title'] ?? ''),
            'description_'.$sourceLocale => (string) ($source['scenario'] ?? ''),
            'description_'.$targetLocale => (string) ($translation['scenario'] ?? ''),
            'learning_objectives_'.$sourceLocale => $this->stringifyObjectives($source['learning_objectives'] ?? ''),
            'learning_objectives_'.$targetLocale => $this->stringifyObjectives($translation['learning_objectives'] ?? ''),
            'generated_language' => $sourceLocale,
            'generated_questions' => $questions,
            'scenario_title' => (string) ($source['scenario_title'] ?? ''),
            'generated_scenario' => (string) ($source['scenario'] ?? ''),
        ];
    }

    public function isReady(AiScenarioConfig|array $source): bool
    {
        $data = $this->toArray($source);
        $locale = $this->resolveLocale($data['generated_language'] ?? $this->defaultLanguage());
        $otherLocale = $this->otherLanguage($locale);

        $hasSource = filled($data["title_{$locale}"] ?? $data['scenario_title'] ?? null)
            && filled($data["description_{$locale}"] ?? $data['generated_scenario'] ?? null);
        $hasTranslation = filled($data["title_{$otherLocale}"] ?? null)
            && filled($data["description_{$otherLocale}"] ?? null);

        $questions = $data['generated_questions'] ?? [];
        $hasQuestions = is_array($questions) && count($questions) > 0;

        return $hasSource && $hasTranslation && $hasQuestions;
    }

    /**
     * @param  array<string, mixed>  $question
     */
    protected function hasBilingualFields(array $question): bool
    {
        return isset($question['question_en']) || isset($question['question_fil']);
    }

    /**
     * @param  array<string, mixed>  $question
     * @return array<string, mixed>
     */
    protected function ensureBothLocalesPresent(array $question, string $sourceLocale): array
    {
        $sourceLocale = $this->resolveLocale($sourceLocale);
        $otherLocale = $this->otherLanguage($sourceLocale);
        $normalized = $question;

        foreach (['question', 'explanation'] as $field) {
            $normalized["{$field}_{$sourceLocale}"] ??= (string) ($question[$field] ?? '');
            $normalized["{$field}_{$otherLocale}"] ??= '';
        }

        foreach (['a', 'b', 'c', 'd'] as $letter) {
            $upper = strtoupper($letter);
            $normalized["choice_{$letter}_{$sourceLocale}"] ??= (string) ($question['choices'][$upper] ?? '');
            $normalized["choice_{$letter}_{$otherLocale}"] ??= '';
        }

        $normalized['correct_answer'] = strtoupper((string) ($normalized['correct_answer'] ?? 'A'));

        return $normalized;
    }

    /**
     * @param  array<string, mixed>  $question
     */
    protected function detectSourceLocale(array $question): string
    {
        if (filled($question['question_en'] ?? null)) {
            return 'en';
        }

        if (filled($question['question_fil'] ?? null)) {
            return 'fil';
        }

        return $this->defaultLanguage();
    }

    protected function otherLanguage(string $locale): string
    {
        return $locale === 'en' ? 'fil' : 'en';
    }

    /**
     * @param  array<string, mixed>|AiScenarioConfig|AiScenarioAttempt  $source
     * @return array<string, mixed>
     */
    protected function toArray(array|AiScenarioConfig|AiScenarioAttempt $source): array
    {
        return is_array($source) ? $source : $source->toArray();
    }

    protected function stringifyObjectives(mixed $objectives): string
    {
        if (is_array($objectives)) {
            return implode("\n", array_filter(array_map('strval', $objectives)));
        }

        return trim((string) $objectives);
    }
}
