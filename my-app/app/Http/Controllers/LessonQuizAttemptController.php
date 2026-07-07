<?php

namespace App\Http\Controllers;

use App\Models\LessonQuizAttempt;
use App\Models\TrainingContent;
use App\Models\TrainingModule;
use App\Services\LessonQuizAttemptService;
use Illuminate\Http\Request;

class LessonQuizAttemptController extends Controller
{
    public function __construct(
        private readonly LessonQuizAttemptService $attemptService,
    ) {}

    public function status(TrainingModule $trainingModule, TrainingContent $content)
    {
        $user = $this->authorizeParticipant();

        if ($content->training_module_id !== $trainingModule->id) {
            abort(422);
        }

        return response()->json(
            $this->attemptService->getParticipantMeta($trainingModule, $content, $user),
        );
    }

    public function start(Request $request, TrainingModule $trainingModule, TrainingContent $content)
    {
        $user = $this->authorizeParticipant();

        if ($trainingModule->status !== 'published' || $content->training_module_id !== $trainingModule->id) {
            abort(403);
        }

        $request->validate([
            'display_language' => ['nullable', 'string', 'in:en,fil'],
        ]);

        try {
            $attempt = $this->attemptService->startOrResume(
                $user,
                $trainingModule,
                $content,
                $request->input('display_language'),
            );
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => collect($e->errors())->flatten()->first() ?? 'Unable to start lesson quiz.',
            ], 422);
        }

        return response()->json([
            'redirect' => route('participant.lesson-quiz-attempts.show', $attempt),
            'attempt_id' => $attempt->id,
        ]);
    }

    public function show(LessonQuizAttempt $attempt)
    {
        $user = $this->authorizeParticipant();
        $this->authorizeAttemptOwner($attempt, $user);

        $attempt = $this->attemptService->hydrateForParticipant($attempt);

        return view('app', [
            'section' => 'lesson_quiz_attempt',
            'lesson_quiz_attempt' => $attempt->toParticipantArray(),
            'module' => $attempt->trainingModule,
        ]);
    }

    public function submit(Request $request, LessonQuizAttempt $attempt)
    {
        $user = $this->authorizeParticipant();
        $this->authorizeAttemptOwner($attempt, $user);

        $data = $request->validate([
            'answers' => ['required', 'array'],
        ]);

        $attempt = $this->attemptService->submitAttempt($attempt, $data['answers']);

        return response()->json([
            'message' => $attempt->passed ? 'Lesson quiz passed.' : 'Lesson quiz submitted.',
            'attempt' => $attempt->toParticipantArray(),
            'redirect' => route('participant.training-modules.show', $attempt->training_module_id),
        ]);
    }

    private function authorizeParticipant(): \App\Models\User
    {
        $user = portal_user();
        if (! $user || $user->role !== 'PARTICIPANT') {
            abort(403);
        }

        return $user;
    }

    private function authorizeAttemptOwner(LessonQuizAttempt $attempt, \App\Models\User $user): void
    {
        if ((int) $attempt->user_id !== (int) $user->id) {
            abort(403);
        }
    }
}
