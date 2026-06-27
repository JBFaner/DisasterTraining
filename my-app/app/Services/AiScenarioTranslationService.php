<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class AiScenarioTranslationService
{
    public function __construct(
        private readonly GeminiService $gemini,
        private readonly AiScenarioLocaleService $localeService,
    ) {}

    /**
     * @param  array<string, mixed>  $source
     * @return array<string, mixed>
     */
    public function translateScenarioQuiz(array $source, string $fromLocale, string $toLocale): array
    {
        $fromLocale = $this->localeService->resolveLocale($fromLocale);
        $toLocale = $this->localeService->resolveLocale($toLocale);

        if ($fromLocale === $toLocale) {
            return $source;
        }

        $fromLabel = config("ai_scenario.languages.{$fromLocale}.label", $fromLocale);
        $toLabel = config("ai_scenario.languages.{$toLocale}.label", $toLocale);

        $payload = [
            'scenario_title' => (string) ($source['scenario_title'] ?? ''),
            'scenario' => (string) ($source['scenario'] ?? ''),
            'learning_objectives' => $source['learning_objectives'] ?? '',
            'questions' => $source['questions'] ?? [],
        ];

        $prompt = $this->buildTranslationPrompt($payload, $fromLabel, $toLabel);

        try {
            $generatedText = $this->gemini->generateContentText($prompt);
            $translated = $this->parseTranslationResponse($generatedText);

            return [
                'scenario_title' => (string) ($translated['scenario_title'] ?? ''),
                'scenario' => (string) ($translated['scenario'] ?? ''),
                'learning_objectives' => $translated['learning_objectives'] ?? '',
                'questions' => $this->mergeTranslatedQuestions(
                    $payload['questions'],
                    $translated['questions'] ?? [],
                ),
            ];
        } catch (\Throwable $e) {
            Log::warning('AI scenario translation failed: '.$e->getMessage());

            throw new \RuntimeException(
                'Failed to translate scenario content to '.$toLabel.'. '.$e->getMessage()
            );
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function buildTranslationPrompt(array $payload, string $fromLabel, string $toLabel): string
    {
        $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        return <<<PROMPT
You are a professional translator for disaster preparedness training materials used by Local Government Units (LGUs) in the Philippines.

Translate the following AI-generated scenario and quiz from {$fromLabel} to {$toLabel}.

Rules:
- Preserve the exact JSON structure.
- Do NOT change question numbers, competency values, or correct_answer letters (A, B, C, D).
- Translate scenario_title, scenario, learning_objectives, question text, all choice texts, and explanations.
- Use clear, professional {$toLabel} appropriate for government disaster training.
- learning_objectives may be a string or array of strings — return the same shape translated.
- Return ONLY valid JSON (no markdown, no code fences).

Source JSON:
{$json}

Return JSON with this shape:
{
  "scenario_title": "translated title",
  "scenario": "translated scenario narrative",
  "learning_objectives": "translated objectives (string or array)",
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
    protected function mergeTranslatedQuestions(array $sourceQuestions, array $translatedQuestions): array
    {
        $translatedByNumber = [];
        foreach ($translatedQuestions as $question) {
            $number = (int) ($question['number'] ?? 0);
            if ($number > 0) {
                $translatedByNumber[$number] = $question;
            }
        }

        $merged = [];
        foreach ($sourceQuestions as $index => $sourceQuestion) {
            $number = (int) ($sourceQuestion['number'] ?? ($index + 1));
            $translated = $translatedByNumber[$number] ?? $sourceQuestion;

            $merged[] = [
                'number' => $number,
                'competency' => $sourceQuestion['competency'] ?? $translated['competency'] ?? null,
                'question' => (string) ($translated['question'] ?? ''),
                'choices' => [
                    'A' => (string) ($translated['choices']['A'] ?? ''),
                    'B' => (string) ($translated['choices']['B'] ?? ''),
                    'C' => (string) ($translated['choices']['C'] ?? ''),
                    'D' => (string) ($translated['choices']['D'] ?? ''),
                ],
                'correct_answer' => strtoupper((string) ($sourceQuestion['correct_answer'] ?? $translated['correct_answer'] ?? 'A')),
                'explanation' => (string) ($translated['explanation'] ?? ''),
            ];
        }

        return $merged;
    }
}
