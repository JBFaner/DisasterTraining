<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTrainingModuleRequest extends FormRequest
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
            'difficulty' => ['nullable', 'string', 'in:Beginner,Intermediate,Advanced'],
            'category' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:draft,published,archived,unpublished,deprecated'],
            'visibility' => ['required', 'string', 'in:all,group,staff_only'],
            'thumbnail' => ['nullable', 'image', 'mimes:jpg,jpeg,png,gif,webp', 'max:5120'],
            'remove_thumbnail' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Module title is required.',
            'category.required' => 'Disaster category is required.',
            'status.required' => 'Status is required.',
            'learning_objectives.required' => 'At least one learning objective is required.',
        ];
    }
}
