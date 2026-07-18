<?php

namespace App\Services;

use App\Models\EvaluationResult;
use App\Models\LessonQuizAttempt;
use App\Models\ParticipantEvaluation;
use App\Models\TrainingModule;
use App\Models\User;
use Illuminate\Http\Request;

class ParticipantEvaluationHubService
{
    public function __construct(
        private readonly EvaluationScoringService $scoringService,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function buildPayload(User $user, Request $request): array
    {
        $tab = $request->string('tab')->toString();
        if (! in_array($tab, ['overview', 'modules', 'events', 'lessons'], true)) {
            $tab = 'overview';
        }

        $filters = [
            'tab' => $tab,
            'search' => $request->string('search')->toString(),
            'status' => $request->string('status')->toString(),
            'training_module_id' => $request->string('training_module_id')->toString(),
            'date_from' => $request->string('date_from')->toString(),
            'date_to' => $request->string('date_to')->toString(),
        ];

        $modules = TrainingModule::query()
            ->where('status', 'published')
            ->orderBy('title')
            ->get(['id', 'title']);

        $moduleSummary = $this->moduleResultsQuery($user, $request);
        $eventSummary = $this->eventResultsQuery($user, $request);
        $lessonSummary = $this->lessonResultsQuery($user, $request);

        $perPage = 10;
        $moduleResults = null;
        $eventResults = null;
        $lessonResults = null;

        if ($tab === 'modules') {
            $moduleResults = $moduleSummary['query']->paginate($perPage)->withQueryString();
        } elseif ($tab === 'events') {
            $eventResults = $eventSummary['query']->paginate($perPage)->withQueryString();
        } elseif ($tab === 'lessons') {
            $lessonResults = $lessonSummary['query']->paginate($perPage)->withQueryString();
        }

        $recentModules = $this->mapModuleResults(
            $moduleSummary['query']->clone()->limit(5)->get()
        );
        $recentEvents = $this->mapEventResults(
            $eventSummary['query']->clone()->limit(5)->get()
        );
        $recentLessons = $this->mapLessonResults(
            $lessonSummary['query']->clone()->limit(5)->get()
        );

        return [
            'tab' => $tab,
            'filters' => $filters,
            'passing_score' => $this->scoringService->passingScore(),
            'summary' => [
                'module_count' => $moduleSummary['total'],
                'event_count' => $eventSummary['total'],
                'lesson_count' => $lessonSummary['total'],
                'module_passed' => $moduleSummary['passed'],
                'event_passed' => $eventSummary['passed'],
                'lesson_passed' => $lessonSummary['passed'],
            ],
            'modules' => $modules,
            'recent' => [
                'modules' => $recentModules,
                'events' => $recentEvents,
                'lessons' => $recentLessons,
            ],
            'module_results' => $moduleResults
                ? $this->mapModuleResults(collect($moduleResults->items()))
                : [],
            'event_results' => $eventResults
                ? $this->mapEventResults(collect($eventResults->items()))
                : [],
            'lesson_results' => $lessonResults
                ? $this->mapLessonResults(collect($lessonResults->items()))
                : [],
            'pagination' => [
                'modules' => $moduleResults ? $this->paginationMeta($moduleResults) : null,
                'events' => $eventResults ? $this->paginationMeta($eventResults) : null,
                'lessons' => $lessonResults ? $this->paginationMeta($lessonResults) : null,
            ],
        ];
    }

    /**
     * @return array{query: \Illuminate\Database\Eloquent\Builder, total: int, passed: int}
     */
    private function moduleResultsQuery(User $user, Request $request): array
    {
        $query = EvaluationResult::query()
            ->with(['trainingModule', 'aiScenarioAttempt'])
            ->where('participant_id', $user->id)
            ->orderByDesc('completed_at');

        $this->applySearch($request, $query, function ($builder, string $search) {
            $builder->where(function ($inner) use ($search) {
                $inner->where('scenario_title', 'like', "%{$search}%")
                    ->orWhereHas('trainingModule', fn ($q) => $q->where('title', 'like', "%{$search}%"));
            });
        });

        if ($request->filled('status')) {
            $status = $request->string('status')->toString();
            if ($status === 'passed') {
                $query->where('status', EvaluationResult::STATUS_PASSED);
            } elseif ($status === 'failed') {
                $query->where('status', EvaluationResult::STATUS_NEEDS_IMPROVEMENT);
            }
        }

        if ($request->filled('training_module_id')) {
            $query->where('training_module_id', $request->integer('training_module_id'));
        }

        $this->applyDateFilters($request, $query, 'completed_at');

        $total = (clone $query)->count();
        $passed = (clone $query)->where('status', EvaluationResult::STATUS_PASSED)->count();

        return compact('query', 'total', 'passed');
    }

    /**
     * @return array{query: \Illuminate\Database\Eloquent\Builder, total: int, passed: int}
     */
    private function eventResultsQuery(User $user, Request $request): array
    {
        $query = ParticipantEvaluation::query()
            ->with(['evaluation.simulationEvent', 'scores'])
            ->where('user_id', $user->id)
            ->whereNotNull('submitted_at')
            ->orderByDesc('submitted_at');

        $this->applySearch($request, $query, function ($builder, string $search) {
            $builder->whereHas('evaluation.simulationEvent', fn ($q) => $q->where('title', 'like', "%{$search}%"));
        });

        if ($request->filled('status')) {
            $status = $request->string('status')->toString();
            if ($status === 'passed') {
                $query->where('result', 'passed');
            } elseif ($status === 'failed') {
                $query->where('result', 'failed');
            }
        }

        if ($request->filled('training_module_id')) {
            $moduleId = $request->integer('training_module_id');
            $query->whereHas('evaluation.simulationEvent', fn ($q) => $q->where('training_module_id', $moduleId));
        }

        $this->applyDateFilters($request, $query, 'submitted_at');

        $total = (clone $query)->count();
        $passed = (clone $query)->where('result', 'passed')->count();

        return compact('query', 'total', 'passed');
    }

    /**
     * @return array{query: \Illuminate\Database\Eloquent\Builder, total: int, passed: int}
     */
    private function lessonResultsQuery(User $user, Request $request): array
    {
        $query = LessonQuizAttempt::query()
            ->with(['trainingModule', 'trainingContent'])
            ->where('user_id', $user->id)
            ->whereIn('status', [
                LessonQuizAttempt::STATUS_COMPLETED,
                LessonQuizAttempt::STATUS_EXPIRED,
            ])
            ->orderByDesc('completed_at')
            ->orderByDesc('id');

        $this->applySearch($request, $query, function ($builder, string $search) {
            $builder->where(function ($inner) use ($search) {
                $inner->whereHas('trainingModule', fn ($q) => $q->where('title', 'like', "%{$search}%"))
                    ->orWhereHas('trainingContent', fn ($q) => $q->where('title', 'like', "%{$search}%"));
            });
        });

        if ($request->filled('status')) {
            $status = $request->string('status')->toString();
            if ($status === 'passed') {
                $query->where('passed', true);
            } elseif ($status === 'failed') {
                $query->where('passed', false);
            }
        }

        if ($request->filled('training_module_id')) {
            $query->where('training_module_id', $request->integer('training_module_id'));
        }

        $this->applyDateFilters($request, $query, 'completed_at');

        $total = (clone $query)->count();
        $passed = (clone $query)->where('passed', true)->count();

        return compact('query', 'total', 'passed');
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     */
    private function applySearch(Request $request, $query, callable $callback): void
    {
        if (! $request->filled('search')) {
            return;
        }

        $search = $request->string('search')->trim();
        if ($search !== '') {
            $callback($query, $search);
        }
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     */
    private function applyDateFilters(Request $request, $query, string $column): void
    {
        if ($request->filled('date_from')) {
            $query->whereDate($column, '>=', $request->string('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate($column, '<=', $request->string('date_to'));
        }
    }

    /**
     * @param  \Illuminate\Support\Collection<int, EvaluationResult>  $results
     * @return list<array<string, mixed>>
     */
    private function mapModuleResults($results): array
    {
        return $results->map(function (EvaluationResult $result) {
            $durationSeconds = $result->duration_seconds;
            if ($durationSeconds === null && $result->aiScenarioAttempt?->started_at && $result->aiScenarioAttempt?->completed_at) {
                $durationSeconds = max(0, (int) $result->aiScenarioAttempt->started_at->diffInSeconds($result->aiScenarioAttempt->completed_at));
            }

            return [
                'id' => $result->id,
                'type' => 'module',
                'training_module' => $result->trainingModule ? [
                    'id' => $result->trainingModule->id,
                    'title' => $result->trainingModule->title,
                ] : null,
                'title' => $result->scenario_title ?: ($result->trainingModule?->title ?? 'AI Scenario Assessment'),
                'subtitle' => $result->trainingModule?->title,
                'difficulty' => $result->difficulty,
                'attempt_number' => $result->attempt_number,
                'score_label' => sprintf('%d/%d', (int) $result->correct_answers, (int) $result->total_questions),
                'percentage' => (float) $result->percentage,
                'status' => $result->status === EvaluationResult::STATUS_PASSED ? 'passed' : 'failed',
                'duration_seconds' => $durationSeconds,
                'completed_at' => $result->completed_at?->toIso8601String(),
                'view_url' => route('participant.evaluation-results.show', $result),
            ];
        })->values()->all();
    }

    /**
     * @param  \Illuminate\Support\Collection<int, ParticipantEvaluation>  $results
     * @return list<array<string, mixed>>
     */
    private function mapEventResults($results): array
    {
        return $results->map(function (ParticipantEvaluation $evaluation) {
            $event = $evaluation->evaluation?->simulationEvent;

            return [
                'id' => $evaluation->id,
                'type' => 'event',
                'simulation_event_id' => $event?->id,
                'title' => $event?->title ?? 'Simulation Event',
                'subtitle' => $event?->disaster_type,
                'event_date' => $event?->event_date?->toDateString(),
                'percentage' => $evaluation->average_score !== null ? (float) $evaluation->average_score : null,
                'status' => $evaluation->result === 'passed' ? 'passed' : 'failed',
                'competency_rating' => $evaluation->competency_rating,
                'eligible_for_certification' => (bool) $evaluation->is_eligible_for_certification,
                'criteria_scored' => $evaluation->scores->count(),
                'completed_at' => $evaluation->submitted_at?->toIso8601String(),
                'view_url' => $event?->id
                    ? route('participant.simulation-events.show', $event)
                    : null,
            ];
        })->values()->all();
    }

    /**
     * @param  \Illuminate\Support\Collection<int, LessonQuizAttempt>  $results
     * @return list<array<string, mixed>>
     */
    private function mapLessonResults($results): array
    {
        return $results->map(function (LessonQuizAttempt $attempt) {
            $totalQuestions = count($attempt->generated_questions ?? []);

            return [
                'id' => $attempt->id,
                'type' => 'lesson',
                'training_module' => $attempt->trainingModule ? [
                    'id' => $attempt->trainingModule->id,
                    'title' => $attempt->trainingModule->title,
                ] : null,
                'lesson' => $attempt->trainingContent ? [
                    'id' => $attempt->trainingContent->id,
                    'title' => $attempt->trainingContent->title,
                ] : null,
                'title' => $attempt->trainingContent?->title ?? 'Lesson Quiz',
                'subtitle' => $attempt->trainingModule?->title,
                'attempt_number' => $attempt->attempt_number,
                'score_label' => sprintf('%d/%d', (int) ($attempt->score ?? 0), $totalQuestions),
                'percentage' => $attempt->percentage !== null ? (float) $attempt->percentage : null,
                'status' => $attempt->passed ? 'passed' : ($attempt->status === LessonQuizAttempt::STATUS_EXPIRED ? 'expired' : 'failed'),
                'passing_score' => $attempt->passingScore(),
                'completed_at' => $attempt->completed_at?->toIso8601String(),
                'view_url' => route('participant.lesson-quiz-attempts.show', $attempt),
            ];
        })->values()->all();
    }

    /**
     * @param  \Illuminate\Contracts\Pagination\LengthAwarePaginator  $paginator
     * @return array<string, int>
     */
    private function paginationMeta($paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];
    }
}
