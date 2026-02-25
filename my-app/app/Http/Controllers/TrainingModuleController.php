<?php

namespace App\Http\Controllers;

use App\Models\TrainingModule;
use App\Models\TrainingLesson;
use App\Models\LessonMaterial;
use App\Models\LessonCompletion;
use App\Services\AuditLogger;
use App\Services\GeminiService;
use Cloudinary\Cloudinary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class TrainingModuleController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        $perPage = 9;

        $query = TrainingModule::with('owner')
            ->orderByDesc('updated_at');

        // Participants should only see published modules (visibility can be used later if needed)
        if ($user && $user->role === 'PARTICIPANT') {
            $query->where('status', 'published');
        }

        $paginator = $query->paginate($perPage)->withQueryString();

        $modules = $paginator->items();

        $modulesPagination = [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
        ];

        if ($request->expectsJson()) {
            return response()->json([
                'modules' => $modules,
                'pagination' => $modulesPagination,
            ]);
        }

        return view('app', [
            'section' => 'training',
            'modules' => $modules,
            'modulesPagination' => $modulesPagination,
        ]);
    }

    public function create()
    {
        $user = Auth::user();
        $barangayProfile = null;

        // If the user is assigned to a barangay, use that barangay's profile (with disaster hazards) for the disaster type dropdown
        if ($user && $user->barangay_id) {
            $barangayProfile = \App\Models\BarangayProfile::find($user->barangay_id);
        }

        if (! $barangayProfile) {
            $barangayProfile = \App\Models\BarangayProfile::first();
        }

        return view('app', [
            'section' => 'training_create',
            'barangay_profile' => $barangayProfile,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'learning_objectives' => ['required', 'array', 'min:1'],
            'learning_objectives.*' => ['required', 'string', 'max:500'],
            'difficulty' => ['required', 'string'],
            'category' => ['nullable', 'string', 'max:255'],
            'visibility' => ['required', 'string'],
        ]);

        $data['owner_id'] = Auth::id();
        // Automatically set status to draft
        $data['status'] = 'draft';

        // Filter out empty objectives and convert to JSON
        if (isset($data['learning_objectives'])) {
            $data['learning_objectives'] = array_values(array_filter($data['learning_objectives']));
            if (empty($data['learning_objectives'])) {
                return redirect()->back()
                    ->withErrors(['learning_objectives' => 'At least one learning objective is required.'])
                    ->withInput();
            }
        }

        $module = TrainingModule::create($data);

        AuditLogger::log([
            'action' => 'Created training module (draft)',
            'module' => 'Training Modules',
            'status' => 'success',
            'description' => "Title: {$module->title}",
            'new_values' => $module->toArray(),
        ]);

        return redirect()->route('training.modules')
            ->with('status', 'Training module created successfully.');
    }

    public function publish(Request $request, TrainingModule $trainingModule)
    {
        $this->authorizeOwner($trainingModule);

        // Validation: Check if module has required fields
        $errors = [];
        if (empty($trainingModule->title)) {
            $errors[] = 'Title is required';
        }
        if (empty($trainingModule->difficulty)) {
            $errors[] = 'Difficulty is required';
        }
        if ($trainingModule->lessons()->count() === 0) {
            $errors[] = 'At least one lesson is required';
        }

        if (! empty($errors)) {
            // If this is an AJAX/fetch request, return JSON so the frontend can show a popup
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot publish module.',
                    'errors' => $errors,
                ], 422);
            }

            return redirect()->route('training.modules.show', $trainingModule)
                ->with('error', 'Cannot publish module: '.implode(', ', $errors));
        }

        $old = $trainingModule->getOriginal();

        $trainingModule->update([
            'status' => 'published',
        ]);

        AuditLogger::log([
            'action' => 'Published training module',
            'module' => 'Training Modules',
            'status' => 'success',
            'description' => "Title: {$trainingModule->title}",
            'old_values' => $old,
            'new_values' => $trainingModule->toArray(),
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Training module published successfully.',
            ]);
        }

        return redirect()->route('training.modules')
            ->with('status', 'Training module published successfully.');
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
            'learning_objectives' => ['required', 'array', 'min:1'],
            'learning_objectives.*' => ['required', 'string', 'max:500'],
            'difficulty' => ['required', 'string'],
            'category' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'string'],
            'visibility' => ['required', 'string'],
        ]);

        // Filter out empty objectives and convert to JSON
        if (isset($data['learning_objectives'])) {
            $data['learning_objectives'] = array_values(array_filter($data['learning_objectives']));
            if (empty($data['learning_objectives'])) {
                return redirect()->back()
                    ->withErrors(['learning_objectives' => 'At least one learning objective is required.'])
                    ->withInput();
            }
        }

        $old = $trainingModule->getOriginal();
        $trainingModule->update($data);

        AuditLogger::log([
            'action' => 'Updated training module',
            'module' => 'Training Modules',
            'status' => 'success',
            'description' => "Title: {$trainingModule->title}",
            'old_values' => $old,
            'new_values' => $trainingModule->toArray(),
        ]);

        return redirect()->route('training.modules')
            ->with('status', 'Training module updated successfully.');
    }

    public function archive(TrainingModule $trainingModule)
    {
        $this->authorizeOwner($trainingModule);

        $old = $trainingModule->getOriginal();

        $trainingModule->update([
            'status' => 'archived',
        ]);

        AuditLogger::log([
            'action' => 'Archived training module',
            'module' => 'Training Modules',
            'status' => 'success',
            'description' => "Title: {$trainingModule->title}",
            'old_values' => $old,
            'new_values' => $trainingModule->toArray(),
        ]);

        return redirect()->route('training.modules')
            ->with('status', 'Training module archived.');
    }

    public function destroy(TrainingModule $trainingModule)
    {
        $this->authorizeOwner($trainingModule);

        // TODO: check if module is linked to active simulations before delete.
        $snapshot = $trainingModule->toArray();
        $trainingModule->delete();

        AuditLogger::log([
            'action' => 'Deleted training module',
            'module' => 'Training Modules',
            'status' => 'warning',
            'description' => "Title: {$snapshot['title']}",
            'old_values' => $snapshot,
        ]);

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
            'url' => ['nullable', 'url', 'max:2048'],
            // Allow larger files; actual limit is controlled by PHP upload_max_filesize/post_max_size
            'file' => ['nullable', 'file', 'mimes:pdf,doc,docx,ppt,pptx,jpg,jpeg,png,gif,mp4,mov,avi'],
            'storage_target' => ['nullable', 'string', 'in:auto,local,cloudinary'],
        ]);

        if (! $request->hasFile('file') && empty($data['url'])) {
            return redirect()->back()
                ->withErrors([
                    'file' => 'Please either upload a file or provide a valid link.',
                ])
                ->withInput();
        }

        $storedPath = null;
        $storageTarget = $data['storage_target'] ?? 'auto';

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $mime = $file->getMimeType();
            $extension = strtolower($file->getClientOriginalExtension());

            $isVideo = ($mime && str_starts_with($mime, 'video/'))
                || in_array($extension, ['mp4', 'mov', 'avi'], true);
            $isImage = ($mime && str_starts_with($mime, 'image/'))
                || in_array($extension, ['jpg', 'jpeg', 'png', 'gif'], true);

            $shouldUseCloudinary = false;

            if ($storageTarget === 'cloudinary' && ($isVideo || $isImage)) {
                $shouldUseCloudinary = true;
            } elseif ($storageTarget === 'local') {
                $shouldUseCloudinary = false;
            } else {
                // auto: preserve previous behaviour (videos -> Cloudinary, others -> local)
                $shouldUseCloudinary = $isVideo;
            }

            if ($shouldUseCloudinary && ($isVideo || $isImage)) {
                try {
                    $cloudinaryUrl = getenv('CLOUDINARY_URL') ?: null;
                    if (! $cloudinaryUrl) {
                        return redirect()->back()
                            ->withErrors([
                                'file' => 'Cloudinary is not configured. Please set CLOUDINARY_URL in .env and restart the server.',
                            ])
                            ->withInput();
                    }

                    $parsed = parse_url($cloudinaryUrl);
                    $cloudName = $parsed['host'] ?? null;
                    $apiKey = $parsed['user'] ?? null;
                    $apiSecret = $parsed['pass'] ?? null;

                    if (! $cloudName || ! $apiKey || ! $apiSecret) {
                        return redirect()->back()
                            ->withErrors([
                                'file' => 'Cloudinary is misconfigured. CLOUDINARY_URL must look like cloudinary://API_KEY:API_SECRET@CLOUD_NAME',
                            ])
                            ->withInput();
                    }

                    $cloudinary = new Cloudinary([
                        'cloud' => [
                            'cloud_name' => $cloudName,
                            'api_key' => $apiKey,
                            'api_secret' => $apiSecret,
                        ],
                        'url' => [
                            'secure' => true,
                        ],
                    ]);

                    $resourceType = $isVideo ? 'video' : 'image';

                    $uploadResult = $cloudinary->uploadApi()->upload($file->getRealPath(), [
                        'resource_type' => $resourceType,
                        'folder' => 'lesson-materials',
                    ]);

                    $storedPath = $uploadResult['secure_url'] ?? $uploadResult['url'] ?? null;
                    if (! $storedPath) {
                        throw new \Exception('Cloudinary did not return a URL for the uploaded file.');
                    }
                } catch (\Throwable $e) {
                    return redirect()->back()
                        ->withErrors([
                            'file' => 'Cloudinary upload failed. Please confirm CLOUDINARY_URL is correct and restart the server. Error: '.$e->getMessage(),
                        ])
                        ->withInput();
                }
            } else {
                // Local storage
                $relativePath = $file->store('lesson-materials', 'public');
                $storedPath = Storage::url($relativePath);
            }
        } else {
            // Fallback to external URL
            $storedPath = $data['url'];
        }

        LessonMaterial::create([
            'training_lesson_id' => $lesson->id,
            'type' => $data['type'],
            'label' => $data['label'] ?? null,
            'path' => $storedPath,
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

        // Best-effort cleanup of locally stored files
        if ($material->path) {
            $publicBase = rtrim(Storage::url(''), '/');
            $path = $material->path;

            if (str_starts_with($path, $publicBase)) {
                $relative = ltrim(substr($path, strlen($publicBase)), '/');
                Storage::disk('public')->delete($relative);
            } elseif (str_starts_with($path, '/storage/')) {
                $relative = ltrim(substr($path, strlen('/storage/')), '/');
                Storage::disk('public')->delete($relative);
            }
        }

        $material->delete();

        return redirect()->route('training.modules.show', $trainingModule)
            ->with('status', 'Learning material removed from lesson.');
    }

    /**
     * Generate training module description and learning objectives using AI
     */
    public function generateAiModule(Request $request)
    {
        $user = Auth::user();
        if (! $user) {
            abort(403);
        }

        $data = $request->validate([
            'title' => ['required', 'string', 'min:5', 'max:255'],
            'difficulty' => ['nullable', 'string', 'max:50'],
            'category' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $gemini = new GeminiService();
            $result = $gemini->generateTrainingModuleFromTitle(
                $data['title'],
                $data['difficulty'] ?? 'Beginner',
                $data['category'] ?? null,
            );

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
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


