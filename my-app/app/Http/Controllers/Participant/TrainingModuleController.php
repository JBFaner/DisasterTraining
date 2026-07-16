<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\TrainingModule;
use App\Services\CampaignRegistrationService;
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

        $user = portal_user();
        $registeredModuleIds = $user
            ? app(CampaignRegistrationService::class)->registeredModuleIdsFor($user)
            : [];

        // Walk-in / campaign participants only see modules they registered for.
        if ($registeredModuleIds !== []) {
            $query->whereIn('id', $registeredModuleIds);
        }

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

        $registeredModuleIds = app(CampaignRegistrationService::class)->registeredModuleIdsFor($user);
        if ($registeredModuleIds !== [] && ! in_array((int) $trainingModule->id, $registeredModuleIds, true)) {
            abort(403);
        }

        $trainingModule->load(['contents.resources', 'owner']);
        $trainingModule->applyParticipantProgression($user->id);

        $trainingService = app(\App\Services\AiScenarioTrainingService::class);
        $attemptService = app(\App\Services\LessonQuizAttemptService::class);
        $retakePolicy = app(\App\Services\TrainingRetakePolicyService::class);
        $contentReviewPending = $retakePolicy->isContentReviewPending($trainingModule, $user);

        if ($contentReviewPending) {
            $reviewedIds = array_flip(
                \App\Models\LessonCompletion::query()
                    ->where('user_id', $user->id)
                    ->where('training_module_id', $trainingModule->id)
                    ->pluck('training_content_id')
                    ->map(fn ($id) => (int) $id)
                    ->all()
            );

            $trainingModule->contents->transform(function ($content, $index) use ($reviewedIds, $trainingModule) {
                $isReviewed = isset($reviewedIds[(int) $content->id]);
                $previousReviewed = $index === 0
                    || isset($reviewedIds[(int) $trainingModule->contents[$index - 1]->id]);

                $content->is_completed = $isReviewed;
                $content->is_unlocked = $previousReviewed || $isReviewed || (bool) $content->is_unlocked;
                $content->is_locked = ! $content->is_unlocked;
                $content->content_review_required = true;

                return $content;
            });
        }

        $trainingModule->ai_training = $trainingService->buildParticipantMeta($trainingModule, $user);

        $trainingModule->contents->transform(function ($content) use ($trainingModule, $user, $attemptService) {
            $content->lesson_quiz = $attemptService->getParticipantMeta($trainingModule, $content, $user);

            // During content review after a failed final assessment, keep lesson quiz
            // results passed — participants only re-open lessons, they do not retake quizzes.
            if (! empty($content->content_review_required) && ($content->lesson_quiz['passed'] ?? false)) {
                $meta = $content->lesson_quiz;
                $meta['retake_required'] = false;
                $meta['review_only'] = true;
                $content->lesson_quiz = $meta;
            }

            return $content;
        });

        return view('app', [
            'section' => 'training_detail',
            'module' => $trainingModule,
        ]);
    }
}
