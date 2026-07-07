<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAiScenarioConfigRequest;
use App\Models\AiScenarioConfig;
use App\Models\AiScenarioGenerationJob;
use App\Models\TrainingModule;
use App\Services\AiScenarioGenerationProcessor;
use App\Services\AiScenarioTrainingService;
use App\Services\AuditLogger;
use App\Support\AiScenarioAdminSerializer;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AiScenarioConfigController extends Controller
{
    public function __construct(
        private readonly AiScenarioTrainingService $trainingService,
        private readonly AiScenarioGenerationProcessor $generationProcessor,
    ) {}

    public function index()
    {
        $this->authorizeAdmin();

        $modules = TrainingModule::query()
            ->where('status', 'published')
            ->with('aiScenarioConfig')
            ->orderBy('title')
            ->get();

        $configs = AiScenarioConfig::with(AiScenarioAdminSerializer::configRelations())
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (AiScenarioConfig $config) => AiScenarioAdminSerializer::serializeConfig($config));

        return view('app', [
            'section' => 'ai_scenario_final_assessment',
            'ai_scenario_modules' => $modules,
            'ai_scenario_configs' => $configs,
        ]);
    }

    public function store(StoreAiScenarioConfigRequest $request)
    {
        $this->authorizeAdmin();

        $data = $request->validated();

        $module = TrainingModule::with('contents')->findOrFail($data['training_module_id']);
        $difficulty = $this->trainingService->resolveDifficultyForModule($module);

        $config = AiScenarioConfig::updateOrCreate(
            ['training_module_id' => $data['training_module_id']],
            [
                'difficulty' => $difficulty,
                'number_of_questions' => $data['number_of_questions'],
                'generation_language' => $data['generation_language'] ?? 'en',
                'is_enabled' => $request->boolean('is_enabled'),
                'time_limit_minutes' => $data['time_limit_minutes'] ?? 60,
                'max_attempts' => $data['max_attempts'] ?? 3,
                'passing_score' => $data['passing_score'] ?? 75,
                'fail_retake_policy' => $data['fail_retake_policy'] ?? AiScenarioConfig::FAIL_POLICY_REQUIRE_LESSON_REVIEW,
                'auto_submit_on_expire' => $request->boolean('auto_submit_on_expire', true),
                'allow_resume_attempt' => $request->boolean('allow_resume_attempt', true),
                'shuffle_questions' => $request->boolean('shuffle_questions', true),
                'shuffle_answer_choices' => $request->boolean('shuffle_answer_choices', true),
                'created_by' => portal_id(),
            ],
        );

        AuditLogger::log([
            'action' => 'Updated AI scenario configuration',
            'module' => 'Final AI Scenario Assessment',
            'status' => 'success',
            'description' => 'Module ID: '.$config->training_module_id,
        ]);

        if ($request->expectsJson()) {
            $fresh = $config->fresh(AiScenarioAdminSerializer::configRelations());

            return response()->json([
                'message' => 'Configuration saved.',
                'config' => AiScenarioAdminSerializer::serializeConfig($fresh),
            ]);
        }

        return redirect()
            ->route('admin.ai-scenario-config.index')
            ->with('status', 'AI scenario configuration saved.');
    }

    public function generate(Request $request, AiScenarioConfig $config)
    {
        $this->authorizeAdmin();

        $user = portal_user();
        if (! $user) {
            abort(403);
        }

        try {
            $job = $this->generationProcessor->queueGeneration($config, $user);

            AuditLogger::log([
                'action' => 'Queued AI scenario assessment generation',
                'module' => 'Final AI Scenario Assessment',
                'status' => 'success',
                'description' => 'Config ID: '.$config->id.'; Job ID: '.$job->id,
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'AI Scenario generation has started. You may continue using the system.',
                    'generation_job' => $this->generationProcessor->serializeJob($job),
                ], 202);
            }

            return redirect()
                ->route('admin.ai-scenario-config.index')
                ->with('status', 'AI Scenario generation has started. You may continue using the system.');
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            if ($request->expectsJson()) {
                return response()->json(['message' => $e->getMessage()], 422);
            }

            return redirect()
                ->back()
                ->withErrors(['ai_generation' => $e->getMessage()]);
        }
    }

    public function generationStatus(AiScenarioGenerationJob $generationJob)
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

        if ($generationJob->status === AiScenarioGenerationJob::STATUS_COMPLETED) {
            $config = $generationJob->config()
                ->with(AiScenarioAdminSerializer::configRelations())
                ->first();

            if ($config) {
                $payload['config'] = AiScenarioAdminSerializer::serializeConfig($config);
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
