<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveQuizAnswerRequest;
use App\Http\Requests\SaveQuizProgressRequest;
use App\Http\Requests\SubmitAiScenarioAttemptRequest;
use App\Models\AiScenarioAttempt;
use App\Models\AiScenarioConfig;
use App\Models\TrainingModule;
use App\Models\User;
use App\Services\QuizAttemptService;
use App\Support\PortalAuth;
use Illuminate\Http\Request;

class AiScenarioAttemptController extends Controller
{
    public function __construct(
        private readonly QuizAttemptService $quizAttemptService,
    ) {}

    public function status(Request $request, TrainingModule $trainingModule)
    {
        $user = $this->authorizeParticipant();
        $trainingModule->loadMissing('aiScenarioConfig');

        return response()->json(
            $this->quizAttemptService->getParticipantQuizMeta($trainingModule, $user),
        );
    }

    public function start(Request $request, TrainingModule $trainingModule)
    {
        $user = $this->authorizeParticipant();

        if ($trainingModule->status !== 'published') {
            abort(403);
        }

        $config = AiScenarioConfig::where('training_module_id', $trainingModule->id)->first();
        if (! $config || ! $config->isReady()) {
            return $this->errorResponse($request, 'AI scenario training is not available for this module yet.', 422);
        }

        try {
            $attempt = $this->quizAttemptService->startOrResume($user, $trainingModule, $config);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->errorResponse(
                $request,
                collect($e->errors())->flatten()->first() ?? 'Unable to start quiz.',
                422,
            );
        }

        if ($request->expectsJson()) {
            return response()->json([
                'redirect' => route('participant.ai-scenario-attempts.show', $attempt),
                'attempt_id' => $attempt->id,
                'resumed' => $attempt->wasRecentlyCreated === false,
            ]);
        }

        return redirect()->route('participant.ai-scenario-attempts.show', $attempt);
    }

    public function show(AiScenarioAttempt $attempt)
    {
        $user = $this->authorizeParticipant();
        $this->authorizeAttemptOwner($attempt, $user);

        $attempt = $this->quizAttemptService->hydrateForParticipant($attempt);

        if ($attempt->isInProgress() && $attempt->expires_at && now()->greaterThanOrEqualTo($attempt->expires_at)) {
            $attempt = $this->quizAttemptService->expireAttempt($attempt);
        }

        return view('app', [
            'section' => 'ai_scenario_attempt',
            'ai_scenario_attempt' => $attempt->toParticipantArray(),
            'module' => $attempt->trainingModule,
        ]);
    }

    public function saveProgress(SaveQuizProgressRequest $request, AiScenarioAttempt $attempt)
    {
        $user = $this->authorizeParticipant();
        $this->authorizeAttemptOwner($attempt, $user);

        try {
            $attempt = $this->quizAttemptService->updateProgress(
                $attempt,
                (int) $request->validated('current_question'),
            );
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => collect($e->errors())->flatten()->first(),
                'errors' => $e->errors(),
            ], 422);
        }

        return response()->json([
            'message' => 'Progress saved.',
            'attempt' => $this->quizAttemptService->attemptSummary($attempt),
        ]);
    }

    public function saveAnswer(SaveQuizAnswerRequest $request, AiScenarioAttempt $attempt)
    {
        $user = $this->authorizeParticipant();
        $this->authorizeAttemptOwner($attempt, $user);

        try {
            $attempt = $this->quizAttemptService->saveAnswer(
                $attempt,
                (int) $request->validated('question_id'),
                $request->validated('selected_answer'),
                $request->validated('current_question'),
            );
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => collect($e->errors())->flatten()->first(),
                'errors' => $e->errors(),
            ], 422);
        }

        return response()->json([
            'message' => 'Answer saved.',
            'attempt' => $this->quizAttemptService->attemptSummary($attempt),
            'answers' => $this->quizAttemptService->answersMapFromRecords($attempt),
        ]);
    }

    public function submit(SubmitAiScenarioAttemptRequest $request, AiScenarioAttempt $attempt)
    {
        $user = $this->authorizeParticipant();
        $this->authorizeAttemptOwner($attempt, $user);

        if ($attempt->isCompleted()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Attempt already submitted.',
                    'attempt' => $attempt,
                ]);
            }

            return redirect()->route('participant.ai-scenario-attempts.show', $attempt);
        }

        $answers = $request->validated('answers');
        foreach ($answers as $questionId => $choice) {
            try {
                $this->quizAttemptService->saveAnswer(
                    $attempt->fresh(),
                    (int) $questionId,
                    (string) $choice,
                );
            } catch (\Throwable) {
                // Best-effort sync before final submit.
            }
        }

        try {
            $attempt = $this->quizAttemptService->submitAttempt(
                $attempt->fresh(),
                $request->validated('display_language'),
            );
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->errorResponse(
                $request,
                collect($e->errors())->flatten()->first() ?? 'Unable to submit.',
                422,
            );
        }

        $evaluationResult = $attempt->fresh()->evaluationResult;

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Assessment submitted.',
                'redirect' => $evaluationResult
                    ? route('admin.evaluation-results.show', $evaluationResult)
                    : route('participant.ai-scenario-attempts.show', $attempt),
                'evaluation_result_id' => $evaluationResult?->id,
            ]);
        }

        if ($evaluationResult) {
            return redirect()
                ->route('admin.evaluation-results.show', $evaluationResult)
                ->with('status', 'Your evaluation report is ready.');
        }

        return redirect()
            ->route('participant.ai-scenario-attempts.show', $attempt)
            ->with('status', 'Your assessment has been submitted.');
    }

    protected function authorizeParticipant(): User
    {
        $user = PortalAuth::participantUser();

        if (! $user) {
            abort(403, 'Participant login required to access AI scenario training.');
        }

        return $user;
    }

    protected function authorizeAttemptOwner(AiScenarioAttempt $attempt, User $user): void
    {
        if ($attempt->user_id !== $user->id) {
            abort(403, 'You may only access your own quiz attempts.');
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
