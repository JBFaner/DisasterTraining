<?php

namespace App\Services;

use App\Models\AiScenarioAttempt;
use App\Models\AiScenarioConfig;
use App\Models\TrainingContent;
use App\Models\TrainingModule;
use App\Models\User;

class AiScenarioTrainingService
{
    public function __construct(
        private readonly GeminiService $gemini,
        private readonly AiScenarioTranslationService $translationService,
        private readonly AiScenarioLocaleService $localeService,
    ) {}

    public function generateForConfig(AiScenarioConfig $config): AiScenarioConfig
    {
        $config->loadMissing('trainingModule.contents');

        $module = $config->trainingModule;
        $sourceLocale = $this->localeService->resolveLocale(
            $config->generation_language ?? $this->localeService->defaultLanguage(),
        );
        $targetLocale = $sourceLocale === 'en' ? 'fil' : 'en';

        $result = $this->gemini->generateTrainingScenarioQuiz(
            $module,
            $config->difficulty,
            $config->number_of_questions,
            $sourceLocale,
        );

        $translated = $this->translationService->translateScenarioQuiz($result, $sourceLocale, $targetLocale);
        $bilingual = $this->localeService->mergeSourceAndTranslation($result, $translated, $sourceLocale);

        $config->fill($bilingual);
        $config->generated_language = $sourceLocale;
        $config->generation_language = $sourceLocale;
        $config->generated_at = now();
        $config->translated_at = now();
        $config->save();

        return $config->fresh();
    }

    public function createAttempt(User $user, TrainingModule $module, AiScenarioConfig $config): AiScenarioAttempt
    {
        if (! $config->isReady()) {
            throw new \RuntimeException('AI scenario is not configured for this training module.');
        }

        $defaultDisplay = $this->localeService->resolveLocale($config->generated_language);

        return AiScenarioAttempt::create([
            'user_id' => $user->id,
            'training_module_id' => $module->id,
            'ai_scenario_config_id' => $config->id,
            'scenario_title' => $config->scenario_title,
            'title_en' => $config->title_en,
            'title_fil' => $config->title_fil,
            'generated_scenario' => $config->generated_scenario,
            'description_en' => $config->description_en,
            'description_fil' => $config->description_fil,
            'learning_objectives_en' => $config->learning_objectives_en,
            'learning_objectives_fil' => $config->learning_objectives_fil,
            'generated_language' => $config->generated_language ?? $defaultDisplay,
            'display_language' => $defaultDisplay,
            'generated_questions' => $config->generated_questions,
            'difficulty' => $config->difficulty,
            'number_of_questions' => $config->number_of_questions,
            'started_at' => now(),
        ]);
    }

    /**
     * @param  array<string, string>  $answers  question number => choice letter
     */
    public function submitAttempt(AiScenarioAttempt $attempt, array $answers, ?string $displayLanguage = null): AiScenarioAttempt
    {
        if ($attempt->isCompleted()) {
            return $attempt;
        }

        if ($displayLanguage) {
            $attempt->display_language = $this->localeService->resolveLocale($displayLanguage);
        }

        $questions = $attempt->generated_questions ?? [];
        $total = count($questions);
        $score = 0;

        foreach ($questions as $question) {
            $number = (string) ($question['number'] ?? '');
            $correct = strtoupper((string) ($question['correct_answer'] ?? ''));
            $given = strtoupper((string) ($answers[$number] ?? ''));

            if ($number !== '' && $given !== '' && $given === $correct) {
                $score++;
            }
        }

        $percentage = $total > 0 ? round(($score / $total) * 100, 2) : 0;

        $attempt->participant_answers = $answers;
        $attempt->score = $score;
        $attempt->percentage = $percentage;
        $attempt->passed = $percentage >= AiScenarioAttempt::PASS_PERCENTAGE;
        $attempt->completed_at = now();
        $attempt->save();

        app(EvaluationScoringService::class)->createFromAttempt($attempt->fresh());

        return $attempt->fresh();
    }

    /**
     * @return array<string, mixed>
     */
    public function buildParticipantMeta(TrainingModule $module, User $user): array
    {
        $module->loadMissing(['contents', 'aiScenarioConfig']);
        $config = $module->aiScenarioConfig;

        $allComplete = $module->participantHasCompletedAllContents($user->id);
        $configReady = $config?->isReady() ?? false;

        $latestAttempt = AiScenarioAttempt::query()
            ->where('user_id', $user->id)
            ->where('training_module_id', $module->id)
            ->orderByDesc('id')
            ->first();

        return [
            'all_lessons_completed' => $allComplete,
            'is_enabled' => (bool) ($config?->is_enabled),
            'is_configured' => $configReady,
            'is_unlocked' => $allComplete && $configReady,
            'latest_attempt' => $latestAttempt ? [
                'id' => $latestAttempt->id,
                'score' => $latestAttempt->score,
                'percentage' => $latestAttempt->percentage,
                'passed' => $latestAttempt->passed,
                'completed_at' => $latestAttempt->completed_at?->toIso8601String(),
            ] : null,
        ];
    }

    /**
     * @return array<int, array{title: string, summary: string}>
     */
    public function summarizeModuleContents(TrainingModule $module): array
    {
        return $module->contents
            ->sortBy('sort_order')
            ->map(function (TrainingContent $content) {
                return [
                    'title' => $content->title,
                    'summary' => $this->summarizeContent($content),
                ];
            })
            ->values()
            ->all();
    }

    protected function summarizeContent(TrainingContent $content): string
    {
        if ($content->content_type === TrainingContent::TYPE_TEXT && $content->body) {
            $text = trim(preg_replace('/\s+/', ' ', strip_tags($content->body)) ?? '');

            return mb_strlen($text) > 400 ? mb_substr($text, 0, 400).'…' : $text;
        }

        return match ($content->content_type) {
            TrainingContent::TYPE_PDF => 'PDF lesson material.',
            TrainingContent::TYPE_VIDEO => 'Video lesson material.',
            TrainingContent::TYPE_IMAGE => 'Image-based lesson material.',
            TrainingContent::TYPE_YOUTUBE => 'YouTube video lesson.',
            default => 'Learning content.',
        };
    }
}
