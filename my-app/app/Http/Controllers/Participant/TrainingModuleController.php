<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\TrainingModule;
use Illuminate\Http\Request;

class TrainingModuleController extends Controller
{
    public function index(Request $request)
    {
        $perPage = 9;

        $query = TrainingModule::query()
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
                'status' => '',
                'difficulty' => $request->string('difficulty')->toString(),
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

        $trainingModule->load(['contents', 'owner']);
        $trainingModule->applyParticipantProgression($user->id);

        $trainingService = app(\App\Services\AiScenarioTrainingService::class);
        $trainingModule->ai_training = $trainingService->buildParticipantMeta($trainingModule, $user);

        return view('app', [
            'section' => 'training_detail',
            'module' => $trainingModule,
        ]);
    }
}
