<?php

namespace App\Services;

use App\Models\AiScenarioAttempt;
use App\Models\AiScenarioConfig;
use App\Models\TrainingContent;
use App\Models\TrainingModule;
use App\Models\User;
use Illuminate\Support\Facades\DB;

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

        $hazardContext = null;
        $user = portal_user();
        if ($user?->barangay_id) {
            $profile = \App\Models\BarangayProfile::with('hazardRecords')->find($user->barangay_id);
            if ($profile) {
                $hazardContext = app(\App\Services\HazardAssessment\HazardTrainingRecommendationService::class)
                    ->buildAiContext($profile);
            }
        }

        $result = $this->gemini->generateTrainingScenarioQuiz(
            $module,
            $config->difficulty,
            $config->number_of_questions,
            $sourceLocale,
            $hazardContext,
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
        return app(QuizAttemptService::class)->createAttempt($user, $module, $config);
    }

    /**
     * @param  array<string, string>  $answers  question number => choice letter
     */
    public function submitAttempt(AiScenarioAttempt $attempt, array $answers, ?string $displayLanguage = null): AiScenarioAttempt
    {
        if ($attempt->isCompleted()) {
            return $attempt;
        }

        $attempt->participant_answers = $answers;

        if ($displayLanguage) {
            $attempt->display_language = $this->localeService->resolveLocale($displayLanguage);
        }

        return $this->finalizeAttempt($attempt);
    }

    public function finalizeAttempt(AiScenarioAttempt $attempt, bool $autoSubmitted = false): AiScenarioAttempt
    {
        if ($attempt->isCompleted()) {
            return $attempt;
        }

        $questions = $attempt->generated_questions ?? [];
        $answers = $attempt->participant_answers ?? [];
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
        $passingScore = $attempt->passingScore();

        $attempt->participant_answers = $answers;
        $attempt->score = $score;
        $attempt->percentage = $percentage;
        $attempt->passed = $percentage >= $passingScore;
        $attempt->status = $autoSubmitted && $attempt->expires_at && now()->greaterThan($attempt->expires_at)
            ? AiScenarioAttempt::STATUS_EXPIRED
            : AiScenarioAttempt::STATUS_COMPLETED;
        $attempt->time_remaining_seconds = 0;
        $attempt->submitted_at = now();
        $attempt->completed_at = now();

        return DB::transaction(function () use ($attempt) {
            $attempt->save();
            $freshAttempt = $attempt->fresh();

            $evaluation = app(EvaluationScoringService::class)->createFromAttempt($freshAttempt);

            if ($freshAttempt->passed) {
                app(TrainingCertificateService::class)->issueForPassedAttempt($freshAttempt, $evaluation);
            } else {
                app(TrainingRetakePolicyService::class)->handleFailedAttempt($freshAttempt);
            }

            return $freshAttempt->fresh();
        });
    }

    /**
     * @deprecated Use QuizAttemptService::getParticipantQuizMeta()
     * @return array<string, mixed>
     */
    public function buildParticipantMeta(TrainingModule $module, User $user): array
    {
        return app(QuizAttemptService::class)->getParticipantQuizMeta($module, $user);
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

