<?php

namespace App\Http\Controllers;

use App\Models\TrainingModule;
use App\Models\TrainingLesson;
use App\Models\LessonMaterial;
use App\Models\LessonCompletion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TrainingModuleController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Participants should only see published modules (visibility can be used later if needed)
        if ($user && $user->role === 'PARTICIPANT') {
            $modules = TrainingModule::with('owner')
                ->where('status', 'published')
                ->orderByDesc('updated_at')
                ->get();
        } else {
            $modules = TrainingModule::with('owner')
                ->orderByDesc('updated_at')
                ->get();
        }

        return view('app', [
            'section' => 'training',
            'modules' => $modules,
        ]);
    }

    public function create()
    {
        return view('app', [
            'section' => 'training_create',
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'difficulty' => ['required', 'string'],
            'category' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'string'],
            'visibility' => ['required', 'string'],
        ]);

        $data['owner_id'] = Auth::id();

        TrainingModule::create($data);

        return redirect()->route('training.modules')
            ->with('status', 'Training module created successfully.');
    }

    public function edit(TrainingModule $trainingModule)
    {
        $this->authorizeOwner($trainingModule);

        return view('app', [
            'section' => 'training_edit',
            'module' => $trainingModule,
        ]);
    }

    public function show(TrainingModule $trainingModule)
    {
        $user = Auth::user();

        if (! $user) {
            abort(403);
        }

        // Participants can view only published modules (read-only)
        if ($user->role === 'PARTICIPANT') {
            if (
                $trainingModule->status !== 'published'
            ) {
                abort(403);
            }
        } else {
            // Admin / owner access for management views
            $this->authorizeOwner($trainingModule);
        }

        $trainingModule->load(['lessons.materials', 'owner']);

        // Attach completion info for participants
        if ($user->role === 'PARTICIPANT') {
            $completedLessonIds = LessonCompletion::where('user_id', $user->id)
                ->where('training_module_id', $trainingModule->id)
                ->pluck('training_lesson_id')
                ->all();

            // Mark lessons with a computed property for the frontend
            $trainingModule->lessons->transform(function ($lesson) use ($completedLessonIds) {
                $lesson->is_completed = in_array($lesson->id, $completedLessonIds, true);
                return $lesson;
            });
        }

        return view('app', [
            'section' => 'training_detail',
            'module' => $trainingModule,
        ]);
    }

    public function update(Request $request, TrainingModule $trainingModule)
    {
        $this->authorizeOwner($trainingModule);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'difficulty' => ['required', 'string'],
            'category' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'string'],
            'visibility' => ['required', 'string'],
        ]);

        $trainingModule->update($data);

        return redirect()->route('training.modules')
            ->with('status', 'Training module updated successfully.');
    }

    public function archive(TrainingModule $trainingModule)
    {
        $this->authorizeOwner($trainingModule);

        $trainingModule->update([
            'status' => 'archived',
        ]);

        return redirect()->route('training.modules')
            ->with('status', 'Training module archived.');
    }

    public function destroy(TrainingModule $trainingModule)
    {
        $this->authorizeOwner($trainingModule);

        // TODO: check if module is linked to active simulations before delete.
        $trainingModule->delete();

        return redirect()->route('training.modules')
            ->with('status', 'Training module deleted permanently.');
    }

    public function storeLesson(Request $request, TrainingModule $trainingModule)
    {
        $this->authorizeOwner($trainingModule);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_required' => ['nullable', 'boolean'],
        ]);

        $order = ($trainingModule->lessons()->max('order') ?? 0) + 1;

        TrainingLesson::create([
            'training_module_id' => $trainingModule->id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'is_required' => $request->boolean('is_required'),
            'order' => $order,
        ]);

        return redirect()->route('training.modules.show', $trainingModule)
            ->with('status', 'Lesson added to module.');
    }

    public function updateLesson(Request $request, TrainingModule $trainingModule, TrainingLesson $lesson)
    {
        $this->authorizeOwner($trainingModule);

        if ($lesson->training_module_id !== $trainingModule->id) {
            abort(404);
        }

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_required' => ['nullable', 'boolean'],
        ]);

        $lesson->update([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'is_required' => $request->boolean('is_required'),
        ]);

        return redirect()->route('training.modules.show', $trainingModule)
            ->with('status', 'Lesson updated successfully.');
    }

    public function destroyLesson(TrainingModule $trainingModule, TrainingLesson $lesson)
    {
        $this->authorizeOwner($trainingModule);

        if ($lesson->training_module_id !== $trainingModule->id) {
            abort(404);
        }

        $lesson->delete();

        return redirect()->route('training.modules.show', $trainingModule)
            ->with('status', 'Lesson removed from module.');
    }

    public function storeMaterial(Request $request, TrainingModule $trainingModule, TrainingLesson $lesson)
    {
        $this->authorizeOwner($trainingModule);

        if ($lesson->training_module_id !== $trainingModule->id) {
            abort(404);
        }

        $data = $request->validate([
            'type' => ['required', 'string', 'max:50'],
            'label' => ['nullable', 'string', 'max:255'],
            'url' => ['required', 'url', 'max:2048'],
        ]);

        LessonMaterial::create([
            'training_lesson_id' => $lesson->id,
            'type' => $data['type'],
            'label' => $data['label'] ?? null,
            'path' => $data['url'],
        ]);

        return redirect()->route('training.modules.show', $trainingModule)
            ->with('status', 'Learning material added to lesson.');
    }

    public function destroyMaterial(TrainingModule $trainingModule, TrainingLesson $lesson, LessonMaterial $material)
    {
        $this->authorizeOwner($trainingModule);

        if ($lesson->training_module_id !== $trainingModule->id || $material->training_lesson_id !== $lesson->id) {
            abort(404);
        }

        $material->delete();

        return redirect()->route('training.modules.show', $trainingModule)
            ->with('status', 'Learning material removed from lesson.');
    }

    protected function authorizeOwner(TrainingModule $module): void
    {
        $user = Auth::user();

        if (! $user) {
            abort(403);
        }

        if ($user->role !== 'LGU_ADMIN' && $user->id !== $module->owner_id) {
            abort(403);
        }
    }
}


