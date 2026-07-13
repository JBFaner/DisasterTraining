<?php

namespace App\Services;

use App\Jobs\ProcessAiScenarioGenerationJob;
use App\Models\AiScenarioAssessmentVersion;
use App\Models\AiScenarioConfig;
use App\Models\AiScenarioGenerationJob;
use App\Models\PortalNotification;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AiScenarioGenerationProcessor
{
    public function __construct(
        private readonly AiScenarioTrainingService $trainingService,
        private readonly AiScenarioTranslationService $translationService,
        private readonly AiScenarioLocaleService $localeService,
        private readonly AiScenarioWorkflowService $workflowService,
        private readonly GeminiService $gemini,
        private readonly PortalNotificationService $notificationService,
    ) {}

    public function queueGeneration(AiScenarioConfig $config, User $user): AiScenarioGenerationJob
    {
        $activeJob = AiScenarioGenerationJob::query()
            ->where('ai_scenario_config_id', $config->id)
            ->whereIn('status', AiScenarioGenerationJob::ACTIVE_STATUSES)
            ->exists();

        if ($activeJob) {
            throw ValidationException::withMessages([
                'generation' => 'An AI scenario generation is already in progress for this module.',
            ]);
        }

        $job = AiScenarioGenerationJob::create([
            'ai_scenario_config_id' => $config->id,
            'requested_by' => $user->id,
            'status' => AiScenarioGenerationJob::STATUS_QUEUED,
        ]);

        ProcessAiScenarioGenerationJob::dispatch($job->id);

        return $job;
    }

    public function process(AiScenarioGenerationJob $job): void
    {
        $job->refresh();
        $job->loadMissing(['config.trainingModule.contents', 'requester']);

        if (! $job->isActive() && $job->status !== AiScenarioGenerationJob::STATUS_QUEUED) {
            return;
        }

        $config = $job->config;
        $requester = $job->requester;

        if (! $config) {
            $job->markFailed('AI scenario configuration not found.');
            $this->notifyGenerationFailed($job, 'AI scenario configuration not found.');

            return;
        }

        try {
            $job->markStatus(AiScenarioGenerationJob::STATUS_PROCESSING);

            $module = $config->trainingModule;
            if (! $module) {
                throw new \RuntimeException('Training module not found for AI scenario configuration.');
            }

            $difficulty = $this->trainingService->resolveDifficultyForModule($module);
            $config->difficulty = $difficulty;

            $sourceLocale = $this->localeService->resolveLocale(
                $config->generation_language ?? $this->localeService->defaultLanguage(),
            );
            $targetLocale = $sourceLocale === 'en' ? 'fil' : 'en';

            $hazardContext = $this->buildHazardContext($requester);

            $job->markStatus(AiScenarioGenerationJob::STATUS_GENERATING);
            $result = $this->gemini->generateTrainingScenarioQuiz(
                $module,
                $difficulty,
                (int) ($config->bank_question_count ?? $config->number_of_questions),
                $sourceLocale,
                $hazardContext,
            );

            $job->markStatus(AiScenarioGenerationJob::STATUS_TRANSLATING);
            $translated = $this->translationService->translateScenarioQuiz($result, $sourceLocale, $targetLocale);
            $bilingual = $this->localeService->mergeSourceAndTranslation($result, $translated, $sourceLocale);

            $version = DB::transaction(function () use ($config, $bilingual, $sourceLocale) {
                $config->fill($bilingual);
                $config->generated_language = $sourceLocale;
                $config->generation_language = $sourceLocale;
                $config->generated_at = now();
                $config->translated_at = now();
                $config->is_enabled = false;
                $config->save();

                $config->loadMissing('currentVersion');
                $currentDraft = $config->currentVersion;

                if (
                    $currentDraft
                    && ! in_array($currentDraft->status, [
                        AiScenarioAssessmentVersion::STATUS_PUBLISHED,
                        AiScenarioAssessmentVersion::STATUS_ARCHIVED,
                    ], true)
                ) {
                    return $this->workflowService->replaceDraftFromGeneration($currentDraft, $bilingual, 'AI Regenerated');
                }

                return $this->workflowService->createVersionFromGeneration($config, $bilingual, 'AI Generated');
            });

            $job->markCompleted($version);
            $this->notifyGenerationCompleted($job, $version);
        } catch (\Throwable $e) {
            $job->markFailed($e->getMessage());
            $this->notifyGenerationFailed($job, $e->getMessage());
            throw $e;
        }
    }

    public function serializeJob(?AiScenarioGenerationJob $job): ?array
    {
        if (! $job) {
            return null;
        }

        return [
            'id' => $job->id,
            'ai_scenario_config_id' => $job->ai_scenario_config_id,
            'status' => $job->status,
            'status_label' => AiScenarioGenerationJob::statusLabel($job->status),
            'error_message' => $job->error_message,
            'ai_scenario_assessment_version_id' => $job->ai_scenario_assessment_version_id,
            'started_at' => $job->started_at,
            'completed_at' => $job->completed_at,
            'failed_at' => $job->failed_at,
            'created_at' => $job->created_at,
            'is_active' => $job->isActive(),
        ];
    }

    protected function buildHazardContext(?User $user): ?array
    {
        if (! $user?->barangay_id) {
            return null;
        }

        $profile = \App\Models\BarangayProfile::with('hazardRecords')->find($user->barangay_id);
        if (! $profile) {
            return null;
        }

        return app(\App\Services\HazardAssessment\HazardTrainingRecommendationService::class)
            ->buildAiContext($profile);
    }

    protected function notifyGenerationCompleted(AiScenarioGenerationJob $job, AiScenarioAssessmentVersion $version): void
    {
        $user = $job->requester;
        if (! $user) {
            return;
        }

        $version->loadMissing('config.trainingModule');
        $moduleTitle = $version->config?->trainingModule?->title ?? 'Training Module';

        $this->notificationService->notify($user, [
            'type' => PortalNotification::TYPE_AI_SCENARIO_GENERATED,
            'icon' => '🎯',
            'title' => 'Final AI Scenario Generated Successfully',
            'body' => "Final AI Scenario Version {$version->version_number} for \"{$moduleTitle}\" is ready for review.",
            'action_label' => 'Review Assessment',
            'action_url' => $this->buildAssessmentActionUrl($version->config, $version),
            'metadata' => [
                'ai_scenario_config_id' => $job->ai_scenario_config_id,
                'ai_scenario_assessment_version_id' => $version->id,
                'version_number' => $version->version_number,
                'training_module_id' => $version->config?->training_module_id,
            ],
        ]);
    }

    protected function notifyGenerationFailed(AiScenarioGenerationJob $job, string $reason): void
    {
        $user = $job->requester;
        if (! $user) {
            return;
        }

        $job->loadMissing('config.trainingModule');
        $moduleTitle = $job->config?->trainingModule?->title ?? 'Training Module';

        $this->notificationService->notify($user, [
            'type' => PortalNotification::TYPE_AI_SCENARIO_GENERATION_FAILED,
            'icon' => '❌',
            'title' => 'AI Scenario Generation Failed',
            'body' => "Final AI Scenario generation could not be completed.\n\nModule: {$moduleTitle}\n\nReason: {$reason}",
            'action_label' => 'View Details',
            'action_url' => $this->buildAssessmentActionUrl($job->config),
            'metadata' => [
                'ai_scenario_config_id' => $job->ai_scenario_config_id,
                'training_module_id' => $job->config?->training_module_id,
            ],
        ]);
    }

    protected function buildAssessmentActionUrl(?AiScenarioConfig $config, ?AiScenarioAssessmentVersion $version = null): string
    {
        $baseUrl = '/admin/ai-scenario-training/final-assessment';
        if (! $config) {
            return $baseUrl;
        }

        $params = array_filter([
            'module' => $config->training_module_id,
            'version' => $version?->id,
        ]);

        if ($params === []) {
            return $baseUrl;
        }

        return $baseUrl.'?'.http_build_query($params);
    }
}
