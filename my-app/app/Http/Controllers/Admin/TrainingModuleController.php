<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\ManagesTrainingModuleAssets;
use App\Http\Controllers\Controller;
use App\Http\Requests\ReorderTrainingContentsRequest;
use App\Http\Requests\StoreTrainingContentRequest;
use App\Http\Requests\StoreTrainingModuleRequest;
use App\Http\Requests\UpdateTrainingContentRequest;
use App\Http\Requests\UpdateTrainingModuleRequest;
use App\Models\TrainingContent;
use App\Models\TrainingModule;
use App\Services\AuditLogger;
use App\Services\GeminiService;
use Illuminate\Http\Request;

class TrainingModuleController extends Controller
{
    use ManagesTrainingModuleAssets;

    public function index(Request $request)
    {
        $perPage = 9;

        $query = TrainingModule::with('owner')
            ->orderByDesc('updated_at');

        if ($request->filled('search')) {
            $search = $request->string('search')->trim();
            if ($search !== '') {
                $query->where(function ($builder) use ($search) {
                    $builder->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%");
                });
            }
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('difficulty')) {
            $query->where('difficulty', $request->string('difficulty'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
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
            'trainingFilters' => [
                'search' => $request->string('search')->toString(),
                'status' => $request->string('status')->toString(),
                'difficulty' => $request->string('difficulty')->toString(),
                'category' => $request->string('category')->toString(),
            ],
        ]);
    }

    public function create()
    {
        $user = portal_user();
        $barangayProfile = null;

        if ($user && $user->barangay_id) {
            $barangayProfile = \App\Models\BarangayProfile::with('hazardRecords')->find($user->barangay_id);
        }

        if (! $barangayProfile) {
            $barangayProfile = \App\Models\BarangayProfile::with('hazardRecords')->first();
        }

        return view('app', [
            'section' => 'training_create',
            'barangay_profile' => $barangayProfile,
        ]);
    }

    public function store(StoreTrainingModuleRequest $request)
    {
        $data = $request->validated();
        $data['owner_id'] = portal_id();
        $data['status'] = 'draft';
        $data['learning_objectives'] = $this->normalizeObjectives($data['learning_objectives'] ?? []);

        if (empty($data['learning_objectives'])) {
            return redirect()->back()
                ->withErrors(['learning_objectives' => 'At least one learning objective is required.'])
                ->withInput();
        }

        if ($request->hasFile('thumbnail')) {
            $data['thumbnail_path'] = $request->file('thumbnail')->store('training-module-thumbnails', 'public');
        }

        unset($data['thumbnail']);

        $module = TrainingModule::create($data);

        AuditLogger::log([
            'action' => 'Created training module (draft)',
            'module' => 'Training Modules',
            'status' => 'success',
            'description' => "Title: {$module->title}",
            'new_values' => $module->toArray(),
        ]);

        return redirect()->route('admin.training-modules.show', $module)
            ->with('status', 'Training module created successfully.');
    }

    public function show(TrainingModule $trainingModule)
    {
        $this->authorizeOwner($trainingModule);
        $trainingModule->load(['contents', 'owner']);

        return view('app', [
            'section' => 'training_detail',
            'module' => $trainingModule,
        ]);
    }

    public function edit(TrainingModule $trainingModule)
    {
        $this->authorizeOwner($trainingModule);

        return view('app', [
            'section' => 'training_edit',
            'module' => $trainingModule,
        ]);
    }

    public function update(UpdateTrainingModuleRequest $request, TrainingModule $trainingModule)
    {
        $this->authorizeOwner($trainingModule);

        $data = $request->validated();
        $data['learning_objectives'] = $this->normalizeObjectives($data['learning_objectives'] ?? []);

        if (empty($data['learning_objectives'])) {
            return redirect()->back()
                ->withErrors(['learning_objectives' => 'At least one learning objective is required.'])
                ->withInput();
        }

        if ($request->boolean('remove_thumbnail') && $trainingModule->thumbnail_path) {
            $this->deleteLocalFile($trainingModule->thumbnail_path);
            $data['thumbnail_path'] = null;
        }

        if ($request->hasFile('thumbnail')) {
            if ($trainingModule->thumbnail_path) {
                $this->deleteLocalFile($trainingModule->thumbnail_path);
            }
            $data['thumbnail_path'] = $request->file('thumbnail')->store('training-module-thumbnails', 'public');
        }

        unset($data['thumbnail'], $data['remove_thumbnail']);

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

        return redirect()->route('admin.training-modules.show', $trainingModule)
            ->with('status', 'Training module updated successfully.');
    }

    public function publish(Request $request, TrainingModule $trainingModule)
    {
        $this->authorizeOwner($trainingModule);

        $errors = [];
        if (empty($trainingModule->title)) {
            $errors[] = 'Title is required';
        }
        if (empty($trainingModule->category)) {
            $errors[] = 'Disaster category is required';
        }
        if (empty($trainingModule->difficulty)) {
            $errors[] = 'Difficulty is required';
        }
        if ($trainingModule->contents()->count() === 0) {
            $errors[] = 'At least one learning content item is required';
        }

        if (! empty($errors)) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot publish module.',
                    'errors' => $errors,
                ], 422);
            }

            return redirect()->route('admin.training-modules.show', $trainingModule)
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

        return redirect()->route('admin.training-modules.index')
            ->with('status', 'Training module published successfully.');
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

        return redirect()->route('admin.training-modules.index')
            ->with('status', 'Training module archived.');
    }

    public function destroy(TrainingModule $trainingModule)
    {
        $this->authorizeOwner($trainingModule);

        $snapshot = $trainingModule->toArray();

        if ($trainingModule->thumbnail_path) {
            $this->deleteLocalFile($trainingModule->thumbnail_path);
        }

        $trainingModule->delete();

        AuditLogger::log([
            'action' => 'Deleted training module',
            'module' => 'Training Modules',
            'status' => 'warning',
            'description' => "Title: {$snapshot['title']}",
            'old_values' => $snapshot,
        ]);

        return redirect()->route('admin.training-modules.index')
            ->with('status', 'Training module deleted permanently.');
    }

    public function storeContent(StoreTrainingContentRequest $request, TrainingModule $trainingModule)
    {
        $this->authorizeOwner($trainingModule);

        $data = $request->validated();
        $sortOrder = ($trainingModule->contents()->max('sort_order') ?? 0) + 1;

        $payload = [
            'training_module_id' => $trainingModule->id,
            'title' => $data['title'],
            'content_type' => $data['content_type'],
            'body' => $data['body'] ?? null,
            'external_url' => $data['external_url'] ?? null,
            'sort_order' => $sortOrder,
        ];

        if ($request->hasFile('file')) {
            try {
                $payload['file_path'] = $this->storeContentFile(
                    $request->file('file'),
                    $data['content_type'],
                    $data['storage_target'] ?? 'auto',
                );
            } catch (\Throwable $e) {
                return redirect()->back()
                    ->withErrors(['file' => $e->getMessage()])
                    ->withInput();
            }
        }

        TrainingContent::create($payload);

        return redirect()->route('admin.training-modules.show', $trainingModule)
            ->with('status', 'Learning content added to module.');
    }

    public function updateContent(
        UpdateTrainingContentRequest $request,
        TrainingModule $trainingModule,
        TrainingContent $content,
    ) {
        $this->authorizeOwner($trainingModule);
        $this->assertContentBelongsToModule($trainingModule, $content);

        $data = $request->validated();

        $payload = [
            'title' => $data['title'],
            'content_type' => $data['content_type'],
            'body' => $data['body'] ?? null,
            'external_url' => $data['external_url'] ?? null,
        ];

        if ($request->hasFile('file')) {
            $this->deleteStoredContentFile($content->file_path);
            $payload['file_path'] = $this->storeContentFile(
                $request->file('file'),
                $data['content_type'],
                $data['storage_target'] ?? 'auto',
            );
        } elseif ($data['content_type'] === TrainingContent::TYPE_YOUTUBE) {
            $payload['file_path'] = null;
        }

        $content->update($payload);

        return redirect()->route('admin.training-modules.show', $trainingModule)
            ->with('status', 'Learning content updated successfully.');
    }

    public function destroyContent(
        TrainingModule $trainingModule,
        TrainingContent $content,
    ) {
        $this->authorizeOwner($trainingModule);
        $this->assertContentBelongsToModule($trainingModule, $content);

        $this->deleteStoredContentFile($content->file_path);
        $content->delete();

        return redirect()->route('admin.training-modules.show', $trainingModule)
            ->with('status', 'Learning content removed from module.');
    }

    public function reorderContents(
        ReorderTrainingContentsRequest $request,
        TrainingModule $trainingModule,
    ) {
        $this->authorizeOwner($trainingModule);

        $order = $request->validated()['order'];
        $moduleContentIds = $trainingModule->contents()->pluck('id')->all();

        foreach ($order as $index => $contentId) {
            if (! in_array($contentId, $moduleContentIds, true)) {
                continue;
            }

            TrainingContent::where('id', $contentId)
                ->where('training_module_id', $trainingModule->id)
                ->update(['sort_order' => $index + 1]);
        }

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Content order updated.',
            ]);
        }

        return redirect()->route('admin.training-modules.show', $trainingModule)
            ->with('status', 'Content order updated.');
    }

    public function generateAiModule(Request $request)
    {
        $user = portal_user();
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
}
