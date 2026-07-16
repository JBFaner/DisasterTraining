<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\ManagesTrainingModuleAssets;
use App\Http\Controllers\Controller;
use App\Http\Requests\ReorderLessonResourcesRequest;
use App\Http\Requests\ReorderTrainingContentsRequest;
use App\Http\Requests\StoreLessonResourceRequest;
use App\Http\Requests\StoreTrainingLessonRequest;
use App\Http\Requests\UpdateLessonResourceRequest;
use App\Http\Requests\UpdateTrainingLessonRequest;
use App\Http\Requests\StoreTrainingModuleRequest;
use App\Http\Requests\UpdateTrainingModuleRequest;
use App\Models\LessonResource;
use App\Models\BarangayProfile;
use App\Models\TrainingContent;
use App\Models\TrainingModule;
use App\Models\QualifiedTrainer;
use App\Services\AuditLogger;
use App\Services\DatabaseBackupService;
use App\Services\GeminiService;
use App\Services\HazardAssessment\HazardTrainingRecommendationService;
use App\Services\LessonResourceProcessingService;
use App\Services\TrainingModuleCardStatsService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TrainingModuleController extends Controller
{
    use ManagesTrainingModuleAssets;

    public function index(Request $request)
    {
        $perPage = 9;

        $query = TrainingModule::with('owner')
            ->withCount('contents as lesson_count')
            ->orderByDesc('updated_at');

        if ($request->filled('search')) {
            $search = $request->string('search')->trim();
            if ($search !== '') {
                $query->where(function ($builder) use ($search) {
                    $builder->where('title', 'like', "%{$search}%")
                        ->orWhere('short_description', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%")
                        ->orWhere('related_hazard', 'like', "%{$search}%");
                });
            }
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
        }

        $paginator = $query->paginate($perPage)->withQueryString();
        $modules = collect($paginator->items());
        app(TrainingModuleCardStatsService::class)->enrichAdminModules($modules);

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
                'modules' => $modules->values()->all(),
                'pagination' => $modulesPagination,
            ]);
        }

        return view('app', [
            'section' => 'training',
            'modules' => $modules->values()->all(),
            'modulesPagination' => $modulesPagination,
            'trainingFilters' => [
                'search' => $request->string('search')->toString(),
                'status' => $request->string('status')->toString(),
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
        $data['difficulty'] = $data['difficulty'] ?? 'Beginner';
        $data['short_description'] = $data['short_description'] ?? Str::limit((string) ($data['description'] ?? ''), 500, '');
        $data['related_hazard'] = $data['related_hazard'] ?? ($data['category'] ?? null);
        $data['delivery_method'] = $data['delivery_method'] ?? 'in_person';
        $data['target_audience'] = array_values(array_filter($data['target_audience'] ?? []));
        $data['assigned_qualified_trainer_ids'] = $this->normalizeTrainerIds($data['assigned_qualified_trainer_ids'] ?? []);
        $data['available_training_sessions'] = $this->normalizeTrainingSessions($data['available_training_sessions'] ?? []);
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
        $trainingModule->load([
            'contents.resources.creator',
            'contents.resources.updater',
            'contents.creator',
            'contents.updater',
            'contents.lessonQuizConfig',
            'owner',
            'aiScenarioConfig',
            'leadQualifiedTrainer',
        ]);
        $hazardRecommendations = app(HazardTrainingRecommendationService::class)
            ->recommendCommunitiesForTraining($trainingModule);
        $trainingModule->recommended_communities = $hazardRecommendations;

        // Source of trainer information for the Training Intelligence Profile (Participant Registration & Attendance module).
        $trainingModule->qualified_trainers = QualifiedTrainer::query()
            ->active()
            ->get([
                'id',
                'name',
                'email',
                'specialization',
                'status',
                'certifications',
            ]);
        $assignedTrainerIds = $trainingModule->assigned_qualified_trainer_ids ?? [];
        if ($assignedTrainerIds === [] && $trainingModule->lead_qualified_trainer_id) {
            $assignedTrainerIds = [(int) $trainingModule->lead_qualified_trainer_id];
        }
        $trainingModule->assigned_trainers = collect($assignedTrainerIds)
            ->map(fn ($id) => $trainingModule->qualified_trainers->firstWhere('id', (int) $id))
            ->filter()
            ->values();

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
        $data['difficulty'] = $data['difficulty'] ?? $trainingModule->difficulty ?? 'Beginner';
        $data['short_description'] = $data['short_description']
            ?? $trainingModule->short_description
            ?? Str::limit((string) ($data['description'] ?? $trainingModule->description ?? ''), 500, '');
        $data['related_hazard'] = $data['related_hazard'] ?? ($data['category'] ?? $trainingModule->category);
        $data['delivery_method'] = $data['delivery_method'] ?? $trainingModule->delivery_method ?? 'in_person';
        $data['target_audience'] = array_values(array_filter($data['target_audience'] ?? $trainingModule->target_audience ?? []));
        $data['assigned_qualified_trainer_ids'] = $this->normalizeTrainerIds($data['assigned_qualified_trainer_ids'] ?? $trainingModule->assigned_qualified_trainer_ids ?? []);
        $data['available_training_sessions'] = $this->normalizeTrainingSessions($data['available_training_sessions'] ?? $trainingModule->available_training_sessions ?? []);

        if (array_key_exists('learning_objectives', $data)) {
            $data['learning_objectives'] = $this->normalizeObjectives($data['learning_objectives'] ?? []);
            if ($data['learning_objectives'] === []) {
                $data['learning_objectives'] = null;
            }
        } else {
            unset($data['learning_objectives']);
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

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Training module updated successfully.',
            ]);
        }

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

        app(DatabaseBackupService::class)->queueAfterCommit('training_module_published');

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

    public function destroy(Request $request, TrainingModule $trainingModule)
    {
        $this->authorizeOwner($trainingModule);

        if ($trainingModule->hasParticipantLearningRecords()) {
            $message = 'This training module cannot be deleted because participant learning records already exist.';

            if ($request->expectsJson()) {
                return response()->json(['message' => $message], 422);
            }

            return redirect()->route('admin.training-modules.index')
                ->withErrors(['training_module' => $message]);
        }

        $snapshot = $trainingModule->toArray();

        $trainingModule->delete();

        AuditLogger::log([
            'action' => 'Deleted training module',
            'module' => 'Training Modules',
            'status' => 'warning',
            'description' => "Title: {$snapshot['title']}",
            'old_values' => $snapshot,
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Training module deleted successfully.',
            ]);
        }

        return redirect()->route('admin.training-modules.index')
            ->with('status', 'Training module deleted successfully.');
    }

    public function storeContent(StoreTrainingLessonRequest $request, TrainingModule $trainingModule)
    {
        $this->authorizeOwner($trainingModule);

        $data = $request->validated();
        $sortOrder = ($trainingModule->contents()->max('sort_order') ?? 0) + 1;
        $objectives = $this->normalizeObjectives($data['learning_objectives'] ?? []);
        $storageTarget = $data['storage_target'] ?? 'auto';

        if (trim((string) ($data['content_body'] ?? '')) === '') {
            return $this->trainingModuleFormResponse(
                $request,
                $trainingModule,
                'Training content is required.',
                false,
                422,
                ['content_body' => ['Training content is required.']],
            );
        }

        $lesson = TrainingContent::create([
            'training_module_id' => $trainingModule->id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'learning_objectives' => $objectives !== [] ? $objectives : null,
            'sort_order' => $sortOrder,
            'created_by' => portal_id(),
            'updated_by' => portal_id(),
        ]);

        $processing = app(LessonResourceProcessingService::class);
        $resourceOrder = 1;

        if (trim((string) ($data['content_body'] ?? '')) !== '') {
            $resource = LessonResource::create([
                'training_content_id' => $lesson->id,
                'title' => 'Training Content',
                'resource_type' => LessonResource::TYPE_TEXT,
                'body' => $data['content_body'],
                'sort_order' => $resourceOrder++,
                'created_by' => portal_id(),
                'updated_by' => portal_id(),
            ]);
            $processing->afterResourceSaved($resource);
        }

        try {
            $this->appendLessonUploads(
                $request,
                $lesson,
                $data,
                $storageTarget,
                $resourceOrder,
            );
        } catch (\Throwable $e) {
            return $this->trainingModuleFormResponse(
                $request,
                $trainingModule,
                $e->getMessage(),
                false,
                422,
                ['attachments' => [$e->getMessage()]],
            );
        }

        return $this->trainingModuleFormResponse($request, $trainingModule, 'Lesson added to module.');
    }

    public function updateContent(
        UpdateTrainingLessonRequest $request,
        TrainingModule $trainingModule,
        TrainingContent $content,
    ) {
        $this->authorizeOwner($trainingModule);
        $this->assertContentBelongsToModule($trainingModule, $content);

        $data = $request->validated();
        $objectives = $this->normalizeObjectives($data['learning_objectives'] ?? []);
        $storageTarget = $data['storage_target'] ?? 'auto';

        $processing = app(LessonResourceProcessingService::class);
        $textResource = $content->resources()
            ->where('resource_type', LessonResource::TYPE_TEXT)
            ->orderBy('sort_order')
            ->first();

        $contentBody = trim((string) ($data['content_body'] ?? ''));
        if ($contentBody === '' && $textResource) {
            $contentBody = (string) ($textResource->body ?? '');
        }

        if (trim(strip_tags($contentBody)) === '') {
            return $this->trainingModuleFormResponse(
                $request,
                $trainingModule,
                'Training content is required.',
                false,
                422,
                ['content_body' => ['Training content is required.']],
            );
        }

        $content->update([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'learning_objectives' => $objectives !== [] ? $objectives : null,
            'updated_by' => portal_id(),
        ]);

        if ($textResource) {
            $textResource->update([
                'body' => $contentBody,
                'updated_by' => portal_id(),
            ]);
            $processing->afterResourceSaved($textResource->fresh());
        } else {
            $resource = LessonResource::create([
                'training_content_id' => $content->id,
                'title' => 'Training Content',
                'resource_type' => LessonResource::TYPE_TEXT,
                'body' => $contentBody,
                'sort_order' => ($content->resources()->max('sort_order') ?? 0) + 1,
                'created_by' => portal_id(),
                'updated_by' => portal_id(),
            ]);
            $processing->afterResourceSaved($resource);
        }

        $resourceOrder = ($content->resources()->max('sort_order') ?? 0) + 1;
        try {
            $this->appendLessonUploads(
                $request,
                $content,
                $data,
                $storageTarget,
                $resourceOrder,
            );
        } catch (\Throwable $e) {
            return $this->trainingModuleFormResponse(
                $request,
                $trainingModule,
                $e->getMessage(),
                false,
                422,
                ['attachments' => [$e->getMessage()]],
            );
        }

        return $this->trainingModuleFormResponse($request, $trainingModule, 'Lesson updated successfully.');
    }

    private function appendLessonUploads(
        StoreTrainingLessonRequest|UpdateTrainingLessonRequest $request,
        TrainingContent $lesson,
        array $data,
        string $storageTarget,
        int $resourceOrder,
    ): int {
        $processing = app(LessonResourceProcessingService::class);

        foreach ($request->file('images', []) ?? [] as $index => $file) {
            try {
                $resource = LessonResource::create([
                    'training_content_id' => $lesson->id,
                    'title' => 'Image '.($index + 1),
                    'resource_type' => LessonResource::TYPE_IMAGE,
                    'file_path' => $this->storeContentFile($file, LessonResource::TYPE_IMAGE, $storageTarget),
                    'sort_order' => $resourceOrder++,
                    'created_by' => portal_id(),
                    'updated_by' => portal_id(),
                ]);
                $processing->afterResourceSaved($resource);
            } catch (\Throwable $e) {
                throw $e;
            }
        }

        if (! empty($data['video_url'])) {
            $resource = LessonResource::create([
                'training_content_id' => $lesson->id,
                'title' => 'Video',
                'resource_type' => LessonResource::TYPE_YOUTUBE,
                'external_url' => $data['video_url'],
                'sort_order' => $resourceOrder++,
                'created_by' => portal_id(),
                'updated_by' => portal_id(),
            ]);
            $processing->afterResourceSaved($resource);
        } elseif ($request->hasFile('video_file')) {
            try {
                $resource = LessonResource::create([
                    'training_content_id' => $lesson->id,
                    'title' => 'Video',
                    'resource_type' => LessonResource::TYPE_VIDEO,
                    'file_path' => $this->storeContentFile($request->file('video_file'), LessonResource::TYPE_VIDEO, $storageTarget),
                    'sort_order' => $resourceOrder++,
                    'created_by' => portal_id(),
                    'updated_by' => portal_id(),
                ]);
                $processing->afterResourceSaved($resource);
            } catch (\Throwable $e) {
                throw $e;
            }
        }

        foreach ($request->file('attachments', []) ?? [] as $index => $file) {
            try {
                $resource = LessonResource::create([
                    'training_content_id' => $lesson->id,
                    'title' => 'Attachment '.($index + 1),
                    'resource_type' => LessonResource::TYPE_PDF,
                    'file_path' => $this->storeContentFile($file, LessonResource::TYPE_PDF, $storageTarget),
                    'sort_order' => $resourceOrder++,
                    'created_by' => portal_id(),
                    'updated_by' => portal_id(),
                ]);
                $processing->afterResourceSaved($resource);
            } catch (\Throwable $e) {
                throw $e;
            }
        }

        return $resourceOrder;
    }

    public function destroyContent(
        Request $request,
        TrainingModule $trainingModule,
        TrainingContent $content,
    ) {
        $this->authorizeOwner($trainingModule);
        $this->assertContentBelongsToModule($trainingModule, $content);

        $content->load('resources');
        foreach ($content->resources as $resource) {
            $this->deleteStoredContentFile($resource->file_path);
        }

        $content->delete();

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Lesson removed from module.',
            ]);
        }

        return redirect()->route('admin.training-modules.show', $trainingModule)
            ->with('status', 'Lesson removed from module.');
    }

    public function storeResource(
        StoreLessonResourceRequest $request,
        TrainingModule $trainingModule,
        TrainingContent $content,
    ) {
        $this->authorizeOwner($trainingModule);
        $this->assertContentBelongsToModule($trainingModule, $content);

        $data = $request->validated();
        $sortOrder = ($content->resources()->max('sort_order') ?? 0) + 1;

        $payload = [
            'training_content_id' => $content->id,
            'title' => $data['title'],
            'resource_type' => $data['resource_type'],
            'body' => $data['body'] ?? null,
            'external_url' => $data['external_url'] ?? null,
            'sort_order' => $sortOrder,
            'created_by' => portal_id(),
            'updated_by' => portal_id(),
        ];

        if ($request->hasFile('file')) {
            try {
                $payload['file_path'] = $this->storeContentFile(
                    $request->file('file'),
                    $data['resource_type'],
                    $data['storage_target'] ?? 'auto',
                );
            } catch (\Throwable $e) {
                return $this->trainingModuleFormResponse(
                    $request,
                    $trainingModule,
                    $e->getMessage(),
                    false,
                    422,
                    ['file' => [$e->getMessage()]],
                );
            }
        }

        $resource = LessonResource::create($payload);
        app(LessonResourceProcessingService::class)->afterResourceSaved($resource);

        return $this->trainingModuleFormResponse($request, $trainingModule, 'Learning resource added to lesson.');
    }

    public function updateResource(
        UpdateLessonResourceRequest $request,
        TrainingModule $trainingModule,
        TrainingContent $content,
        LessonResource $resource,
    ) {
        $this->authorizeOwner($trainingModule);
        $this->assertContentBelongsToModule($trainingModule, $content);
        $this->assertResourceBelongsToLesson($content, $resource);

        $data = $request->validated();

        $payload = [
            'title' => $data['title'],
            'resource_type' => $data['resource_type'],
            'body' => $data['body'] ?? null,
            'external_url' => $data['external_url'] ?? null,
            'updated_by' => portal_id(),
        ];

        if ($request->hasFile('file')) {
            $this->deleteStoredContentFile($resource->file_path);
            $payload['file_path'] = $this->storeContentFile(
                $request->file('file'),
                $data['resource_type'],
                $data['storage_target'] ?? 'auto',
            );
        } elseif ($data['resource_type'] === LessonResource::TYPE_YOUTUBE) {
            $payload['file_path'] = null;
        }

        $resource->update($payload);
        $resource->refresh();

        if ($request->hasFile('file')
            || $resource->wasChanged(['resource_type', 'body', 'file_path', 'external_url'])) {
            app(LessonResourceProcessingService::class)->afterResourceSaved($resource);
        }

        return redirect()->route('admin.training-modules.show', $trainingModule)
            ->with('status', 'Learning resource updated successfully.');
    }

    public function destroyResource(
        Request $request,
        TrainingModule $trainingModule,
        TrainingContent $content,
        LessonResource $resource,
    ) {
        $this->authorizeOwner($trainingModule);
        $this->assertContentBelongsToModule($trainingModule, $content);
        $this->assertResourceBelongsToLesson($content, $resource);

        $this->deleteStoredContentFile($resource->file_path);
        $resource->delete();

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Learning resource removed.',
            ]);
        }

        return redirect()->route('admin.training-modules.show', $trainingModule)
            ->with('status', 'Learning resource removed.');
    }

    public function reprocessResource(
        TrainingModule $trainingModule,
        TrainingContent $content,
        LessonResource $resource,
    ) {
        $this->authorizeOwner($trainingModule);
        $this->assertContentBelongsToModule($trainingModule, $content);
        $this->assertResourceBelongsToLesson($content, $resource);

        app(LessonResourceProcessingService::class)->reprocess($resource);

        return redirect()->route('admin.training-modules.show', $trainingModule)
            ->with('status', 'Learning resource reprocessing started.');
    }

    public function reorderResources(
        ReorderLessonResourcesRequest $request,
        TrainingModule $trainingModule,
        TrainingContent $content,
    ) {
        $this->authorizeOwner($trainingModule);
        $this->assertContentBelongsToModule($trainingModule, $content);

        $order = $request->validated()['order'];
        $resourceIds = $content->resources()->pluck('id')->all();

        foreach ($order as $index => $resourceId) {
            $resourceId = (int) $resourceId;
            if (! in_array($resourceId, $resourceIds, true)) {
                continue;
            }

            LessonResource::where('id', $resourceId)
                ->where('training_content_id', $content->id)
                ->update(['sort_order' => $index + 1]);
        }

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Resource order updated.',
            ]);
        }

        return redirect()->route('admin.training-modules.show', $trainingModule)
            ->with('status', 'Resource order updated.');
    }

    public function reorderContents(
        ReorderTrainingContentsRequest $request,
        TrainingModule $trainingModule,
    ) {
        $this->authorizeOwner($trainingModule);

        $order = $request->validated()['order'];
        $moduleContentIds = $trainingModule->contents()->pluck('id')->all();

        foreach ($order as $index => $contentId) {
            $contentId = (int) $contentId;
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
            ], 422);
        }
    }

    /**
     * @param  array<int, mixed>  $entries
     * @return list<array<string, mixed>>
     */
    private function normalizeTrainerAvailability(array $entries): array
    {
        return collect($entries)
            ->filter(fn ($entry) => is_array($entry))
            ->map(function (array $entry) {
                return [
                    'date' => trim((string) ($entry['date'] ?? '')),
                    'start_time' => trim((string) ($entry['start_time'] ?? '')),
                    'end_time' => trim((string) ($entry['end_time'] ?? '')),
                ];
            })
            ->filter(fn (array $entry) => $entry['date'] !== '' && $entry['start_time'] !== '' && $entry['end_time'] !== '')
            ->values()
            ->all();
    }

    /**
     * @param  array<int, mixed>  $entries
     * @return list<int>
     */
    private function normalizeTrainerIds(array $entries): array
    {
        return collect($entries)
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @param  array<int, mixed>  $entries
     * @return list<array<string, mixed>>
     */
    private function normalizeTrainingSessions(array $entries): array
    {
        return collect($entries)
            ->filter(fn ($entry) => is_array($entry))
            ->map(function (array $entry) {
                $deliveryMethod = trim((string) ($entry['delivery_method'] ?? 'in_person'));
                if (! in_array($deliveryMethod, ['in_person', 'online'], true)) {
                    $deliveryMethod = 'in_person';
                }

                return [
                    'title' => trim((string) ($entry['title'] ?? '')),
                    'date' => trim((string) ($entry['date'] ?? '')),
                    'start_time' => trim((string) ($entry['start_time'] ?? '')),
                    'end_time' => trim((string) ($entry['end_time'] ?? '')),
                    'delivery_method' => $deliveryMethod,
                    'venue' => $deliveryMethod === 'in_person' ? trim((string) ($entry['venue'] ?? '')) : '',
                    'online_platform' => $deliveryMethod === 'online' ? trim((string) ($entry['online_platform'] ?? '')) : '',
                    'meeting_link' => $deliveryMethod === 'online' ? trim((string) ($entry['meeting_link'] ?? '')) : '',
                    'maximum_participants' => isset($entry['maximum_participants']) ? (int) $entry['maximum_participants'] : null,
                ];
            })
            ->filter(fn (array $entry) => (
                $entry['date'] !== ''
                && $entry['start_time'] !== ''
                && $entry['end_time'] !== ''
                && $entry['maximum_participants'] !== null
                && (
                    ($entry['delivery_method'] === 'in_person' && $entry['venue'] !== '')
                    || ($entry['delivery_method'] === 'online' && $entry['online_platform'] !== '' && $entry['meeting_link'] !== '')
                )
            ))
            ->values()
            ->all();
    }
}
