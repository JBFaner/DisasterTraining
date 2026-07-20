<?php

namespace App\Services;

use App\Jobs\ProcessLessonQuizGenerationJob;
use App\Models\LessonQuizConfig;
use App\Models\LessonQuizGenerationJob;
use App\Models\LessonQuizVersion;
use App\Models\PortalNotification;
use App\Models\TrainingContent;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LessonQuizGenerationProcessor
{
    public function __construct(
        private readonly GeminiService $gemini,
        private readonly LessonContentExtractorService $contentExtractor,
        private readonly LessonQuizWorkflowService $workflowService,
        private readonly PortalNotificationService $notificationService,
    ) {}

    public function validateLessonResources(LessonQuizConfig $config): string
    {
        $config->loadMissing('trainingContent');
        $content = $config->trainingContent;

        if (! $content) {
            throw ValidationException::withMessages([
                'lesson' => 'Lesson not found for quiz configuration.',
            ]);
        }

        $sourceText = $this->buildSourceText($content);

        if (trim($sourceText) === '') {
            $message = 'No readable lesson content is available for AI Question Bank generation.';

            throw ValidationException::withMessages([
                'lesson' => $message,
            ]);
        }

        return $sourceText;
    }

    public function queueGeneration(LessonQuizConfig $config, User $user, bool $autoTranslateFil = true): LessonQuizGenerationJob
    {
        $this->validateLessonResources($config);

        $activeJob = LessonQuizGenerationJob::query()
            ->where('lesson_quiz_config_id', $config->id)
            ->whereIn('status', LessonQuizGenerationJob::ACTIVE_STATUSES)
            ->exists();

        if ($activeJob) {
            throw ValidationException::withMessages([
                'generation' => 'A question bank generation is already in progress for this lesson.',
            ]);
        }

        $job = LessonQuizGenerationJob::create([
            'lesson_quiz_config_id' => $config->id,
            'requested_by' => $user->id,
            'status' => LessonQuizGenerationJob::STATUS_QUEUED,
            'auto_translate_fil' => $autoTranslateFil,
        ]);

        ProcessLessonQuizGenerationJob::dispatch($job->id);

        return $job;
    }

    public function process(LessonQuizGenerationJob $job): void
    {
        $job->refresh();
        $job->loadMissing(['config.trainingContent.module', 'requester']);

        if (! $job->isActive() && $job->status !== LessonQuizGenerationJob::STATUS_QUEUED) {
            return;
        }

        $config = $job->config;
        $content = $config?->trainingContent;
        $actorId = (int) ($job->requested_by ?? 0);

        try {
            $job->markStatus(LessonQuizGenerationJob::STATUS_PROCESSING);

            if (! $content) {
                throw new \RuntimeException('Lesson not found for quiz configuration.');
            }

            $job->markStatus(LessonQuizGenerationJob::STATUS_EXTRACTING);
            $sourceText = $this->buildSourceText($content);

            if (trim($sourceText) === '') {
                throw new \RuntimeException('No readable lesson content is available for AI Question Bank generation.');
            }

            $job->markStatus(LessonQuizGenerationJob::STATUS_GENERATING);
            $result = $this->gemini->generateLessonQuizBank(
                $content,
                $sourceText,
                (int) ($config->bank_question_count ?? 30),
                LessonQuizConfig::DEFAULT_GENERATION_LANGUAGE,
            );

            $version = DB::transaction(function () use ($config, $result, $actorId) {
                // Keep the currently published bank available to participants while a new draft is generated.
                // Only disable when there is no live published version yet.
                if (! $config->published_version_id) {
                    $config->is_enabled = false;
                    $config->save();
                }

                $config->loadMissing('currentVersion');
                $currentDraft = $config->currentVersion;

                $payload = [
                    'generated_questions' => $result['questions'],
                    'generated_language' => LessonQuizConfig::DEFAULT_GENERATION_LANGUAGE,
                ];

                if (
                    $currentDraft
                    && ! in_array($currentDraft->status, [
                        LessonQuizVersion::STATUS_PUBLISHED,
                        LessonQuizVersion::STATUS_ARCHIVED,
                    ], true)
                ) {
                    return $this->workflowService->replaceDraftFromGeneration(
                        $currentDraft,
                        $payload,
                        'AI Regenerated',
                        $actorId,
                    );
                }

                return $this->workflowService->createVersionFromGeneration(
                    $config,
                    $payload,
                    'AI Generated',
                    $actorId,
                );
            });

            if ($job->auto_translate_fil) {
                $job->markStatus(LessonQuizGenerationJob::STATUS_TRANSLATING);
                $version = $this->workflowService->translateVersion($version, 'fil', $actorId);
            }

            $job->markCompleted($version);
            $this->notifyGenerationCompleted($job, $version);
        } catch (\Throwable $e) {
            $job->markFailed($e->getMessage());
            $this->notifyGenerationFailed($job, $e->getMessage());
            throw $e;
        }
    }

    public function buildSourceText(TrainingContent $content): string
    {
        return $this->contentExtractor->buildAiSourceText($content);
    }

    public function serializeJob(?LessonQuizGenerationJob $job): ?array
    {
        if (! $job) {
            return null;
        }

        return [
            'id' => $job->id,
            'lesson_quiz_config_id' => $job->lesson_quiz_config_id,
            'status' => $job->status,
            'status_label' => LessonQuizGenerationJob::statusLabel($job->status),
            'auto_translate_fil' => $job->auto_translate_fil,
            'error_message' => $job->error_message,
            'lesson_quiz_version_id' => $job->lesson_quiz_version_id,
            'started_at' => $job->started_at,
            'completed_at' => $job->completed_at,
            'failed_at' => $job->failed_at,
            'created_at' => $job->created_at,
            'is_active' => $job->isActive(),
        ];
    }

    protected function notifyGenerationCompleted(LessonQuizGenerationJob $job, LessonQuizVersion $version): void
    {
        $user = $job->requester;
        if (! $user) {
            return;
        }

        $version->loadMissing('config.trainingContent.module');
        $config = $version->config;
        $lessonTitle = $config?->trainingContent?->title ?? 'Lesson';

        $this->notificationService->notify($user, [
            'type' => PortalNotification::TYPE_QUIZ_GENERATED,
            'icon' => '🧠',
            'title' => 'Question Bank Generated Successfully',
            'body' => "Your AI-generated question bank for \"{$lessonTitle}\" is now ready. Click to view it.",
            'action_label' => 'View Question Bank',
            'action_url' => $this->buildQuestionBankActionUrl($config, $version),
            'metadata' => [
                'lesson_quiz_config_id' => $job->lesson_quiz_config_id,
                'lesson_quiz_version_id' => $version->id,
                'version_number' => $version->version_number,
                'training_content_id' => $config?->training_content_id,
                'training_module_id' => $config?->trainingContent?->training_module_id,
            ],
        ]);
    }

    protected function buildQuestionBankActionUrl(?LessonQuizConfig $config, ?LessonQuizVersion $version = null): string
    {
        $baseUrl = '/admin/ai-scenario-training/lesson-quiz-generator';
        if (! $config) {
            return $baseUrl;
        }

        $config->loadMissing('trainingContent');
        $params = array_filter([
            'module' => $config->trainingContent?->training_module_id,
            'lesson' => $config->training_content_id,
            'version' => $version?->id,
        ]);

        if ($params === []) {
            return $baseUrl;
        }

        return $baseUrl.'?'.http_build_query($params);
    }

    protected function notifyGenerationFailed(LessonQuizGenerationJob $job, string $reason): void
    {
        $user = $job->requester;
        if (! $user) {
            return;
        }

        $job->loadMissing('config.trainingContent.module');
        $moduleTitle = $job->config?->trainingContent?->module?->title ?? 'Training Module';

        $config = $job->config;

        $this->notificationService->notify($user, [
            'type' => PortalNotification::TYPE_LESSON_QUIZ_FAILED,
            'icon' => '❌',
            'title' => 'AI Generation Failed',
            'body' => "Question Bank generation could not be completed.\n\nModule: {$moduleTitle}\n\nReason: {$reason}",
            'action_label' => 'View Details',
            'action_url' => $this->buildQuestionBankActionUrl($config),
            'metadata' => [
                'lesson_quiz_config_id' => $job->lesson_quiz_config_id,
                'generation_job_id' => $job->id,
                'error_message' => $reason,
            ],
        ]);
    }
}
