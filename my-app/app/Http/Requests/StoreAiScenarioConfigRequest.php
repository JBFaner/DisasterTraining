<?php

namespace App\Http\Requests;

use App\Models\AiScenarioConfig;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAiScenarioConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user && in_array($user->role, ['LGU_ADMIN', 'LGU_TRAINER'], true);
    }

    public function rules(): array
    {
        return [
            'training_module_id' => ['required', 'integer', 'exists:training_modules,id'],
            'bank_question_count' => ['required', Rule::in(AiScenarioConfig::BANK_QUESTION_COUNTS)],
            'quiz_question_count' => [
                'required',
                'integer',
                'min:1',
                function (string $attribute, mixed $value, \Closure $fail) {
                    $bankCount = (int) $this->input('bank_question_count', AiScenarioConfig::DEFAULT_BANK_QUESTION_COUNT);
                    if ((int) $value > $bankCount) {
                        $fail('Participant quiz size cannot exceed AI questions to generate.');
                    }
                },
            ],
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
