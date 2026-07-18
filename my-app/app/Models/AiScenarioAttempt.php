<?php

namespace App\Models;

use App\Services\AiScenarioLocaleService;
use App\Services\QuizAttemptService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiScenarioAttempt extends Model
{
    public const PASS_PERCENTAGE = 75;

    public const STATUS_NOT_STARTED = 'not_started';

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_EXPIRED = 'expired';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'user_id',
        'training_module_id',
        'ai_scenario_config_id',
        'attempt_number',
        'training_cycle',
        'status',
        'current_question',
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
        'question_order',
        'shuffled_choices',
        'participant_answers',
        'score',
        'percentage',
        'difficulty',
        'number_of_questions',
        'passed',
        'time_limit_minutes',
        'time_remaining_seconds',
        'started_at',
        'expires_at',
        'last_activity_at',
        'completed_at',
        'submitted_at',
    ];

    protected $casts = [
        'generated_questions' => 'array',
        'question_order' => 'array',
        'shuffled_choices' => 'array',
        'participant_answers' => 'array',
        'passed' => 'boolean',
        'started_at' => 'datetime',
        'expires_at' => 'datetime',
        'last_activity_at' => 'datetime',
        'completed_at' => 'datetime',
        'submitted_at' => 'datetime',
        'percentage' => 'float',
        'number_of_questions' => 'integer',
        'score' => 'integer',
        'attempt_number' => 'integer',
        'training_cycle' => 'integer',
        'current_question' => 'integer',
        'time_limit_minutes' => 'integer',
        'time_remaining_seconds' => 'integer',
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

    public function quizAnswers(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(QuizAnswer::class);
    }

    public function isCompleted(): bool
    {
        return in_array($this->status, [self::STATUS_COMPLETED, self::STATUS_EXPIRED], true)
            || $this->completed_at !== null;
    }

    public function isInProgress(): bool
    {
        return $this->status === self::STATUS_IN_PROGRESS;
    }

    public function passingScore(): int
    {
        return (int) ($this->config?->passing_score ?? self::PASS_PERCENTAGE);
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
            $this->loadMissing('quizAnswers');
            $quizService = app(QuizAttemptService::class);
            $answerMap = $quizService->answersMapFromRecords($this);
            $hasSavedProgress = count($answerMap) > 0;

            $data['participant_answers'] = $answerMap;
            $data['has_saved_progress'] = $hasSavedProgress;
            $data['initial_question_index'] = $hasSavedProgress
                ? $quizService->questionIndexForNumber($this, $this->current_question)
                : 0;
            $data['time_remaining_seconds'] = $this->remainingSeconds();
            $data['time_limit_minutes'] = $this->time_limit_minutes;
            $data['expires_at'] = $this->expires_at?->toIso8601String();
            $data['current_question'] = $this->current_question;
            $data['attempt_number'] = $this->attempt_number;
            $data['status'] = $this->status;
            $data['passing_score'] = $this->passingScore();
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
            $data['evaluation_result_id'] = $this->evaluationResult()->value('id');
        }

        return $data;
    }

    public function remainingSeconds(): int
    {
        if ($this->expires_at && $this->isInProgress()) {
            return max(0, (int) now()->diffInSeconds($this->expires_at, false));
        }

        return (int) ($this->time_remaining_seconds ?? 0);
    }
}

