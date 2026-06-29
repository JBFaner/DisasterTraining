<?php



namespace App\Http\Controllers;



use App\Http\Requests\BulkResetTrainingProgressRequest;

use App\Http\Requests\ResetTrainingProgressRequest;

use App\Models\AiScenarioAttempt;

use App\Models\EvaluationResult;

use App\Models\TrainingModule;

use App\Services\EvaluationScoringService;

use App\Services\TrainingResetService;

use Illuminate\Http\Request;

use Illuminate\Support\Facades\DB;



class EvaluationResultController extends Controller

{

    public function __construct(

        private readonly EvaluationScoringService $scoringService,

        private readonly TrainingResetService $trainingResetService,

    ) {}



    public function index(Request $request)

    {

        $user = portal_user();

        abort_unless($user, 403);



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



        $analytics = $user->role === 'PARTICIPANT'

            ? null

            : $this->scoringService->buildAnalyticsSummary();



        return view('app', [

            'section' => $user->role === 'PARTICIPANT' ? 'evaluation_results_participant' : 'evaluation_dashboard',

            'evaluation_results' => $resultItems,

            'evaluation_results_pagination' => [

                'current_page' => $results->currentPage(),

                'last_page' => $results->lastPage(),

                'per_page' => $results->perPage(),

                'total' => $results->total(),

            ],

            'evaluation_analytics' => $analytics,

            'evaluation_modules' => $modules,

            'evaluation_attempt_numbers' => $attemptNumbers,

            'evaluation_filters' => [

                'search' => $request->string('search')->toString(),

                'status' => $request->string('status')->toString(),

                'training_module_id' => $request->string('training_module_id')->toString(),

                'attempt_number' => $request->string('attempt_number')->toString(),

                'date_from' => $request->string('date_from')->toString(),

                'date_to' => $request->string('date_to')->toString(),

            ],

            'evaluation_passing_score' => $this->scoringService->passingScore(),

        ]);

    }



    public function show(EvaluationResult $evaluationResult)

    {

        $this->authorize('view', $evaluationResult);



        $evaluationResult->load(['participant', 'trainingModule.aiScenarioConfig', 'aiScenarioAttempt']);



        $passingScore = (int) ($evaluationResult->trainingModule?->aiScenarioConfig?->passing_score

            ?? config('evaluation.passing_score', 75));



        $user = portal_user();

        $resultData = $evaluationResult->toArray();

        $resultData['can_reset'] = $user?->role === 'LGU_ADMIN'

            && $this->trainingResetService->canResetEvaluation($evaluationResult);



        return view('app', [

            'section' => 'evaluation_result_detail',

            'evaluation_result' => $resultData,

            'evaluation_passing_score' => $passingScore,

        ]);

    }



    public function reset(

        ResetTrainingProgressRequest $request,

        EvaluationResult $evaluationResult,

    ) {

        $this->authorize('reset', $evaluationResult);



        $admin = portal_user();

        abort_unless($admin, 403);



        $evaluationResult->loadMissing(['participant', 'trainingModule']);



        $this->trainingResetService->resetFromEvaluation(

            $evaluationResult,

            $admin,

            $request->validated('reason'),

        );



        if ($request->expectsJson()) {

            return response()->json([

                'message' => 'Training progress has been reset. The participant may begin re-training.',

            ]);

        }



        return redirect()

            ->route('admin.evaluations.index')

            ->with('status', 'Training progress reset successfully. The participant may begin re-training.');

    }



    public function bulkReset(BulkResetTrainingProgressRequest $request)

    {

        $admin = portal_user();

        abort_unless($admin?->role === 'LGU_ADMIN', 403);



        $payload = $this->trainingResetService->bulkResetFromEvaluations(

            $request->validated('evaluation_result_ids'),

            $admin,

            $request->validated('reason'),

        );



        $message = sprintf(

            '%d participant(s) have been reset for a new training attempt.',

            $payload['reset_count'],

        );



        if ($request->expectsJson()) {

            return response()->json(['message' => $message, 'reset_count' => $payload['reset_count']]);

        }



        return redirect()

            ->route('admin.evaluations.index')

            ->with('status', $message);

    }



    public function destroy(EvaluationResult $evaluationResult)

    {

        $this->authorize('delete', $evaluationResult);



        $evaluationResult->delete();



        if (request()->expectsJson()) {

            return response()->json(['message' => 'Evaluation record deleted.']);

        }



        return redirect()

            ->route('admin.evaluations.index')

            ->with('status', 'Evaluation record deleted.');

    }

}


