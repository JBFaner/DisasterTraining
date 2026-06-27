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
            'difficulty' => ['required', Rule::in(AiScenarioConfig::DIFFICULTIES)],
            'number_of_questions' => ['required', Rule::in(AiScenarioConfig::QUESTION_COUNTS)],
            'generation_language' => ['sometimes', Rule::in(AiScenarioConfig::LANGUAGES)],
            'is_enabled' => ['sometimes', 'boolean'],
        ];
    }
}
