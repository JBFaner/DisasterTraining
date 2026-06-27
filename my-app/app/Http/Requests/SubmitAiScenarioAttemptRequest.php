<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitAiScenarioAttemptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'answers' => ['required', 'array'],
            'answers.*' => ['required', 'string', 'in:A,B,C,D,a,b,c,d'],
            'display_language' => ['sometimes', 'string', 'in:en,fil'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('answers') && is_array($this->input('answers'))) {
            $normalized = [];
            foreach ($this->input('answers') as $key => $value) {
                $normalized[(string) $key] = strtoupper((string) $value);
            }
            $this->merge(['answers' => $normalized]);
        }
    }
}
