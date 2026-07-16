<?php

namespace App\Http\Controllers;

use App\Models\LessonQuizConfig;
use App\Models\LessonQuizVersion;
use App\Services\AuditLogger;
use App\Services\LessonQuizWorkflowService;
use App\Support\LessonQuizAdminSerializer;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LessonQuizWorkflowController extends Controller
{
    public function __construct(
        private readonly LessonQuizWorkflowService $workflowService,
    ) {}

    public function show(LessonQuizConfig $config)
    {
        $this->authorizeAdmin();
        $config->load(LessonQuizAdminSerializer::configRelations());

        return response()->json([
            'config' => LessonQuizAdminSerializer::serializeConfig($config),
        ]);
    }

    public function storeQuestion(Request $request, LessonQuizConfig $config, LessonQuizVersion $version)
    {
        $this->authorizeAdmin();
        $this->assertVersionBelongsToConfig($version, $config);

        $data = $request->validate([
            'question_en' => ['nullable', 'string'],
            'question_fil' => ['nullable', 'string'],
            'choice_a_en' => ['nullable', 'string'],
            'choice_b_en' => ['nullable', 'string'],
            'choice_c_en' => ['nullable', 'string'],
            'choice_d_en' => ['nullable', 'string'],
            'choice_a_fil' => ['nullable', 'string'],
            'choice_b_fil' => ['nullable', 'string'],
            'choice_c_fil' => ['nullable', 'string'],
            'choice_d_fil' => ['nullable', 'string'],
            'correct_answer' => ['nullable', Rule::in(['A', 'B', 'C', 'D', 'a', 'b', 'c', 'd'])],
            'explanation_en' => ['nullable', 'string'],
            'explanation_fil' => ['nullable', 'string'],
            'competency' => ['nullable', 'string', 'max:64'],
        ]);

        $version = $this->workflowService->addManualQuestion($version, $data);
        $this->logAction('Added manual lesson quiz question', $config, $version);

        return $this->versionResponse('Question added.', $config, $version);
    }

    public function updateQuestion(
        Request $request,
        LessonQuizConfig $config,
        LessonQuizVersion $version,
        int $questionNumber,
    ) {
        $this->authorizeAdmin();
        $this->assertVersionBelongsToConfig($version, $config);

        $data = $request->validate([
            'question' => ['sometimes', 'string'],
            'choice_a' => ['sometimes', 'string'],
            'choice_b' => ['sometimes', 'string'],
            'choice_c' => ['sometimes', 'string'],
            'choice_d' => ['sometimes', 'string'],
            'correct_answer' => ['sometimes', Rule::in(['A', 'B', 'C', 'D', 'a', 'b', 'c', 'd'])],
            'explanation' => ['nullable', 'string'],
            'locale' => ['nullable', Rule::in(LessonQuizConfig::LANGUAGES)],
        ]);

        $version = $this->workflowService->updateQuestion(
            $version,
            $questionNumber,
            $data,
            $data['locale'] ?? 'en',
        );
        $this->logAction('Updated lesson quiz question #'.$questionNumber, $config, $version);

        return $this->versionResponse('Question updated.', $config, $version);
    }

    public function destroyQuestion(LessonQuizConfig $config, LessonQuizVersion $version, int $questionNumber)
    {
        $this->authorizeAdmin();
        $this->assertVersionBelongsToConfig($version, $config);

        $version = $this->workflowService->destroyQuestion($version, $questionNumber);
        $this->logAction('Deleted lesson quiz question #'.$questionNumber, $config, $version);

        return $this->versionResponse('Question removed.', $config, $version);
    }

    public function bulkSaveQuestions(Request $request, LessonQuizConfig $config, LessonQuizVersion $version)
    {
        $this->authorizeAdmin();
        $this->assertVersionBelongsToConfig($version, $config);

        $data = $request->validate([
            'questions' => ['required', 'array', 'min:1'],
            'questions.*.number' => ['required', 'integer', 'min:1'],
            'questions.*.question_en' => ['sometimes', 'string'],
            'questions.*.question_fil' => ['sometimes', 'string'],
            'questions.*.choice_a_en' => ['sometimes', 'string'],
            'questions.*.choice_b_en' => ['sometimes', 'string'],
            'questions.*.choice_c_en' => ['sometimes', 'string'],
            'questions.*.choice_d_en' => ['sometimes', 'string'],
            'questions.*.choice_a_fil' => ['sometimes', 'string'],
            'questions.*.choice_b_fil' => ['sometimes', 'string'],
            'questions.*.choice_c_fil' => ['sometimes', 'string'],
            'questions.*.choice_d_fil' => ['sometimes', 'string'],
            'questions.*.explanation_en' => ['nullable', 'string'],
            'questions.*.explanation_fil' => ['nullable', 'string'],
            'questions.*.correct_answer' => ['sometimes', Rule::in(['A', 'B', 'C', 'D', 'a', 'b', 'c', 'd'])],
        ]);

        $version = $this->workflowService->bulkUpdateQuestions($version, $data['questions']);
        $this->logAction('Bulk saved lesson quiz questions', $config, $version);

        return $this->versionResponse('Changes saved.', $config, $version);
    }

    public function duplicateQuestion(LessonQuizConfig $config, LessonQuizVersion $version, int $questionNumber)
    {
        $this->authorizeAdmin();
        $this->assertVersionBelongsToConfig($version, $config);

        $version = $this->workflowService->duplicateQuestion($version, $questionNumber);
        $this->logAction('Duplicated lesson quiz question #'.$questionNumber, $config, $version);

        return $this->versionResponse('Question duplicated.', $config, $version);
    }

    public function regenerateQuestion(LessonQuizConfig $config, LessonQuizVersion $version, int $questionNumber)
    {
        $this->authorizeAdmin();
        $this->assertVersionBelongsToConfig($version, $config);

        set_time_limit((int) config('ai_scenario.generation_max_execution_seconds', 300));

        try {
            $version = $this->workflowService->regenerateQuestion($version, $questionNumber);
            $this->logAction('Regenerated lesson quiz question #'.$questionNumber, $config, $version);

            return $this->versionResponse('Question regenerated.', $config, $version);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function generateQuestion(LessonQuizConfig $config, LessonQuizVersion $version)
    {
        $this->authorizeAdmin();
        $this->assertVersionBelongsToConfig($version, $config);

        set_time_limit((int) config('ai_scenario.generation_max_execution_seconds', 300));

        try {
            $version = $this->workflowService->generateAndAppendQuestion($version);
            $this->logAction('Generated and added lesson quiz question', $config, $version);

            return $this->versionResponse('AI question generated.', $config, $version);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function saveDraft(LessonQuizConfig $config, LessonQuizVersion $version)
    {
        $this->authorizeAdmin();
        $this->assertVersionBelongsToConfig($version, $config);

        $version = $this->workflowService->saveDraft($version);
        $this->logAction('Saved lesson quiz draft', $config, $version);

        return $this->versionResponse('Draft saved.', $config, $version);
    }

    public function approve(LessonQuizConfig $config, LessonQuizVersion $version)
    {
        $this->authorizeAdmin();
        $this->assertVersionBelongsToConfig($version, $config);

        $version = $this->workflowService->approve($version);
        $this->logAction('Approved lesson quiz version', $config, $version);

        return $this->versionResponse('Version approved.', $config, $version);
    }

    public function publish(LessonQuizConfig $config, LessonQuizVersion $version)
    {
        $this->authorizeAdmin();
        $this->assertVersionBelongsToConfig($version, $config);

        try {
            $version = $this->workflowService->publish($version);
            $this->logAction('Published lesson quiz question bank', $config, $version);

            return $this->versionResponse('Question bank published.', $config, $version);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => collect($e->errors())->flatten()->first() ?? 'Unable to publish this version.',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    public function translate(Request $request, LessonQuizConfig $config, LessonQuizVersion $version)
    {
        $this->authorizeAdmin();
        $this->assertVersionBelongsToConfig($version, $config);

        $data = $request->validate([
            'locale' => ['required', Rule::in(LessonQuizConfig::LANGUAGES)],
        ]);

        set_time_limit((int) config('ai_scenario.generation_max_execution_seconds', 300));

        try {
            $version = $this->workflowService->translateVersion($version, $data['locale']);
            $this->logAction('Translated lesson quiz question bank to '.$data['locale'], $config, $version);

            return $this->versionResponse('Translation generated.', $config, $version);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function publishTranslation(Request $request, LessonQuizConfig $config, LessonQuizVersion $version)
    {
        $this->authorizeAdmin();
        $this->assertVersionBelongsToConfig($version, $config);

        $data = $request->validate([
            'locale' => ['required', Rule::in(LessonQuizConfig::LANGUAGES)],
        ]);

        $version = $this->workflowService->publishTranslation($version, $data['locale']);
        $this->logAction('Published lesson quiz translation for '.$data['locale'], $config, $version);

        return $this->versionResponse('Translation published.', $config, $version);
    }

    public function deleteTranslation(Request $request, LessonQuizConfig $config, LessonQuizVersion $version)
    {
        $this->authorizeAdmin();
        $this->assertVersionBelongsToConfig($version, $config);

        $data = $request->validate([
            'locale' => ['required', Rule::in(LessonQuizConfig::LANGUAGES)],
        ]);

        $version = $this->workflowService->deleteTranslation($version, $data['locale']);
        $this->logAction('Deleted lesson quiz translation for '.$data['locale'], $config, $version);

        return $this->versionResponse('Translation deleted.', $config, $version);
    }

    private function versionResponse(string $message, LessonQuizConfig $config, LessonQuizVersion $version)
    {
        $config = $config->fresh(LessonQuizAdminSerializer::configRelations());
        $version = $version->fresh(LessonQuizAdminSerializer::versionRelations());

        return response()->json([
            'message' => $message,
            'version' => LessonQuizAdminSerializer::serializeVersion($version, $config),
            'config' => LessonQuizAdminSerializer::serializeConfig($config),
        ]);
    }

    private function assertVersionBelongsToConfig(LessonQuizVersion $version, LessonQuizConfig $config): void
    {
        if ((int) $version->lesson_quiz_config_id !== (int) $config->id) {
            abort(404);
        }
    }

    private function logAction(string $action, LessonQuizConfig $config, LessonQuizVersion $version): void
    {
        AuditLogger::log([
            'action' => $action,
            'module' => 'Lesson Quiz Generator',
            'status' => 'success',
            'description' => "Config {$config->id}, Version v{$version->version_number}",
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
