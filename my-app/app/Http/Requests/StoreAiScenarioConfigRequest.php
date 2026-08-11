<?php

namespace App\Http\Requests;

use App\Models\AiScenarioConfig;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAiScenarioConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = portal_user() ?: $this->user();

        return $user && \App\Support\PortalAuth::canManageOperations($user->role);
    }

    protected function prepareForValidation(): void
    {
        $timeLimit = $this->input('time_limit_minutes');
        if ($timeLimit === '' || $timeLimit === null || (int) $timeLimit < 1) {
            $this->merge(['time_limit_minutes' => 60]);
        }

        $maxAttempts = $this->input('max_attempts');
        if ($maxAttempts === '' || $maxAttempts === null || (int) $maxAttempts < 1) {
            $this->merge(['max_attempts' => 3]);
        }

        $passingScore = $this->input('passing_score');
        if ($passingScore === '' || $passingScore === null || (int) $passingScore < 1) {
            $this->merge(['passing_score' => 50]);
        }

        // Match Lesson Quiz: one question count drives both bank size and participant quiz size.
        $questionCount = (int) ($this->input('quiz_question_count')
            ?: $this->input('bank_question_count')
            ?: AiScenarioConfig::DEFAULT_BANK_QUESTION_COUNT);
        $this->merge([
            'bank_question_count' => $questionCount,
            'quiz_question_count' => $questionCount,
        ]);
    }

    public function rules(): array
    {
        return [
            'training_module_id' => ['required', 'integer', 'exists:training_modules,id'],
            'bank_question_count' => ['required', Rule::in(AiScenarioConfig::BANK_QUESTION_COUNTS)],
            'quiz_question_count' => ['required', Rule::in(AiScenarioConfig::BANK_QUESTION_COUNTS)],
            'number_of_questions' => ['sometimes', Rule::in(AiScenarioConfig::QUESTION_COUNTS)],
            'generation_language' => ['sometimes', Rule::in(AiScenarioConfig::LANGUAGES)],
            'time_limit_minutes' => ['sometimes', 'integer', 'min:1', 'max:480'],
            'max_attempts' => ['sometimes', 'integer', 'min:1', 'max:20'],
            'passing_score' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'fail_retake_policy' => ['sometimes', Rule::in(AiScenarioConfig::FAIL_POLICIES)],
            'auto_submit_on_expire' => ['sometimes', 'boolean'],
            'shuffle_questions' => ['sometimes', 'boolean'],
            'shuffle_answer_choices' => ['sometimes', 'boolean'],
        ];
    }
}
