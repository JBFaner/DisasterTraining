<?php

namespace App\Http\Controllers;

use App\Models\AiScenarioAssessmentVersion;
use App\Models\AiScenarioConfig;
use App\Services\AiScenarioWorkflowService;
use App\Services\AuditLogger;
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

        $config->load([
            'trainingModule',
            'currentVersion.creator',
            'currentVersion.approver',
            'publishedVersion',
            'versions' => fn ($q) => $q->with(['creator', 'approver'])->orderByDesc('version_number'),
        ]);

        return response()->json([
            'config' => $this->serializeConfig($config),
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

        return response()->json([
            'message' => 'Scenario saved.',
            'version' => $this->serializeVersion($version),
            'config' => $this->serializeConfig($config->fresh([
                'trainingModule', 'currentVersion', 'publishedVersion', 'versions.creator', 'versions.approver',
            ])),
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

            $config = $config->fresh([
                'trainingModule',
                'currentVersion.creator',
                'publishedVersion',
                'versions' => fn ($q) => $q->with(['creator', 'approver'])->orderByDesc('version_number'),
            ]);

            return response()->json([
                'message' => 'Assessment deleted.',
                'config' => $this->serializeConfig($config),
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
        $config = $config->fresh([
            'trainingModule',
            'currentVersion.creator',
            'currentVersion.approver',
            'publishedVersion',
            'versions' => fn ($q) => $q->with(['creator', 'approver'])->orderByDesc('version_number'),
        ]);

        return response()->json([
            'message' => $message,
            'version' => $this->serializeVersion($version->fresh(['creator', 'approver'])),
            'config' => $this->serializeConfig($config),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeConfig(AiScenarioConfig $config): array
    {
        return [
            'id' => $config->id,
            'training_module_id' => $config->training_module_id,
            'training_module' => $config->trainingModule,
            'difficulty' => $config->difficulty,
            'number_of_questions' => $config->number_of_questions,
            'generation_language' => $config->generation_language,
            'is_enabled' => $config->is_enabled,
            'time_limit_minutes' => $config->time_limit_minutes,
            'max_attempts' => $config->max_attempts,
            'passing_score' => $config->passing_score,
            'fail_retake_policy' => $config->fail_retake_policy,
            'auto_submit_on_expire' => $config->auto_submit_on_expire,
            'allow_resume_attempt' => $config->allow_resume_attempt,
            'shuffle_questions' => $config->shuffle_questions,
            'shuffle_answer_choices' => $config->shuffle_answer_choices,
            'current_version_id' => $config->current_version_id,
            'published_version_id' => $config->published_version_id,
            'current_version' => $config->currentVersion ? $this->serializeVersion($config->currentVersion) : null,
            'published_version' => $config->publishedVersion ? $this->serializeVersion($config->publishedVersion) : null,
            'versions' => $config->versions?->map(fn ($v) => $this->serializeVersion($v))->values() ?? [],
            'generated_at' => $config->generated_at,
            'updated_at' => $config->updated_at,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeVersion(AiScenarioAssessmentVersion $version): array
    {
        return [
            'id' => $version->id,
            'ai_scenario_config_id' => $version->ai_scenario_config_id,
            'version_number' => $version->version_number,
            'status' => $version->status,
            'disaster_type' => $version->disaster_type,
            'difficulty' => $version->difficulty,
            'estimated_time_minutes' => $version->estimated_time_minutes,
            'scenario_title' => $version->scenario_title,
            'title_en' => $version->title_en,
            'title_fil' => $version->title_fil,
            'generated_scenario' => $version->generated_scenario,
            'description_en' => $version->description_en,
            'description_fil' => $version->description_fil,
            'learning_objectives_en' => $version->learning_objectives_en,
            'learning_objectives_fil' => $version->learning_objectives_fil,
            'generated_questions' => $version->generated_questions ?? [],
            'generated_language' => $version->generated_language,
            'change_note' => $version->change_note,
            'parent_version_id' => $version->parent_version_id,
            'created_by' => $version->created_by,
            'approved_by' => $version->approved_by,
            'approved_at' => $version->approved_at,
            'published_at' => $version->published_at,
            'created_at' => $version->created_at,
            'updated_at' => $version->updated_at,
            'creator' => $version->creator,
            'approver' => $version->approver,
            'question_count' => count($version->generated_questions ?? []),
        ];
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
