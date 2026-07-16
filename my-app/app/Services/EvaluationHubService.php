<?php

namespace App\Services;

use App\Models\AiScenarioAttempt;
use App\Models\CampaignRegistration;
use App\Models\CampaignRequest;
use App\Models\EvaluationResult;
use App\Models\LessonQuizAttempt;
use App\Models\TrainingModule;
use App\Models\User;
use App\Services\TrainingResetService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EvaluationHubService
{
    public function __construct(
        private readonly EvaluationScoringService $scoringService,
        private readonly TrainingResetService $trainingResetService,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function moduleResultsPayload(Request $request, User $user): array
    {
        $query = EvaluationResult::query()
            ->with(['participant', 'trainingModule.aiScenarioConfig', 'aiScenarioAttempt'])
            ->orderByDesc('completed_at');

        if ($user->role === 'PARTICIPANT') {
            $query->where('participant_id', $user->id);
        }

        if ($request->filled('search')) {
            $search = $request->string('search')->trim();
            $query->where(function ($builder) use ($search) {
                $builder->where('scenario_title', 'like', "%{$search}%")
                    ->orWhereHas('participant', fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"))
                    ->orWhereHas('trainingModule', fn ($q) => $q->where('title', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $status = $request->string('status')->toString();
            if ($status === 'failed') {
                $query->where('status', EvaluationResult::STATUS_NEEDS_IMPROVEMENT);
            } elseif ($status === 'passed') {
                $query->where('status', EvaluationResult::STATUS_PASSED);
            } elseif ($status === 'in_progress') {
                $query->whereExists(function ($sub) {
                    $sub->select(DB::raw(1))
                        ->from('ai_scenario_attempts')
                        ->whereColumn('ai_scenario_attempts.user_id', 'evaluation_results.participant_id')
                        ->whereColumn('ai_scenario_attempts.training_module_id', 'evaluation_results.training_module_id')
                        ->where('ai_scenario_attempts.status', AiScenarioAttempt::STATUS_IN_PROGRESS);
                });
            } else {
                $query->where('status', $status);
            }
        }

        if ($request->filled('training_module_id')) {
            $query->where('training_module_id', $request->integer('training_module_id'));
        }

        if ($request->filled('attempt_number')) {
            $query->where('attempt_number', $request->integer('attempt_number'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('completed_at', '>=', $request->string('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('completed_at', '<=', $request->string('date_to'));
        }

        $results = $query->paginate(15)->withQueryString();
        $isAdmin = $user->role === 'LGU_ADMIN';

        $resultItems = collect($results->items())->map(function (EvaluationResult $result) use ($isAdmin) {
            $data = $result->toArray();
            $data['can_reset'] = $isAdmin && $this->trainingResetService->canResetEvaluation($result);

            return $data;
        })->all();

        $modules = TrainingModule::query()
            ->where('status', 'published')
            ->orderBy('title')
            ->get(['id', 'title']);

        $attemptNumbers = EvaluationResult::query()
            ->when($user->role === 'PARTICIPANT', fn ($q) => $q->where('participant_id', $user->id))
            ->whereNotNull('attempt_number')
            ->distinct()
            ->orderBy('attempt_number')
            ->pluck('attempt_number')
            ->filter()
            ->values();

        return [
            'evaluation_results' => $resultItems,
            'evaluation_results_pagination' => [
                'current_page' => $results->currentPage(),
                'last_page' => $results->lastPage(),
                'per_page' => $results->perPage(),
                'total' => $results->total(),
            ],
            'evaluation_analytics' => $user->role === 'PARTICIPANT'
                ? null
                : $this->scoringService->buildAnalyticsSummary(),
            'evaluation_modules' => $modules,
            'evaluation_attempt_numbers' => $attemptNumbers,
            'evaluation_filters' => [
                'tab' => 'modules',
                'search' => $request->string('search')->toString(),
                'status' => $request->string('status')->toString(),
                'training_module_id' => $request->string('training_module_id')->toString(),
                'attempt_number' => $request->string('attempt_number')->toString(),
                'date_from' => $request->string('date_from')->toString(),
                'date_to' => $request->string('date_to')->toString(),
            ],
            'evaluation_passing_score' => $this->scoringService->passingScore(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function lessonQuizPayload(Request $request): array
    {
        $query = LessonQuizAttempt::query()
            ->with(['user', 'trainingModule', 'trainingContent', 'config'])
            ->whereIn('status', [
                LessonQuizAttempt::STATUS_COMPLETED,
                LessonQuizAttempt::STATUS_EXPIRED,
                LessonQuizAttempt::STATUS_IN_PROGRESS,
            ])
            ->orderByDesc('completed_at')
            ->orderByDesc('id');

        if ($request->filled('search')) {
            $search = $request->string('search')->trim();
            $query->where(function ($builder) use ($search) {
                $builder->whereHas('user', fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"))
                    ->orWhereHas('trainingModule', fn ($q) => $q->where('title', 'like', "%{$search}%"))
                    ->orWhereHas('trainingContent', fn ($q) => $q->where('title', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $status = $request->string('status')->toString();
            if ($status === 'passed') {
                $query->where('passed', true);
            } elseif ($status === 'failed') {
                $query->where('status', LessonQuizAttempt::STATUS_COMPLETED)
                    ->where('passed', false);
            } elseif ($status === 'in_progress') {
                $query->where('status', LessonQuizAttempt::STATUS_IN_PROGRESS);
            } elseif ($status === 'expired') {
                $query->where('status', LessonQuizAttempt::STATUS_EXPIRED);
            }
        }

        if ($request->filled('training_module_id')) {
            $query->where('training_module_id', $request->integer('training_module_id'));
        }

        if ($request->filled('participant_name')) {
            $participantName = $request->string('participant_name')->trim();
            $query->whereHas('user', fn ($q) => $q->where('name', 'like', "%{$participantName}%"));
        }

        if ($request->filled('batch_filter') || $request->filled('campaign_request_id')) {
            $batchId = $request->integer('batch_filter') ?: $request->integer('campaign_request_id');
            if ($batchId > 0) {
                $query->whereHas('user.campaignRegistrations', function ($q) use ($batchId) {
                    $q->where('campaign_request_id', $batchId)
                        ->where('registration_status', CampaignRegistration::STATUS_REGISTERED);
                });
            }
        }

        if ($request->filled('training_content_id')) {
            $query->where('training_content_id', $request->integer('training_content_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('completed_at', '>=', $request->string('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('completed_at', '<=', $request->string('date_to'));
        }

        $attempts = $query->paginate(15)->withQueryString();

        $attemptItems = collect($attempts->items())->map(function (LessonQuizAttempt $attempt) {
            return [
                'id' => $attempt->id,
                'participant' => $attempt->user ? [
                    'id' => $attempt->user->id,
                    'name' => $attempt->user->name,
                    'email' => $attempt->user->email,
                ] : null,
                'training_module' => $attempt->trainingModule ? [
                    'id' => $attempt->trainingModule->id,
                    'title' => $attempt->trainingModule->title,
                ] : null,
                'lesson' => $attempt->trainingContent ? [
                    'id' => $attempt->trainingContent->id,
                    'title' => $attempt->trainingContent->title,
                ] : null,
                'attempt_number' => $attempt->attempt_number,
                'status' => $attempt->status,
                'score' => $attempt->score,
                'total_questions' => count($attempt->generated_questions ?? []),
                'percentage' => $attempt->percentage,
                'passed' => (bool) $attempt->passed,
                'passing_score' => $attempt->passingScore(),
                'started_at' => $attempt->started_at?->toIso8601String(),
                'completed_at' => $attempt->completed_at?->toIso8601String(),
            ];
        })->all();

        $modules = TrainingModule::query()
            ->where('status', 'published')
            ->orderBy('title')
            ->get(['id', 'title']);

        $batches = $this->buildBatchOptions($request->integer('training_module_id') ?: null);

        return [
            'lesson_quiz_attempts' => $attemptItems,
            'lesson_quiz_pagination' => [
                'current_page' => $attempts->currentPage(),
                'last_page' => $attempts->lastPage(),
                'per_page' => $attempts->perPage(),
                'total' => $attempts->total(),
            ],
            'lesson_quiz_analytics' => $this->lessonQuizAnalytics(),
            'lesson_quiz_modules' => $modules,
            'lesson_quiz_batches' => $batches,
            'lesson_quiz_filters' => [
                'tab' => 'lessons',
                'search' => $request->string('search')->toString(),
                'status' => $request->string('status')->toString(),
                'training_module_id' => $request->string('training_module_id')->toString(),
                'training_content_id' => $request->string('training_content_id')->toString(),
                'participant_name' => $request->string('participant_name')->toString(),
                'batch_filter' => $request->string('batch_filter')->toString() ?: $request->string('campaign_request_id')->toString(),
                'date_from' => $request->string('date_from')->toString(),
                'date_to' => $request->string('date_to')->toString(),
            ],
        ];
    }

    /**
     * @return list<array{id: int, training_module_id: int, label: string, module_title: ?string}>
     */
    protected function buildBatchOptions(?int $moduleId = null): array
    {
        $query = CampaignRequest::query()
            ->with('trainingModule:id,title')
            ->whereIn('id', CampaignRegistration::query()
                ->where('registration_status', CampaignRegistration::STATUS_REGISTERED)
                ->distinct()
                ->pluck('campaign_request_id'));

        if ($moduleId) {
            $query->where('training_module_id', $moduleId);
        }

        return $query->orderByDesc('id')
            ->get()
            ->map(function (CampaignRequest $request) {
                $label = trim((string) ($request->proposed_session_label ?? ''));
                if ($label === '') {
                    $label = $request->session_index
                        ? 'Batch '.$request->session_index.' (Campaign #'.$request->id.')'
                        : 'Batch / Campaign #'.$request->id;
                }

                return [
                    'id' => (int) $request->id,
                    'training_module_id' => (int) $request->training_module_id,
                    'label' => $label,
                    'module_title' => $request->trainingModule?->title,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function lessonQuizAnalytics(): array
    {
        $completed = LessonQuizAttempt::query()
            ->where('status', LessonQuizAttempt::STATUS_COMPLETED);

        $total = (clone $completed)->count();
        $passed = (clone $completed)->where('passed', true)->count();
        $failed = max(0, $total - $passed);
        $average = (float) ((clone $completed)->avg('percentage') ?? 0);
        $inProgress = LessonQuizAttempt::query()
            ->where('status', LessonQuizAttempt::STATUS_IN_PROGRESS)
            ->count();

        $byModule = DB::table('lesson_quiz_attempts')
            ->join('training_modules', 'training_modules.id', '=', 'lesson_quiz_attempts.training_module_id')
            ->where('lesson_quiz_attempts.status', LessonQuizAttempt::STATUS_COMPLETED)
            ->groupBy('lesson_quiz_attempts.training_module_id', 'training_modules.title')
            ->select(
                'lesson_quiz_attempts.training_module_id as module_id',
                'training_modules.title as module_title',
                DB::raw('ROUND(AVG(lesson_quiz_attempts.percentage), 1) as average'),
                DB::raw('COUNT(*) as attempts'),
            )
            ->orderByDesc('attempts')
            ->get()
            ->map(fn ($row) => [
                'module_id' => (int) $row->module_id,
                'module_title' => $row->module_title,
                'average' => (float) $row->average,
                'attempts' => (int) $row->attempts,
            ])
            ->values()
            ->all();

        return [
            'total_attempts' => $total + $inProgress,
            'completed_attempts' => $total,
            'in_progress' => $inProgress,
            'passed' => $passed,
            'failed' => $failed,
            'pass_rate' => $total > 0 ? round(($passed / $total) * 100, 1) : 0,
            'average_score' => round($average, 1),
            'by_module' => $byModule,
        ];
    }

    /**
     * Combined pass overview across lesson quizzes, final scenario evaluation, and simulation events.
     *
     * @return array<string, mixed>
     */
    public function overallPayload(Request $request): array
    {
        $moduleId = $request->filled('training_module_id')
            ? $request->integer('training_module_id')
            : null;

        $lessonPassedQuery = LessonQuizAttempt::query()
            ->with(['user:id,name,email', 'trainingModule:id,title', 'trainingContent:id,title'])
            ->where('status', LessonQuizAttempt::STATUS_COMPLETED)
            ->where('passed', true)
            ->when($moduleId, fn ($q) => $q->where('training_module_id', $moduleId))
            ->orderByDesc('completed_at');

        $scenarioPassedQuery = EvaluationResult::query()
            ->with(['participant:id,name,email', 'trainingModule:id,title'])
            ->where('status', EvaluationResult::STATUS_PASSED)
            ->when($moduleId, fn ($q) => $q->where('training_module_id', $moduleId))
            ->orderByDesc('completed_at');

        $simulationPassedQuery = \App\Models\ParticipantEvaluation::query()
            ->with([
                'user:id,name,email',
                'evaluation.simulationEvent:id,title,event_date',
            ])
            ->where('result', 'passed')
            ->whereNotNull('submitted_at')
            ->orderByDesc('submitted_at');

        $lessonPassed = (clone $lessonPassedQuery)->limit(50)->get()->map(function (LessonQuizAttempt $attempt) {
            return [
                'participant_id' => $attempt->user_id,
                'participant_name' => $attempt->user?->name,
                'participant_email' => $attempt->user?->email,
                'module_title' => $attempt->trainingModule?->title,
                'lesson_title' => $attempt->trainingContent?->title,
                'percentage' => $attempt->percentage,
                'completed_at' => $attempt->completed_at?->toIso8601String(),
            ];
        })->values()->all();

        $scenarioPassed = (clone $scenarioPassedQuery)->limit(50)->get()->map(function (EvaluationResult $result) {
            return [
                'participant_id' => $result->participant_id,
                'participant_name' => $result->participant?->name,
                'participant_email' => $result->participant?->email,
                'module_title' => $result->trainingModule?->title,
                'score' => $result->percentage ?? $result->score,
                'completed_at' => $result->completed_at?->toIso8601String(),
            ];
        })->values()->all();

        $simulationPassed = (clone $simulationPassedQuery)->limit(50)->get()->map(function ($pe) {
            $event = $pe->evaluation?->simulationEvent;

            return [
                'participant_id' => $pe->user_id,
                'participant_name' => $pe->user?->name,
                'participant_email' => $pe->user?->email,
                'event_title' => $event?->title,
                'average_score' => $pe->average_score,
                'eligible_for_certification' => (bool) $pe->is_eligible_for_certification,
                'submitted_at' => $pe->submitted_at?->toIso8601String(),
            ];
        })->values()->all();

        $lessonPassedCount = (clone $lessonPassedQuery)->distinct('user_id')->count('user_id');
        $scenarioPassedCount = (clone $scenarioPassedQuery)->distinct('participant_id')->count('participant_id');
        $simulationPassedCount = (clone $simulationPassedQuery)->distinct('user_id')->count('user_id');

        $modules = TrainingModule::query()
            ->where('status', 'published')
            ->orderBy('title')
            ->get(['id', 'title']);

        return [
            'overall_summary' => [
                'lesson_quiz_passed' => $lessonPassedCount,
                'final_scenario_passed' => $scenarioPassedCount,
                'simulation_event_passed' => $simulationPassedCount,
                'lesson_quiz_attempts_passed' => (clone $lessonPassedQuery)->count(),
                'final_scenario_results_passed' => (clone $scenarioPassedQuery)->count(),
                'simulation_event_results_passed' => (clone $simulationPassedQuery)->count(),
            ],
            'overall_lesson_passed' => $lessonPassed,
            'overall_scenario_passed' => $scenarioPassed,
            'overall_simulation_passed' => $simulationPassed,
            'overall_modules' => $modules,
            'overall_filters' => [
                'tab' => 'overall',
                'training_module_id' => $request->string('training_module_id')->toString(),
            ],
        ];
    }
}
