<?php

namespace App\Http\Controllers;

use App\Models\EvaluationResult;
use App\Models\TrainingModule;
use App\Services\EvaluationScoringService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EvaluationResultController extends Controller
{
    public function __construct(
        private readonly EvaluationScoringService $scoringService,
    ) {}

    public function index(Request $request)
    {
        $user = Auth::user();
        abort_unless($user, 403);

        $query = EvaluationResult::query()
            ->with(['participant', 'trainingModule'])
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
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('training_module_id')) {
            $query->where('training_module_id', $request->integer('training_module_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('completed_at', '>=', $request->string('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('completed_at', '<=', $request->string('date_to'));
        }

        $results = $query->paginate(15)->withQueryString();

        $modules = TrainingModule::query()
            ->where('status', 'published')
            ->orderBy('title')
            ->get(['id', 'title']);

        $analytics = $user->role === 'PARTICIPANT'
            ? null
            : $this->scoringService->buildAnalyticsSummary();

        return view('app', [
            'section' => $user->role === 'PARTICIPANT' ? 'evaluation_results_participant' : 'evaluation_dashboard',
            'evaluation_results' => $results->items(),
            'evaluation_results_pagination' => [
                'current_page' => $results->currentPage(),
                'last_page' => $results->lastPage(),
                'per_page' => $results->perPage(),
                'total' => $results->total(),
            ],
            'evaluation_analytics' => $analytics,
            'evaluation_modules' => $modules,
            'evaluation_filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $request->string('status')->toString(),
                'training_module_id' => $request->string('training_module_id')->toString(),
                'date_from' => $request->string('date_from')->toString(),
                'date_to' => $request->string('date_to')->toString(),
            ],
            'evaluation_passing_score' => $this->scoringService->passingScore(),
        ]);
    }

    public function show(EvaluationResult $evaluationResult)
    {
        $this->authorize('view', $evaluationResult);

        $evaluationResult->load(['participant', 'trainingModule', 'aiScenarioAttempt']);

        return view('app', [
            'section' => 'evaluation_result_detail',
            'evaluation_result' => $evaluationResult,
            'evaluation_passing_score' => $this->scoringService->passingScore(),
        ]);
    }

    public function destroy(EvaluationResult $evaluationResult)
    {
        $this->authorize('delete', $evaluationResult);

        $evaluationResult->delete();

        if (request()->expectsJson()) {
            return response()->json(['message' => 'Evaluation record deleted.']);
        }

        return redirect()
            ->route('evaluations.index')
            ->with('status', 'Evaluation record deleted.');
    }
}
