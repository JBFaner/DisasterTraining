<?php

namespace App\Http\Controllers;

use App\Models\LessonQuizConfig;
use App\Models\LessonQuizGenerationJob;
use App\Models\TrainingContent;
use App\Models\TrainingModule;
use App\Services\AuditLogger;
use App\Services\LessonContentExtractorService;
use App\Services\LessonQuizGenerationProcessor;
use App\Services\LessonQuizGeneratorService;
use App\Support\LessonQuizAdminSerializer;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class LessonQuizGeneratorController extends Controller
{
    public function __construct(
        private readonly LessonQuizGeneratorService $generatorService,
        private readonly LessonQuizGenerationProcessor $generationProcessor,
        private readonly LessonContentExtractorService $contentExtractor,
    ) {}

    public function index()
    {
        $this->authorizeAdmin();

        $modules = TrainingModule::query()
            ->where('status', 'published')
            ->with(['contents' => fn ($q) => $q->with('resources')->orderBy('sort_order')])
            ->orderBy('title')
            ->get();

        $configs = LessonQuizConfig::with(array_merge(
            LessonQuizAdminSerializer::configRelations(),
            ['latestGenerationJob'],
        ))
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (LessonQuizConfig $config) => LessonQuizAdminSerializer::serializeConfig($config));

        return view('app', [
            'section' => 'lesson_quiz_generator',
            'lesson_quiz_modules' => $modules,
            'lesson_quiz_configs' => $configs,
        ]);
    }

    public function lessonResources(TrainingModule $trainingModule, TrainingContent $content)
    {
        $this->authorizeAdmin();

        if ($content->training_module_id !== $trainingModule->id) {
            abort(422, 'Lesson does not belong to this training module.');
        }

        $content->load('resources');

        return response()->json([
            'lesson' => $content,
            'resources' => $this->contentExtractor->serializeLessonForAdmin($content),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin();

        $data = $request->validate([
            'training_content_id' => ['required', 'exists:training_contents,id'],
            'bank_question_count' => ['required', Rule::in(LessonQuizConfig::BANK_QUESTION_COUNTS)],
            'quiz_question_count' => [
                'required',
                'integer',
                'min:1',
                function (string $attribute, mixed $value, \Closure $fail) use ($request) {
                    $bankCount = (int) $request->input('bank_question_count', 30);
                    if ((int) $value > $bankCount) {
                        $fail('Participant quiz size cannot exceed AI questions to generate.');
                    }
                },
            ],
            'is_enabled' => ['nullable', 'boolean'],
            'time_limit_minutes' => ['nullable', 'integer', 'min:5', 'max:180'],
            'max_attempts' => ['nullable', 'integer', 'min:1', 'max:20'],
            'passing_score' => ['nullable', 'integer', 'min:50', 'max:100'],
            'shuffle_questions' => ['nullable', 'boolean'],
            'shuffle_answer_choices' => ['nullable', 'boolean'],
        ]);

        $config = LessonQuizConfig::updateOrCreate(
            ['training_content_id' => $data['training_content_id']],
            [
                'bank_question_count' => $data['bank_question_count'],
                'quiz_question_count' => $data['quiz_question_count'],
                'generation_language' => LessonQuizConfig::DEFAULT_GENERATION_LANGUAGE,
                'is_enabled' => $request->boolean('is_enabled'),
                'time_limit_minutes' => $data['time_limit_minutes'] ?? null,
                'max_attempts' => $data['max_attempts'] ?? 3,
                'passing_score' => $data['passing_score'] ?? 75,
                'shuffle_questions' => $request->boolean('shuffle_questions', true),
                'shuffle_answer_choices' => $request->boolean('shuffle_answer_choices', true),
                'created_by' => portal_id(),
            ],
        );

        AuditLogger::log([
            'action' => 'Updated lesson quiz configuration',
            'module' => 'Lesson Quiz Generator',
            'status' => 'success',
            'description' => 'Lesson content ID: '.$config->training_content_id,
        ]);

        $fresh = $config->fresh(array_merge(
            LessonQuizAdminSerializer::configRelations(),
            ['latestGenerationJob'],
        ));

        return response()->json([
            'message' => 'Lesson quiz configuration saved.',
            'config' => LessonQuizAdminSerializer::serializeConfig($fresh),
        ]);
    }

    public function generate(Request $request, LessonQuizConfig $config)
    {
        $this->authorizeAdmin();

        $data = $request->validate([
            'auto_translate_fil' => ['nullable', 'boolean'],
        ]);

        $user = portal_user();
        if (! $user) {
            abort(403);
        }

        try {
            $job = $this->generatorService->dispatchGeneration(
                $config,
                $user,
                $request->boolean('auto_translate_fil', true),
            );

            AuditLogger::log([
                'action' => 'Queued lesson quiz question bank generation',
                'module' => 'Lesson Quiz Generator',
                'status' => 'success',
                'description' => 'Config ID: '.$config->id.'; Job ID: '.$job->id,
            ]);

            return response()->json([
                'message' => 'Question Bank generation has started. You may continue using the system while the AI processes your lesson.',
                'generation_job' => $this->generationProcessor->serializeJob($job),
            ], 202);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function generationStatus(LessonQuizGenerationJob $generationJob)
    {
        $this->authorizeAdmin();

        $user = portal_user();
        if (! $user || (int) $generationJob->requested_by !== (int) $user->id) {
            abort(403);
        }

        $generationJob->loadMissing('version');

        $payload = [
            'generation_job' => $this->generationProcessor->serializeJob($generationJob),
        ];

        if ($generationJob->status === LessonQuizGenerationJob::STATUS_COMPLETED) {
            $config = $generationJob->config()
                ->with(LessonQuizAdminSerializer::configRelations())
                ->first();

            if ($config) {
                $payload['config'] = LessonQuizAdminSerializer::serializeConfig($config);
            }
        }

        return response()->json($payload);
    }

    protected function authorizeAdmin(): void
    {
        $user = portal_user();
        if (! $user || ! in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true)) {
            abort(403);
        }
    }
}
