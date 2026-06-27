<?php

namespace App\Models;

use App\Services\AiScenarioLocaleService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiScenarioAttempt extends Model
{
    public const PASS_PERCENTAGE = 75;

    protected $fillable = [
        'user_id',
        'training_module_id',
        'ai_scenario_config_id',
        'scenario_title',
        'title_en',
        'title_fil',
        'generated_scenario',
        'description_en',
        'description_fil',
        'learning_objectives_en',
        'learning_objectives_fil',
        'generated_language',
        'display_language',
        'generated_questions',
        'participant_answers',
        'score',
        'percentage',
        'difficulty',
        'number_of_questions',
        'passed',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'generated_questions' => 'array',
        'participant_answers' => 'array',
        'passed' => 'boolean',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'percentage' => 'float',
        'number_of_questions' => 'integer',
        'score' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function trainingModule(): BelongsTo
    {
        return $this->belongsTo(TrainingModule::class);
    }

    public function config(): BelongsTo
    {
        return $this->belongsTo(AiScenarioConfig::class, 'ai_scenario_config_id');
    }

    public function evaluationResult(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(EvaluationResult::class);
    }

    public function isCompleted(): bool
    {
        return $this->completed_at !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function toParticipantArray(): array
    {
        $localeService = app(AiScenarioLocaleService::class);
        $data = $this->toArray();
        $questions = $this->generated_questions ?? [];

        if (! $this->isCompleted()) {
            $data['generated_questions'] = collect($questions)
                ->map(function (array $question) use ($localeService) {
                    $bilingual = $localeService->normalizeQuestionToBilingual(
                        $question,
                        $this->generated_language ?? 'en',
                    );

                    return [
                        'number' => $bilingual['number'] ?? null,
                        'question_en' => $bilingual['question_en'] ?? '',
                        'question_fil' => $bilingual['question_fil'] ?? '',
                        'choice_a_en' => $bilingual['choice_a_en'] ?? '',
                        'choice_a_fil' => $bilingual['choice_a_fil'] ?? '',
                        'choice_b_en' => $bilingual['choice_b_en'] ?? '',
                        'choice_b_fil' => $bilingual['choice_b_fil'] ?? '',
                        'choice_c_en' => $bilingual['choice_c_en'] ?? '',
                        'choice_c_fil' => $bilingual['choice_c_fil'] ?? '',
                        'choice_d_en' => $bilingual['choice_d_en'] ?? '',
                        'choice_d_fil' => $bilingual['choice_d_fil'] ?? '',
                    ];
                })
                ->values()
                ->all();
        } else {
            $data['generated_questions'] = collect($questions)
                ->map(fn (array $question) => $localeService->normalizeQuestionToBilingual(
                    $question,
                    $this->generated_language ?? 'en',
                ))
                ->values()
                ->all();
        }

        return $data;
    }
}
