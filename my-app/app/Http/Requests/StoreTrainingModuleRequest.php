<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTrainingModuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'learning_objectives' => ['required', 'array', 'min:1'],
            'learning_objectives.*' => ['required', 'string', 'max:500'],
            'estimated_duration_minutes' => ['nullable', 'integer', 'min:1', 'max:10080'],
            'difficulty' => ['required', 'string', 'in:Beginner,Intermediate,Advanced'],
            'category' => ['required', 'string', 'max:255'],
            'visibility' => ['required', 'string', 'in:all,group,staff_only'],
            'thumbnail' => ['nullable', 'image', 'mimes:jpg,jpeg,png,gif,webp', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Module title is required.',
            'category.required' => 'Disaster category is required.',
            'difficulty.required' => 'Difficulty level is required.',
            'learning_objectives.required' => 'At least one learning objective is required.',
        ];
    }
}
