<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAiScenarioConfigRequest;
use App\Models\AiScenarioConfig;
use App\Models\TrainingModule;
use App\Services\AiScenarioTrainingService;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AiScenarioConfigController extends Controller
{
    public function __construct(
        private readonly AiScenarioTrainingService $trainingService,
    ) {}

    public function index()
    {
        $this->authorizeAdmin();

        $modules = TrainingModule::query()
            ->where('status', 'published')
            ->with('aiScenarioConfig')
            ->orderBy('title')
            ->get();

        $configs = AiScenarioConfig::with([
            'trainingModule',
            'creator',
            'currentVersion.creator',
            'publishedVersion',
            'versions' => fn ($q) => $q->with(['creator', 'approver'])->orderByDesc('version_number'),
        ])
            ->orderByDesc('updated_at')
            ->get();

        return view('app', [
            'section' => 'ai_scenario_training',
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
            'module' => 'AI Scenario Training',
            'status' => 'success',
            'description' => 'Module ID: '.$config->training_module_id,
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Configuration saved.',
                'config' => $config->fresh([
                    'trainingModule',
                    'currentVersion.creator',
                    'publishedVersion',
                    'versions' => fn ($q) => $q->with(['creator', 'approver'])->orderByDesc('version_number'),
                ]),
            ]);
        }

        return redirect()
            ->route('admin.ai-scenario-config.index')
            ->with('status', 'AI scenario configuration saved.');
    }

    public function generate(Request $request, AiScenarioConfig $config)
    {
        $this->authorizeAdmin();

        set_time_limit((int) config('ai_scenario.generation_max_execution_seconds', 300));

        try {
            $config = $this->trainingService->generateForConfig($config);

            AuditLogger::log([
                'action' => 'Generated AI scenario quiz',
                'module' => 'AI Scenario Training',
                'status' => 'success',
                'description' => $config->scenario_title,
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Scenario and quiz generated successfully.',
                    'config' => $config->fresh([
                    'trainingModule',
                    'currentVersion.creator',
                    'publishedVersion',
                    'versions' => fn ($q) => $q->with(['creator', 'approver'])->orderByDesc('version_number'),
                ]),
                ]);
            }

            return redirect()
                ->route('admin.ai-scenario-config.index')
                ->with('status', 'AI scenario and quiz generated successfully.');
        } catch (\Throwable $e) {
            if ($request->expectsJson()) {
                return response()->json(['message' => $e->getMessage()], 422);
            }

            return redirect()
                ->back()
                ->withErrors(['ai_generation' => $e->getMessage()]);
        }
    }

    protected function authorizeAdmin(): void
    {
        $user = portal_user();
        if (! $user || ! in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true)) {
            abort(403);
        }
    }
}
