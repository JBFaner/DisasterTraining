<?php

namespace App\Http\Controllers;

use App\Models\LessonCompletion;
use App\Models\TrainingContent;
use App\Models\TrainingModule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LessonCompletionController extends Controller
{
    public function toggle(Request $request, TrainingModule $trainingModule, TrainingContent $content)
    {
        $user = Auth::user();

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

        return response()->json([
            'message' => 'Content completion updated',
        ]);
    }
}
