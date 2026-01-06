<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    private $apiKey;
    private $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key');
    }

    /**
     * Generate a disaster scenario using Gemini API
     */
    public function generateScenario(string $disasterType, string $difficulty = 'Medium'): array
    {
        if (!$this->apiKey) {
            throw new \Exception('Gemini API key not configured. Add GEMINI_API_KEY to .env');
        }

        $prompt = $this->buildScenarioPrompt($disasterType, $difficulty);

        try {
            $response = Http::timeout(30)
                ->post($this->baseUrl . '?key=' . $this->apiKey, [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt]
                            ]
                        ]
                    ]
                ]);

            if (!$response->successful()) {
                Log::error('Gemini API error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception('Gemini API returned status ' . $response->status());
            }

            $data = $response->json();
            
            // Extract text from Gemini response
            $generatedText = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
            
            return $this->parseScenarioFromText($generatedText, $disasterType);

        } catch (\Exception $e) {
            Log::error('Gemini scenario generation failed', [
                'error' => $e->getMessage(),
                'disaster_type' => $disasterType
            ]);
            throw $e;
        }
    }

    /**
     * Build the prompt for Gemini to generate a scenario
     */
    private function buildScenarioPrompt(string $disasterType, string $difficulty): string
    {
        $prompt = "Generate a realistic disaster response training scenario for the following:
- Disaster Type: {$disasterType}
- Difficulty Level: {$difficulty}

Return the response in this exact JSON format (no markdown, just valid JSON):
{
  \"title\": \"Brief scenario title\",
  \"short_description\": \"2-3 sentence overview of the scenario\",
  \"affected_area\": \"Specific location/barangay name\",
  \"incident_time_text\": \"Time in HH:MM AM/PM format\",
  \"general_situation\": \"Detailed description of the disaster situation, what's happening, and the current state\",
  \"severity_level\": \"Low|Medium|High|Critical\",
  \"difficulty\": \"{$difficulty}\",
  \"intended_participants\": \"Target roles/positions (e.g., Barangay Officials, Fire Responders, Medical Teams)\",
  \"injured_victims_count\": number,
  \"trapped_persons_count\": number,
  \"infrastructure_damage\": \"Description of damaged infrastructure\",
  \"communication_status\": \"working|unstable|down\",
  \"learning_objectives\": \"Comma-separated list of what participants should learn\"
}

Create a realistic, detailed scenario that is appropriate for disaster preparedness training.";

        return $prompt;
    }

    /**
     * Parse the generated text into scenario data
     */
    private function parseScenarioFromText(string $text, string $disasterType): array
    {
        // Extract JSON from the response (might be wrapped in markdown code blocks)
        $jsonMatch = preg_match('/\{[\s\S]*\}/', $text, $matches);
        
        if (!$jsonMatch) {
            throw new \Exception('Could not extract JSON from Gemini response');
        }

        $json = json_decode($matches[0], true);
        
        if (!$json) {
            throw new \Exception('Invalid JSON in Gemini response');
        }

        // Ensure all required fields are present
        return [
            'title' => $json['title'] ?? 'Generated Scenario',
            'short_description' => $json['short_description'] ?? '',
            'affected_area' => $json['affected_area'] ?? '',
            'incident_time_text' => $json['incident_time_text'] ?? '',
            'general_situation' => $json['general_situation'] ?? '',
            'severity_level' => $json['severity_level'] ?? 'Medium',
            'difficulty' => $json['difficulty'] ?? 'Medium',
            'intended_participants' => $json['intended_participants'] ?? '',
            'injured_victims_count' => (int)($json['injured_victims_count'] ?? 0),
            'trapped_persons_count' => (int)($json['trapped_persons_count'] ?? 0),
            'infrastructure_damage' => $json['infrastructure_damage'] ?? '',
            'communication_status' => $json['communication_status'] ?? 'working',
            'learning_objectives' => $json['learning_objectives'] ?? '',
            'disaster_type' => $disasterType,
        ];
    }
}
