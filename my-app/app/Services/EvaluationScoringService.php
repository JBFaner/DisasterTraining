<?php

namespace App\Services;

use App\Models\AiScenarioAttempt;
use App\Models\EvaluationResult;
use App\Models\TrainingModule;
use Illuminate\Support\Facades\Log;

class EvaluationScoringService
{
    public const COMPETENCIES = [
        'knowledge',
        'decision_making',
        'emergency_response',
        'safety_awareness',
    ];

    public function passingScore(): float
    {
        return (float) config('evaluation.passing_score', 75);
    }

    public function createFromAttempt(AiScenarioAttempt $attempt): EvaluationResult
    {
        $attempt->loadMissing(['user', 'trainingModule.contents']);

        $existing = EvaluationResult::where('ai_scenario_attempt_id', $attempt->id)->first();
        if ($existing) {
            return $existing;
        }

        $questions = $attempt->generated_questions ?? [];
        $answers = $attempt->participant_answers ?? [];
        $total = count($questions);
        $correct = (int) $attempt->score;
        $wrong = max(0, $total - $correct);
        $percentage = (float) $attempt->percentage;
        $passed = $percentage >= $attempt->passingScore();
        $durationSeconds = null;

        if ($attempt->started_at && $attempt->completed_at) {
            $durationSeconds = max(0, (int) $attempt->started_at->diffInSeconds($attempt->completed_at));
        }

        $competencyScores = $this->computeCompetencyScores($questions, $answers);
        $rating = $this->overallStarRating($percentage);
        $feedback = $this->buildFeedback($attempt, $percentage, $passed, $competencyScores);
        $recommendations = $this->buildRecommendations($attempt, $passed, $competencyScores);

        return EvaluationResult::create([
            'participant_id' => $attempt->user_id,
            'training_module_id' => $attempt->training_module_id,
            'ai_scenario_attempt_id' => $attempt->id,
            'attempt_number' => $attempt->attempt_number,
            'duration_seconds' => $durationSeconds,
            'scenario_title' => $attempt->scenario_title,
            'difficulty' => $attempt->difficulty,
            'score' => $correct,
            'correct_answers' => $correct,
            'wrong_answers' => $wrong,
            'total_questions' => $total,
            'percentage' => $percentage,
            'rating' => $rating,
            'status' => $passed ? EvaluationResult::STATUS_PASSED : EvaluationResult::STATUS_NEEDS_IMPROVEMENT,
            'knowledge_score' => $competencyScores['knowledge'],
            'decision_making_score' => $competencyScores['decision_making'],
            'emergency_response_score' => $competencyScores['emergency_response'],
            'safety_awareness_score' => $competencyScores['safety_awareness'],
            'feedback' => $feedback,
            'recommendations' => $recommendations,
            'generated_questions' => $questions,
            'participant_answers' => $answers,
            'eligible_for_simulation' => $passed,
            'completed_at' => $attempt->completed_at ?? now(),
        ]);
    }

    /**
     * @param  array<int, array<string, mixed>>  $questions
     * @param  array<string, string>  $answers
     * @return array<string, int>
     */
    public function computeCompetencyScores(array $questions, array $answers): array
    {
        $totals = array_fill_keys(self::COMPETENCIES, 0);
        $correct = array_fill_keys(self::COMPETENCIES, 0);

        foreach ($questions as $question) {
            $competency = $this->normalizeCompetency($question['competency'] ?? 'knowledge');
            $number = (string) ($question['number'] ?? '');
            $expected = strtoupper((string) ($question['correct_answer'] ?? ''));
            $given = strtoupper((string) ($answers[$number] ?? ''));

            $totals[$competency]++;
            if ($given !== '' && $given === $expected) {
                $correct[$competency]++;
            }
        }

        $scores = [];
        foreach (self::COMPETENCIES as $key) {
            if ($totals[$key] === 0) {
                $scores[$key] = 3;
                continue;
            }
            $pct = ($correct[$key] / $totals[$key]) * 100;
            $scores[$key] = $this->percentageToStars($pct);
        }

        return $scores;
    }

    public function normalizeCompetency(?string $value): string
    {
        $normalized = strtolower(trim(str_replace([' ', '-'], '_', (string) $value)));

        return in_array($normalized, self::COMPETENCIES, true) ? $normalized : 'knowledge';
    }

    public function percentageToStars(float $percentage): int
    {
        if ($percentage >= 90) {
            return 5;
        }
        if ($percentage >= 75) {
            return 4;
        }
        if ($percentage >= 60) {
            return 3;
        }
        if ($percentage >= 40) {
            return 2;
        }

        return 1;
    }

    public function overallStarRating(float $percentage): int
    {
        return $this->percentageToStars($percentage);
    }

    /**
     * @param  array<string, int>  $competencyScores
     */
    public function buildFeedback(AiScenarioAttempt $attempt, float $percentage, bool $passed, array $competencyScores): string
    {
        try {
            $gemini = app(GeminiService::class);
            $weak = $this->weakestCompetencies($competencyScores);
            $weakText = implode(', ', array_map(fn ($k) => config("evaluation.competencies.{$k}", $k), $weak));

            $prompt = <<<PROMPT
Write 2-3 sentences of personalized feedback for a disaster preparedness trainee who completed an AI scenario quiz.
Training module: {$attempt->trainingModule->title}
Scenario: {$attempt->scenario_title}
Score: {$percentage}%
Status: {$passed} passed
Weakest areas: {$weakText}
Tone: professional, encouraging, specific. Do not use bullet points.
PROMPT;

            return trim($gemini->generateContentText($prompt));
        } catch (\Throwable $e) {
            Log::info('Using fallback evaluation feedback', ['error' => $e->getMessage()]);

            return $this->fallbackFeedback($attempt, $percentage, $passed, $competencyScores);
        }
    }

    /**
     * @param  array<string, int>  $competencyScores
     */
    protected function fallbackFeedback(AiScenarioAttempt $attempt, float $percentage, bool $passed, array $competencyScores): string
    {
        $module = $attempt->trainingModule->title ?? 'the training module';
        $weak = $this->weakestCompetencies($competencyScores);
        $weakLabels = array_map(fn ($k) => config("evaluation.competencies.{$k}", $k), $weak);

        if ($passed && $percentage >= 90) {
            return "Excellent work on {$module}. You demonstrated strong understanding across the scenario and are well prepared for simulation event participation.";
        }

        if ($passed) {
            $weakPhrase = $weakLabels ? ' Focus on improving '.implode(' and ', $weakLabels).' before your next drill.' : '';

            return "You demonstrated a good understanding of key disaster preparedness concepts in {$module}.{$weakPhrase} You may proceed to simulation event planning.";
        }

        $weakPhrase = $weakLabels ? implode(', ', $weakLabels) : 'core response procedures';

        return "You showed partial understanding of {$module}, but your score indicates areas for improvement in {$weakPhrase}. Review the related lessons and retake the AI scenario training before joining a simulation event.";
    }

    /**
     * @param  array<string, int>  $competencyScores
     * @return list<string>
     */
    protected function weakestCompetencies(array $competencyScores): array
    {
        $min = min($competencyScores);
        if ($min >= 4) {
            return [];
        }

        return array_keys(array_filter($competencyScores, fn ($score) => $score <= $min));
    }

    /**
     * @param  array<string, int>  $competencyScores
     * @return list<string>
     */
    public function buildRecommendations(AiScenarioAttempt $attempt, bool $passed, array $competencyScores): array
    {
        $recommendations = [];
        $module = $attempt->trainingModule;
        $contents = $module?->contents?->sortBy('sort_order') ?? collect();

        if (! $passed) {
            $recommendations[] = 'Retake AI Scenario Training';
        }

        foreach ($this->weakestCompetencies($competencyScores) as $competency) {
            $lesson = $this->suggestLessonForCompetency($contents, $competency);
            if ($lesson) {
                $recommendations[] = "Review: {$lesson}";
            }
        }

        if ($contents->count() >= 2 && ! $passed) {
            $mid = $contents->values()->get(min(4, $contents->count() - 1));
            if ($mid && ! in_array("Review: {$mid->title}", $recommendations, true)) {
                $recommendations[] = "Review: {$mid->title}";
            }
        }

        if ($passed) {
            $recommendations[] = 'Eligible for Simulation Event Planning';
        }

        return array_values(array_unique($recommendations));
    }

    protected function suggestLessonForCompetency($contents, string $competency): ?string
    {
        $keywords = match ($competency) {
            'decision_making' => ['decision', 'evacuation', 'plan', 'procedure'],
            'emergency_response' => ['response', 'emergency', 'drill', 'rescue'],
            'safety_awareness' => ['safety', 'hazard', 'prevention', 'awareness'],
            default => ['lesson', 'introduction', 'overview', 'basic'],
        };

        foreach ($contents as $content) {
            $haystack = strtolower($content->title.' '.strip_tags($content->body ?? ''));
            foreach ($keywords as $keyword) {
                if (str_contains($haystack, $keyword)) {
                    return $content->title;
                }
            }
        }

        $first = $contents->first();

        return $first?->title;
    }

    /**
     * @return array<string, mixed>
     */
    public function buildAnalyticsSummary(): array
    {
        $results = EvaluationResult::query()->with('trainingModule')->get();

        if ($results->isEmpty()) {
            return [
                'total_evaluations' => 0,
                'average_score' => 0,
                'highest_score' => 0,
                'lowest_score' => 0,
                'pass_rate' => 0,
                'participant_count' => 0,
                'by_module' => [],
                'pass_vs_failed' => ['passed' => 0, 'failed' => 0],
                'monthly_trend' => [],
                'top_modules' => [],
            ];
        }

        $passed = $results->where('status', EvaluationResult::STATUS_PASSED)->count();

        return [
            'total_evaluations' => $results->count(),
            'average_score' => round($results->avg('percentage'), 1),
            'highest_score' => round($results->max('percentage'), 1),
            'lowest_score' => round($results->min('percentage'), 1),
            'pass_rate' => round(($passed / max(1, $results->count())) * 100, 1),
            'participant_count' => $results->unique('participant_id')->count(),
            'by_module' => $results->groupBy('training_module_id')->map(function ($group) {
                return [
                    'module_id' => $group->first()->training_module_id,
                    'module_title' => $group->first()->trainingModule?->title ?? 'Unknown',
                    'average' => round($group->avg('percentage'), 1),
                    'count' => $group->count(),
                ];
            })->values()->all(),
            'pass_vs_failed' => [
                'passed' => $passed,
                'failed' => $results->count() - $passed,
            ],
            'monthly_trend' => $results
                ->filter(fn ($r) => $r->completed_at)
                ->groupBy(fn ($r) => $r->completed_at->format('Y-m'))
                ->map(fn ($group, $month) => [
                    'month' => $month,
                    'count' => $group->count(),
                    'average' => round($group->avg('percentage'), 1),
                ])
                ->sortKeys()
                ->values()
                ->all(),
            'top_modules' => $results->groupBy('training_module_id')
                ->map(fn ($group) => [
                    'module_title' => $group->first()->trainingModule?->title ?? 'Unknown',
                    'average' => round($group->avg('percentage'), 1),
                    'count' => $group->count(),
                ])
                ->sortByDesc('average')
                ->take(5)
                ->values()
                ->all(),
        ];
    }
}
