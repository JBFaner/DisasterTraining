<?php

namespace App\Http\Controllers;

use App\Http\Requests\SubmitAiScenarioAttemptRequest;
use App\Models\AiScenarioAttempt;
use App\Models\AiScenarioConfig;
use App\Models\TrainingModule;
use App\Services\AiScenarioTrainingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AiScenarioAttemptController extends Controller
{
    public function __construct(
        private readonly AiScenarioTrainingService $trainingService,
    ) {}

    public function start(Request $request, TrainingModule $trainingModule)
    {
        $user = $this->authorizeParticipant();

        if ($trainingModule->status !== 'published') {
            abort(403);
        }

        if (! $trainingModule->participantHasCompletedAllContents($user->id)) {
            return $this->errorResponse($request, 'Complete all lessons before starting AI scenario training.', 403);
        }

        $config = AiScenarioConfig::where('training_module_id', $trainingModule->id)->first();
        if (! $config || ! $config->isReady()) {
            return $this->errorResponse($request, 'AI scenario training is not available for this module yet.', 422);
        }

        $inProgress = AiScenarioAttempt::query()
            ->where('user_id', $user->id)
            ->where('training_module_id', $trainingModule->id)
            ->whereNull('completed_at')
            ->latest('id')
            ->first();

        $attempt = $inProgress ?? $this->trainingService->createAttempt($user, $trainingModule, $config);

        if ($request->expectsJson()) {
            return response()->json([
                'redirect' => route('ai-scenario-attempts.show', $attempt),
                'attempt_id' => $attempt->id,
            ]);
        }

        return redirect()->route('ai-scenario-attempts.show', $attempt);
    }

    public function show(AiScenarioAttempt $attempt)
    {
        $user = $this->authorizeParticipant();
        $this->authorizeAttemptOwner($attempt, $user->id);

        $attempt->load(['trainingModule', 'config']);

        return view('app', [
            'section' => 'ai_scenario_attempt',
            'ai_scenario_attempt' => $attempt->toParticipantArray(),
            'module' => $attempt->trainingModule,
        ]);
    }

    public function submit(SubmitAiScenarioAttemptRequest $request, AiScenarioAttempt $attempt)
    {
        $user = $this->authorizeParticipant();
        $this->authorizeAttemptOwner($attempt, $user->id);

        if ($attempt->isCompleted()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Attempt already submitted.',
                    'attempt' => $attempt,
                ]);
            }

            return redirect()->route('ai-scenario-attempts.show', $attempt);
        }

        $attempt = $this->trainingService->submitAttempt(
            $attempt,
            $request->validated('answers'),
            $request->validated('display_language'),
        );
        $evaluationResult = $attempt->fresh()->evaluationResult;

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Assessment submitted.',
                'redirect' => $evaluationResult
                    ? route('evaluation-results.show', $evaluationResult)
                    : route('ai-scenario-attempts.show', $attempt),
                'evaluation_result_id' => $evaluationResult?->id,
            ]);
        }

        if ($evaluationResult) {
            return redirect()
                ->route('evaluation-results.show', $evaluationResult)
                ->with('status', 'Your evaluation report is ready.');
        }

        return redirect()
            ->route('ai-scenario-attempts.show', $attempt)
            ->with('status', 'Your assessment has been submitted.');
    }

    protected function authorizeParticipant()
    {
        $user = Auth::user();
        if (! $user || $user->role !== 'PARTICIPANT') {
            abort(403);
        }

        return $user;
    }

    protected function authorizeAttemptOwner(AiScenarioAttempt $attempt, int $userId): void
    {
        if ($attempt->user_id !== $userId) {
            abort(403);
        }
    }

    protected function errorResponse(Request $request, string $message, int $status)
    {
        if ($request->expectsJson()) {
            return response()->json(['message' => $message], $status);
        }

        return redirect()
            ->back()
            ->withErrors(['ai_scenario' => $message]);
    }
}
