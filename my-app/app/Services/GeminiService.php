<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    /** Models that support generateContent on v1beta (avoid deprecated gemini-pro / 1.5). */
    private const PREFERRED_MODELS = [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-2.5-pro',
    ];

    private string $apiKey;

    private string $modelName;

    private string $currentApiVersion;

    private string $baseUrl = 'https://generativelanguage.googleapis.com';

    /** @var list<string> */
    private array $availableModels = [];

    public function __construct()
    {
        $this->apiKey = (string) config('services.gemini.api_key');
        $this->currentApiVersion = (string) config('services.gemini.api_version', 'v1beta');
        $configuredModel = (string) config('services.gemini.model', 'gemini-2.0-flash');
        $this->modelName = $configuredModel !== '' ? $configuredModel : 'gemini-2.0-flash';
        $this->resolveAvailableModels();
    }

    /**
     * @return list<string>
     */
    public function getModelsToTry(): array
    {
        $ordered = array_values(array_unique(array_filter([
            $this->modelName,
            ...$this->availableModels,
            ...self::PREFERRED_MODELS,
        ])));

        return $ordered;
    }

    private function resolveAvailableModels(): void
    {
        if ($this->apiKey === '') {
            return;
        }

        $version = $this->currentApiVersion ?: 'v1beta';
        $url = $this->baseUrl.'/'.$version.'/models?key='.$this->apiKey;

        try {
            $response = Http::timeout(15)->get($url);

            if ($response->status() === 403) {
                $message = $response->json('error.message') ?? $response->body();
                if (stripos($message, 'leaked') !== false) {
                    Log::error('Gemini API key reported as leaked — create a new key at https://aistudio.google.com/apikey');
                }

                return;
            }

            if (! $response->successful()) {
                Log::warning('Failed to list Gemini models', [
                    'version' => $version,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return;
            }

            $listed = [];
            foreach ($response->json('models') ?? [] as $model) {
                $name = $model['name'] ?? '';
                if (str_starts_with($name, 'models/')) {
                    $name = substr($name, 7);
                }
                $methods = $model['supportedGenerationMethods'] ?? [];
                if (in_array('generateContent', $methods, true)) {
                    $listed[] = $name;
                }
            }

            if ($listed !== []) {
                $this->availableModels = $listed;
                if (in_array($this->modelName, $listed, true)) {
                    return;
                }
                foreach (self::PREFERRED_MODELS as $preferred) {
                    if (in_array($preferred, $listed, true)) {
                        $this->modelName = $preferred;
                        Log::info("Gemini: configured model unavailable, using {$preferred}");

                        return;
                    }
                }
                $this->modelName = $listed[0];
            }
        } catch (\Exception $e) {
            Log::warning('Could not list Gemini models', ['error' => $e->getMessage()]);
        }
    }

    /**
     * @deprecated Use resolveAvailableModels — kept for TestGeminiApi compatibility
     */
    private function findAvailableModel(): string
    {
        $this->resolveAvailableModels();

        return $this->modelName;
    }

    /**
     * Generate a disaster scenario using Gemini API from custom user prompt
     */
    public function generateScenarioFromPrompt(string $userPrompt, ?string $disasterType = null, string $difficulty = 'Medium', ?string $hazardContext = null): array
    {
        if ($this->apiKey === '') {
            throw new \Exception('Gemini API key not configured. Add GEMINI_API_KEY to .env');
        }

        $prompt = $this->buildScenarioPromptFromUserInput($userPrompt, $disasterType, $difficulty, $hazardContext);

        try {
            $generatedText = $this->generateContentText($prompt);

            return $this->parseScenarioFromText($generatedText, $disasterType);
        } catch (\Exception $e) {
            Log::error('Gemini scenario generation failed', [
                'error' => $e->getMessage(),
                'prompt' => $userPrompt,
                'disaster_type' => $disasterType,
            ]);
            throw $e;
        }
    }

    /**
     * Get list of available models (for debugging)
     */
    public function listAvailableModels(): array
    {
        if ($this->apiKey === '') {
            return [];
        }

        $version = $this->currentApiVersion ?: 'v1beta';
        $url = $this->baseUrl.'/'.$version.'/models?key='.$this->apiKey;
        $response = Http::timeout(15)->get($url);

        if (! $response->successful()) {
            Log::warning('Failed to list Gemini models', [
                'version' => $version,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [];
        }

        $allModels = [];
        foreach ($response->json('models') ?? [] as $model) {
            $model['api_version'] = $version;
            $allModels[] = $model;
        }

        return $allModels;
    }

    /**
     * Legacy method for backward compatibility
     */
    public function generateScenario(string $disasterType, string $difficulty = 'Medium'): array
    {
        return $this->generateScenarioFromPrompt("Create a {$difficulty} difficulty scenario for {$disasterType}", $disasterType, $difficulty);
    }

    /**
     * Generate a training module description and learning objectives from a title
     */
    public function generateTrainingModuleFromTitle(string $title, ?string $difficulty = 'Beginner', ?string $disasterType = null): array
    {
        if ($this->apiKey === '') {
            throw new \Exception('Gemini API key not configured. Add GEMINI_API_KEY to .env');
        }

        $prompt = $this->buildTrainingModulePromptFromTitle($title, $difficulty, $disasterType);

        try {
            $generatedText = $this->generateContentText($prompt);

            return $this->parseTrainingModuleFromText($generatedText);
        } catch (\Exception $e) {
            Log::error('Gemini training module generation failed', [
                'error' => $e->getMessage(),
                'title' => $title,
                'difficulty' => $difficulty,
                'disaster_type' => $disasterType,
            ]);
            throw $e;
        }
    }

    /**
     * Build the prompt for Gemini to generate a scenario from user input
     */
    private function buildScenarioPromptFromUserInput(string $userPrompt, ?string $disasterType, string $difficulty, ?string $hazardContext = null): string
    {
        $disasterTypeText = $disasterType ? "Disaster Type: {$disasterType}\n" : "";
        $hazardBlock = $hazardContext ? "\n\nOFFICIAL HAZARD ASSESSMENT DATA (must be respected):\n{$hazardContext}\n" : "";
        
        $prompt = "You are a disaster preparedness training expert. Based on the following user description, generate a comprehensive disaster response training scenario.

User's Scenario Description: {$userPrompt}
{$disasterTypeText}Difficulty Level: {$difficulty}{$hazardBlock}

Return the response ONLY as valid JSON (no markdown, no code blocks, no explanations, just the JSON object):
{
  \"title\": \"Brief, descriptive scenario title (max 100 chars)\",
  \"short_description\": \"2-3 sentence overview of the scenario\",
  \"affected_area\": \"Specific location/barangay name\",
  \"incident_time_text\": \"Time in HH:MM AM/PM format (e.g., 10:17 AM)\",
  \"general_situation\": \"Detailed description of the disaster situation, what's happening, current state, and context\",
  \"severity_level\": \"Low\" or \"Medium\" or \"High\" or \"Critical\",
  \"difficulty\": \"{$difficulty}\",
  \"intended_participants\": \"Target roles/positions (e.g., Barangay Officials, Fire Responders, Medical Teams, Students, Staff, Volunteers)\",
  \"injured_victims_count\": integer_number,
  \"trapped_persons_count\": integer_number,
  \"infrastructure_damage\": \"Description of damaged infrastructure, buildings, roads, utilities\",
  \"communication_status\": \"working\" or \"unstable\" or \"down\"
}

Important:
- All string values must be properly escaped JSON strings
- Numbers must be integers (no decimals)
- Severity level and communication status must match the exact values provided
- Make the scenario realistic, detailed, and appropriate for disaster preparedness training
- Base all details on the user's description while making it comprehensive";

        return $prompt;
    }

    /**
     * Parse the generated text into scenario data
     */
    private function parseScenarioFromText(string $text, ?string $disasterType): array
    {
        // Clean the text - remove markdown code blocks if present
        $cleanText = $text;
        $cleanText = preg_replace('/```json\s*/i', '', $cleanText);
        $cleanText = preg_replace('/```\s*/', '', $cleanText);
        $cleanText = trim($cleanText);
        
        // Try to find JSON object
        $jsonMatch = preg_match('/\{[\s\S]*\}/', $cleanText, $matches);
        
        if (!$jsonMatch) {
            Log::error('Could not extract JSON from Gemini response', ['text' => $text]);
            throw new \Exception('Could not extract JSON from AI response. The AI may have returned invalid format.');
        }

        $json = json_decode($matches[0], true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::error('Invalid JSON in Gemini response', [
                'error' => json_last_error_msg(),
                'text' => $matches[0]
            ]);
            throw new \Exception('Invalid JSON in AI response: ' . json_last_error_msg());
        }

        // Validate severity_level and communication_status
        $severityLevel = $json['severity_level'] ?? 'Medium';
        if (!in_array($severityLevel, ['Low', 'Medium', 'High', 'Critical'])) {
            $severityLevel = 'Medium';
        }

        $communicationStatus = $json['communication_status'] ?? 'working';
        if (!in_array($communicationStatus, ['working', 'unstable', 'down'])) {
            $communicationStatus = 'working';
        }

        // Ensure all required fields are present
        return [
            'title' => $json['title'] ?? 'Generated Scenario',
            'short_description' => $json['short_description'] ?? '',
            'affected_area' => $json['affected_area'] ?? '',
            'incident_time_text' => $json['incident_time_text'] ?? '',
            'general_situation' => $json['general_situation'] ?? '',
            'severity_level' => $severityLevel,
            'difficulty' => $json['difficulty'] ?? 'Medium',
            'intended_participants' => $json['intended_participants'] ?? '',
            'injured_victims_count' => max(0, (int)($json['injured_victims_count'] ?? 0)),
            'trapped_persons_count' => max(0, (int)($json['trapped_persons_count'] ?? 0)),
            'infrastructure_damage' => $json['infrastructure_damage'] ?? '',
            'communication_status' => $communicationStatus,
            'disaster_type' => $disasterType ?? '',
        ];
    }

    /**
     * Build prompt for training module generation
     */
    private function buildTrainingModulePromptFromTitle(string $title, ?string $difficulty, ?string $disasterType): string
    {
        $difficultyText = $difficulty ?: 'Beginner';
        $disasterLine = $disasterType ? "Disaster Type: {$disasterType}\n" : '';

        return "You are a disaster preparedness training expert. Based on the following training module title, generate a concise module description and at least three clear learning objectives.

Module Title: {$title}
{$disasterLine}Difficulty Level: {$difficultyText}

Return the response ONLY as valid JSON (no markdown, no code blocks, no explanations, just the JSON object):
{
  \"description\": \"2-3 sentences describing what this training module covers, written in plain language for participants.\",
  \"learning_objectives\": [
    \"First specific learning objective in participant-friendly language.\",
    \"Second specific learning objective in participant-friendly language.\",
    \"Third specific learning objective in participant-friendly language.\"
  ]
}

Important:
- learning_objectives must be an array of short strings
- Include at least three learning objectives
- Make the content specific to the module title and disaster context (if provided)
- Do NOT include markdown, bullet markers, or numbering in the JSON itself.";
    }

    /**
     * Parse generated training module JSON
     */
    private function parseTrainingModuleFromText(string $text): array
    {
        $cleanText = preg_replace('/```json\s*/i', '', $text);
        $cleanText = preg_replace('/```\s*/', '', $cleanText);
        $cleanText = trim($cleanText ?? '');

        $jsonMatch = preg_match('/\{[\s\S]*\}/', $cleanText, $matches);
        if (! $jsonMatch) {
            Log::error('Could not extract JSON from Gemini training-module response', ['text' => $text]);
            throw new \Exception('Could not extract JSON from AI response. The AI may have returned invalid format.');
        }

        $json = json_decode($matches[0], true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::error('Invalid JSON in Gemini training-module response', [
                'error' => json_last_error_msg(),
                'text' => $matches[0],
            ]);
            throw new \Exception('Invalid JSON in AI response: ' . json_last_error_msg());
        }

        $description = trim((string)($json['description'] ?? ''));
        $objectives = $json['learning_objectives'] ?? [];
        if (! is_array($objectives)) {
            $objectives = [];
        }

        $objectives = array_values(array_filter($objectives, function ($item) {
            return is_string($item) && trim($item) !== '';
        }));

        // Ensure at least three objectives (pad with empty strings if needed so UI has fields)
        while (count($objectives) < 3) {
            $objectives[] = '';
        }

        return [
            'description' => $description,
            'learning_objectives' => $objectives,
        ];
    }

    /**
     * Generate a scenario + multiple-choice quiz from a training module context.
     *
     * @return array{scenario_title: string, scenario: string, questions: array<int, array<string, mixed>>}
     */
    public function generateTrainingScenarioQuiz(
        \App\Models\TrainingModule $module,
        string $difficulty = 'medium',
        int $questionCount = 10,
        string $language = 'en',
        ?string $hazardContext = null,
    ): array {
        if (! $this->apiKey) {
            throw new \Exception('Gemini API key not configured. Add GEMINI_API_KEY to .env');
        }

        $questionCount = in_array($questionCount, [10, 15, 20], true) ? $questionCount : 10;
        $difficulty = in_array($difficulty, ['easy', 'medium', 'hard'], true) ? $difficulty : 'medium';
        $language = in_array($language, ['en', 'fil'], true) ? $language : 'en';

        $module->loadMissing('contents');
        $prompt = $this->buildTrainingScenarioQuizPrompt($module, $difficulty, $questionCount, $language, $hazardContext);
        $generatedText = $this->generateContentText($prompt);

        return $this->parseTrainingScenarioQuizFromText($generatedText, $questionCount);
    }

    public function generateContentText(string $prompt): string
    {
        if ($this->apiKey === '') {
            throw new \Exception('Gemini API key not configured. Add GEMINI_API_KEY to .env');
        }

        if ($this->availableModels === []) {
            $this->resolveAvailableModels();
        }

        $apiVersion = $this->currentApiVersion ?: 'v1beta';
        $modelsToTry = $this->getModelsToTry();
        $lastError = null;
        $leakedKey = false;

        foreach ($modelsToTry as $model) {
            $url = $this->baseUrl.'/'.$apiVersion.'/models/'.$model.':generateContent?key='.$this->apiKey;

            try {
                $response = Http::timeout(120)->post($url, [
                    'contents' => [
                        ['parts' => [['text' => $prompt]]],
                    ],
                ]);

                if ($response->successful()) {
                    $text = $response->json('candidates.0.content.parts.0.text') ?? '';
                    if ($text !== '') {
                        $this->modelName = $model;
                        Log::info("Gemini generateContent OK: {$apiVersion}/{$model}");

                        return $text;
                    }
                    $lastError = 'Empty response from Gemini API';
                    continue;
                }

                $lastError = $response->json('error.message') ?? $response->body();

                if ($response->status() === 403 && stripos((string) $lastError, 'leaked') !== false) {
                    $leakedKey = true;
                    break;
                }

                if ($response->status() === 404) {
                    Log::warning("Gemini model not found: {$apiVersion}/{$model}");
                    continue;
                }

                if ($response->status() === 429) {
                    Log::warning("Gemini quota exceeded for {$model}, trying next model");
                    continue;
                }
            } catch (\Exception $e) {
                $lastError = $e->getMessage();
            }
        }

        if ($leakedKey) {
            throw new \Exception(
                'Your Gemini API key was reported as leaked and disabled by Google. '.
                'Create a new key at https://aistudio.google.com/apikey, update GEMINI_API_KEY in .env, then run: php artisan config:clear'
            );
        }

        $hint = $this->availableModels !== []
            ? ' Available models: '.implode(', ', array_slice($this->availableModels, 0, 8)).'.'
            : ' Enable the Generative Language API and verify billing/quota in Google AI Studio.';

        throw new \Exception('Gemini API failed: '.($lastError ?? 'Unknown error').$hint);
    }

    private function buildTrainingScenarioQuizPrompt(
        \App\Models\TrainingModule $module,
        string $difficulty,
        int $questionCount,
        string $language = 'en',
        ?string $hazardContext = null,
    ): string {
        $objectives = is_array($module->learning_objectives)
            ? implode('; ', array_filter($module->learning_objectives))
            : '';

        $lessonLines = $module->contents
            ->sortBy('sort_order')
            ->map(function ($content, $index) {
                $summary = $content->body
                    ? mb_substr(trim(preg_replace('/\s+/', ' ', strip_tags($content->body)) ?? ''), 0, 300)
                    : strtoupper($content->content_type).' content';

                return ($index + 1).'. '.$content->title.' — '.$summary;
            })
            ->implode("\n");

        $difficultyLabel = ucfirst($difficulty);
        $languageLabel = $language === 'fil' ? 'Filipino' : 'English';
        $hazardBlock = $hazardContext ? "\nOfficial Hazard Assessment (scenario must align with these risks only):\n{$hazardContext}\n" : '';

        return <<<PROMPT
You are a disaster preparedness training expert for Local Government Units (LGUs) in the Philippines.

Using ONLY the training module information below, create one realistic disaster scenario and exactly {$questionCount} multiple-choice assessment questions.
{$hazardBlock}

Write ALL output in {$languageLabel}.

Training Module Title: {$module->title}
Module Description: {$module->description}
Learning Objectives: {$objectives}
Module Difficulty Level: {$module->difficulty}
Assessment Difficulty (auto-selected from module and lesson depth): {$difficultyLabel}
Lesson Titles and Content Summaries:
{$lessonLines}

Requirements:
- The scenario must be practical for LGU personnel or community disaster preparedness participants.
- Base the scenario entirely on the training module topic and lessons.
- Difficulty "{$difficultyLabel}" should affect scenario complexity and question rigor.
- Generate exactly {$questionCount} multiple-choice questions numbered 1 through {$questionCount}.
- Each question must have exactly four choices labeled A, B, C, and D.
- Each question must have one correct answer (A, B, C, or D) and a brief explanation.
- Questions must measure understanding, decision-making, and proper emergency response.
- Each question must include a "competency" field: one of "knowledge", "decision_making", "emergency_response", or "safety_awareness". Distribute competencies evenly across all questions.
- Include 3-5 concise learning objectives derived from the scenario and questions.

Return ONLY valid JSON (no markdown, no code fences):
{
  "scenario_title": "Short descriptive title",
  "scenario": "2-4 paragraph realistic disaster scenario narrative",
  "learning_objectives": ["Objective 1", "Objective 2"],
  "questions": [
    {
      "number": 1,
      "competency": "knowledge",
      "question": "Question text",
      "choices": {
        "A": "Choice A",
        "B": "Choice B",
        "C": "Choice C",
        "D": "Choice D"
      },
      "correct_answer": "B",
      "explanation": "Brief explanation"
    }
  ]
}
PROMPT;
    }

    /**
     * @return array{scenario_title: string, scenario: string, questions: array<int, array<string, mixed>>}
     */
    private function parseTrainingScenarioQuizFromText(string $text, int $expectedCount): array
    {
        $cleanText = preg_replace('/```json\s*/i', '', $text);
        $cleanText = preg_replace('/```\s*/', '', $cleanText ?? '');
        $cleanText = trim($cleanText ?? '');

        if (! preg_match('/\{[\s\S]*\}/', $cleanText, $matches)) {
            throw new \Exception('Could not extract JSON from AI response.');
        }

        $json = json_decode($matches[0], true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception('Invalid JSON in AI response: '.json_last_error_msg());
        }

        $questions = $json['questions'] ?? [];
        if (! is_array($questions) || count($questions) < 1) {
            throw new \Exception('AI response did not include questions.');
        }

        $normalized = [];
        foreach ($questions as $index => $question) {
            $normalized[] = $this->normalizeQuizQuestionRecord($question, $index, $expectedCount);
        }

        usort($normalized, fn ($a, $b) => $a['number'] <=> $b['number']);
        $normalized = array_slice($normalized, 0, $expectedCount);

        return [
            'scenario_title' => (string) ($json['scenario_title'] ?? 'AI Generated Scenario'),
            'scenario' => (string) ($json['scenario'] ?? ''),
            'learning_objectives' => $json['learning_objectives'] ?? [],
            'questions' => array_values($normalized),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function normalizeQuizQuestionRecord(array $question, int $index, int $expectedCount): array
    {
        $number = (int) ($question['number'] ?? ($index + 1));
        $choices = $question['choices'] ?? [];
        $correct = strtoupper((string) ($question['correct_answer'] ?? 'A'));

        if (! in_array($correct, ['A', 'B', 'C', 'D'], true)) {
            $correct = 'A';
        }

        return [
            'number' => $number,
            'competency' => $this->normalizeQuizCompetency($question['competency'] ?? null, $index, $expectedCount),
            'question' => (string) ($question['question'] ?? ''),
            'choices' => [
                'A' => (string) ($choices['A'] ?? ''),
                'B' => (string) ($choices['B'] ?? ''),
                'C' => (string) ($choices['C'] ?? ''),
                'D' => (string) ($choices['D'] ?? ''),
            ],
            'correct_answer' => $correct,
            'explanation' => (string) ($question['explanation'] ?? ''),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function parseSingleQuizQuestionFromText(string $text, int $questionNumber): array
    {
        $cleanText = preg_replace('/```json\s*/i', '', $text);
        $cleanText = preg_replace('/```\s*/', '', $cleanText ?? '');
        $cleanText = trim($cleanText ?? '');

        if (! preg_match('/\{[\s\S]*\}/', $cleanText, $matches)) {
            throw new \Exception('Could not extract JSON from AI response.');
        }

        $json = json_decode($matches[0], true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception('Invalid JSON in AI response: '.json_last_error_msg());
        }

        if (isset($json['questions'][0]) && is_array($json['questions'][0])) {
            $question = $json['questions'][0];
        } elseif (isset($json['question'])) {
            $question = $json;
        } else {
            throw new \Exception('AI response did not include a question.');
        }

        $question['number'] = $questionNumber;

        return $this->normalizeQuizQuestionRecord($question, 0, 1);
    }

    private function normalizeQuizCompetency(?string $value, int $index, int $total): string
    {
        $valid = ['knowledge', 'decision_making', 'emergency_response', 'safety_awareness'];
        $normalized = strtolower(trim(str_replace([' ', '-'], '_', (string) $value)));

        if (in_array($normalized, $valid, true)) {
            return $normalized;
        }

        return $valid[$index % count($valid)];
    }

    /**
     * @return array<string, mixed>
     */
    public function generateSingleQuizQuestion(
        \App\Models\TrainingModule $module,
        string $difficulty,
        string $language,
        int $questionNumber,
        ?string $scenarioContext = null,
    ): array {
        $languageLabel = $language === 'fil' ? 'Filipino' : 'English';
        $prompt = <<<PROMPT
Generate ONE multiple-choice quiz question in {$languageLabel} for disaster preparedness training module "{$module->title}".
Difficulty: {$difficulty}.
Scenario context: {$scenarioContext}

Return ONLY valid JSON:
{
  "number": {$questionNumber},
  "competency": "knowledge|decision_making|emergency_response|safety_awareness",
  "question": "...",
  "choices": {"A":"...","B":"...","C":"...","D":"..."},
  "correct_answer": "A|B|C|D",
  "explanation": "..."
}
PROMPT;

        $text = $this->generateContentText($prompt);

        return $this->parseSingleQuizQuestionFromText($text, $questionNumber);
    }
}
