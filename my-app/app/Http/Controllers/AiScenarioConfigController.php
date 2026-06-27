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

        $configs = AiScenarioConfig::with(['trainingModule', 'creator'])
            ->orderByDesc('updated_at')
            ->get();

        return view('app', [
            'section' => 'ai_scenario_config',
            'ai_scenario_modules' => $modules,
            'ai_scenario_configs' => $configs,
        ]);
    }

    public function store(StoreAiScenarioConfigRequest $request)
    {
        $this->authorizeAdmin();

        $data = $request->validated();

        $config = AiScenarioConfig::updateOrCreate(
            ['training_module_id' => $data['training_module_id']],
            [
                'difficulty' => $data['difficulty'],
                'number_of_questions' => $data['number_of_questions'],
                'generation_language' => $data['generation_language'] ?? 'en',
                'is_enabled' => $request->boolean('is_enabled'),
                'created_by' => Auth::id(),
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
                'config' => $config->fresh(['trainingModule']),
            ]);
        }

        return redirect()
            ->route('ai-scenario-config.index')
            ->with('status', 'AI scenario configuration saved.');
    }

    public function generate(Request $request, AiScenarioConfig $config)
    {
        $this->authorizeAdmin();

        set_time_limit((int) config('ai_scenario.generation_max_execution_seconds', 300));

        try {
            $config = $this->trainingService->generateForConfig($config);
            $config->is_enabled = true;
            $config->save();

            AuditLogger::log([
                'action' => 'Generated AI scenario quiz',
                'module' => 'AI Scenario Training',
                'status' => 'success',
                'description' => $config->scenario_title,
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Scenario and quiz generated successfully.',
                    'config' => $config->fresh(['trainingModule']),
                ]);
            }

            return redirect()
                ->route('ai-scenario-config.index')
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
        $user = Auth::user();
        if (! $user || ! in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true)) {
            abort(403);
        }
    }
}
