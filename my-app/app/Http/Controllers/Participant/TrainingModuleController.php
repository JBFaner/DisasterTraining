<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\TrainingModule;
use App\Models\User;
use App\Services\ParticipantTrainingAccessService;
use App\Services\ParticipantTrainingProgressSummaryService;
use App\Services\TrainingModuleCardStatsService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TrainingModuleController extends Controller
{
    public function __construct(
        private readonly ParticipantTrainingAccessService $trainingAccess,
    ) {}

    public function index(Request $request)
    {
        $perPage = 9;
        $user = portal_user();
        abort_unless($user, 403);

        $accessContext = $this->trainingAccess->buildContext($user);
        $query = $this->trainingAccess->participantModulesQuery($user);

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
        app(TrainingModuleCardStatsService::class)->enrichParticipantModules($modules, (int) $user->id);

        $modulesPayload = $modules
            ->map(fn (TrainingModule $module) => $this->trainingAccess->enrichModuleForParticipant($user, $module))
            ->values()
            ->all();

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
                'modules' => $modulesPayload,
                'pagination' => $modulesPagination,
                'training_access_context' => $accessContext,
                'available_categories' => $this->availableCategories($user),
                'training_filters' => [
                    'search' => $request->string('search')->toString(),
                    'category' => $request->string('category')->toString(),
                ],
            ]);
        }

        return view('app', [
            'section' => 'training',
            'modules' => $modulesPayload,
            'modulesPagination' => $modulesPagination,
            'training_access_context' => $accessContext,
            'training_filters' => [
                'search' => $request->string('search')->toString(),
                'category' => $request->string('category')->toString(),
            ],
            'available_categories' => $this->availableCategories($user),
        ]);
    }

    public function progressSummaryAll(Request $request): StreamedResponse
    {
        $user = portal_user();
        abort_unless($user, 403);

        $summary = app(ParticipantTrainingProgressSummaryService::class)->buildAllModulesSummary($user);
        $text = app(ParticipantTrainingProgressSummaryService::class)->renderText($summary);
        $filename = 'training-progress-summary-'.now()->format('Y-m-d').'.txt';

        return response()->streamDownload(function () use ($text) {
            echo $text;
        }, $filename, [
            'Content-Type' => 'text/plain; charset=UTF-8',
        ]);
    }

    public function progressSummary(TrainingModule $trainingModule): StreamedResponse
    {
        $user = portal_user();
        abort_unless($user, 403);

        $accessBlock = $this->trainingAccess->moduleAccessBlock($user, $trainingModule);
        abort_if($accessBlock !== null, 403);

        $trainingModule->load('contents');
        $summary = app(ParticipantTrainingProgressSummaryService::class)->buildModuleSummary($user, $trainingModule);
        $text = app(ParticipantTrainingProgressSummaryService::class)->renderText([
            'generated_at' => now()->toIso8601String(),
            'participant' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
            'modules' => [$summary],
        ]);

        $slug = str($trainingModule->title)->slug()->limit(40)->toString() ?: 'module';
        $filename = "training-transcript-{$slug}-".now()->format('Y-m-d').'.txt';

        return response()->streamDownload(function () use ($text) {
            echo $text;
        }, $filename, [
            'Content-Type' => 'text/plain; charset=UTF-8',
        ]);
    }

    /**
     * @return list<string>
     */
    private function availableCategories(User $user): array
    {
        $registeredModuleIds = $this->trainingAccess
            ->participantModulesQuery($user)
            ->clone()
            ->reorder()
            ->select('category')
            ->distinct()
            ->whereNotNull('category')
            ->where('category', '!=', '')
            ->orderBy('category')
            ->pluck('category')
            ->map(fn ($category) => (string) $category)
            ->values()
            ->all();

        return $registeredModuleIds;
    }

    public function show(TrainingModule $trainingModule)
    {
        $user = portal_user();
        abort_unless($user, 403);

        $accessBlock = $this->trainingAccess->moduleAccessBlock($user, $trainingModule);
        if ($accessBlock !== null) {
            return view('app', [
                'section' => 'training_module_locked',
                'training_module_lock' => $accessBlock,
                'training_access_context' => $this->trainingAccess->buildContext($user),
            ]);
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
            'training_access_context' => $this->trainingAccess->buildContext($user),
        ]);
    }
}
