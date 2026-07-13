<?php

namespace App\Services;

use App\Models\Resource;
use App\Models\SimulationExerciseTemplate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SimulationExerciseTemplateAiService
{
    public function __construct(
        private readonly GeminiService $geminiService,
    ) {}

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    public function generateExercisePlan(array $input): array
    {
        $resources = $this->resourceCatalog();
        $prompt = $this->buildFullPlanPrompt($input, $resources);

        try {
            $text = $this->geminiService->generateContentText($prompt, [
                'temperature' => 0.4,
                'responseMimeType' => 'application/json',
            ]);

            return $this->normalizeGeneratedPlan($this->parseJsonResponse($text), $resources, $input);
        } catch (\Throwable $exception) {
            Log::warning('Exercise template AI plan fallback', ['error' => $exception->getMessage()]);

            return $this->fallbackPlan($input, $resources);
        }
    }

    /**
     * @param  array<string, mixed>  $input
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    public function regenerateSection(string $section, array $input, array $context = []): array
    {
        $resources = $this->resourceCatalog();
        $prompt = $this->buildSectionPrompt($section, $input, $context, $resources);

        try {
            $text = $this->geminiService->generateContentText($prompt, [
                'temperature' => 0.45,
                'responseMimeType' => 'application/json',
            ]);
            $parsed = $this->parseJsonResponse($text);

            return $this->normalizeSectionResult($section, $parsed, $resources, $input, $context);
        } catch (\Throwable $exception) {
            Log::warning('Exercise template AI section fallback', [
                'section' => $section,
                'error' => $exception->getMessage(),
            ]);

            return $this->fallbackSection($section, $input, $context, $resources);
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function resourceCatalog(): array
    {
        return Resource::query()
            ->orderBy('name')
            ->get(['id', 'name', 'category', 'available', 'quantity', 'status'])
            ->map(fn (Resource $resource) => [
                'id' => $resource->id,
                'name' => $resource->name,
                'category' => $resource->category,
                'available' => $resource->computeAvailableQuantity(),
            ])
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $input
     * @param  list<array<string, mixed>>  $resources
     */
    private function buildFullPlanPrompt(array $input, array $resources): string
    {
        $title = (string) ($input['title'] ?? '');
        $category = (string) ($input['category'] ?? 'Multi-Hazard');
        $exerciseType = (string) ($input['exercise_type'] ?? 'Drill');
        $targetDuration = $input['estimated_duration_minutes'] ?? null;
        $durationRule = $targetDuration
            ? "Target total duration: {$targetDuration} minutes. Activity durations should sum close to this target."
            : 'No target duration provided. Estimate realistic activity durations and return estimated_duration_minutes as their sum.';

        $resourceList = collect($resources)
            ->map(fn ($item) => "{$item['name']} (id: {$item['id']})")
            ->take(40)
            ->implode(', ');

        return <<<PROMPT
You are an LGU disaster preparedness exercise planning assistant in the Philippines.

Create a reusable simulation exercise template plan for:
- Exercise Title: {$title}
- Category: {$category}
- Exercise Type: {$exerciseType}
- {$durationRule}

Available inventory equipment (prefer matching names to these): {$resourceList}

Return ONLY valid JSON with this shape:
{
  "objectives": "string",
  "estimated_duration_minutes": number,
  "activities": [
    {
      "title": "string",
      "description": "string",
      "duration_minutes": number,
      "equipment": [{"name": "string", "required_quantity": number}]
    }
  ],
  "timeline_items": [
    {"start_time": "HH:MM", "label": "string", "description": "string", "activity_index": number|null}
  ],
  "personnel": [
    {"role": "string", "recommended_count": number, "notes": "string"}
  ],
  "scenario": {
    "scenario_summary": "string",
    "expected_hazards": "string",
    "learning_objectives": "string",
    "safety_reminders": "string"
  },
  "evaluation_objectives": [
    {"heading": "string", "activity_index": number|null, "objective_text": "string"}
  ]
}

Rules:
- Provide 5-8 practical activities including orientation and debriefing.
- Personnel roles: Lead Trainer, Safety Officer, Marshal, Medical Team, Evaluator, Communication Officer, Assistant Trainer where appropriate. Use recommended_count for staffing needs.
- Timeline should start around 08:00 and align with activities.
- Evaluation objectives must be measurable and linked to activities where possible.
- Use Philippine LGU/community disaster training context.
PROMPT;
    }

    /**
     * @param  array<string, mixed>  $input
     * @param  array<string, mixed>  $context
     * @param  list<array<string, mixed>>  $resources
     */
    private function buildSectionPrompt(string $section, array $input, array $context, array $resources): string
    {
        $title = (string) ($input['title'] ?? $context['title'] ?? '');
        $category = (string) ($input['category'] ?? $context['category'] ?? '');
        $exerciseType = (string) ($input['exercise_type'] ?? $context['exercise_type'] ?? '');
        $contextJson = json_encode($context, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        $resourceList = collect($resources)->pluck('name')->take(40)->implode(', ');

        $sectionShape = match ($section) {
            'objectives' => '{"objectives":"string"}',
            'activities' => '{"activities":[{"title":"string","description":"string","duration_minutes":number,"equipment":[{"name":"string","required_quantity":number}]}]}',
            'timeline' => '{"timeline_items":[{"start_time":"HH:MM","label":"string","description":"string","activity_index":number|null}]}',
            'personnel' => '{"personnel":[{"role":"string","recommended_count":number,"notes":"string"}]}',
            'equipment' => '{"activities":[{"title":"string","equipment":[{"name":"string","required_quantity":number}]}]}',
            'scenario' => '{"scenario":{"scenario_summary":"string","expected_hazards":"string","learning_objectives":"string","safety_reminders":"string"}}',
            'evaluation_objectives' => '{"evaluation_objectives":[{"heading":"string","activity_index":number|null,"objective_text":"string"}]}',
            default => throw new \InvalidArgumentException('Unsupported regeneration section.'),
        };

        return <<<PROMPT
Regenerate ONLY the "{$section}" section for this LGU disaster exercise template.

Exercise Title: {$title}
Category: {$category}
Exercise Type: {$exerciseType}
Inventory equipment names: {$resourceList}

Current template context:
{$contextJson}

Return ONLY valid JSON matching: {$sectionShape}
- For personnel sections, use roles from: Lead Trainer, Assistant Trainer, Safety Officer, Marshal, Medical Team, Evaluator, Communication Officer.
PROMPT;
    }

    /**
     * @return array<string, mixed>
     */
    private function parseJsonResponse(string $text): array
    {
        $text = trim($text);
        if (preg_match('/```(?:json)?\s*([\s\S]*?)```/i', $text, $matches)) {
            $text = trim($matches[1]);
        }

        if (preg_match('/\{[\s\S]*\}/', $text, $matches)) {
            $decoded = json_decode($matches[0], true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }

        throw new \RuntimeException('AI response did not contain valid JSON.');
    }

    /**
     * @param  array<string, mixed>  $parsed
     * @param  list<array<string, mixed>>  $resources
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    private function normalizeGeneratedPlan(array $parsed, array $resources, array $input): array
    {
        $activities = $this->normalizeActivities($parsed['activities'] ?? [], $resources);
        $estimated = (int) ($parsed['estimated_duration_minutes'] ?? 0);
        if ($estimated <= 0) {
            $estimated = collect($activities)->sum('duration_minutes');
        }

        $scenario = is_array($parsed['scenario'] ?? null) ? $parsed['scenario'] : [];

        return [
            'objectives' => trim((string) ($parsed['objectives'] ?? '')),
            'estimated_duration_minutes' => $estimated > 0 ? $estimated : null,
            'activities' => $activities,
            'timeline_items' => $this->normalizeTimeline($parsed['timeline_items'] ?? [], $activities),
            'personnel' => $this->normalizePersonnel($parsed['personnel'] ?? []),
            'scenario_summary' => trim((string) ($scenario['scenario_summary'] ?? '')),
            'expected_hazards' => trim((string) ($scenario['expected_hazards'] ?? '')),
            'learning_objectives' => trim((string) ($scenario['learning_objectives'] ?? '')),
            'safety_reminders' => trim((string) ($scenario['safety_reminders'] ?? '')),
            'evaluation_objectives' => $this->normalizeEvaluationObjectives($parsed['evaluation_objectives'] ?? [], $activities),
        ];
    }

    /**
     * @param  array<string, mixed>  $parsed
     * @param  list<array<string, mixed>>  $resources
     * @param  array<string, mixed>  $input
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    private function normalizeSectionResult(string $section, array $parsed, array $resources, array $input, array $context): array
    {
        $activities = $this->normalizeActivities($context['activities'] ?? [], $resources);

        return match ($section) {
            'objectives' => ['objectives' => trim((string) ($parsed['objectives'] ?? ''))],
            'activities' => [
                'activities' => $this->normalizeActivities($parsed['activities'] ?? [], $resources),
                'estimated_duration_minutes' => collect($this->normalizeActivities($parsed['activities'] ?? [], $resources))->sum('duration_minutes'),
            ],
            'timeline' => ['timeline_items' => $this->normalizeTimeline($parsed['timeline_items'] ?? [], $activities)],
            'personnel' => ['personnel' => $this->normalizePersonnel($parsed['personnel'] ?? [])],
            'equipment' => [
                'activities' => $this->mergeEquipmentIntoActivities($activities, $parsed['activities'] ?? [], $resources),
            ],
            'scenario' => $this->normalizeScenarioOnly($parsed['scenario'] ?? $parsed),
            'evaluation_objectives' => [
                'evaluation_objectives' => $this->normalizeEvaluationObjectives(
                    $parsed['evaluation_objectives'] ?? [],
                    $activities,
                ),
            ],
            default => [],
        };
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @param  list<array<string, mixed>>  $resources
     * @return list<array<string, mixed>>
     */
    private function normalizeActivities(array $rows, array $resources): array
    {
        return collect($rows)
            ->filter(fn ($row) => is_array($row) && trim((string) ($row['title'] ?? '')) !== '')
            ->values()
            ->map(function (array $row, int $index) use ($resources) {
                $equipment = collect($row['equipment'] ?? [])
                    ->filter(fn ($item) => is_array($item))
                    ->map(function (array $item) use ($resources) {
                        $match = $this->matchResource((string) ($item['name'] ?? ''), $resources);

                        return [
                            'resource_id' => $match['id'] ?? null,
                            'resource_name' => $match['name'] ?? (string) ($item['name'] ?? ''),
                            'required_quantity' => max(1, (int) ($item['required_quantity'] ?? 1)),
                            'available_quantity' => $match['available'] ?? null,
                            'availability_status' => $match['status'] ?? null,
                        ];
                    })
                    ->filter(fn ($item) => $item['resource_id'] || $item['resource_name'])
                    ->values()
                    ->all();

                return [
                    'title' => trim((string) $row['title']),
                    'description' => trim((string) ($row['description'] ?? '')),
                    'duration_minutes' => max(1, (int) ($row['duration_minutes'] ?? 15)),
                    'sort_order' => $index + 1,
                    'equipment' => $equipment,
                ];
            })
            ->all();
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @param  list<array<string, mixed>>  $activities
     * @return list<array<string, mixed>>
     */
    private function normalizeTimeline(array $rows, array $activities): array
    {
        return collect($rows)
            ->filter(fn ($row) => is_array($row) && trim((string) ($row['label'] ?? '')) !== '')
            ->values()
            ->map(function (array $row, int $index) use ($activities) {
                $activityIndex = $row['activity_index'] ?? null;
                $activityTitle = is_numeric($activityIndex) && isset($activities[(int) $activityIndex])
                    ? $activities[(int) $activityIndex]['title']
                    : null;

                return [
                    'start_time' => (string) ($row['start_time'] ?? '08:00'),
                    'label' => trim((string) $row['label']),
                    'description' => trim((string) ($row['description'] ?? '')),
                    'activity_index' => is_numeric($activityIndex) ? (int) $activityIndex : null,
                    'activity_title' => $activityTitle,
                    'sort_order' => $index + 1,
                ];
            })
            ->all();
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return list<array<string, mixed>>
     */
    private function normalizePersonnel(array $rows): array
    {
        $allowedRoles = SimulationExerciseTemplate::PERSONNEL_ROLES;

        return collect($rows)
            ->filter(fn ($row) => is_array($row))
            ->values()
            ->map(function (array $row, int $index) use ($allowedRoles) {
                $role = trim((string) ($row['role'] ?? ''));
                if (! in_array($role, $allowedRoles, true)) {
                    $role = $allowedRoles[0];
                }

                return [
                    'role' => $role,
                    'qualified_trainer_id' => null,
                    'recommended_count' => max(1, (int) ($row['recommended_count'] ?? 1)),
                    'notes' => trim((string) ($row['notes'] ?? '')),
                    'sort_order' => $index + 1,
                ];
            })
            ->all();
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @param  list<array<string, mixed>>  $activities
     * @return list<array<string, mixed>>
     */
    private function normalizeEvaluationObjectives(array $rows, array $activities): array
    {
        return collect($rows)
            ->filter(fn ($row) => is_array($row) && trim((string) ($row['objective_text'] ?? '')) !== '')
            ->values()
            ->map(function (array $row, int $index) use ($activities) {
                $activityIndex = $row['activity_index'] ?? null;
                $activityTitle = is_numeric($activityIndex) && isset($activities[(int) $activityIndex])
                    ? $activities[(int) $activityIndex]['title']
                    : null;

                return [
                    'heading' => trim((string) ($row['heading'] ?? $activityTitle ?? '')),
                    'objective_text' => trim((string) $row['objective_text']),
                    'activity_index' => is_numeric($activityIndex) ? (int) $activityIndex : null,
                    'activity_title' => $activityTitle,
                    'sort_order' => $index + 1,
                ];
            })
            ->all();
    }

    /**
     * @param  array<string, mixed>  $scenario
     * @return array<string, string>
     */
    private function normalizeScenarioOnly(array $scenario): array
    {
        return [
            'scenario_summary' => trim((string) ($scenario['scenario_summary'] ?? '')),
            'expected_hazards' => trim((string) ($scenario['expected_hazards'] ?? '')),
            'learning_objectives' => trim((string) ($scenario['learning_objectives'] ?? '')),
            'safety_reminders' => trim((string) ($scenario['safety_reminders'] ?? '')),
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $existingActivities
     * @param  list<array<string, mixed>>  $equipmentRows
     * @param  list<array<string, mixed>>  $resources
     * @return list<array<string, mixed>>
     */
    private function mergeEquipmentIntoActivities(array $existingActivities, array $equipmentRows, array $resources): array
    {
        if ($equipmentRows === []) {
            return $existingActivities;
        }

        return collect($existingActivities)
            ->map(function (array $activity, int $index) use ($equipmentRows, $resources) {
                $match = collect($equipmentRows)->first(function ($row) use ($activity, $index) {
                    if (! is_array($row)) {
                        return false;
                    }
                    $title = strtolower(trim((string) ($row['title'] ?? '')));
                    $activityTitle = strtolower(trim((string) ($activity['title'] ?? '')));

                    return $title === $activityTitle || ($title === '' && $index === 0);
                });

                if (! is_array($match)) {
                    return $activity;
                }

                $equipment = collect($match['equipment'] ?? [])
                    ->filter(fn ($item) => is_array($item))
                    ->map(function (array $item) use ($resources) {
                        $resource = $this->matchResource((string) ($item['name'] ?? ''), $resources);

                        return [
                            'resource_id' => $resource['id'] ?? null,
                            'resource_name' => $resource['name'] ?? (string) ($item['name'] ?? ''),
                            'required_quantity' => max(1, (int) ($item['required_quantity'] ?? 1)),
                            'available_quantity' => $resource['available'] ?? null,
                            'availability_status' => $resource['status'] ?? null,
                        ];
                    })
                    ->values()
                    ->all();

                $activity['equipment'] = $equipment;

                return $activity;
            })
            ->all();
    }

    /**
     * @param  list<array<string, mixed>>  $resources
     * @return array<string, mixed>|null
     */
    private function matchResource(string $name, array $resources): ?array
    {
        $needle = strtolower(trim($name));
        if ($needle === '') {
            return null;
        }

        foreach ($resources as $resource) {
            $candidate = strtolower((string) ($resource['name'] ?? ''));
            if ($candidate === $needle || str_contains($candidate, $needle) || str_contains($needle, $candidate)) {
                return [
                    'id' => $resource['id'],
                    'name' => $resource['name'],
                    'available' => $resource['available'] ?? null,
                    'status' => $resource['status'] ?? null,
                ];
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $input
     * @param  list<array<string, mixed>>  $resources
     * @return array<string, mixed>
     */
    private function fallbackPlan(array $input, array $resources): array
    {
        $category = (string) ($input['category'] ?? 'Multi-Hazard');
        $title = (string) ($input['title'] ?? "{$category} Exercise");

        $activities = [
            ['title' => 'Safety Orientation', 'description' => 'Brief participants on hazards and exercise flow.', 'duration_minutes' => 15, 'equipment' => []],
            ['title' => 'Skill Demonstration', 'description' => "Practical {$category} response demonstration.", 'duration_minutes' => 30, 'equipment' => []],
            ['title' => 'Applied Drill', 'description' => 'Hands-on drill applying demonstrated skills.', 'duration_minutes' => 35, 'equipment' => []],
            ['title' => 'Debriefing', 'description' => 'Review performance and lessons learned.', 'duration_minutes' => 15, 'equipment' => []],
        ];

        return [
            'objectives' => "Develop practical {$category} response skills for community responders through structured demonstration and drill activities.",
            'estimated_duration_minutes' => (int) ($input['estimated_duration_minutes'] ?? 95),
            'activities' => $this->normalizeActivities($activities, $resources),
            'timeline_items' => $this->normalizeTimeline([
                ['start_time' => '08:00', 'label' => 'Registration', 'description' => 'Participant check-in', 'activity_index' => null],
                ['start_time' => '08:20', 'label' => 'Orientation', 'description' => 'Safety briefing', 'activity_index' => 0],
                ['start_time' => '08:40', 'label' => 'Demonstration', 'description' => 'Core skill demo', 'activity_index' => 1],
                ['start_time' => '09:20', 'label' => 'Drill', 'description' => 'Applied exercise', 'activity_index' => 2],
                ['start_time' => '10:00', 'label' => 'Debriefing', 'description' => 'After-action review', 'activity_index' => 3],
            ], $activities),
            'personnel' => $this->normalizePersonnel([
                ['role' => 'Lead Trainer', 'recommended_count' => 1, 'notes' => 'Facilitates exercise'],
                ['role' => 'Safety Officer', 'recommended_count' => 1, 'notes' => 'Monitors hazards'],
                ['role' => 'Evaluator', 'recommended_count' => 2, 'notes' => 'Scores participant performance'],
            ]),
            'scenario_summary' => "{$title} prepares participants to respond effectively to {$category} scenarios in a community setting.",
            'expected_hazards' => "{$category} related hazards appropriate to the local community context.",
            'learning_objectives' => 'Demonstrate safe response procedures and coordinated community actions.',
            'safety_reminders' => 'Use PPE, maintain safe distances, and follow marshal instructions at all times.',
            'evaluation_objectives' => $this->normalizeEvaluationObjectives([
                ['heading' => 'Applied Drill', 'activity_index' => 2, 'objective_text' => 'Followed established response procedures'],
                ['heading' => 'Applied Drill', 'activity_index' => 2, 'objective_text' => 'Maintained communication with team leader'],
            ], $activities),
        ];
    }

    /**
     * @param  array<string, mixed>  $input
     * @param  array<string, mixed>  $context
     * @param  list<array<string, mixed>>  $resources
     * @return array<string, mixed>
     */
    private function fallbackSection(string $section, array $input, array $context, array $resources): array
    {
        $plan = $this->fallbackPlan($input, $resources);

        return $this->normalizeSectionResult($section, $plan, $resources, $input, $context);
    }
}
