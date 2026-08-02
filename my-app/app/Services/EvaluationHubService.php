<?php

namespace App\Services;

use App\Models\AiScenarioAttempt;
use App\Models\CampaignRegistration;
use App\Models\CampaignRequest;
use App\Models\EvaluationResult;
use App\Models\LessonQuizAttempt;
use App\Models\TrainingContent;
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
        // Results rows are only created on completion — in-progress must come from attempts.
        if ($request->string('status')->toString() === 'in_progress') {
            return $this->inProgressScenarioResultsPayload($request, $user);
        }

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
            } elseif ($status === 'completed') {
                $query->whereIn('status', [
                    EvaluationResult::STATUS_PASSED,
                    EvaluationResult::STATUS_NEEDS_IMPROVEMENT,
                ]);
            } elseif ($status === 'in_progress') {
                // Handled by inProgressScenarioResultsPayload earlier.
                $query->where('status', $status);
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

        $results = $query->paginate(10)->withQueryString();
        $isAdmin = $user->role === 'LGU_ADMIN';

        $resultItems = collect($results->items())->map(function (EvaluationResult $result) use ($isAdmin) {
            $data = $result->toArray();
            $data['can_reset'] = $isAdmin && $this->trainingResetService->canResetEvaluation($result);
            $data['detail_href'] = '/admin/evaluations/results/'.$result->id;

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
                'from' => $results->firstItem(),
                'to' => $results->lastItem(),
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
     * In-progress AI scenario attempts (no EvaluationResult yet).
     *
     * @return array<string, mixed>
     */
    protected function inProgressScenarioResultsPayload(Request $request, User $user): array
    {
        $query = AiScenarioAttempt::query()
            ->with(['user', 'trainingModule'])
            ->where('status', AiScenarioAttempt::STATUS_IN_PROGRESS)
            ->orderByDesc('last_activity_at')
            ->orderByDesc('id');

        if ($user->role === 'PARTICIPANT') {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('search')) {
            $search = $request->string('search')->trim();
            $query->where(function ($builder) use ($search) {
                $builder->where('scenario_title', 'like', "%{$search}%")
                    ->orWhere('title_en', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"))
                    ->orWhereHas('trainingModule', fn ($q) => $q->where('title', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('training_module_id')) {
            $query->where('training_module_id', $request->integer('training_module_id'));
        }

        if ($request->filled('attempt_number')) {
            $query->where('attempt_number', $request->integer('attempt_number'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('started_at', '>=', $request->string('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('started_at', '<=', $request->string('date_to'));
        }

        $attempts = $query->paginate(10)->withQueryString();

        $resultItems = collect($attempts->items())->map(function (AiScenarioAttempt $attempt) {
            return [
                'id' => 'in-progress-'.$attempt->id,
                'participant_id' => $attempt->user_id,
                'participant' => $attempt->user ? [
                    'id' => $attempt->user->id,
                    'name' => $attempt->user->name,
                    'email' => $attempt->user->email,
                ] : null,
                'training_module' => $attempt->trainingModule ? [
                    'id' => $attempt->trainingModule->id,
                    'title' => $attempt->trainingModule->title,
                ] : null,
                'scenario_title' => $attempt->scenario_title ?: ($attempt->title_en ?: 'In-progress scenario'),
                'difficulty' => $attempt->difficulty,
                'attempt_number' => $attempt->attempt_number,
                'correct_answers' => null,
                'total_questions' => $attempt->number_of_questions,
                'percentage' => null,
                'status' => 'in_progress',
                'completed_at' => null,
                'can_reset' => false,
                'is_in_progress' => true,
                'ai_scenario_attempt' => [
                    'id' => $attempt->id,
                    'attempt_number' => $attempt->attempt_number,
                ],
            ];
        })->all();


        $modules = TrainingModule::query()
            ->where('status', 'published')
            ->orderBy('title')
            ->get(['id', 'title']);

        $attemptNumbers = AiScenarioAttempt::query()
            ->when($user->role === 'PARTICIPANT', fn ($q) => $q->where('user_id', $user->id))
            ->where('status', AiScenarioAttempt::STATUS_IN_PROGRESS)
            ->whereNotNull('attempt_number')
            ->distinct()
            ->orderBy('attempt_number')
            ->pluck('attempt_number')
            ->filter()
            ->values();

        return [
            'evaluation_results' => $resultItems,
            'evaluation_results_pagination' => [
                'current_page' => $attempts->currentPage(),
                'last_page' => $attempts->lastPage(),
                'per_page' => $attempts->perPage(),
                'total' => $attempts->total(),
                'from' => $attempts->firstItem(),
                'to' => $attempts->lastItem(),
            ],
            'evaluation_analytics' => $user->role === 'PARTICIPANT'
                ? null
                : $this->scoringService->buildAnalyticsSummary(),
            'evaluation_modules' => $modules,
            'evaluation_attempt_numbers' => $attemptNumbers,
            'evaluation_filters' => [
                'tab' => 'modules',
                'search' => $request->string('search')->toString(),
                'status' => 'in_progress',
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
    /**
     * Participant-centric lesson quiz monitoring (scores by lesson, not raw attempt rows).
     *
     * @return array<string, mixed>
     */
    public function lessonQuizPayload(Request $request): array
    {
        $filtered = LessonQuizAttempt::query()
            ->whereIn('status', [
                LessonQuizAttempt::STATUS_COMPLETED,
                LessonQuizAttempt::STATUS_EXPIRED,
                LessonQuizAttempt::STATUS_IN_PROGRESS,
            ]);

        if ($request->filled('search')) {
            $search = $request->string('search')->trim();
            $filtered->where(function ($builder) use ($search) {
                $builder->whereHas('user', fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"))
                    ->orWhereHas('trainingModule', fn ($q) => $q->where('title', 'like', "%{$search}%"))
                    ->orWhereHas('trainingContent', fn ($q) => $q->where('title', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $status = $request->string('status')->toString();
            if ($status === 'completed' || $status === 'passed') {
                $filtered->where('status', LessonQuizAttempt::STATUS_COMPLETED);
            } elseif ($status === 'failed') {
                $filtered->where('status', LessonQuizAttempt::STATUS_COMPLETED)->where('passed', false);
            } elseif ($status === 'in_progress') {
                $filtered->where('status', LessonQuizAttempt::STATUS_IN_PROGRESS);
            } elseif ($status === 'expired') {
                $filtered->where('status', LessonQuizAttempt::STATUS_EXPIRED);
            }
        }

        if ($request->filled('training_module_id')) {
            $filtered->where('training_module_id', $request->integer('training_module_id'));
        }

        if ($request->filled('participant_name')) {
            $participantName = $request->string('participant_name')->trim();
            $filtered->whereHas('user', fn ($q) => $q->where('name', 'like', "%{$participantName}%"));
        }

        if ($request->filled('batch_filter') || $request->filled('campaign_request_id')) {
            $batchId = $request->integer('batch_filter') ?: $request->integer('campaign_request_id');
            if ($batchId > 0) {
                $filtered->whereHas('user.campaignRegistrations', function ($q) use ($batchId) {
                    $q->where('campaign_request_id', $batchId)
                        ->where('registration_status', CampaignRegistration::STATUS_REGISTERED);
                });
            }
        }

        if ($request->filled('training_content_id')) {
            $filtered->where('training_content_id', $request->integer('training_content_id'));
        }

        if ($request->filled('date_from')) {
            $filtered->whereDate('completed_at', '>=', $request->string('date_from'));
        }

        if ($request->filled('date_to')) {
            $filtered->whereDate('completed_at', '<=', $request->string('date_to'));
        }

        $groupedSub = (clone $filtered)
            ->select('user_id', 'training_module_id')
            ->selectRaw('MAX(COALESCE(completed_at, started_at, created_at)) as last_activity_at')
            ->groupBy('user_id', 'training_module_id');

        $pairs = DB::query()
            ->fromSub($groupedSub->toBase(), 'lq_participant_rows')
            ->orderByDesc('last_activity_at')
            ->paginate(10)
            ->withQueryString();

        $moduleIds = collect($pairs->items())->pluck('training_module_id')->unique()->filter()->values();
        $userIds = collect($pairs->items())->pluck('user_id')->unique()->filter()->values();

        $users = User::query()->whereIn('id', $userIds->all() ?: [0])->get(['id', 'name', 'email'])->keyBy('id');
        $modulesById = TrainingModule::query()->whereIn('id', $moduleIds->all() ?: [0])->get(['id', 'title'])->keyBy('id');

        $lessonsByModule = TrainingContent::query()
            ->whereIn('training_module_id', $moduleIds->all() ?: [0])
            ->whereHas('lessonQuizConfig', fn ($q) => $q->where('is_enabled', true))
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get(['id', 'title', 'training_module_id', 'sort_order'])
            ->groupBy('training_module_id');

        $attemptsByPair = LessonQuizAttempt::query()
            ->whereIn('user_id', $userIds->all() ?: [0])
            ->whereIn('training_module_id', $moduleIds->all() ?: [0])
            ->whereIn('status', [
                LessonQuizAttempt::STATUS_COMPLETED,
                LessonQuizAttempt::STATUS_EXPIRED,
                LessonQuizAttempt::STATUS_IN_PROGRESS,
            ])
            ->orderByDesc('attempt_number')
            ->orderByDesc('id')
            ->get()
            ->groupBy(fn (LessonQuizAttempt $a) => $a->user_id.'-'.$a->training_module_id);

        // Latest registered campaign batch per user + module (for table Batch column).
        $batchesByPair = CampaignRegistration::query()
            ->with(['campaignRequest:id,proposed_session_label,session_index'])
            ->whereIn('user_id', $userIds->all() ?: [0])
            ->whereIn('training_module_id', $moduleIds->all() ?: [0])
            ->where('registration_status', CampaignRegistration::STATUS_REGISTERED)
            ->orderByDesc('registered_at')
            ->orderByDesc('id')
            ->get()
            ->unique(fn (CampaignRegistration $reg) => $reg->user_id.'-'.$reg->training_module_id)
            ->keyBy(fn (CampaignRegistration $reg) => $reg->user_id.'-'.$reg->training_module_id);

        $participantRows = collect($pairs->items())->map(function ($pair) use ($users, $modulesById, $lessonsByModule, $attemptsByPair, $batchesByPair) {
            $userId = (int) $pair->user_id;
            $moduleId = (int) $pair->training_module_id;
            $user = $users->get($userId);
            $module = $modulesById->get($moduleId);
            $lessons = $lessonsByModule->get($moduleId, collect());
            $attempts = $attemptsByPair->get($userId.'-'.$moduleId, collect())
                ->unique('training_content_id')
                ->keyBy('training_content_id');
            $registration = $batchesByPair->get($userId.'-'.$moduleId);
            $batchLabel = $this->formatBatchLabel($registration?->campaignRequest);

            $lessonScores = $lessons->values()->map(function (TrainingContent $lesson, int $index) use ($attempts) {
                $attempt = $attempts->get($lesson->id);
                $label = 'L'.($index + 1);
                if (preg_match('/Lesson\s+(\d+)/i', (string) $lesson->title, $match)) {
                    $label = 'L'.$match[1];
                }

                return [
                    'lesson_id' => $lesson->id,
                    'label' => $label,
                    'title' => $lesson->title,
                    'attempt_id' => $attempt?->id,
                    'score' => $attempt?->score,
                    'total_questions' => $attempt ? count($attempt->generated_questions ?? []) : null,
                    'percentage' => $attempt?->percentage,
                    'passed' => $attempt ? (bool) $attempt->passed : null,
                    'status' => $attempt?->status,
                ];
            })->values()->all();

            $completed = collect($lessonScores)->filter(fn ($row) => $row['status'] === LessonQuizAttempt::STATUS_COMPLETED);
            $passedCount = $completed->where('passed', true)->count();
            $totalLessons = count($lessonScores);
            $completedCount = $completed->count();
            $progressStatus = ($totalLessons > 0 && $completedCount >= $totalLessons)
                ? 'completed'
                : 'in_progress';

            return [
                'participant' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ] : null,
                'training_module' => $module ? [
                    'id' => $module->id,
                    'title' => $module->title,
                ] : null,
                'batch' => $registration ? [
                    'id' => (int) $registration->campaign_request_id,
                    'label' => $batchLabel,
                ] : null,
                'batch_label' => $registration ? $batchLabel : null,
                'lesson_scores' => $lessonScores,
                'passed_lessons' => $passedCount,
                'completed_lessons' => $completedCount,
                'total_lessons' => $totalLessons,
                'progress_status' => $progressStatus,
                'detail_href' => '/admin/evaluations/lesson-quizzes/participants/'.$userId.'?training_module_id='.$moduleId,
            ];
        })->values()->all();

        $modules = TrainingModule::query()
            ->where('status', 'published')
            ->orderBy('title')
            ->get(['id', 'title']);

        $lessonsQuery = TrainingContent::query()
            ->whereHas('lessonQuizConfig', fn ($q) => $q->where('is_enabled', true))
            ->orderBy('training_module_id')
            ->orderBy('sort_order')
            ->orderBy('id');

        if ($request->filled('training_module_id')) {
            $lessonsQuery->where('training_module_id', $request->integer('training_module_id'));
        }

        $lessons = $lessonsQuery->get(['id', 'title', 'training_module_id', 'sort_order']);
        $batches = $this->buildBatchOptions($request->integer('training_module_id') ?: null);

        $columnLessons = $lessons;
        if (! $request->filled('training_module_id') || $columnLessons->isEmpty()) {
            $primaryModuleId = $moduleIds->first()
                ?: TrainingModule::query()->where('title', 'Fire Safety and Emergency Response')->value('id')
                ?: $modules->first()?->id;
            if ($primaryModuleId) {
                $columnLessons = TrainingContent::query()
                    ->where('training_module_id', $primaryModuleId)
                    ->whereHas('lessonQuizConfig', fn ($q) => $q->where('is_enabled', true))
                    ->orderBy('sort_order')
                    ->orderBy('id')
                    ->get(['id', 'title', 'training_module_id', 'sort_order']);
            }
        }

        $lessonColumns = $columnLessons->values()->map(function (TrainingContent $lesson, int $index) {
            $label = 'L'.($index + 1);
            if (preg_match('/Lesson\s+(\d+)/i', (string) $lesson->title, $match)) {
                $label = 'L'.$match[1];
            }

            return [
                'lesson_id' => $lesson->id,
                'label' => $label,
                'title' => $lesson->title,
            ];
        })->all();

        return [
            'lesson_quiz_attempts' => $participantRows,
            'lesson_quiz_pagination' => [
                'current_page' => $pairs->currentPage(),
                'last_page' => $pairs->lastPage(),
                'per_page' => $pairs->perPage(),
                'total' => $pairs->total(),
                'from' => $pairs->firstItem(),
                'to' => $pairs->lastItem(),
            ],
            'lesson_quiz_analytics' => $this->lessonQuizAnalytics(),
            'lesson_quiz_modules' => $modules,
            'lesson_quiz_lessons' => $lessons,
            'lesson_quiz_lesson_columns' => $lessonColumns,
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
     * Participant lesson quiz score sheet (Lessons 1–N) for admin review.
     *
     * @return array<string, mixed>
     */
    public function participantLessonQuizDetail(User $participant, ?int $moduleId = null): array
    {
        $module = $moduleId
            ? TrainingModule::query()->find($moduleId)
            : TrainingModule::query()
                ->where('title', 'Fire Safety and Emergency Response')
                ->first()
                ?? TrainingModule::query()->orderBy('id')->first();

        abort_unless($module, 404, 'Training module not found.');

        $lessons = TrainingContent::query()
            ->where('training_module_id', $module->id)
            ->whereHas('lessonQuizConfig', fn ($q) => $q->where('is_enabled', true))
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get(['id', 'title', 'training_module_id', 'sort_order']);

        $attempts = LessonQuizAttempt::query()
            ->where('user_id', $participant->id)
            ->where('training_module_id', $module->id)
            ->whereIn('status', [
                LessonQuizAttempt::STATUS_COMPLETED,
                LessonQuizAttempt::STATUS_EXPIRED,
                LessonQuizAttempt::STATUS_IN_PROGRESS,
            ])
            ->orderByDesc('attempt_number')
            ->orderByDesc('id')
            ->get()
            ->unique('training_content_id')
            ->keyBy('training_content_id');

        $registration = CampaignRegistration::query()
            ->with(['campaignRequest:id,proposed_session_label,session_index'])
            ->where('user_id', $participant->id)
            ->where('training_module_id', $module->id)
            ->where('registration_status', CampaignRegistration::STATUS_REGISTERED)
            ->orderByDesc('registered_at')
            ->orderByDesc('id')
            ->first();
        $batchLabel = $registration ? $this->formatBatchLabel($registration->campaignRequest) : null;

        $rows = $lessons->values()->map(function (TrainingContent $lesson, int $index) use ($attempts) {
            $attempt = $attempts->get($lesson->id);
            $label = 'Lesson '.($index + 1);
            if (preg_match('/Lesson\s+(\d+)/i', (string) $lesson->title, $match)) {
                $label = 'Lesson '.$match[1];
            }

            return [
                'lesson_id' => $lesson->id,
                'label' => $label,
                'title' => $lesson->title,
                'attempt_id' => $attempt?->id,
                'attempt_number' => $attempt?->attempt_number,
                'score' => $attempt?->score,
                'total_questions' => $attempt ? count($attempt->generated_questions ?? []) : null,
                'percentage' => $attempt?->percentage,
                'passed' => $attempt ? (bool) $attempt->passed : null,
                'status' => $attempt?->status,
                'completed_at' => $attempt?->completed_at?->toIso8601String(),
                'detail_href' => $attempt ? '/admin/evaluations/lesson-quiz-attempts/'.$attempt->id : null,
            ];
        })->values()->all();

        return [
            'participant' => [
                'id' => $participant->id,
                'name' => $participant->name,
                'email' => $participant->email,
            ],
            'training_module' => [
                'id' => $module->id,
                'title' => $module->title,
            ],
            'batch' => $registration ? [
                'id' => (int) $registration->campaign_request_id,
                'label' => $batchLabel,
            ] : null,
            'batch_label' => $batchLabel,
            'lessons' => $rows,
            'back_href' => '/admin/evaluations?tab=lessons',
        ];
    }


    protected function formatBatchLabel(?CampaignRequest $request): string
    {
        if (! $request) {
            return '—';
        }

        $label = trim((string) ($request->proposed_session_label ?? ''));
        if ($label !== '') {
            return $label;
        }

        $session = $request->session_index;
        if ($session !== null && $session !== '') {
            return 'Batch '.$session.' (Campaign #'.$request->id.')';
        }

        return 'Batch / Campaign #'.$request->id;
    }

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
                return [
                    'id' => (int) $request->id,
                    'training_module_id' => (int) $request->training_module_id,
                    'label' => $this->formatBatchLabel($request),
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

        $attemptCounts = DB::table('lesson_quiz_attempts')
            ->select('training_content_id', DB::raw('COUNT(*) as attempts'))
            ->whereIn('status', [
                LessonQuizAttempt::STATUS_COMPLETED,
                LessonQuizAttempt::STATUS_EXPIRED,
                LessonQuizAttempt::STATUS_IN_PROGRESS,
            ])
            ->groupBy('training_content_id')
            ->pluck('attempts', 'training_content_id');

        $byLesson = TrainingContent::query()
            ->whereHas('lessonQuizConfig', fn ($q) => $q->where('is_enabled', true))
            ->orderBy('training_module_id')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get(['id', 'title', 'training_module_id', 'sort_order'])
            ->map(fn (TrainingContent $lesson) => [
                'lesson_id' => (int) $lesson->id,
                'lesson_title' => $lesson->title,
                'module_id' => (int) $lesson->training_module_id,
                'attempts' => (int) ($attemptCounts[$lesson->id] ?? 0),
            ])
            ->values()
            ->all();

        $lessonsWithAttempts = collect($byLesson)->where('attempts', '>', 0)->count();
        $lessonsWithoutAttempts = collect($byLesson)->where('attempts', '=', 0)->count();

        return [
            'total_attempts' => $total + $inProgress,
            'completed_attempts' => $total,
            'in_progress' => $inProgress,
            'passed' => $passed,
            'failed' => $failed,
            'pass_rate' => $total > 0 ? round(($passed / $total) * 100, 1) : 0,
            'average_score' => round($average, 1),
            'by_module' => $byModule,
            'by_lesson' => $byLesson,
            'lessons_with_attempts' => $lessonsWithAttempts,
            'lessons_without_attempts' => $lessonsWithoutAttempts,
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
        $search = $request->filled('search')
            ? $request->string('search')->trim()->toString()
            : '';
        $participantName = $request->filled('participant_name')
            ? $request->string('participant_name')->trim()->toString()
            : '';

        $lessonPassedQuery = LessonQuizAttempt::query()
            ->with(['user:id,name,email', 'trainingModule:id,title', 'trainingContent:id,title'])
            ->where('status', LessonQuizAttempt::STATUS_COMPLETED)
            ->where('passed', true)
            ->when($moduleId, fn ($q) => $q->where('training_module_id', $moduleId))
            ->when($participantName !== '', fn ($q) => $q->whereHas(
                'user',
                fn ($userQuery) => $userQuery->where('name', 'like', "%{$participantName}%")
            ))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($builder) use ($search) {
                    $builder->whereHas('user', fn ($userQuery) => $userQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%"))
                        ->orWhereHas('trainingModule', fn ($moduleQuery) => $moduleQuery->where('title', 'like', "%{$search}%"))
                        ->orWhereHas('trainingContent', fn ($lessonQuery) => $lessonQuery->where('title', 'like', "%{$search}%"));
                });
            })
            ->orderByDesc('completed_at');

        $scenarioPassedQuery = EvaluationResult::query()
            ->with(['participant:id,name,email', 'trainingModule:id,title'])
            ->where('status', EvaluationResult::STATUS_PASSED)
            ->when($moduleId, fn ($q) => $q->where('training_module_id', $moduleId))
            ->when($participantName !== '', fn ($q) => $q->whereHas(
                'participant',
                fn ($userQuery) => $userQuery->where('name', 'like', "%{$participantName}%")
            ))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($builder) use ($search) {
                    $builder->whereHas('participant', fn ($userQuery) => $userQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%"))
                        ->orWhereHas('trainingModule', fn ($moduleQuery) => $moduleQuery->where('title', 'like', "%{$search}%"))
                        ->orWhere('scenario_title', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('completed_at');

        $simulationPassedQuery = \App\Models\ParticipantEvaluation::query()
            ->with([
                'user:id,name,email',
                'evaluation.simulationEvent:id,title,event_date',
            ])
            ->where('result', 'passed')
            ->whereNotNull('submitted_at')
            ->when($participantName !== '', fn ($q) => $q->whereHas(
                'user',
                fn ($userQuery) => $userQuery->where('name', 'like', "%{$participantName}%")
            ))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($builder) use ($search) {
                    $builder->whereHas('user', fn ($userQuery) => $userQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%"))
                        ->orWhereHas('evaluation.simulationEvent', fn ($eventQuery) => $eventQuery->where('title', 'like', "%{$search}%"));
                });
            })
            ->orderByDesc('submitted_at');

        // Module filter for simulation events: match participants registered to that module's campaigns.
        if ($moduleId) {
            $simulationPassedQuery->whereHas('user.campaignRegistrations', function ($q) use ($moduleId) {
                $q->where('training_module_id', $moduleId)
                    ->where('registration_status', CampaignRegistration::STATUS_REGISTERED);
            });
        }

        $lessonPassedTotal = (clone $lessonPassedQuery)->count();
        $scenarioPassedTotal = (clone $scenarioPassedQuery)->count();
        $simulationPassedTotal = (clone $simulationPassedQuery)->count();
        $listLimit = 200;

        $lessonPassed = (clone $lessonPassedQuery)->limit($listLimit)->get()->map(function (LessonQuizAttempt $attempt) {
            $totalQuestions = count($attempt->generated_questions ?? []);

            return [
                'id' => $attempt->id,
                'participant_id' => $attempt->user_id,
                'participant_name' => $attempt->user?->name,
                'participant_email' => $attempt->user?->email,
                'module_title' => $attempt->trainingModule?->title,
                'lesson_title' => $attempt->trainingContent?->title,
                'score' => $attempt->score,
                'total_questions' => $totalQuestions,
                'percentage' => $attempt->percentage,
                'completed_at' => $attempt->completed_at?->toIso8601String(),
                'detail_href' => '/admin/evaluations/lesson-quiz-attempts/'.$attempt->id,
            ];
        })->values()->all();

        $scenarioPassed = (clone $scenarioPassedQuery)->limit($listLimit)->get()->map(function (EvaluationResult $result) {
            return [
                'id' => $result->id,
                'participant_id' => $result->participant_id,
                'participant_name' => $result->participant?->name,
                'participant_email' => $result->participant?->email,
                'module_title' => $result->trainingModule?->title,
                'score' => $result->correct_answers ?? $result->score,
                'total_questions' => $result->total_questions,
                'percentage' => $result->percentage,
                'completed_at' => $result->completed_at?->toIso8601String(),
                'detail_href' => '/admin/evaluations/results/'.$result->id,
            ];
        })->values()->all();

        $simulationPassed = (clone $simulationPassedQuery)->limit($listLimit)->get()->map(function ($pe) {
            $event = $pe->evaluation?->simulationEvent;

            return [
                'id' => $pe->id,
                'participant_id' => $pe->user_id,
                'participant_name' => $pe->user?->name,
                'participant_email' => $pe->user?->email,
                'event_title' => $event?->title,
                'average_score' => $pe->average_score,
                'total_score' => $pe->total_score,
                'eligible_for_certification' => (bool) $pe->is_eligible_for_certification,
                'submitted_at' => $pe->submitted_at?->toIso8601String(),
                'detail_href' => $event?->id
                    ? '/admin/simulation-events/'.$event->id.'/evaluation/'.$pe->user_id
                    : null,
            ];
        })->values()->all();


        $lessonPassedCount = (clone $lessonPassedQuery)->distinct('user_id')->count('user_id');
        $scenarioPassedCount = (clone $scenarioPassedQuery)->distinct('participant_id')->count('participant_id');
        $simulationPassedCount = (clone $simulationPassedQuery)->distinct('user_id')->count('user_id');

        $lessonAvgPct = round((float) ((clone $lessonPassedQuery)->avg('percentage') ?? 0), 1);
        $scenarioAvgPct = round((float) ((clone $scenarioPassedQuery)->avg('percentage') ?? 0), 1);
        $simulationAvgScore = round((float) ((clone $simulationPassedQuery)->avg('average_score') ?? 0), 1);

        $modules = TrainingModule::query()
            ->where('status', 'published')
            ->orderBy('title')
            ->get(['id', 'title']);

        return [
            'overall_summary' => [
                'lesson_quiz_passed' => $lessonPassedCount,
                'final_scenario_passed' => $scenarioPassedCount,
                'simulation_event_passed' => $simulationPassedCount,
                'lesson_quiz_attempts_passed' => $lessonPassedTotal,
                'final_scenario_results_passed' => $scenarioPassedTotal,
                'simulation_event_results_passed' => $simulationPassedTotal,
                'lesson_quiz_list_shown' => count($lessonPassed),
                'final_scenario_list_shown' => count($scenarioPassed),
                'simulation_event_list_shown' => count($simulationPassed),
                'list_limit' => $listLimit,
                'lesson_quiz_average_percentage' => $lessonAvgPct,
                'final_scenario_average_percentage' => $scenarioAvgPct,
                'simulation_event_average_score' => $simulationAvgScore,
            ],
            'overall_lesson_passed' => $lessonPassed,
            'overall_scenario_passed' => $scenarioPassed,
            'overall_simulation_passed' => $simulationPassed,
            'overall_modules' => $modules,
            'overall_filters' => [
                'tab' => 'overall',
                'search' => $search,
                'participant_name' => $participantName,
                'training_module_id' => $request->string('training_module_id')->toString(),
            ],
        ];
    }
}
