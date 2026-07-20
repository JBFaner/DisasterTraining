<?php

namespace App\Services;

use App\Models\AiScenarioAttempt;
use App\Models\Attendance;
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

        $attemptTrendsForRecent = $this->moduleAttemptTrends($user);
        $recentModules = $this->mapModuleResults(
            $moduleSummary['query']->clone()->limit(5)->get(),
            $attemptTrendsForRecent,
        );
        $recentEvents = $this->mapEventResults(
            $eventSummary['query']->clone()->limit(5)->get()
        );
        $recentLessons = $this->mapLessonResults(
            $lessonSummary['query']->clone()->limit(5)->get(),
            $user,
        );

        $attemptTrends = $this->moduleAttemptTrends($user);
        $pendingItems = $this->pendingItems($user);
        $focus = $request->string('focus')->toString();
        if ($focus === 'pending' && $tab === 'overview' && $pendingItems !== []) {
            $tab = 'overview';
        }

        return [
            'tab' => $tab,
            'focus' => in_array($focus, ['pending'], true) ? $focus : null,
            'filters' => $filters,
            'passing_score' => $this->scoringService->passingScore(),
            'pending_items' => $pendingItems,
            'export_urls' => [
                'portfolio_print' => route('participant.evaluations.portfolio', ['print' => 1]),
                'portfolio_download' => route('participant.evaluations.portfolio.download'),
            ],
            'summary' => [
                'module_count' => $moduleSummary['total'],
                'event_count' => $eventSummary['total'],
                'lesson_count' => $lessonSummary['total'],
                'total_count' => $moduleSummary['total'] + $eventSummary['total'] + $lessonSummary['total'],
                'pending_count' => count($pendingItems),
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
                ? $this->mapModuleResults(collect($moduleResults->items()), $attemptTrends)
                : [],
            'event_results' => $eventResults
                ? $this->mapEventResults(collect($eventResults->items()))
                : [],
            'lesson_results' => $lessonResults
                ? $this->mapLessonResults(collect($lessonResults->items()), $user)
                : [],
            'pagination' => [
                'modules' => $moduleResults ? $this->paginationMeta($moduleResults) : null,
                'events' => $eventResults ? $this->paginationMeta($eventResults) : null,
                'lessons' => $lessonResults ? $this->paginationMeta($lessonResults) : null,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function summaryCounts(User $user): array
    {
        $moduleSummary = $this->moduleResultsQuery($user, new Request);
        $eventSummary = $this->eventResultsQuery($user, new Request);
        $lessonSummary = $this->lessonResultsQuery($user, new Request);

        return [
            'module_count' => $moduleSummary['total'],
            'event_count' => $eventSummary['total'],
            'lesson_count' => $lessonSummary['total'],
            'total_count' => $moduleSummary['total'] + $eventSummary['total'] + $lessonSummary['total'],
            'module_passed' => $moduleSummary['passed'],
            'event_passed' => $eventSummary['passed'],
            'lesson_passed' => $lessonSummary['passed'],
            'pending_count' => count($this->pendingItems($user)),
        ];
    }

    /**
     * Dashboard deep link for the evaluations KPI card.
     */
    public function dashboardEvaluationsHref(User $user): string
    {
        $pending = $this->pendingItems($user);
        if ($pending !== []) {
            return route('participant.evaluations.index', ['focus' => 'pending']);
        }

        $counts = $this->summaryCounts($user);
        if (($counts['module_count'] ?? 0) > 0) {
            return route('participant.evaluations.index', ['tab' => 'modules']);
        }
        if (($counts['event_count'] ?? 0) > 0) {
            return route('participant.evaluations.index', ['tab' => 'events']);
        }
        if (($counts['lesson_count'] ?? 0) > 0) {
            return route('participant.evaluations.index', ['tab' => 'lessons']);
        }

        return route('participant.evaluations.index');
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function pendingItems(User $user): array
    {
        $items = [];

        AiScenarioAttempt::query()
            ->with('trainingModule:id,title')
            ->where('user_id', $user->id)
            ->where('status', AiScenarioAttempt::STATUS_IN_PROGRESS)
            ->orderByDesc('updated_at')
            ->get()
            ->each(function (AiScenarioAttempt $attempt) use (&$items) {
                $items[] = [
                    'id' => 'ai-attempt-'.$attempt->id,
                    'type' => 'module_assessment',
                    'title' => 'Resume AI scenario assessment',
                    'description' => ($attempt->trainingModule?->title ?? 'Training module').' · assessment in progress',
                    'href' => '/participant/ai-scenario-attempts/'.$attempt->id,
                    'action_label' => 'Resume',
                    'tab' => 'modules',
                ];
            });

        $latestByModule = EvaluationResult::query()
            ->with('trainingModule:id,title')
            ->where('participant_id', $user->id)
            ->orderByDesc('completed_at')
            ->get()
            ->unique('training_module_id');

        foreach ($latestByModule as $result) {
            if ($result->status !== EvaluationResult::STATUS_NEEDS_IMPROVEMENT) {
                continue;
            }

            $inProgress = AiScenarioAttempt::query()
                ->where('user_id', $user->id)
                ->where('training_module_id', $result->training_module_id)
                ->where('status', AiScenarioAttempt::STATUS_IN_PROGRESS)
                ->exists();

            if ($inProgress) {
                continue;
            }

            $items[] = [
                'id' => 'retry-module-'.$result->training_module_id,
                'type' => 'module_assessment',
                'title' => 'Retake module assessment',
                'description' => ($result->trainingModule?->title ?? 'Training module').' · last score '.number_format((float) $result->percentage, 1).'%',
                'href' => '/participant/training-modules/'.$result->training_module_id,
                'action_label' => 'Retake',
                'tab' => 'modules',
            ];
        }

        Attendance::query()
            ->with(['simulationEvent:id,title,status,event_date'])
            ->where('user_id', $user->id)
            ->whereIn('status', ['present', 'late', 'completed'])
            ->whereHas('simulationEvent', fn ($q) => $q->whereIn('status', ['ended', 'completed', 'archived']))
            ->orderByDesc('checked_in_at')
            ->get()
            ->each(function (Attendance $attendance) use (&$items) {
                $event = $attendance->simulationEvent;
                if (! $event) {
                    return;
                }

                $hasEvaluation = ParticipantEvaluation::query()
                    ->where('user_id', $attendance->user_id)
                    ->whereNotNull('submitted_at')
                    ->whereHas('evaluation', fn ($q) => $q->where('simulation_event_id', $event->id))
                    ->exists();

                if ($hasEvaluation) {
                    return;
                }

                $items[] = [
                    'id' => 'await-event-eval-'.$event->id,
                    'type' => 'event_drill',
                    'title' => 'Awaiting drill evaluation',
                    'description' => $event->title.' · attended, evaluation not posted yet',
                    'href' => '/participant/simulation-events/'.$event->id,
                    'action_label' => 'View event',
                    'tab' => 'events',
                ];
            });

        return $items;
    }

    /**
     * @return array<int, array<int, array<string, mixed>>>
     */
    public function moduleAttemptTrends(User $user): array
    {
        $results = EvaluationResult::query()
            ->with('trainingModule:id,title')
            ->where('participant_id', $user->id)
            ->orderBy('training_module_id')
            ->orderBy('attempt_number')
            ->orderBy('completed_at')
            ->get();

        $trends = [];

        foreach ($results->groupBy('training_module_id') as $moduleId => $attempts) {
            if ($attempts->count() < 2) {
                continue;
            }

            $moduleId = (int) $moduleId;
            $sorted = $attempts->sortBy(fn (EvaluationResult $r) => ($r->attempt_number ?? 0))->values();
            $trends[$moduleId] = [];

            for ($i = 1; $i < $sorted->count(); $i++) {
                $previous = $sorted[$i - 1];
                $current = $sorted[$i];
                $fromAttempt = (int) ($previous->attempt_number ?: $i);
                $toAttempt = (int) ($current->attempt_number ?: ($i + 1));
                $delta = round((float) $current->percentage - (float) $previous->percentage, 1);
                $direction = $delta > 0 ? 'improved' : ($delta < 0 ? 'declined' : 'unchanged');

                $trends[$moduleId][(int) $current->id] = [
                    'module_id' => $moduleId,
                    'module_title' => $current->trainingModule?->title,
                    'from_attempt' => $fromAttempt,
                    'to_attempt' => $toAttempt,
                    'from_percentage' => (float) $previous->percentage,
                    'to_percentage' => (float) $current->percentage,
                    'delta' => $delta,
                    'direction' => $direction,
                    'label' => $this->trendLabel($direction, $delta, $fromAttempt, $toAttempt),
                ];
            }
        }

        return $trends;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function attemptHistoryForResult(EvaluationResult $result): array
    {
        return EvaluationResult::query()
            ->where('participant_id', $result->participant_id)
            ->where('training_module_id', $result->training_module_id)
            ->orderBy('attempt_number')
            ->orderBy('completed_at')
            ->get()
            ->map(fn (EvaluationResult $row) => [
                'id' => $row->id,
                'attempt_number' => $row->attempt_number,
                'percentage' => (float) $row->percentage,
                'status' => $row->status === EvaluationResult::STATUS_PASSED ? 'passed' : 'failed',
                'completed_at' => $row->completed_at?->toIso8601String(),
                'is_current' => (int) $row->id === (int) $result->id,
            ])
            ->values()
            ->all();
    }

    private function trendLabel(string $direction, float $delta, int $fromAttempt, int $toAttempt): string
    {
        $abs = abs($delta);
        $arrow = match ($direction) {
            'improved' => 'Improved',
            'declined' => 'Declined',
            default => 'No change',
        };

        if ($direction === 'unchanged') {
            return "{$arrow} from attempt {$fromAttempt} → {$toAttempt}";
        }

        $sign = $delta > 0 ? '+' : '-';

        return "{$arrow} {$sign}{$abs}% from attempt {$fromAttempt} → {$toAttempt}";
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
    /**
     * @param  array<int, array<int, array<string, mixed>>>  $attemptTrends
     */
    private function mapModuleResults($results, array $attemptTrends = []): array
    {
        return $results->map(function (EvaluationResult $result) use ($attemptTrends) {
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
                'print_url' => route('participant.evaluation-results.show', $result).'?print=1',
                'trend' => $attemptTrends[(int) $result->training_module_id][(int) $result->id] ?? null,
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
                'view_url' => route('participant.event-evaluations.show', $evaluation),
                'print_url' => route('participant.event-evaluations.show', $evaluation).'?print=1',
            ];
        })->values()->all();
    }

    /**
     * @param  \Illuminate\Support\Collection<int, LessonQuizAttempt>  $results
     * @return list<array<string, mixed>>
     */
    private function mapLessonResults($results, User $user): array
    {
        $lessonTrends = $this->lessonAttemptTrends($user);

        return $results->map(function (LessonQuizAttempt $attempt) use ($lessonTrends) {
            $totalQuestions = count($attempt->generated_questions ?? []);
            $contentId = (int) $attempt->training_content_id;

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
                'trend' => $lessonTrends[$contentId][(int) $attempt->id] ?? null,
            ];
        })->values()->all();
    }

    /**
     * @return array<int, array<int, array<string, mixed>>>
     */
    private function lessonAttemptTrends(User $user): array
    {
        $attempts = LessonQuizAttempt::query()
            ->with(['trainingContent:id,title', 'trainingModule:id,title'])
            ->where('user_id', $user->id)
            ->whereIn('status', [LessonQuizAttempt::STATUS_COMPLETED, LessonQuizAttempt::STATUS_EXPIRED])
            ->whereNotNull('percentage')
            ->orderBy('training_content_id')
            ->orderBy('attempt_number')
            ->get();

        $trends = [];

        foreach ($attempts->groupBy('training_content_id') as $contentId => $rows) {
            if ($rows->count() < 2) {
                continue;
            }

            $contentId = (int) $contentId;
            $sorted = $rows->sortBy(fn (LessonQuizAttempt $a) => ($a->attempt_number ?? 0))->values();
            $trends[$contentId] = [];

            for ($i = 1; $i < $sorted->count(); $i++) {
                $previous = $sorted[$i - 1];
                $current = $sorted[$i];
                $fromAttempt = (int) ($previous->attempt_number ?: $i);
                $toAttempt = (int) ($current->attempt_number ?: ($i + 1));
                $delta = round((float) $current->percentage - (float) $previous->percentage, 1);
                $direction = $delta > 0 ? 'improved' : ($delta < 0 ? 'declined' : 'unchanged');

                $trends[$contentId][(int) $current->id] = [
                    'from_attempt' => $fromAttempt,
                    'to_attempt' => $toAttempt,
                    'delta' => $delta,
                    'direction' => $direction,
                    'label' => $this->trendLabel($direction, $delta, $fromAttempt, $toAttempt),
                ];
            }
        }

        return $trends;
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
