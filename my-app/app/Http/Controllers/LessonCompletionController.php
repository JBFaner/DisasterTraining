<?php

namespace App\Http\Controllers;

use App\Models\LessonCompletion;
use App\Models\TrainingContent;
use App\Models\TrainingModule;
use App\Services\AiScenarioTrainingService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class LessonCompletionController extends Controller
{
    public function toggle(Request $request, TrainingModule $trainingModule, TrainingContent $content)
    {
        $user = portal_user();

        if (! $user || $user->role !== 'PARTICIPANT') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($content->training_module_id !== $trainingModule->id) {
            return response()->json(['message' => 'Invalid content for module'], 422);
        }

        $request->validate([
            'completed' => ['required', 'boolean'],
        ]);

        if ($request->boolean('completed')) {
            if (! $trainingModule->participantCanCompleteContent($user->id, $content->id)) {
                throw ValidationException::withMessages([
                    'completed' => 'Complete the previous lesson to unlock this lesson.',
                ]);
            }

            $completion = LessonCompletion::firstOrNew([
                'user_id' => $user->id,
                'training_module_id' => $trainingModule->id,
                'training_content_id' => $content->id,
            ]);

            if (! $completion->exists) {
                $completion->completed_at = now();
                $completion->save();
            }
        } else {
            LessonCompletion::where('user_id', $user->id)
                ->where('training_module_id', $trainingModule->id)
                ->where('training_content_id', $content->id)
                ->delete();
        }

        $trainingModule->load('contents');
        $trainingModule->applyParticipantProgression($user->id);

        $completedContentIds = $trainingModule->participantCompletedContentIds($user->id);
        $totalContents = $trainingModule->contents->count();
        $completedCount = count($completedContentIds);

        return response()->json([
            'message' => 'Content completion updated',
            'completed' => $request->boolean('completed'),
            'completed_content_ids' => $completedContentIds,
            'content_progress' => $trainingModule->contents->map(fn ($item) => [
                'id' => $item->id,
                'is_completed' => (bool) $item->is_completed,
                'is_unlocked' => (bool) $item->is_unlocked,
                'is_locked' => (bool) $item->is_locked,
                'sequence_number' => $item->sequence_number,
                'status' => $item->is_completed
                    ? 'completed'
                    : ($item->is_unlocked ? 'available' : 'locked'),
            ])->values()->all(),
            'lesson_progress' => app(\App\Services\LessonProgressionService::class)
                ->buildLessonProgressMeta(
                    $trainingModule,
                    $user->id,
                    app(\App\Services\TrainingRetakePolicyService::class)
                        ->isContentReviewPending($trainingModule, $user),
                ),
            'progress' => [
                'completed' => $completedCount,
                'total' => $totalContents,
                'percent' => $totalContents > 0
                    ? (int) round(($completedCount / $totalContents) * 100)
                    : 0,
            ],
            'ai_training' => app(AiScenarioTrainingService::class)
                ->buildParticipantMeta($trainingModule, $user),
        ]);
    }
}
