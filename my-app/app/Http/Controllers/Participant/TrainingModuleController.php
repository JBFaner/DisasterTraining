<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\TrainingModule;
use App\Services\TrainingModuleCardStatsService;
use Illuminate\Http\Request;

class TrainingModuleController extends Controller
{
    public function index(Request $request)
    {
        $perPage = 9;

        $query = TrainingModule::query()
            ->withCount('contents as lesson_count')
            ->where('status', 'published')
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

        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
        }

        $paginator = $query->paginate($perPage)->withQueryString();
        $modules = collect($paginator->items());
        $user = portal_user();
        if ($user) {
            app(TrainingModuleCardStatsService::class)->enrichParticipantModules($modules, (int) $user->id);
        }

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
                'status' => '',
                'category' => $request->string('category')->toString(),
            ],
        ]);
    }

    public function show(TrainingModule $trainingModule)
    {
        $user = portal_user();
        abort_unless($user, 403);

        if ($trainingModule->status !== 'published') {
            abort(403);
        }

        $trainingModule->load(['contents.resources', 'owner']);
        $trainingModule->applyParticipantProgression($user->id);

        $trainingService = app(\App\Services\AiScenarioTrainingService::class);
        $attemptService = app(\App\Services\LessonQuizAttemptService::class);
        $trainingModule->ai_training = $trainingService->buildParticipantMeta($trainingModule, $user);

        $trainingModule->contents->transform(function ($content) use ($trainingModule, $user, $attemptService) {
            $content->lesson_quiz = $attemptService->getParticipantMeta($trainingModule, $content, $user);

            return $content;
        });

        return view('app', [
            'section' => 'training_detail',
            'module' => $trainingModule,
        ]);
    }
}
