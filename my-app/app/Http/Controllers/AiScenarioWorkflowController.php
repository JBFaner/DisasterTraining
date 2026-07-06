<?php

namespace App\Http\Controllers;

use App\Models\AiScenarioAssessmentVersion;
use App\Models\AiScenarioConfig;
use App\Services\AiScenarioWorkflowService;
use App\Services\AuditLogger;
use App\Support\AiScenarioAdminSerializer;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AiScenarioWorkflowController extends Controller
{
    public function __construct(
        private readonly AiScenarioWorkflowService $workflowService,
    ) {}

    public function show(AiScenarioConfig $config)
    {
        $this->authorizeAdmin();

        $config->load(AiScenarioAdminSerializer::configRelations());

        return response()->json([
            'config' => AiScenarioAdminSerializer::serializeConfig($config),
        ]);
    }

    public function updateScenario(Request $request, AiScenarioConfig $config, AiScenarioAssessmentVersion $version)
    {
        $this->authorizeAdmin();
        $this->assertVersionBelongsToConfig($version, $config);

        $data = $request->validate([
            'title_en' => ['nullable', 'string', 'max:255'],
            'title_fil' => ['nullable', 'string', 'max:255'],
            'description_en' => ['nullable', 'string'],
            'description_fil' => ['nullable', 'string'],
            'learning_objectives_en' => ['nullable', 'string'],
            'learning_objectives_fil' => ['nullable', 'string'],
            'disaster_type' => ['nullable', 'string', 'max:120'],
            'difficulty' => ['nullable', Rule::in(AiScenarioConfig::DIFFICULTIES)],
            'estimated_time_minutes' => ['nullable', 'integer', 'min:5', 'max:480'],
        ]);

        $version = $this->workflowService->updateScenario($version, $data);

        $this->logAction('Updated AI scenario content', $config, $version);

        $config = $config->fresh(AiScenarioAdminSerializer::configRelations());
        $version = $version->fresh(AiScenarioAdminSerializer::versionRelations());

        return response()->json([
            'message' => 'Scenario saved.',
            'version' => AiScenarioAdminSerializer::serializeVersion($version, $config),
            'config' => AiScenarioAdminSerializer::serializeConfig($config),
        ]);
    }

    public function storeQuestion(Request $request, AiScenarioConfig $config, AiScenarioAssessmentVersion $version)
    {
        $this->authorizeAdmin();
        $this->assertVersionBelongsToConfig($version, $config);

        $data = $request->validate([
            'question_en' => ['required', 'string'],
            'question_fil' => ['nullable', 'string'],
            'choice_a_en' => ['required', 'string'],
            'choice_b_en' => ['required', 'string'],
            'choice_c_en' => ['required', 'string'],
            'choice_d_en' => ['required', 'string'],
            'choice_a_fil' => ['nullable', 'string'],
            'choice_b_fil' => ['nullable', 'string'],
            'choice_c_fil' => ['nullable', 'string'],
            'choice_d_fil' => ['nullable', 'string'],
            'correct_answer' => ['required', Rule::in(['A', 'B', 'C', 'D', 'a', 'b', 'c', 'd'])],
            'explanation_en' => ['nullable', 'string'],
            'explanation_fil' => ['nullable', 'string'],
            'competency' => ['nullable', 'string', 'max:64'],
            'difficulty' => ['nullable', Rule::in(AiScenarioConfig::DIFFICULTIES)],
        ]);

        $version = $this->workflowService->addManualQuestion($version, $data);
        $this->logAction('Added manual AI scenario question', $config, $version);

        return $this->versionResponse('Question added.', $config, $version);
    }

    public function updateQuestion(
        Request $request,
        AiScenarioConfig $config,
        AiScenarioAssessmentVersion $version,
        int $questionNumber,
    ) {
        $this->authorizeAdmin();
        $this->assertVersionBelongsToConfig($version, $config);

        $data = $request->validate([
            'question_en' => ['sometimes', 'string'],
            'question_fil' => ['nullable', 'string'],
            'choice_a_en' => ['sometimes', 'string'],
            'choice_b_en' => ['sometimes', 'string'],
            'choice_c_en' => ['sometimes', 'string'],
            'choice_d_en' => ['sometimes', 'string'],
            'choice_a_fil' => ['nullable', 'string'],
            'choice_b_fil' => ['nullable', 'string'],
            'choice_c_fil' => ['nullable', 'string'],
            'choice_d_fil' => ['nullable', 'string'],
            'correct_answer' => ['sometimes', Rule::in(['A', 'B', 'C', 'D', 'a', 'b', 'c', 'd'])],
            'explanation_en' => ['nullable', 'string'],
            'explanation_fil' => ['nullable', 'string'],
            'competency' => ['nullable', 'string', 'max:64'],
            'difficulty' => ['nullable', Rule::in(AiScenarioConfig::DIFFICULTIES)],
        ]);

        $version = $this->workflowService->updateQuestion($version, $questionNumber, $data);
        $this->logAction('Updated AI scenario question #'.$questionNumber, $config, $version);

        return $this->versionResponse('Question updated.', $config, $version);
    }

    public function destroyQuestion(
        AiScenarioConfig $config,
        AiScenarioAssessmentVersion $version,
        int $questionNumber,
    ) {
        $this->authorizeAdmin();
        $this->assertVersionBelongsToConfig($version, $config);

        $version = $this->workflowService->deleteQuestion($version, $questionNumber);
        $this->logAction('Deleted AI scenario question #'.$questionNumber, $config, $version);

        return $this->versionResponse('Question deleted.', $config, $version);
    }

    public function duplicateQuestion(
        AiScenarioConfig $config,
        AiScenarioAssessmentVersion $version,
        int $questionNumber,
    ) {
        $this->authorizeAdmin();
        $this->assertVersionBelongsToConfig($version, $config);

        $version = $this->workflowService->duplicateQuestion($version, $questionNumber);
        $this->logAction('Duplicated AI scenario question #'.$questionNumber, $config, $version);

        return $this->versionResponse('Question duplicated.', $config, $version);
    }

    public function regenerateQuestion(
        Request $request,
        AiScenarioConfig $config,
        AiScenarioAssessmentVersion $version,
        int $questionNumber,
    ) {
        $this->authorizeAdmin();
        $this->assertVersionBelongsToConfig($version, $config);

        set_time_limit((int) config('ai_scenario.generation_max_execution_seconds', 300));

        try {
            $version = $this->workflowService->regenerateQuestion($version, $questionNumber);
            $this->logAction('Regenerated AI scenario question #'.$questionNumber, $config, $version);

            return $this->versionResponse('Question regenerated.', $config, $version);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function saveDraft(AiScenarioConfig $config, AiScenarioAssessmentVersion $version)
    {
        $this->authorizeAdmin();
        $this->assertVersionBelongsToConfig($version, $config);

        $version = $this->workflowService->saveDraft($version);
        $this->logAction('Saved AI scenario assessment draft', $config, $version);

        return $this->versionResponse('Draft saved.', $config, $version);
    }

    public function approve(AiScenarioConfig $config, AiScenarioAssessmentVersion $version)
    {
        $this->authorizeAdmin();
        $this->assertVersionBelongsToConfig($version, $config);

        try {
            $version = $this->workflowService->approveVersion($version);
            $this->logAction('Approved AI scenario assessment', $config, $version);

            return $this->versionResponse('Assessment approved.', $config, $version);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Approval validation failed.',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    public function publish(AiScenarioConfig $config, AiScenarioAssessmentVersion $version)
    {
        $this->authorizeAdmin();
        $this->assertVersionBelongsToConfig($version, $config);

        try {
            $version = $this->workflowService->publishVersion($version);
            $this->logAction('Published AI scenario assessment', $config, $version);

            return $this->versionResponse('Assessment published. Participants can now access this quiz.', $config, $version);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Publishing validation failed.',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    public function restore(AiScenarioConfig $config, AiScenarioAssessmentVersion $version)
    {
        $this->authorizeAdmin();
        $this->assertVersionBelongsToConfig($version, $config);

        $restored = $this->workflowService->restoreVersion($version);
        $this->logAction('Restored AI scenario version '.$version->version_number, $config, $restored);

        return $this->versionResponse('Version restored as new draft.', $config, $restored);
    }

    public function duplicate(AiScenarioConfig $config, AiScenarioAssessmentVersion $version)
    {
        $this->authorizeAdmin();
        $this->assertVersionBelongsToConfig($version, $config);

        $copy = $this->workflowService->duplicateVersion($version);
        $this->logAction('Duplicated AI scenario version '.$version->version_number, $config, $copy);

        return $this->versionResponse('Version duplicated.', $config, $copy);
    }

    public function destroy(AiScenarioConfig $config, AiScenarioAssessmentVersion $version)
    {
        $this->authorizeAdmin();
        $this->assertVersionBelongsToConfig($version, $config);

        try {
            $this->workflowService->destroyVersion($version);
            $this->logAction('Deleted AI scenario version '.$version->version_number, $config, $version);

            $config = $config->fresh(AiScenarioAdminSerializer::configRelations());

            return response()->json([
                'message' => 'Assessment deleted.',
                'config' => AiScenarioAdminSerializer::serializeConfig($config),
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Delete failed.',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    protected function versionResponse(string $message, AiScenarioConfig $config, AiScenarioAssessmentVersion $version)
    {
        $config = $config->fresh(AiScenarioAdminSerializer::configRelations());

        return response()->json([
            'message' => $message,
            'version' => AiScenarioAdminSerializer::serializeVersion(
                $version->fresh(AiScenarioAdminSerializer::versionRelations()),
                $config,
            ),
            'config' => AiScenarioAdminSerializer::serializeConfig($config),
        ]);
    }

    protected function assertVersionBelongsToConfig(AiScenarioAssessmentVersion $version, AiScenarioConfig $config): void
    {
        if ($version->ai_scenario_config_id !== $config->id) {
            abort(404);
        }
    }

    protected function logAction(string $action, AiScenarioConfig $config, AiScenarioAssessmentVersion $version): void
    {
        AuditLogger::log([
            'action' => $action,
            'module' => 'AI Scenario Training',
            'status' => 'success',
            'description' => 'Module ID: '.$config->training_module_id.' · Version '.$version->version_number,
        ]);
    }

    protected function authorizeAdmin(): void
    {
        $user = portal_user();
        if (! $user || ! in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true)) {
            abort(403);
        }
    }
}
