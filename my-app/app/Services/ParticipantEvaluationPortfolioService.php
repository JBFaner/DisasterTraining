<?php

namespace App\Services;

use App\Models\EvaluationResult;
use App\Models\LessonQuizAttempt;
use App\Models\ParticipantEvaluation;
use App\Models\User;
use Carbon\Carbon;

class ParticipantEvaluationPortfolioService
{
    public function __construct(
        private readonly ParticipantEvaluationHubService $hubService,
        private readonly EvaluationScoringService $scoringService,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function buildPortfolio(User $user): array
    {
        $passingScore = $this->scoringService->passingScore();
        $summary = $this->hubService->summaryCounts($user);
        $trends = $this->hubService->moduleAttemptTrends($user);

        $modules = EvaluationResult::query()
            ->with(['trainingModule'])
            ->where('participant_id', $user->id)
            ->orderByDesc('completed_at')
            ->get()
            ->map(fn (EvaluationResult $result) => $this->mapModuleRow($result, $trends, $passingScore))
            ->values()
            ->all();

        $events = ParticipantEvaluation::query()
            ->with(['evaluation.simulationEvent'])
            ->where('user_id', $user->id)
            ->whereNotNull('submitted_at')
            ->orderByDesc('submitted_at')
            ->get()
            ->map(fn (ParticipantEvaluation $evaluation) => [
                'title' => $evaluation->evaluation?->simulationEvent?->title ?? 'Simulation Event',
                'event_date' => $evaluation->evaluation?->simulationEvent?->event_date?->toDateString(),
                'percentage' => $evaluation->average_score !== null ? (float) $evaluation->average_score : null,
                'result' => $evaluation->result,
                'competency_rating' => $evaluation->competency_rating,
                'submitted_at' => $evaluation->submitted_at?->toIso8601String(),
            ])
            ->values()
            ->all();

        $lessons = LessonQuizAttempt::query()
            ->with(['trainingModule', 'trainingContent'])
            ->where('user_id', $user->id)
            ->whereIn('status', [
                LessonQuizAttempt::STATUS_COMPLETED,
                LessonQuizAttempt::STATUS_EXPIRED,
            ])
            ->orderByDesc('completed_at')
            ->get()
            ->map(fn (LessonQuizAttempt $attempt) => [
                'module_title' => $attempt->trainingModule?->title,
                'lesson_title' => $attempt->trainingContent?->title ?? 'Lesson Quiz',
                'attempt_number' => $attempt->attempt_number,
                'percentage' => $attempt->percentage !== null ? (float) $attempt->percentage : null,
                'passed' => (bool) $attempt->passed,
                'completed_at' => $attempt->completed_at?->toIso8601String(),
            ])
            ->values()
            ->all();

        return [
            'generated_at' => now()->toIso8601String(),
            'passing_score' => $passingScore,
            'participant' => [
                'name' => $user->name,
                'email' => $user->email,
                'participant_id' => $user->participant_id,
            ],
            'summary' => $summary,
            'module_assessments' => $modules,
            'event_drills' => $events,
            'lesson_quizzes' => $lessons,
            'attempt_trends' => collect($trends)
                ->flatMap(fn (array $byResult) => array_values($byResult))
                ->values()
                ->all(),
        ];
    }

    /**
     * @param  array<int, array<int, array<string, mixed>>>  $trends
     * @return array<string, mixed>
     */
    private function mapModuleRow(EvaluationResult $result, array $trends, float $passingScore): array
    {
        $moduleId = (int) $result->training_module_id;
        $trend = $trends[$moduleId][$result->id] ?? null;

        return [
            'module_title' => $result->trainingModule?->title ?? 'Training Module',
            'scenario_title' => $result->scenario_title,
            'attempt_number' => $result->attempt_number,
            'percentage' => (float) $result->percentage,
            'status' => $result->status === EvaluationResult::STATUS_PASSED ? 'passed' : 'failed',
            'passing_score' => $passingScore,
            'completed_at' => $result->completed_at?->toIso8601String(),
            'trend' => $trend,
        ];
    }

    /**
     * @param  array<string, mixed>  $portfolio
     */
    public function renderText(array $portfolio): string
    {
        $lines = [];
        $generatedAt = isset($portfolio['generated_at'])
            ? Carbon::parse($portfolio['generated_at'])->timezone(config('app.timezone'))->format('M j, Y g:i A')
            : now()->format('M j, Y g:i A');

        $lines[] = 'LGU Disaster Training — Evaluation Portfolio Summary';
        $lines[] = 'Generated: '.$generatedAt;
        $lines[] = '';
        $lines[] = 'Participant: '.($portfolio['participant']['name'] ?? 'Participant');
        if (! empty($portfolio['participant']['email'])) {
            $lines[] = 'Email: '.$portfolio['participant']['email'];
        }
        if (! empty($portfolio['participant']['participant_id'])) {
            $lines[] = 'Participant ID: '.$portfolio['participant']['participant_id'];
        }

        $summary = $portfolio['summary'] ?? [];
        $lines[] = '';
        $lines[] = 'Summary';
        $lines[] = str_repeat('-', 40);
        $lines[] = 'Module assessments: '.($summary['module_count'] ?? 0).' ('.($summary['module_passed'] ?? 0).' passed)';
        $lines[] = 'Event drills: '.($summary['event_count'] ?? 0).' ('.($summary['event_passed'] ?? 0).' passed)';
        $lines[] = 'Lesson quizzes: '.($summary['lesson_count'] ?? 0).' ('.($summary['lesson_passed'] ?? 0).' passed)';
        $lines[] = 'Passing score: '.($portfolio['passing_score'] ?? 75).'%';

        if (! empty($portfolio['attempt_trends'])) {
            $lines[] = '';
            $lines[] = 'Attempt Trends';
            $lines[] = str_repeat('-', 40);
            foreach ($portfolio['attempt_trends'] as $trend) {
                $lines[] = ($trend['module_title'] ?? 'Module').': '.$trend['label'];
            }
        }

        $lines[] = '';
        $lines[] = 'Module Assessments (AI Scenario)';
        $lines[] = str_repeat('=', 50);
        foreach ($portfolio['module_assessments'] ?? [] as $row) {
            $lines[] = ($row['module_title'] ?? 'Module').' — Attempt #'.($row['attempt_number'] ?? '?');
            $lines[] = '  Score: '.number_format($row['percentage'] ?? 0, 1).'% · '.ucfirst($row['status'] ?? 'unknown');
            if (! empty($row['trend']['label'])) {
                $lines[] = '  Trend: '.$row['trend']['label'];
            }
            $lines[] = '  Completed: '.$this->formatDate($row['completed_at'] ?? null);
            $lines[] = '';
        }

        $lines[] = 'Event Drill Evaluations';
        $lines[] = str_repeat('=', 50);
        foreach ($portfolio['event_drills'] ?? [] as $row) {
            $lines[] = ($row['title'] ?? 'Event').' — '.ucfirst($row['result'] ?? 'recorded');
            $lines[] = '  Score: '.($row['percentage'] !== null ? number_format($row['percentage'], 1).'%' : '—');
            $lines[] = '  Evaluated: '.$this->formatDate($row['submitted_at'] ?? null);
            $lines[] = '';
        }

        $lines[] = 'Lesson Quizzes';
        $lines[] = str_repeat('=', 50);
        foreach ($portfolio['lesson_quizzes'] ?? [] as $row) {
            $lines[] = ($row['lesson_title'] ?? 'Lesson').' ('.($row['module_title'] ?? 'Module').')';
            $lines[] = '  Score: '.($row['percentage'] !== null ? number_format($row['percentage'], 1).'%' : '—')
                .' · '.($row['passed'] ? 'Passed' : 'Failed');
            $lines[] = '  Completed: '.$this->formatDate($row['completed_at'] ?? null);
            $lines[] = '';
        }

        return implode("\n", $lines);
    }

    private function formatDate(?string $value): string
    {
        if (! $value) {
            return '—';
        }

        return Carbon::parse($value)->timezone(config('app.timezone'))->format('M j, Y g:i A');
    }
}
