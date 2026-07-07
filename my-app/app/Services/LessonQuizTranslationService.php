<?php

namespace App\Services;

use App\Support\Utf8Sanitizer;
use Illuminate\Support\Facades\Log;

class LessonQuizTranslationService
{
    public function __construct(
        private readonly GeminiService $gemini,
        private readonly AiScenarioLocaleService $localeService,
    ) {}

    /**
     * @param  list<array<string, mixed>>  $questions
     * @return list<array<string, mixed>>
     */
    public function translateQuestionBank(array $questions, string $fromLocale, string $toLocale): array
    {
        $fromLocale = $this->localeService->resolveLocale($fromLocale);
        $toLocale = $this->localeService->resolveLocale($toLocale);

        if ($fromLocale === $toLocale) {
            return $questions;
        }

        $fromLabel = config("ai_scenario.languages.{$fromLocale}.label", $fromLocale);
        $toLabel = config("ai_scenario.languages.{$toLocale}.label", $toLocale);

        $sourcePayload = array_map(function (array $question) use ($fromLocale) {
            $normalized = $this->localeService->normalizeQuestionToBilingual($question, $fromLocale);

            return [
                'number' => (int) ($normalized['number'] ?? 0),
                'competency' => $normalized['competency'] ?? null,
                'question' => (string) ($normalized["question_{$fromLocale}"] ?? ''),
                'choices' => [
                    'A' => (string) ($normalized['choice_a_'.$fromLocale] ?? ''),
                    'B' => (string) ($normalized['choice_b_'.$fromLocale] ?? ''),
                    'C' => (string) ($normalized['choice_c_'.$fromLocale] ?? ''),
                    'D' => (string) ($normalized['choice_d_'.$fromLocale] ?? ''),
                ],
                'correct_answer' => strtoupper((string) ($normalized['correct_answer'] ?? 'A')),
                'explanation' => (string) ($normalized["explanation_{$fromLocale}"] ?? ''),
            ];
        }, $questions);

        $prompt = $this->buildTranslationPrompt($sourcePayload, $fromLabel, $toLabel);

        try {
            $generatedText = $this->gemini->generateContentText($prompt);
            $translated = $this->parseTranslationResponse($generatedText);

            return $this->mergeTranslatedQuestions($questions, $translated['questions'] ?? [], $fromLocale, $toLocale);
        } catch (\Throwable $e) {
            Log::warning('Lesson quiz translation failed: '.$e->getMessage());

            throw new \RuntimeException(
                'Failed to translate question bank to '.$toLabel.'. '.$e->getMessage()
            );
        }
    }

    /**
     * @param  list<array<string, mixed>>  $sourceQuestions
     */
    protected function buildTranslationPrompt(array $sourceQuestions, string $fromLabel, string $toLabel): string
    {
        $json = json_encode(
            ['questions' => Utf8Sanitizer::cleanArray($sourceQuestions)],
            JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT,
        );

        return <<<PROMPT
You are a professional translator for disaster preparedness training materials used by Local Government Units (LGUs) in the Philippines.

Translate the following lesson quiz question bank from {$fromLabel} to {$toLabel}.

Rules:
- Preserve the exact JSON structure.
- Do NOT change question numbers, competency values, or correct_answer letters (A, B, C, D).
- Translate question text, all choice texts, and explanations only.
- Preserve official disaster preparedness terminology.
- Preserve official agency names exactly (e.g., PAGASA, NDRRMC, BFP, OCD).
- Produce natural and grammatically correct {$toLabel}.
- Avoid literal word-for-word translations that reduce clarity.
- Maintain the exact meaning of the original question.
- Return ONLY valid JSON (no markdown, no code fences).

Source JSON:
{$json}

Return JSON with this shape:
{
  "questions": [
    {
      "number": 1,
      "competency": "knowledge",
      "question": "translated question",
      "choices": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correct_answer": "B",
      "explanation": "translated explanation"
    }
  ]
}
PROMPT;
    }

    /**
     * @return array<string, mixed>
     */
    protected function parseTranslationResponse(string $text): array
    {
        $cleanText = preg_replace('/```json\s*/i', '', $text);
        $cleanText = preg_replace('/```\s*/', '', $cleanText ?? '');
        $cleanText = trim($cleanText ?? '');

        if (! preg_match('/\{[\s\S]*\}/', $cleanText, $matches)) {
            throw new \RuntimeException('Could not extract translation JSON from AI response.');
        }

        $json = json_decode($matches[0], true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \RuntimeException('Invalid translation JSON: '.json_last_error_msg());
        }

        return is_array($json) ? $json : [];
    }

    /**
     * @param  list<array<string, mixed>>  $sourceQuestions
     * @param  list<array<string, mixed>>  $translatedQuestions
     * @return list<array<string, mixed>>
     */
    protected function mergeTranslatedQuestions(
        array $sourceQuestions,
        array $translatedQuestions,
        string $sourceLocale,
        string $targetLocale,
    ): array {
        $translatedByNumber = [];
        foreach ($translatedQuestions as $question) {
            $number = (int) ($question['number'] ?? 0);
            if ($number > 0) {
                $translatedByNumber[$number] = $question;
            }
        }

        $merged = [];
        foreach ($sourceQuestions as $index => $sourceQuestion) {
            $normalized = $this->localeService->normalizeQuestionToBilingual($sourceQuestion, $sourceLocale);
            $number = (int) ($normalized['number'] ?? ($index + 1));
            $translated = $translatedByNumber[$number] ?? [];

            $normalized["question_{$targetLocale}"] = (string) ($translated['question'] ?? '');
            $normalized["explanation_{$targetLocale}"] = (string) ($translated['explanation'] ?? '');

            foreach (['a', 'b', 'c', 'd'] as $letter) {
                $upper = strtoupper($letter);
                $normalized["choice_{$letter}_{$targetLocale}"] = (string) (
                    $translated['choices'][$upper] ?? ''
                );
            }

            $merged[] = $normalized;
        }

        return $merged;
    }
}
