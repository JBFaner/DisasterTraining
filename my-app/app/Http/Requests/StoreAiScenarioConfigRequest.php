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
            'number_of_questions' => ['required', Rule::in(AiScenarioConfig::QUESTION_COUNTS)],
            'generation_language' => ['sometimes', Rule::in(AiScenarioConfig::LANGUAGES)],
            'is_enabled' => ['sometimes', 'boolean'],
            'time_limit_minutes' => ['sometimes', 'integer', 'min:1', 'max:480'],
            'max_attempts' => ['sometimes', 'integer', 'min:1', 'max:20'],
            'passing_score' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'fail_retake_policy' => ['sometimes', Rule::in(AiScenarioConfig::FAIL_POLICIES)],
            'auto_submit_on_expire' => ['sometimes', 'boolean'],
            'allow_resume_attempt' => ['sometimes', 'boolean'],
            'shuffle_questions' => ['sometimes', 'boolean'],
            'shuffle_answer_choices' => ['sometimes', 'boolean'],
        ];
    }
}
